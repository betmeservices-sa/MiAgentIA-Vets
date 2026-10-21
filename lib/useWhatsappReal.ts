"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MensajeWA, NumeroWA } from "./whatsapp";

// Chats del número REAL de la clínica para la bandeja. Sin las variables de
// WhatsApp (por ejemplo en local) no trae nada y la bandeja queda solo con la
// demostración.

const SONDEO_MS = 4000;
const VENTANA_MS = 24 * 60 * 60 * 1000;
const LLAVE_VISTO = "vet-wa-visto";

export interface ChatReal {
  /** Id en la bandeja: no choca con los de la demostración. */
  id: string;
  telefono: string;
  nombre: string;
  mensajes: MensajeWA[];
  ultimo: MensajeWA;
  /** Último mensaje del cliente: abre la ventana de 24 h para escribirle texto libre. */
  ultimoEntrante?: MensajeWA;
}

interface Respuesta {
  configurado: boolean;
  numero: NumeroWA | null;
  mensajes: MensajeWA[];
  error?: string;
}

export function telefonoLegible(t: string) {
  const d = t.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("503")) return `+503 ${d.slice(3, 7)} ${d.slice(7)}`;
  return `+${d}`;
}

export function ventanaAbierta(c: ChatReal) {
  return Boolean(c.ultimoEntrante && Date.now() - new Date(c.ultimoEntrante.ts).getTime() < VENTANA_MS);
}

function vistoGuardado(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LLAVE_VISTO) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function useWhatsappReal() {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [error, setError] = useState("");
  const [visto, setVisto] = useState<Record<string, string>>({});

  useEffect(() => setVisto(vistoGuardado()), []);

  const recargar = useCallback(async () => {
    try {
      const r = await fetch("/api/whatsapp", { cache: "no-store" });
      const d = (await r.json()) as Respuesta;
      if (!r.ok) throw new Error(d.error ?? "No se pudo leer WhatsApp");
      setDatos(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer WhatsApp");
    }
  }, []);

  // Sondeo mientras la pestaña está a la vista; con la pestaña oculta se pausa.
  useEffect(() => {
    recargar();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") recargar();
    }, SONDEO_MS);
    const alVolver = () => document.visibilityState === "visible" && recargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [recargar]);

  const chats = useMemo<ChatReal[]>(() => {
    const porTelefono = new Map<string, MensajeWA[]>();
    for (const m of datos?.mensajes ?? []) porTelefono.set(m.telefono, [...(porTelefono.get(m.telefono) ?? []), m]);
    return [...porTelefono.entries()]
      .map(([telefono, mensajes]) => {
        const entrantes = mensajes.filter((m) => m.direccion === "in");
        const nombre = [...entrantes].reverse().find((m) => m.nombre)?.nombre;
        return {
          id: `wa-${telefono}`,
          telefono,
          nombre: nombre ?? telefonoLegible(telefono),
          mensajes,
          ultimo: mensajes[mensajes.length - 1],
          ultimoEntrante: entrantes[entrantes.length - 1],
        };
      })
      .sort((a, b) => b.ultimo.ts.localeCompare(a.ultimo.ts));
  }, [datos]);

  const noLeidos = useCallback(
    (c: ChatReal) => c.mensajes.filter((m) => m.direccion === "in" && (!visto[c.telefono] || m.ts > visto[c.telefono])).length,
    [visto],
  );

  const marcarVisto = useCallback((c: ChatReal) => {
    const ts = c.ultimoEntrante?.ts;
    if (!ts) return;
    setVisto((v) => {
      if (v[c.telefono] && v[c.telefono] >= ts) return v;
      const nuevo = { ...v, [c.telefono]: ts };
      try {
        localStorage.setItem(LLAVE_VISTO, JSON.stringify(nuevo));
      } catch {}
      return nuevo;
    });
  }, []);

  /** Envía por WhatsApp; devuelve el error de Meta si no lo aceptó. */
  const enviar = useCallback(
    async (telefono: string, texto: string): Promise<string | null> => {
      try {
        const r = await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono, texto }) });
        const d = (await r.json()) as { mensaje?: MensajeWA; error?: string };
        if (!r.ok || !d.mensaje) return d.error ?? "WhatsApp no aceptó el mensaje";
        const enviado = { ...d.mensaje, id: -Date.now() };
        setDatos((x) => (x ? { ...x, mensajes: [...x.mensajes, enviado] } : x));
        recargar();
        return null;
      } catch {
        return "WhatsApp no aceptó el mensaje";
      }
    },
    [recargar],
  );

  return { configurado: Boolean(datos?.configurado), numero: datos?.numero ?? null, error, chats, noLeidos, marcarVisto, enviar };
}
