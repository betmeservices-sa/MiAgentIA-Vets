"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CONVERSACIONES, RECETAS, cliente } from "./seed";
import type { Agenda, Conversacion, Mensaje, Receta } from "./types";

/** Filtro global: todo, solo clínica o solo grooming. */
export type FiltroAgenda = "todas" | Agenda;

/** Lo que el veterinario decidió sobre una urgencia que marcó el agente. */
export interface UrgenciaVet {
  estado: "en_agenda" | "atendida" | "sin_cita";
  hora?: string;
}

interface Estado {
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
  /** Calendario que se ve en /agendas (lo eligen los botones de la barra de arriba). */
  calendario: Agenda;
  setCalendario: (a: Agenda) => void;
  /** Conversación abierta en la bandeja. */
  convSel: string;
  setConvSel: (id: string) => void;
  /** Id de la conversación del cliente; si no tiene, abre una nueva por su canal. */
  conversacionDe: (clienteId: string) => string;
}

const Ctx = createContext<Estado | null>(null);

export function ahora() {
  return new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const sistema = (texto: string): Mensaje => ({
  id: `s${Date.now()}`,
  autor: "sistema",
  texto,
  hora: ahora(),
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [filtro, setFiltroState] = useState<FiltroAgenda>("todas");
  const [conversaciones, setConvs] = useState<Conversacion[]>(CONVERSACIONES);
  const [calendario, setCalendario] = useState<Agenda>("clinica");
  const [convSel, setConvSel] = useState("v3");

  // El filtro se recuerda por navegador: es una preferencia de vista.
  useEffect(() => {
    try {
      const f = localStorage.getItem("vet-filtro") as FiltroAgenda | null;
      if (f) setFiltroState(f);
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

  const tomar = useCallback(
    (id: string) =>
      editar(id, (c) => ({
        ...c,
        estado: "secretaria",
        esperaMin: undefined,
        noLeidos: 0,
        mensajes: [...c.mensajes, sistema("La clínica respondió. El agente queda en pausa en esta conversación.")],
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
          ? [sistema("La clínica respondió. El agente queda en pausa en esta conversación.")]
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

  // Urgencias: se meten en la agenda de hoy del veterinario y queda el aviso
  // en la conversación para decírselo al cliente.
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

  // Recetas: se escriben en Acciones → Receta y se consultan en el perfil del paciente.
  const [recetas, setRecetas] = useState<Receta[]>(RECETAS);
  const agregarReceta = useCallback((r: Receta) => setRecetas((rs) => [r, ...rs]), []);

  const marcarLeida = useCallback((id: string) => editar(id, (c) => (c.noLeidos ? { ...c, noLeidos: 0 } : c)), [editar]);

  const conversacionDe = useCallback(
    (clienteId: string) => {
      const existente = conversaciones.find((c) => c.clienteId === clienteId);
      if (existente) return existente.id;
      const id = `n-${clienteId}`;
      const cli = cliente(clienteId);
      setConvs((cs) => [
        {
          id,
          objetivo: "informacion",
          clienteId,
          canal: cli.canal,
          agenda: null,
          estado: "secretaria",
          noLeidos: 0,
          hora: ahora(),
          mensajes: [sistema("Conversación abierta desde Pacientes. Luna queda en pausa mientras la clínica escribe.")],
        },
        ...cs,
      ]);
      return id;
    },
    [conversaciones],
  );

  return (
    <Ctx.Provider
      value={{ filtro, setFiltro, conversaciones, tomar, devolverAIA, resolver, enviar, marcarLeida, urgencias, agendarUrgencia, cerrarUrgencia, recetas, agregarReceta, calendario, setCalendario, convSel, setConvSel, conversacionDe }}
    >
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
