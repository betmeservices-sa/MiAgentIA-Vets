"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CONVERSACIONES, RECETAS } from "./seed";
import type { Agenda, Conversacion, Mensaje, Receta, Rol } from "./types";

/** Filtro global: todo, solo clínica o solo grooming. */
export type FiltroAgenda = "todas" | Agenda;

/** Lo que el veterinario decidió sobre una urgencia que marcó el agente. */
export interface UrgenciaVet {
  estado: "en_agenda" | "atendida" | "sin_cita";
  hora?: string;
}

interface Estado {
  rol: Rol;
  setRol: (r: Rol) => void;
  filtro: FiltroAgenda;
  setFiltro: (f: FiltroAgenda) => void;
  conversaciones: Conversacion[];
  tomar: (id: string) => void;
  devolverAIA: (id: string) => void;
  resolver: (id: string) => void;
  enviar: (id: string, texto: string) => void;
  marcarLeida: (id: string) => void;
  urgencias: Record<string, UrgenciaVet>;
  agendarUrgencia: (id: string, hora: string) => void;
  cerrarUrgencia: (id: string, estado: "atendida" | "sin_cita") => void;
  recetas: Receta[];
  agregarReceta: (r: Receta) => void;
}

const Ctx = createContext<Estado | null>(null);

export function ahora() {
  return new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [rol, setRolState] = useState<Rol>("secretaria");
  const [filtro, setFiltroState] = useState<FiltroAgenda>("todas");
  const [conversaciones, setConvs] = useState<Conversacion[]>(CONVERSACIONES);

  // Rol y filtro se recuerdan por navegador: son preferencias de vista.
  useEffect(() => {
    try {
      const r = localStorage.getItem("vet-rol") as Rol | null;
      const f = localStorage.getItem("vet-filtro") as FiltroAgenda | null;
      if (r) setRolState(r);
      if (f) setFiltroState(f);
    } catch {}
  }, []);

  const setRol = useCallback((r: Rol) => {
    setRolState(r);
    // El groomer solo ve su agenda: el filtro se fija a grooming.
    if (r === "groomer") setFiltroState("grooming");
    if (r === "veterinario") setFiltroState("clinica");
    try {
      localStorage.setItem("vet-rol", r);
    } catch {}
  }, []);

  const setFiltro = useCallback((f: FiltroAgenda) => {
    setFiltroState(f);
    try {
      localStorage.setItem("vet-filtro", f);
    } catch {}
  }, []);

  const editar = useCallback((id: string, fn: (c: Conversacion) => Conversacion) => {
    setConvs((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const sistema = (texto: string): Mensaje => ({
    id: `s${Date.now()}`,
    autor: "sistema",
    texto,
    hora: ahora(),
  });

  const tomar = useCallback(
    (id: string) =>
      editar(id, (c) => ({
        ...c,
        estado: "secretaria",
        esperaMin: undefined,
        noLeidos: 0,
        mensajes: [...c.mensajes, sistema("La secretaria respondió. El agente queda en pausa en esta conversación.")],
      })),
    [editar],
  );

  const devolverAIA = useCallback(
    (id: string) =>
      editar(id, (c) => ({
        ...c,
        estado: "ia",
        motivo: undefined,
        mensajes: [...c.mensajes, sistema("El agente retomó la conversación.")],
      })),
    [editar],
  );

  const resolver = useCallback(
    (id: string) =>
      editar(id, (c) => ({ ...c, estado: "resuelta", mensajes: [...c.mensajes, sistema("Conversación marcada como resuelta.")] })),
    [editar],
  );

  const enviar = useCallback(
    (id: string, texto: string) =>
      editar(id, (c) => {
        const tomada = c.estado !== "secretaria";
        const extra: Mensaje[] = tomada
          ? [sistema("La secretaria respondió. El agente queda en pausa en esta conversación.")]
          : [];
        return {
          ...c,
          estado: "secretaria",
          esperaMin: undefined,
          noLeidos: 0,
          hora: ahora(),
          mensajes: [...c.mensajes, ...extra, { id: `t${Date.now()}`, autor: "secretaria", texto, hora: ahora() }],
        };
      }),
    [editar],
  );

  // Urgencias: el veterinario las mete en su agenda de hoy; la secretaria ve el
  // aviso en la conversación para decírselo al cliente.
  const [urgencias, setUrgencias] = useState<Record<string, UrgenciaVet>>({});

  const agendarUrgencia = useCallback(
    (id: string, hora: string) => {
      setUrgencias((u) => ({ ...u, [id]: { estado: "en_agenda", hora } }));
      editar(id, (c) => ({ ...c, mensajes: [...c.mensajes, sistema(`El Dr. Méndez reservó la urgencia en su agenda de hoy a las ${hora}.`)] }));
    },
    [editar],
  );

  const cerrarUrgencia = useCallback(
    (id: string, estado: "atendida" | "sin_cita") => {
      setUrgencias((u) => ({ ...u, [id]: { ...u[id], estado } }));
      if (estado === "sin_cita") editar(id, (c) => ({ ...c, mensajes: [...c.mensajes, sistema("El Dr. Méndez indicó que esta urgencia no necesita cita.")] }));
    },
    [editar],
  );

  // Recetas: las escribe el veterinario; la secretaria las consulta en el perfil del cliente.
  const [recetas, setRecetas] = useState<Receta[]>(RECETAS);
  const agregarReceta = useCallback((r: Receta) => setRecetas((rs) => [r, ...rs]), []);

  const marcarLeida = useCallback((id: string) => editar(id, (c) => (c.noLeidos ? { ...c, noLeidos: 0 } : c)), [editar]);

  return (
    <Ctx.Provider value={{ rol, setRol, filtro, setFiltro, conversaciones, tomar, devolverAIA, resolver, enviar, marcarLeida, urgencias, agendarUrgencia, cerrarUrgencia, recetas, agregarReceta }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore fuera de StoreProvider");
  return c;
}

/** ¿Pasa este elemento el filtro global? null = no tiene agenda (pasa siempre en "todas"). */
export function pasaFiltro(filtro: FiltroAgenda, agenda: Agenda | null | undefined) {
  return filtro === "todas" || agenda === filtro;
}
