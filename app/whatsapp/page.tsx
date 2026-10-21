"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCheck, ChevronLeft, Clock, FileText, MapPin, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { WhatsappIcon } from "@/components/glifos";
import type { MensajeWA, NumeroWA } from "@/lib/whatsapp";

// Módulo con el WhatsApp REAL de la clínica: lo que entra al número conectado
// llega aquí y se contesta desde aquí. La bandeja (/) sigue siendo la de
// demostración.

const SV = "America/El_Salvador";
const VENTANA_MS = 24 * 60 * 60 * 1000;
const SONDEO_MS = 4000;
const LLAVE_VISTO = "vet-wa-visto";

interface Respuesta {
  configurado: boolean;
  numero: NumeroWA | null;
  mensajes: MensajeWA[];
  error?: string;
}

interface Chat {
  telefono: string;
  nombre: string;
  mensajes: MensajeWA[];
  ultimo: MensajeWA;
  /** Último mensaje del cliente: abre la ventana de 24 h para escribirle texto libre. */
  ultimoEntrante?: MensajeWA;
}

function telefonoLegible(t: string) {
  const d = t.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("503")) return `+503 ${d.slice(3, 7)} ${d.slice(7)}`;
  return `+${d}`;
}

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-SV", { timeZone: SV, hour: "2-digit", minute: "2-digit", hour12: false });
}

function diaCorto(iso: string) {
  const f = (d: Date) => d.toLocaleDateString("es-SV", { timeZone: SV });
  if (f(new Date(iso)) === f(new Date())) return hora(iso);
  return new Date(iso).toLocaleDateString("es-SV", { timeZone: SV, day: "numeric", month: "short" });
}

function vistoGuardado(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LLAVE_VISTO) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function resumen(m: MensajeWA) {
  if (m.texto) return m.texto;
  const tipos: Record<string, string> = { image: "Foto", audio: "Audio", video: "Video", document: "Documento", sticker: "Sticker", location: "Ubicación" };
  return tipos[m.tipo] ?? "Mensaje";
}

export default function WhatsappPage() {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [error, setError] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [chatMovil, setChatMovil] = useState(false);
  const [visto, setVisto] = useState<Record<string, string>>({});

  useEffect(() => setVisto(vistoGuardado()), []);

  const cargar = useCallback(async () => {
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
    cargar();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, SONDEO_MS);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  const chats = useMemo<Chat[]>(() => {
    const porTelefono = new Map<string, MensajeWA[]>();
    for (const m of datos?.mensajes ?? []) porTelefono.set(m.telefono, [...(porTelefono.get(m.telefono) ?? []), m]);
    return [...porTelefono.entries()]
      .map(([telefono, mensajes]) => {
        const entrantes = mensajes.filter((m) => m.direccion === "in");
        const nombre = [...entrantes].reverse().find((m) => m.nombre)?.nombre;
        return { telefono, nombre: nombre ?? telefonoLegible(telefono), mensajes, ultimo: mensajes[mensajes.length - 1], ultimoEntrante: entrantes[entrantes.length - 1] };
      })
      .sort((a, b) => b.ultimo.ts.localeCompare(a.ultimo.ts));
  }, [datos]);

  const actual = chats.find((c) => c.telefono === sel) ?? chats[0];

  const noLeidos = (c: Chat) => c.mensajes.filter((m) => m.direccion === "in" && (!visto[c.telefono] || m.ts > visto[c.telefono])).length;

  // Lo que está abierto en pantalla cuenta como leído.
  useEffect(() => {
    if (!actual?.ultimoEntrante || (!chatMovil && window.matchMedia("(max-width: 767px)").matches)) return;
    const ts = actual.ultimoEntrante.ts;
    if (visto[actual.telefono] && visto[actual.telefono] >= ts) return;
    const nuevo = { ...visto, [actual.telefono]: ts };
    setVisto(nuevo);
    try {
      localStorage.setItem(LLAVE_VISTO, JSON.stringify(nuevo));
    } catch {}
  }, [actual, visto, chatMovil]);

  const agregarEnviado = (m: MensajeWA) => setDatos((d) => (d ? { ...d, mensajes: [...d.mensajes, m] } : d));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className={cn("flex-wrap items-center justify-between gap-3 border-b border-line bg-card px-5 py-3", chatMovil ? "hidden md:flex" : "flex")}>
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-extrabold tracking-tight">
            <span className="text-[#1ba34d]"><WhatsappIcon size={20} /></span> WhatsApp
          </h1>
          <p className="text-[12.5px] text-[var(--text-3)]">
            {datos?.numero ? `${datos.numero.telefono} · ${datos.numero.nombre}` : "Número de la clínica"}
          </p>
        </div>
        {datos?.configurado && (
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold", datos.numero ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
            <span className={cn("h-2 w-2 rounded-full", datos.numero ? "bg-emerald-500" : "bg-amber-500")} />
            {datos.numero ? "Conectado" : "Meta no respondió"}
          </span>
        )}
      </header>

      {error && <p className="border-b border-rose-200 bg-rose-50 px-5 py-2 text-[12.5px] font-semibold text-rose-800">{error}</p>}

      {!datos ? (
        <p className="p-8 text-center text-sm text-[var(--text-3)]">Cargando WhatsApp…</p>
      ) : !datos.configurado ? (
        <div className="m-6 max-w-lg rounded-2xl border border-line bg-card p-5 text-[13.5px] text-[var(--text-2)]">
          <p className="font-bold text-[var(--text)]">WhatsApp no está configurado en este ambiente</p>
          <p className="mt-1">Faltan las variables del número (WHATSAPP_*, META_APP_SECRET y SUPABASE_*).</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="m-6 max-w-lg rounded-2xl border border-line bg-card p-5 text-[13.5px] text-[var(--text-2)]">
          <p className="font-bold text-[var(--text)]">Todavía no hay mensajes</p>
          <p className="mt-1">Lo que le escriban al {datos.numero?.telefono ?? "número de la clínica"} aparece aquí.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className={cn("w-full shrink-0 flex-col border-r border-line bg-card md:max-w-[340px]", chatMovil ? "hidden md:flex" : "flex")}>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {chats.map((c) => {
                const n = noLeidos(c);
                return (
                  <button
                    key={c.telefono}
                    type="button"
                    onClick={() => {
                      setSel(c.telefono);
                      setChatMovil(true);
                    }}
                    className={cn("flex w-full gap-3 border-b border-line/70 px-3.5 py-3 text-left transition", actual?.telefono === c.telefono ? "bg-brand/5" : "hover:bg-surface")}
                  >
                    <Avatar nombre={c.nombre} size={42} color="#1ba34d" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{c.nombre}</p>
                        <span className="shrink-0 text-[11px] text-[var(--text-3)]">{diaCorto(c.ultimo.ts)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] text-[var(--text-2)]">
                          {c.ultimo.direccion === "out" && "Tú: "}
                          {resumen(c.ultimo)}
                        </p>
                        {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1ba34d] px-1.5 text-[11px] font-bold text-white">{n}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {actual && <Hilo key={actual.telefono} c={actual} movil={chatMovil} onVolver={() => setChatMovil(false)} onEnviado={agregarEnviado} onRecargar={cargar} />}
        </div>
      )}
    </div>
  );
}

function Hilo({ c, movil, onVolver, onEnviado, onRecargar }: { c: Chat; movil: boolean; onVolver: () => void; onEnviado: (m: MensajeWA) => void; onRecargar: () => void }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [c.mensajes.length]);

  const abierta = Boolean(c.ultimoEntrante && Date.now() - new Date(c.ultimoEntrante.ts).getTime() < VENTANA_MS);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono: c.telefono, texto: t }) });
      const d = (await r.json()) as { mensaje?: MensajeWA; error?: string };
      if (!r.ok || !d.mensaje) throw new Error(d.error ?? "WhatsApp no aceptó el mensaje");
      onEnviado({ ...d.mensaje, id: -Date.now() });
      setTexto("");
      onRecargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "WhatsApp no aceptó el mensaje");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={cn("min-w-0 flex-1 flex-col bg-surface", movil ? "flex" : "hidden md:flex")}>
      <div className="flex items-center gap-2.5 border-b border-line bg-card px-4 py-2.5">
        <button type="button" onClick={onVolver} className="-ml-1 inline-flex items-center gap-0.5 rounded-lg py-1 pr-1.5 text-[13px] font-semibold text-brand md:hidden">
          <ChevronLeft size={18} /> Volver
        </button>
        <Avatar nombre={c.nombre} size={34} color="#1ba34d" />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-bold">{c.nombre}</p>
          <p className="text-[12px] text-[var(--text-3)]">{telefonoLegible(c.telefono)}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {c.mensajes.map((m) => {
          const nuestro = m.direccion === "out";
          return (
            <div key={m.wamid ?? m.id} className={cn("ccg-pop flex", nuestro ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm", nuestro ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-card")}>
                {nuestro && m.autor && <p className="mb-0.5 text-[10.5px] font-bold text-white/80">{m.autor}</p>}
                <Adjunto m={m} />
                {m.texto && <p className="whitespace-pre-line break-words">{m.texto}</p>}
                {!m.texto && !m.media_id && <p className="italic opacity-70">{resumen(m)}</p>}
                <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", nuestro ? "text-white/75" : "text-[var(--text-3)]")}>
                  {hora(m.ts)}
                  {nuestro && <EstadoEnvio estado={m.estado} />}
                </p>
                {m.estado === "fallido" && m.error && <p className="mt-1 rounded-md bg-white/15 px-2 py-1 text-[11px]">No llegó: {m.error}</p>}
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      <form onSubmit={enviar} className="border-t border-line bg-card p-3">
        {!abierta && (
          <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900">
            <Clock size={13} className="mt-0.5 shrink-0" />
            Pasaron más de 24 horas desde su último mensaje. WhatsApp solo deja escribirle de nuevo con una plantilla aprobada.
          </p>
        )}
        {error && (
          <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[12px] text-rose-800">
            <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={!abierta || enviando}
            placeholder={abierta ? `Responder a ${c.nombre.split(" ")[0]} por WhatsApp…` : "Ventana de 24 horas cerrada"}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-60"
          />
          <button type="submit" disabled={!abierta || enviando || !texto.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white hover:bg-brand-dark disabled:opacity-50" aria-label="Enviar">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function EstadoEnvio({ estado }: { estado: string }) {
  if (estado === "fallido") return <AlertCircle size={12} className="text-rose-200" aria-label="No llegó" />;
  if (estado === "leido") return <CheckCheck size={13} className="text-sky-200" aria-label="Leído" />;
  if (estado === "entregado") return <CheckCheck size={13} aria-label="Entregado" />;
  return <Check size={13} aria-label="Enviado" />;
}

function Adjunto({ m }: { m: MensajeWA }) {
  if (m.tipo === "location" && m.texto) {
    const coords = m.texto.split(" · ").pop();
    return (
      <a href={`https://www.google.com/maps?q=${coords}`} target="_blank" rel="noreferrer" className="mb-1 inline-flex items-center gap-1 font-semibold underline">
        <MapPin size={13} /> Ver ubicación
      </a>
    );
  }
  if (!m.media_id) return null;
  const src = `/api/whatsapp/media/${m.media_id}`;
  if (m.tipo === "image" || m.tipo === "sticker") {
    return (
      <a href={src} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Foto enviada por WhatsApp" className={cn("mb-1 rounded-xl", m.tipo === "sticker" ? "h-28 w-28 object-contain" : "max-h-72 w-auto")} />
      </a>
    );
  }
  if (m.tipo === "audio") return <audio controls src={src} className="mb-1 max-w-full" />;
  if (m.tipo === "video") return <video controls src={src} className="mb-1 max-h-72 rounded-xl" />;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="mb-1 inline-flex items-center gap-1.5 font-semibold underline">
      <FileText size={14} /> {m.media_nombre ?? "Documento"}
    </a>
  );
}
