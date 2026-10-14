"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BellRing, Bot, CalendarCheck, CalendarPlus, Check, CheckCheck, ChevronDown, Eye, EyeOff, Info, Moon, PawPrint, Phone, Pill, RotateCcw, Send, ShieldCheck, Sparkles, Stethoscope, UserRound, UserRoundSearch } from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, etiquetaDia, MOTIVO } from "@/lib/format";
import { CITAS, cliente, STAFF } from "@/lib/seed";
import { pasaFiltro, useStore } from "@/lib/store";
import type { Canal, Conversacion, EstadoConv, Objetivo } from "@/lib/types";
import { AgendaPill, Avatar, ChannelBadge, EstadoCitaPill, FiltroAgendaToggle } from "@/components/ui";

// La bandeja no reparte clientes entre personas: el agente atiende todo y su
// trabajo es agendar y reactivar. Las pestañas son por objetivo, más una para
// lo que el agente pasó a la clínica.
type Tab = "todas" | "agendar" | "reactivacion" | "recordatorio" | "atencion";
const TABS: { id: Tab; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "agendar", label: "Agendamiento" },
  { id: "reactivacion", label: "Reactivación" },
  { id: "recordatorio", label: "Seguimiento y recetas" },
  { id: "atencion", label: "Requieren atención" },
];

function enTab(c: Conversacion, tab: Tab) {
  if (tab === "todas") return true;
  if (tab === "atencion") return c.estado === "transferida";
  if (tab === "recordatorio") return c.objetivo === "recordatorio" || c.objetivo === "seguimiento" || c.objetivo === "receta";
  return c.objetivo === tab;
}

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

const CANALES: Canal[] = ["whatsapp", "instagram", "facebook"];

export default function BandejaPage() {
  const { conversaciones, filtro, marcarLeida, convSel: sel, setConvSel: setSel } = useStore();
  const [tab, setTab] = useState<Tab>("todas");
  const [canales, setCanales] = useState<Canal[]>(CANALES);

  // Siempre queda al menos un canal marcado: con cero la bandeja se vería vacía sin razón.
  const alternarCanal = (c: Canal) =>
    setCanales((cs) => (cs.includes(c) ? (cs.length > 1 ? cs.filter((x) => x !== c) : cs) : [...cs, c]));

  // Conversaciones de la agenda filtrada, de los 3 canales (para el conteo del filtro).
  const enAgenda = useMemo(() => conversaciones.filter((c) => pasaFiltro(filtro, c.agenda) || c.agenda === null), [conversaciones, filtro]);
  const visibles = useMemo(() => enAgenda.filter((c) => canales.includes(c.canal)), [enAgenda, canales]);

  const lista = useMemo(() => {
    const orden: Record<EstadoConv, number> = { transferida: 0, ia: 1, secretaria: 2, resuelta: 3 };
    return visibles.filter((c) => enTab(c, tab)).sort((a, b) => orden[a.estado] - orden[b.estado]);
  }, [visibles, tab]);

  const actual = conversaciones.find((c) => c.id === sel) ?? lista[0];
  const transferidas = conversaciones.filter((c) => c.estado === "transferida");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-card px-5 py-3">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Bandeja omnicanal</h1>
          <p className="text-[12.5px] text-[var(--text-3)]">WhatsApp, Instagram y Facebook en un solo lugar · Luna agenda y reactiva clientes de clínica y grooming</p>
        </div>
        <FiltroAgendaToggle />
      </header>

      {transferidas.length > 0 && (
        <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-5 py-2 text-[13px] text-rose-800">
          <AlertTriangle size={15} />
          <span className="font-semibold">{transferidas.length} conversaciones esperan a la secretaria.</span>
          <span className="hidden sm:inline">Las urgencias van primero.</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Lista */}
        <div className="flex w-full max-w-[360px] shrink-0 flex-col border-r border-line bg-card">
          <div className="space-y-2 border-b border-line p-3">
            <div className="flex gap-1 overflow-x-auto">
              {TABS.map((t) => {
                const n = t.id === "todas" ? null : visibles.filter((c) => enTab(c, t.id)).length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-semibold",
                      tab === t.id ? "bg-brand text-white" : "text-[var(--text-2)] hover:bg-surface",
                    )}
                  >
                    {t.label}
                    {n !== null && n > 0 && <span className="ml-1 opacity-70">{n}</span>}
                  </button>
                );
              })}
            </div>
            <CanalesDropdown canales={canales} alternar={alternarCanal} setCanales={setCanales} conteo={(c) => enAgenda.filter((x) => x.canal === c).length} />
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
  const ultimo = [...c.mensajes].reverse().find((m) => m.autor !== "sistema");
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full gap-3 border-b border-line/70 px-3.5 py-3 text-left transition", activa ? "bg-brand/5" : "hover:bg-surface")}>
      <div className="relative">
        <Avatar nombre={cli.nombre} size={42} color={c.agenda ? AGENDA_INFO[c.agenda].color : "#64748b"} />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
          <ChannelBadge canal={c.canal} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{cli.nombre}</p>
          <span className="shrink-0 text-[11px] text-[var(--text-3)]">{c.hora}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-[var(--text-2)]">{ultimo?.texto}</p>
          {c.noLeidos > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-accent)] px-1.5 text-[11px] font-bold text-white">{c.noLeidos}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {c.agenda && <AgendaPill agenda={c.agenda} />}
          <ObjetivoTag c={c} />
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
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700">Luna en curso</span>
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
          <p className="truncate font-bold">{cli.nombre}</p>
          <ChannelBadge canal={c.canal} label />
          {c.agenda && <AgendaPill agenda={c.agenda} />}
          <ObjetivoTag c={c} />
        </div>
        <div className="flex items-center gap-1.5">
          {(c.estado === "secretaria" || c.estado === "transferida") && (
            <button type="button" onClick={() => devolverAIA(c.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-brand-dark">
              <RotateCcw size={14} /> Que Luna siga (agendar)
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
          Luna la pasó a la clínica por {MOTIVO[c.motivo].label.toLowerCase()} hace {c.esperaMin} min y dejó de responder. Contesta aquí abajo.
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
                    {m.autor === "ia" ? "Luna · agente IA" : STAFF.secretaria.nombre}
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
            <Bot size={12} /> Luna está atendiendo. Si escribes, el agente queda en pausa en esta conversación.
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Responder a ${cli.nombre.split(" ")[0]} por ${c.canal === "whatsapp" ? "WhatsApp" : c.canal === "instagram" ? "Instagram" : "Facebook"}…`}
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
  const citas = CITAS.filter((x) => x.clienteId === cli.id).sort((a, b) => b.dia - a.dia).slice(0, 6);
  return (
    <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-line bg-card p-4 xl:block">
      <div className="flex flex-col items-center text-center">
        <Avatar nombre={cli.nombre} size={56} />
        <p className="mt-2 font-bold">{cli.nombre}</p>
        <p className="flex items-center gap-1 text-[12.5px] text-[var(--text-3)]">
          <Phone size={12} /> {cli.telefono}
        </p>
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {cli.creadoPorIA && (
            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700">
              <Sparkles size={10} /> Perfil creado por Luna · por revisar
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
                {m.nombre}
                {m.creadaPorIA && <span className="rounded bg-violet-50 px-1 text-[9.5px] font-semibold text-violet-700">Nueva · Luna</span>}
              </p>
              <p className="text-[var(--text-3)]">{m.especie} · {m.raza} · {m.edad}{m.tamano ? ` · ${m.tamano}` : ""}</p>
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

// Filtro de canales en dropdown: muestra u oculta las conversaciones de cada canal.
function CanalesDropdown({
  canales,
  alternar,
  setCanales,
  conteo,
}: {
  canales: Canal[];
  alternar: (c: Canal) => void;
  setCanales: (cs: Canal[]) => void;
  conteo: (c: Canal) => number;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const todos = canales.length === CANALES.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className={cn("flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold", todos ? "border-line" : "border-brand/50 bg-brand/5")}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Canales</span>
          {todos ? <span>Todos</span> : canales.map((c) => <ChannelBadge key={c} canal={c} />)}
        </span>
        <ChevronDown size={14} className={cn("text-[var(--text-3)] transition", abierto && "rotate-180")} />
      </button>
      {abierto && (
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-line bg-card p-1.5 shadow-lg">
          {CANALES.map((c) => {
            const on = canales.includes(c);
            const ultimo = on && canales.length === 1;
            return (
              <button
                key={c}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => alternar(c)}
                disabled={ultimo}
                title={ultimo ? "Debe quedar al menos un canal visible" : undefined}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface disabled:cursor-not-allowed"
              >
                <span className={cn("flex h-4 w-4 items-center justify-center rounded border", on ? "border-brand bg-brand text-white" : "border-[var(--border-2)]")}>
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                <ChannelBadge canal={c} label />
                <span className="ml-auto text-[11.5px] text-[var(--text-3)]">{conteo(c)}</span>
                {on ? <Eye size={13} className="text-[var(--text-3)]" /> : <EyeOff size={13} className="text-[var(--text-3)]" />}
              </button>
            );
          })}
          <div className="mt-1 flex justify-between border-t border-line px-2 pt-1.5">
            <button type="button" onClick={() => setCanales(CANALES)} className="text-[11.5px] font-semibold text-brand">
              Mostrar todos
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="text-[11.5px] font-semibold text-[var(--text-2)]">
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

