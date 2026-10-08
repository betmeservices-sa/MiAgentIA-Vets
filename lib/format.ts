import type { Agenda, EstadoCita, MotivoTransferencia } from "./types";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function fechaDe(dia: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dia);
  return d;
}

export function etiquetaDia(dia: number): string {
  if (dia === 0) return "Hoy";
  if (dia === 1) return "Mañana";
  if (dia === -1) return "Ayer";
  const d = fechaDe(dia);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function diaCorto(dia: number) {
  const d = fechaDe(dia);
  return { nombre: DIAS[d.getDay()], num: d.getDate(), domingo: d.getDay() === 0, sabado: d.getDay() === 6 };
}

export const AGENDA_INFO: Record<Agenda, { label: string; color: string; soft: string; recurso: string }> = {
  clinica: { label: "Clínica", color: "var(--clinica)", soft: "var(--clinica-soft)", recurso: "Dr. Méndez" },
  grooming: { label: "Grooming", color: "var(--grooming)", soft: "var(--grooming-soft)", recurso: "Luis" },
};

export const ESTADO_CITA: Record<EstadoCita, { label: string; className: string }> = {
  confirmada: { label: "Confirmada", className: "bg-emerald-50 text-emerald-700 ring-emerald-300/50" },
  por_confirmar: { label: "Por confirmar", className: "bg-amber-50 text-amber-700 ring-amber-300/50" },
  completada: { label: "Atendida", className: "bg-slate-100 text-slate-600 ring-slate-300/50" },
  en_curso: { label: "En curso", className: "bg-violet-50 text-violet-700 ring-violet-300/50" },
  cancelada: { label: "Cancelada", className: "bg-rose-50 text-rose-700 ring-rose-300/50" },
  ausente: { label: "No se presentó", className: "bg-rose-50 text-rose-700 ring-rose-300/50" },
  reagendada: { label: "Reagendada", className: "bg-sky-50 text-sky-700 ring-sky-300/50" },
};

export const MOTIVO: Record<MotivoTransferencia, { label: string; className: string }> = {
  urgencia: { label: "Urgencia", className: "bg-rose-600 text-white" },
  caso_clinico: { label: "Caso clínico", className: "bg-rose-50 text-rose-700 ring-1 ring-rose-300/60" },
  excepcion_precio: { label: "Excepción de precio", className: "bg-amber-50 text-amber-800 ring-1 ring-amber-300/60" },
  pedido_cliente: { label: "Pidió hablar con alguien", className: "bg-sky-50 text-sky-700 ring-1 ring-sky-300/60" },
};

export function minutosDe(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function horaDe(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100);
}
