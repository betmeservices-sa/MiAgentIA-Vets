"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BellRing, Bot, CalendarCheck, CalendarPlus, CheckCheck, Info, Moon, PawPrint, Phone, Pill, RotateCcw, Send, ShieldCheck, Sparkles, Stethoscope, UserPlus, UserRound, UserRoundSearch } from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, etiquetaDia, MOTIVO } from "@/lib/format";
import { CITAS, cliente, nombreMascota, STAFF } from "@/lib/seed";
import { pasaFiltro, useStore } from "@/lib/store";
import type { Canal, Conversacion, Objetivo } from "@/lib/types";
import { AgendaPill, Avatar, ChannelBadge, EstadoCitaPill, FiltroAgendaToggle } from "@/components/ui";

// La bandeja no reparte clientes entre personas: MIA atiende todo, agenda y
// reagenda sola. Las pestañas separan la reactivación y lo urgente que MIA
// pasó a la clínica; los filtros son por canal y por prioridad.
type Tab = "todas" | "reactivacion" | "urgencia";
const TABS: { id: Tab; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "reactivacion", label: "Reactivación" },
  { id: "urgencia", label: "Urgencia" },
];

function enTab(c: Conversacion, tab: Tab) {
  if (tab === "todas") return true;
  if (tab === "urgencia") return c.estado === "transferida";
  return c.objetivo === tab;
}

type Prioridad = "alta" | "media" | "baja";

/**
 * Alta: urgencias y casos clínicos sin cerrar. Media: MIA la pasó a la clínica
 * por otro motivo (precio especial, pidió hablar con alguien) o la clínica la
 * está atendiendo. Baja: MIA la resuelve sola.
 */
function prioridad(c: Conversacion): Prioridad {
  if (c.estado === "resuelta") return "baja";
  if (c.motivo === "urgencia" || c.motivo === "caso_clinico") return "alta";
  if (c.estado === "transferida" || c.estado === "secretaria") return "media";
  return "baja";
}

const PRIORIDAD: Record<Prioridad, { label: string; punto: string }> = {
  alta: { label: "Alta", punto: "bg-rose-500" },
  media: { label: "Media", punto: "bg-amber-500" },
  baja: { label: "Baja", punto: "bg-emerald-500" },
};

const OBJETIVO: Record<Objetivo, { label: string; Icon: typeof Bot }> = {
  agendar: { label: "Agendar", Icon: CalendarPlus },
  reactivacion: { label: "Reactivación", Icon: UserRoundSearch },
  recordatorio: { label: "Recordatorio", Icon: BellRing },
  seguimiento: { label: "Seguimiento", Icon: Stethoscope },
  receta: { label: "Receta", Icon: Pill },
  informacion: { label: "Información", Icon: Info },
};

const RESULTADO = {
  cita: "bg-emerald-50 text-emerald-700 ring-emerald-300/60",
  confirmada: "bg-emerald-50 text-emerald-700 ring-emerald-300/60",
  reagendada: "bg-sky-50 text-sky-700 ring-sky-300/60",
  sin_interes: "bg-slate-100 text-slate-600 ring-slate-300/60",
} as const;

const CANALES: { id: "todos" | Canal; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
];

export default function BandejaPage() {
  const { conversaciones, filtro, marcarLeida, convSel: sel, setConvSel: setSel } = useStore();
  const [tab, setTab] = useState<Tab>("todas");
  const [canal, setCanal] = useState<"todos" | Canal>("todos");
  const [prio, setPrio] = useState<"todas" | Prioridad>("todas");

  // Cada filtro cuenta con los demás aplicados, para que los números cuadren.
  const enAgenda = useMemo(() => conversaciones.filter((c) => pasaFiltro(filtro, c.agenda) || c.agenda === null), [conversaciones, filtro]);
  const pasaCanal = (c: Conversacion, k = canal) => k === "todos" || c.canal === k;
  const pasaPrio = (c: Conversacion, p = prio) => p === "todas" || prioridad(c) === p;

  const lista = useMemo(() => {
    const orden: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };
    const urgenciaPrimero = (c: Conversacion) => (c.motivo === "urgencia" && c.estado === "transferida" ? -1 : 0);
    return enAgenda
      .filter((c) => enTab(c, tab) && pasaCanal(c) && pasaPrio(c))
      .sort((a, b) => urgenciaPrimero(a) - urgenciaPrimero(b) || orden[prioridad(a)] - orden[prioridad(b)] || Number(a.estado === "resuelta") - Number(b.estado === "resuelta"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enAgenda, tab, canal, prio]);

  // Si los filtros dejan fuera la conversación abierta, se muestra la primera de la lista.
  const actual = lista.find((c) => c.id === sel) ?? lista[0];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-card px-5 py-3">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Bandeja omnicanal</h1>
          <p className="text-[12.5px] text-[var(--text-3)]">WhatsApp, Instagram y Facebook en un solo lugar · MIA agenda y reagenda sola en clínica y grooming</p>
        </div>
        <FiltroAgendaToggle />
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Lista */}
        <div className="flex w-full max-w-[360px] shrink-0 flex-col border-r border-line bg-card">
          <div className="space-y-2.5 border-b border-line p-3">
            <div className="flex gap-1">
              {TABS.map((t) => {
                const n = t.id === "todas" ? null : enAgenda.filter((c) => enTab(c, t.id) && pasaCanal(c) && pasaPrio(c)).length;
                const urg = t.id === "urgencia";
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold",
                      tab === t.id ? (urg ? "bg-rose-600 text-white" : "bg-brand text-white") : urg ? "text-rose-700 hover:bg-rose-50" : "text-[var(--text-2)] hover:bg-surface",
                    )}
                  >
                    {urg && <AlertTriangle size={12} className="-mt-0.5 mr-1 inline" />}
                    {t.label}
                    {n !== null && n > 0 && <span className="ml-1 opacity-70">{n}</span>}
                  </button>
                );
              })}
            </div>

            <div>
              <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)]">Canal</p>
              <div className="grid grid-cols-4 gap-1">
                {CANALES.map((k) => {
                  const on = canal === k.id;
                  const n = enAgenda.filter((c) => enTab(c, tab) && pasaCanal(c, k.id) && pasaPrio(c)).length;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setCanal(k.id)}
                      aria-pressed={on}
                      title={`${k.label} · ${n}`}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[11.5px] font-semibold transition",
                        on ? "border-brand bg-brand/10 text-brand" : "border-line text-[var(--text-2)] hover:bg-surface",
                      )}
                    >
                      {k.id === "todos" ? "Todos" : <ChannelBadge canal={k.id} />}
                      <span className="opacity-60">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prioridad: filtro discreto; tocar de nuevo lo quita. */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="mr-0.5 text-[var(--text-3)]">Prioridad</span>
              {(["alta", "media", "baja"] as const).map((p) => {
                const on = prio === p;
                const n = enAgenda.filter((c) => enTab(c, tab) && pasaCanal(c) && pasaPrio(c, p)).length;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrio(on ? "todas" : p)}
                    aria-pressed={on}
                    title={on ? "Quitar filtro" : `Solo prioridad ${PRIORIDAD[p].label.toLowerCase()}`}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold transition",
                      on ? "bg-[var(--text)] text-white" : "text-[var(--text-2)] hover:bg-surface",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", PRIORIDAD[p].punto)} />
                    {PRIORIDAD[p].label}
                    <span className="opacity-60">{n}</span>
                  </button>
                );
              })}
              {prio !== "todas" && (
                <button type="button" onClick={() => setPrio("todas")} className="ml-auto font-semibold text-brand hover:underline">
                  Ver todas
                </button>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {lista.map((c) => (
              <Item key={c.id} c={c} activa={actual?.id === c.id} onClick={() => { setSel(c.id); marcarLeida(c.id); }} />
            ))}
            {lista.length === 0 && <p className="p-6 text-center text-sm text-[var(--text-3)]">Sin conversaciones con este filtro.</p>}
          </div>
        </div>

        {actual ? <Hilo c={actual} /> : <div className="flex-1" />}
        {actual && <Ficha c={actual} />}
      </div>
    </div>
  );
}

function Item({ c, activa, onClick }: { c: Conversacion; activa: boolean; onClick: () => void }) {
  const cli = cliente(c.clienteId);
  // Puede escribir el dueño o un contacto secundario de la mascota.
  const quien = c.contacto?.nombre ?? cli.nombre;
  const ultimo = [...c.mensajes].reverse().find((m) => m.autor !== "sistema");
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full gap-3 border-b border-line/70 px-3.5 py-3 text-left transition", activa ? "bg-brand/5" : "hover:bg-surface")}>
      <div className="relative">
        <Avatar nombre={quien} size={42} color={c.agenda ? AGENDA_INFO[c.agenda].color : "#64748b"} />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
          <ChannelBadge canal={c.canal} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORIDAD[prioridad(c)].punto)} title={`Prioridad ${PRIORIDAD[prioridad(c)].label.toLowerCase()}`} aria-label={`Prioridad ${PRIORIDAD[prioridad(c)].label.toLowerCase()}`} />
            <span className="truncate">{quien}</span>
          </p>
          <span className="shrink-0 text-[11px] text-[var(--text-3)]">{c.hora}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-[var(--text-2)]">{ultimo?.texto}</p>
          {c.noLeidos > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-accent)] px-1.5 text-[11px] font-bold text-white">{c.noLeidos}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {c.agenda && <AgendaPill agenda={c.agenda} />}
          <ObjetivoTag c={c} />
          {c.contacto && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700" title={c.contacto.relacion}>
              <UserPlus size={10} /> Contacto de {nombreMascota(c.contacto.mascota, cli)}
            </span>
          )}
          {c.estado === "transferida" && c.motivo ? (
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", MOTIVO[c.motivo].className)}>
              {MOTIVO[c.motivo].label} · {c.esperaMin} min
            </span>
          ) : c.resultado ? (
            <span className={cn("inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ring-1", RESULTADO[c.resultado.tipo])}>
              {c.resultado.tipo !== "sin_interes" && <CalendarCheck size={10} />} {c.resultado.texto}
            </span>
          ) : c.estado === "secretaria" ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600">IA en pausa</span>
          ) : c.estado === "ia" ? (
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700">MIA en curso</span>
          ) : null}
          {cli.creadoPorIA && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700">
              <Sparkles size={10} /> Cliente nuevo
            </span>
          )}
          {c.fueraHorario && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600">
              <Moon size={10} /> Fuera de horario
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ObjetivoTag({ c }: { c: Conversacion }) {
  const { label, Icon } = OBJETIVO[c.objetivo];
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-surface px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--text-2)]">
      <Icon size={10} /> {label}
    </span>
  );
}

function Hilo({ c }: { c: Conversacion }) {
  const { devolverAIA, resolver, enviar } = useStore();
  const [texto, setTexto] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const cli = cliente(c.clienteId);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [c.id, c.mensajes.length]);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <p className="truncate font-bold">{c.contacto?.nombre ?? cli.nombre}</p>
          {c.contacto && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700" title={c.contacto.relacion}>
              <UserPlus size={10} /> Contacto de {nombreMascota(c.contacto.mascota, cli)}
            </span>
          )}
          <ChannelBadge canal={c.canal} label />
          {c.agenda && <AgendaPill agenda={c.agenda} />}
          <ObjetivoTag c={c} />
        </div>
        <div className="flex items-center gap-1.5">
          {(c.estado === "secretaria" || c.estado === "transferida") && (
            <button type="button" onClick={() => devolverAIA(c.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-brand-dark">
              <RotateCcw size={14} /> Que MIA siga (agendar)
            </button>
          )}
          {c.estado !== "resuelta" && (
            <button type="button" onClick={() => resolver(c.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[12.5px] font-semibold text-[var(--text-2)] hover:bg-surface">
              <CheckCheck size={14} /> Resolver
            </button>
          )}
        </div>
      </div>

      {c.estado === "transferida" && c.motivo && (
        <div className={cn("flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold", c.motivo === "urgencia" ? "bg-rose-600 text-white" : "bg-amber-50 text-amber-900")}>
          <AlertTriangle size={14} />
          MIA la pasó a la clínica por {MOTIVO[c.motivo].label.toLowerCase()} hace {c.esperaMin} min y dejó de responder. Contesta aquí abajo.
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {c.mensajes.map((m) => {
          if (m.autor === "sistema") {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="max-w-[85%] rounded-full bg-surface-2 px-3 py-1 text-center text-[11.5px] font-medium text-[var(--text-2)]">
                  {m.texto} · {m.hora}
                </span>
              </div>
            );
          }
          const nuestro = m.autor !== "cliente";
          return (
            <div key={m.id} className={cn("ccg-pop flex", nuestro ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm", nuestro ? (m.autor === "ia" ? "rounded-br-md bg-[#ede9fe] text-[#2e1065]" : "rounded-br-md bg-brand text-white") : "rounded-bl-md bg-card")}>
                {nuestro && (
                  <p className={cn("mb-0.5 flex items-center gap-1 text-[10.5px] font-bold", m.autor === "ia" ? "text-violet-700" : "text-white/80")}>
                    {m.autor === "ia" ? <Bot size={11} /> : <UserRound size={11} />}
                    {m.autor === "ia" ? "MIA · agente IA" : STAFF.secretaria.nombre}
                    {m.plantilla && <span className="ml-1 rounded bg-white/60 px-1 font-mono text-[9.5px]">plantilla: {m.plantilla}</span>}
                  </p>
                )}
                <p className="whitespace-pre-line">{m.texto}</p>
                {m.botones && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.botones.map((b) => (
                      <span key={b} className="rounded-lg border border-violet-300 bg-white px-2 py-0.5 text-[11.5px] font-semibold text-violet-700">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                <p className={cn("mt-0.5 text-right text-[10px]", nuestro && m.autor !== "ia" ? "text-white/70" : "text-[var(--text-3)]")}>{m.hora}</p>
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          enviar(c.id, texto.trim());
          setTexto("");
        }}
        className="border-t border-line bg-card p-3"
      >
        {c.estado === "ia" && (
          <p className="mb-2 flex items-center gap-1.5 text-[11.5px] text-[var(--text-3)]">
            <Bot size={12} /> MIA está atendiendo. Si escribes, el agente queda en pausa en esta conversación.
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Responder a ${(c.contacto?.nombre ?? cli.nombre).split(" ")[0]} por ${c.canal === "whatsapp" ? "WhatsApp" : c.canal === "instagram" ? "Instagram" : "Facebook"}…`}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white hover:bg-brand-dark" aria-label="Enviar">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

function Ficha({ c }: { c: Conversacion }) {
  const cli = cliente(c.clienteId);
  const { contactosDe } = useStore();
  const citas = CITAS.filter((x) => x.clienteId === cli.id).sort((a, b) => b.dia - a.dia).slice(0, 6);
  return (
    <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-line bg-card p-4 xl:block">
      {c.contacto && (
        <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-[12.5px]">
          <p className="flex items-center gap-1.5 font-bold text-violet-800">
            <UserPlus size={14} /> Escribe un contacto secundario
          </p>
          <p className="mt-1 font-semibold text-[var(--text)]">{c.contacto.nombre}</p>
          <p className="text-[var(--text-2)]">{c.contacto.relacion} · {c.contacto.telefono}</p>
          <p className="mt-1 text-[11.5px] text-violet-700">MIA lo agregó al perfil de {nombreMascota(c.contacto.mascota, cli)}. Abajo, el dueño registrado.</p>
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <Avatar nombre={cli.nombre} size={56} />
        <p className="mt-2 font-bold">{cli.nombre}</p>
        <p className="flex items-center gap-1 text-[12.5px] text-[var(--text-3)]">
          <Phone size={12} /> {cli.telefono}
        </p>
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {cli.creadoPorIA && (
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700">
              <Sparkles size={10} /> Perfil creado por MIA · por revisar
            </span>
          )}
          {cli.etiquetas?.map((e) => (
            <span key={e} className="rounded-md bg-surface px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--text-2)]">{e}</span>
          ))}
        </div>
      </div>

      <h3 className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Mascotas</h3>
      <div className="space-y-2">
        {cli.mascotas.map((m) => (
          <div key={m.nombre} className="flex items-center gap-2.5 rounded-xl border border-line p-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-[var(--text-2)]"><PawPrint size={16} /></span>
            <div className="text-[12.5px] leading-tight">
              <p className="flex items-center gap-1.5 font-bold">
                {nombreMascota(m.nombre, cli)}
                {m.creadaPorIA && <span className="rounded bg-violet-50 px-1 text-[9.5px] font-semibold text-violet-700">Nueva · MIA</span>}
              </p>
              <p className="text-[var(--text-3)]">{m.especie} · {m.raza} · {m.edad}{m.tamano ? ` · ${m.tamano}` : ""}</p>
              {contactosDe(cli.id, m.nombre).map((k) => (
                <p key={k.telefono} className="mt-1 flex items-center gap-1 text-[11.5px] text-violet-700">
                  <UserPlus size={11} /> {k.nombre} · {k.relacion}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Última visita</h3>
      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: "var(--clinica-soft)" }}>
          <p className="font-bold" style={{ color: "var(--clinica)" }}>Clínica</p>
          <p className="text-[var(--text-2)]">{cli.ultimaClinica ?? "Sin visitas"}</p>
        </div>
        <div className="rounded-xl p-2.5" style={{ backgroundColor: "var(--grooming-soft)" }}>
          <p className="font-bold" style={{ color: "var(--grooming)" }}>Grooming</p>
          <p className="text-[var(--text-2)]">{cli.ultimaGrooming ?? "Sin visitas"}</p>
        </div>
      </div>

      <h3 className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Historial de citas</h3>
      <div className="space-y-1.5">
        {citas.length === 0 && <p className="text-[12px] text-[var(--text-3)]">Sin citas registradas.</p>}
        {citas.map((x) => (
          <div key={x.id} className="rounded-lg border border-line px-2.5 py-2 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <AgendaPill agenda={x.agenda} />
              <EstadoCitaPill estado={x.estado} />
            </div>
            <p className="mt-1 font-semibold">{x.servicio} · {x.mascota}</p>
            <p className="text-[var(--text-3)]">{etiquetaDia(x.dia)} · {x.hora} · {x.origen === "ia" ? "agendó IA" : "manual"}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-start gap-1.5 rounded-xl bg-surface p-2.5 text-[11px] leading-snug text-[var(--text-3)]">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" />
        Los datos de este cliente son propiedad de la clínica. Se pueden exportar o eliminar a solicitud de la clínica.
      </p>
    </aside>
  );
}
