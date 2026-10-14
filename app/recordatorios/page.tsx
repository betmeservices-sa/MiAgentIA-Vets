"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CalendarCheck, CalendarClock, CalendarDays, Check, MessageCircle, MessageCircleQuestion, Scissors, Stethoscope, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, diasDesde, etiquetaDia, isoDeTexto } from "@/lib/format";
import { CALENDARIOS, CITAS, cliente, nombreMascota } from "@/lib/seed";
import { horario } from "@/lib/agenda";
import { useStore } from "@/lib/store";
import type { Agenda, EstadoCita } from "@/lib/types";
import { EstadoCitaPill, PageHeader } from "@/components/ui";

// Recordatorios internos de la clínica: lo que el equipo tiene que hacer hoy,
// mañana y pasado, separado por calendario (clínica y grooming). Sobre todo citas, más los pendientes
// que salen de ellas (confirmar, controles que dejó el veterinario, dudas de
// recetas).

type Tipo = "cita" | "confirmar" | "control" | "receta";

interface Pendiente {
  id: string;
  tipo: Tipo;
  dia: number;
  hora: string;
  agenda: Agenda;
  clienteId: string;
  titulo: string;
  detalle: string;
  estado?: EstadoCita;
}

const TIPO: Record<Tipo, { label: string; Icon: LucideIcon; className: string }> = {
  cita: { label: "Cita", Icon: CalendarCheck, className: "bg-surface text-[var(--text-2)]" },
  confirmar: { label: "Confirmar", Icon: CalendarClock, className: "bg-amber-50 text-amber-700" },
  control: { label: "Control", Icon: Stethoscope, className: "bg-[var(--clinica-soft)] text-[var(--clinica)]" },
  receta: { label: "Receta", Icon: MessageCircleQuestion, className: "bg-rose-50 text-rose-700" },
};

const DIAS = [0, 1, 2];

/** Qué hay que hacer con cada cita según su estado. */
function queHacer(estado: EstadoCita, agenda: Agenda) {
  if (estado === "por_confirmar") return "Sin confirmar: llama al cliente o reenvía el recordatorio.";
  if (estado === "en_curso") return agenda === "grooming" ? "En curso: avisa al dueño cuando esté lista." : "En consulta.";
  return agenda === "grooming" ? "Confirmada: ten listo el espacio de grooming." : "Confirmada: revisa el historial antes de la consulta.";
}

export default function RecordatoriosPage() {
  const router = useRouter();
  const { visitas, resumenes, recetas, conversacionDe, setConvSel, citasVersion } = useStore();
  const [hechos, setHechos] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState<Agenda>("clinica");

  const todos = useMemo(() => {
    const out: Pendiente[] = [];
    // Citas de hoy a pasado mañana.
    for (const c of CITAS) {
      if (c.dia < 0 || c.dia > 2 || ["completada", "cancelada", "reagendada"].includes(c.estado)) continue;
      const cli = cliente(c.clienteId);
      out.push({
        id: `c-${c.id}`,
        tipo: c.estado === "por_confirmar" ? "confirmar" : "cita",
        dia: c.dia,
        hora: c.hora,
        agenda: c.agenda,
        clienteId: c.clienteId,
        titulo: `${c.servicio} · ${nombreMascota(c.mascota, cli)}`,
        detalle: queHacer(c.estado, c.agenda),
        estado: c.estado,
      });
    }
    // Controles que dejó el veterinario en el resumen de consulta.
    for (const v of visitas) {
      const r = resumenes[v.id];
      const n = Number(r?.proximoControl.match(/^En (\d+) días/)?.[1]);
      if (!r || !n) continue;
      // Si el control cae en un día sin atención, pasa al siguiente que sí atiende.
      let dia = n - diasDesde(v.fecha);
      if (dia < 0) continue;
      while (dia <= 2 && !horario("clinica", dia)) dia++;
      if (dia > 2) continue;
      const tieneCita = CITAS.some((c) => c.clienteId === v.clienteId && c.mascota === v.mascota && c.agenda === "clinica" && c.dia >= 0 && c.dia <= dia + 1);
      if (tieneCita) continue;
      const cli = cliente(v.clienteId);
      out.push({
        id: `k-${v.id}`,
        tipo: "control",
        dia,
        hora: "",
        agenda: "clinica",
        clienteId: v.clienteId,
        titulo: `Control de ${nombreMascota(v.mascota, cli)}`,
        detalle: `${r.diagnostico}. El Dr. pidió control ${r.proximoControl.toLowerCase()} y aún no tiene cita: agéndalo.`,
      });
    }
    // Clientes con dudas sobre su receta.
    for (const r of recetas) {
      if (r.estado !== "duda") continue;
      const cli = cliente(r.clienteId);
      out.push({
        id: `r-${r.id}`,
        tipo: "receta",
        dia: Math.max(0, -diasDesde(isoDeTexto(r.fecha))),
        hora: "",
        agenda: "clinica",
        clienteId: r.clienteId,
        titulo: `Duda sobre la receta de ${nombreMascota(r.mascota, cli)}`,
        detalle: "MIA no explica tratamientos: el veterinario o recepción debe responder.",
      });
    }
    // Primero lo sin hora (tareas del día), luego por hora.
    return out.sort((a, b) => a.dia - b.dia || (a.hora || "00:00").localeCompare(b.hora || "00:00"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitas, resumenes, recetas, citasVersion]);
  const pendientes = todos.filter((p) => p.agenda === cat);
  const cal = CALENDARIOS[cat];
  const faltanDe = (a: Agenda) => todos.filter((p) => p.agenda === a && !hechos.has(p.id)).length;

  const alternar = (id: string) =>
    setHechos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const abrirChat = (clienteId: string) => {
    setConvSel(conversacionDe(clienteId));
    router.push("/");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader
        title="Recordatorios"
        sub="Pendientes de la clínica por calendario: citas y lo que hay que hacer con ellas."
        right={
          <div className="inline-flex rounded-xl border border-line bg-card p-1 shadow-sm">
            {(["clinica", "grooming"] as Agenda[]).map((a) => {
              const n = faltanDe(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setCat(a)}
                  aria-pressed={cat === a}
                  className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition", cat === a ? "text-white shadow-sm" : "text-[var(--text-2)] hover:bg-surface")}
                  style={cat === a ? { backgroundColor: AGENDA_INFO[a].color } : undefined}
                >
                  {a === "clinica" ? <Stethoscope size={14} /> : <Scissors size={14} />}
                  {a === "clinica" ? "Clínica" : "Grooming"}
                  {n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] font-bold", cat === a ? "bg-white/25" : "bg-surface-2")}>{n}</span>}
                </button>
              );
            })}
          </div>
        }
      />
      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 shadow-sm" style={{ borderLeft: `4px solid ${AGENDA_INFO[cat].color}` }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: AGENDA_INFO[cat].color }}>
            <CalendarDays size={18} />
          </span>
          <div className="min-w-0 text-[12.5px] leading-tight">
            <p className="text-[14px] font-bold">{cal.nombre}</p>
            <p className="text-[var(--text-3)]">
              {cal.cuenta} · {cal.horario}
            </p>
          </div>
        </div>
        {DIAS.map((d) => {
          const delDia = pendientes.filter((p) => p.dia === d);
          const abierto = !!horario(cat, d);
          const faltan = delDia.filter((p) => !hechos.has(p.id)).length;
          return (
            <section key={d}>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[16px] font-extrabold tracking-tight">
                  {etiquetaDia(d)}
                  {d > 1 && <span className="ml-1.5 text-[13px] font-semibold text-[var(--text-3)]">pasado mañana</span>}
                </h2>
                <span className="text-[12.5px] text-[var(--text-3)]">{faltan === 0 ? "Todo listo" : `${faltan} pendiente${faltan === 1 ? "" : "s"}`}</span>
              </div>
              {delDia.length === 0 && (
                <p className="rounded-xl border border-dashed border-line p-4 text-center text-[13px] text-[var(--text-3)]">
                  {abierto ? "Nada agendado." : `Sin atención este día en el calendario de ${cat === "clinica" ? "clínica" : "grooming"}.`}
                </p>
              )}
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
                {delDia.map((p) => {
                  const hecho = hechos.has(p.id);
                  const t = TIPO[p.tipo];
                  const cli = cliente(p.clienteId);
                  return (
                    <div key={p.id} className={cn("flex items-start gap-3 px-4 py-3", hecho && "bg-surface/60")}>
                      <button
                        type="button"
                        onClick={() => alternar(p.id)}
                        aria-pressed={hecho}
                        aria-label={hecho ? "Marcar como pendiente" : "Marcar como hecho"}
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                          hecho ? "border-emerald-600 bg-emerald-600 text-white" : "border-[var(--border-2)] hover:border-emerald-600",
                        )}
                      >
                        {hecho && <Check size={13} strokeWidth={3} />}
                      </button>
                      <span className="w-12 shrink-0 pt-0.5 text-[13px] font-bold tabular-nums">{p.hora || "—"}</span>
                      <div className={cn("min-w-0 flex-1", hecho && "opacity-50")}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", t.className)}>
                            <t.Icon size={11} /> {t.label}
                          </span>
                          {p.estado && p.tipo === "cita" && <EstadoCitaPill estado={p.estado} />}
                        </div>
                        <p className={cn("mt-1 text-[13.5px] font-semibold", hecho && "line-through")}>{p.titulo}</p>
                        <p className="text-[12.5px] text-[var(--text-2)]">
                          {cli.nombre} · {p.detalle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => abrirChat(p.clienteId)}
                        className="hidden shrink-0 items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold text-[var(--text-2)] hover:bg-surface sm:inline-flex"
                        title="Abrir la conversación con el cliente"
                      >
                        <MessageCircle size={12} /> Chat
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-[var(--text-3)]">
          <BellRing size={12} /> Los recordatorios que recibe el cliente los manda MIA 24 h antes de cada cita.
        </p>
      </div>
    </div>
  );
}
