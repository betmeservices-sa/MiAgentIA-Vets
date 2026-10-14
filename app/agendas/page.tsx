"use client";

import { useState } from "react";
import { Bot, CalendarDays, ChevronLeft, ChevronRight, RefreshCw, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, diaCorto, minutosDe } from "@/lib/format";
import { citasDe, horario, ocupacion } from "@/lib/agenda";
import { CALENDARIOS, cliente } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";

const INI = 8 * 60;
const FIN = 18 * 60;
const PX = 1.1; // px por minuto

export default function AgendasPage() {
  // El calendario se elige con los botones Veterinaria / Grooming de la barra de arriba.
  const { calendario: agenda } = useStore();
  const [semana, setSemana] = useState(0);

  // Lunes de la semana actual como offset en días.
  const hoy = new Date().getDay();
  const lunes = (hoy === 0 ? -6 : 1 - hoy) + semana * 7;
  const dias = Array.from({ length: 6 }, (_, i) => lunes + i);
  const info = AGENDA_INFO[agenda];
  const cal = CALENDARIOS[agenda];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={agenda === "clinica" ? "Calendario de veterinaria" : "Calendario de grooming"}
        sub="Dos calendarios de Google separados. El agente agenda cada cita en el que corresponde."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-card px-6 py-2.5">
        <div className="flex items-center gap-2 text-[12.5px]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ backgroundColor: info.color }}>
            <CalendarDays size={14} />
          </span>
          <div className="leading-tight">
            <p className="font-bold">{cal.nombre}</p>
            <p className="text-[var(--text-3)]">
              {cal.cuenta} · {cal.horario}
            </p>
          </div>
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <RefreshCw size={10} /> Sincronizado
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSemana((s) => s - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line hover:bg-surface" aria-label="Semana anterior">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setSemana(0)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold hover:bg-surface">
            Esta semana
          </button>
          <button onClick={() => setSemana((s) => s + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line hover:bg-surface" aria-label="Semana siguiente">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="min-w-[900px] rounded-2xl border border-line bg-card shadow-sm">
          <div className="grid border-b border-line" style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}>
            <div />
            {dias.map((d) => {
              const c = diaCorto(d);
              const oc = ocupacion(agenda, d);
              return (
                <div key={d} className={cn("border-l border-line px-2 py-2 text-center", d === 0 && "bg-brand/5")}>
                  <p className="text-[11px] font-semibold uppercase text-[var(--text-3)]">{c.nombre}</p>
                  <p className={cn("text-[18px] font-extrabold", d === 0 && "text-brand")}>{c.num}</p>
                  {oc !== null && (
                    <div className="mx-auto mt-1 h-1.5 w-20 rounded-full bg-surface-2" title={`Ocupación ${oc}%`}>
                      <div className="h-1.5 rounded-full" style={{ width: `${oc}%`, backgroundColor: info.color }} />
                    </div>
                  )}
                  <p className="mt-0.5 text-[10.5px] text-[var(--text-3)]">{oc}% ocupado</p>
                </div>
              );
            })}
          </div>
          <div className="relative grid" style={{ gridTemplateColumns: "56px repeat(6, 1fr)", height: (FIN - INI) * PX }}>
            <div className="relative">
              {Array.from({ length: (FIN - INI) / 60 }, (_, i) => (
                <span key={i} className="absolute right-2 -translate-y-1/2 text-[10.5px] text-[var(--text-3)]" style={{ top: i * 60 * PX }}>
                  {String(8 + i).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {dias.map((d) => {
              const h = horario(agenda, d);
              return (
                <div key={d} className="relative border-l border-line">
                  {Array.from({ length: (FIN - INI) / 60 }, (_, i) => (
                    <div key={i} className="absolute inset-x-0 border-t border-line/60" style={{ top: i * 60 * PX }} />
                  ))}
                  {h && h.fin < FIN && <div className="absolute inset-x-0 bg-[repeating-linear-gradient(45deg,var(--surface),var(--surface)_6px,transparent_6px,transparent_12px)]" style={{ top: (h.fin - INI) * PX, bottom: 0 }} />}
                  {agenda === "clinica" && h && h.fin > 14 * 60 && (
                    <div className="absolute inset-x-0 flex items-center justify-center bg-surface/70 text-[10px] font-semibold text-[var(--text-3)]" style={{ top: (12 * 60 - INI) * PX, height: 120 * PX }}>
                      Almuerzo
                    </div>
                  )}
                  {citasDe(agenda, d).map((c) => {
                    const top = (minutosDe(c.hora) - INI) * PX;
                    const alto = Math.max(c.duracionMin, 26) * PX;
                    return (
                      <div
                        key={c.id}
                        className={cn("absolute inset-x-1 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-[11px] leading-tight", c.estado === "ausente" && "opacity-60 line-through")}
                        style={{ top, height: alto - 2, backgroundColor: info.soft, borderColor: info.color }}
                        title={`${c.hora} ${c.mascota} · ${c.servicio}`}
                      >
                        <p className="flex items-center gap-1 font-bold" style={{ color: info.color }}>
                          {c.hora} {c.origen === "ia" ? <Bot size={10} /> : <UserRound size={10} />}
                          {c.estado === "por_confirmar" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" title="Por confirmar" />}
                        </p>
                        <p className="truncate font-semibold text-[var(--text)]">{c.mascota}</p>
                        {alto > 50 && <p className="truncate text-[var(--text-3)]">{c.servicio}</p>}
                        {alto > 70 && <p className="truncate text-[var(--text-3)]">{cliente(c.clienteId).nombre}</p>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11.5px] text-[var(--text-3)]">
          <span className="flex items-center gap-1"><Bot size={12} /> Agendada por Luna (IA)</span>
          <span className="flex items-center gap-1"><UserRound size={12} /> Agendada por recepción</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Por confirmar</span>
          <span>Las dos agendas nunca se mezclan: una cita de grooming no puede caer en el calendario del veterinario.</span>
        </div>
      </div>
    </div>
  );
}
