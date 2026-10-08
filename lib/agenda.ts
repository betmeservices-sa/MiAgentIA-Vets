import { CITAS } from "./seed";
import { diaCorto, horaDe, minutosDe } from "./format";
import type { Agenda, Cita } from "./types";

/** Horario de cada agenda: [inicio, fin] en minutos y tamaño del bloque. */
export function horario(agenda: Agenda, dia: number): { ini: number; fin: number; bloque: number } | null {
  const d = diaCorto(dia);
  if (d.domingo) return null;
  if (agenda === "clinica") return { ini: 8 * 60, fin: d.sabado ? 13 * 60 : 18 * 60, bloque: 30 };
  return { ini: 8 * 60, fin: 16 * 60, bloque: 120 };
}

export function citasDe(agenda: Agenda, dia: number): Cita[] {
  return CITAS.filter((c) => c.agenda === agenda && c.dia === dia && c.estado !== "cancelada" && c.estado !== "reagendada").sort(
    (a, b) => minutosDe(a.hora) - minutosDe(b.hora),
  );
}

/** Bloques libres de un día (grooming en bloques de 2 h, clínica de 30 min). */
export function espaciosLibres(agenda: Agenda, dia: number): string[] {
  const h = horario(agenda, dia);
  if (!h) return [];
  const ocupadas = citasDe(agenda, dia).map((c) => [minutosDe(c.hora), minutosDe(c.hora) + Math.max(c.duracionMin, agenda === "clinica" ? 30 : c.duracionMin)]);
  const libres: string[] = [];
  const ahora = new Date();
  const minAhora = dia === 0 ? ahora.getHours() * 60 + ahora.getMinutes() : -1;
  for (let t = h.ini; t + h.bloque <= h.fin; t += h.bloque) {
    if (dia === 0 && t < minAhora) continue;
    // La clínica cierra para almorzar de 12:00 a 14:00.
    if (agenda === "clinica" && t >= 12 * 60 && t < 14 * 60) continue;
    const choca = ocupadas.some(([a, b]) => t < b && t + h.bloque > a);
    if (!choca) libres.push(horaDe(t));
  }
  return libres;
}

/** % de ocupación de un día: minutos con cita sobre minutos de atención. */
export function ocupacion(agenda: Agenda, dia: number): number | null {
  const h = horario(agenda, dia);
  if (!h) return null;
  const total = agenda === "clinica" ? h.fin - h.ini - (diaCorto(dia).sabado ? 0 : 120) : h.fin - h.ini;
  const usado = citasDe(agenda, dia).reduce((n, c) => n + (agenda === "clinica" ? 30 : Math.max(c.duracionMin, 120)), 0);
  return Math.min(100, Math.round((usado / total) * 100));
}

/** Próximos N espacios libres desde hoy. */
export function proximosLibres(agenda: Agenda, n = 4): { dia: number; hora: string }[] {
  const out: { dia: number; hora: string }[] = [];
  for (let d = 0; d <= 6 && out.length < n; d++) {
    for (const hora of espaciosLibres(agenda, d)) {
      out.push({ dia: d, hora });
      if (out.length >= n) break;
    }
  }
  return out;
}
