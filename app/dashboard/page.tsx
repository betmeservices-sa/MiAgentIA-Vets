"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  Clock,
  Hourglass,
  Inbox,
  Moon,
  Repeat,
  Scissors,
  Stethoscope,
  Timer,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, diaCorto, etiquetaDia, pct } from "@/lib/format";
import { citasDe, ocupacion, proximosLibres } from "@/lib/agenda";
import { CITAS, cliente, PLANTILLAS } from "@/lib/seed";
import { ReactivacionResumen } from "@/components/ReactivacionResumen";
import { UrgenciasVet } from "@/components/UrgenciasVet";
import { pasaFiltro, useStore } from "@/lib/store";
import type { Agenda } from "@/lib/types";
import { Barra, Card, Embudo, EstadoCitaPill, FiltroAgendaToggle, MetricCard, PageHeader } from "@/components/ui";

// Bandeja de la semana por agenda (demo). Las conversaciones sin agenda
// (preguntas generales) se cuentan dentro de "todas".
const BANDEJA: Record<Agenda, { canal: { whatsapp: number; instagram: number; facebook: number }; ia: number; transferidas: number; fueraHorario: number; motivos: Record<string, number> }> = {
  clinica: { canal: { whatsapp: 168, instagram: 31, facebook: 22 }, ia: 172, transferidas: 49, fueraHorario: 58, motivos: { "Caso clínico": 24, Urgencia: 7, "Excepción de precio": 6, "Pidió hablar con alguien": 12 } },
  grooming: { canal: { whatsapp: 96, instagram: 44, facebook: 15 }, ia: 139, transferidas: 16, fueraHorario: 47, motivos: { "Caso clínico": 1, Urgencia: 0, "Excepción de precio": 9, "Pidió hablar con alguien": 6 } },
};

type Vista = "secretaria" | "veterinario";

export default function DashboardPage() {
  const { filtro, rol, conversaciones } = useStore();
  const [vista, setVista] = useState<Vista>(rol === "veterinario" ? "veterinario" : "secretaria");
  const agendas = (["clinica", "grooming"] as Agenda[]).filter((a) => pasaFiltro(filtro, a));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader
        title="Dashboard"
        sub={vista === "secretaria" ? "Operación del día · se actualiza en vivo" : "Resumen semanal · últimos 7 días"}
        right={
          <>
            <div className="inline-flex rounded-xl border border-line bg-card p-1 shadow-sm">
              {(["secretaria", "veterinario"] as Vista[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={cn("rounded-lg px-3 py-1.5 text-[13px] font-semibold", vista === v ? "bg-[var(--text)] text-white" : "text-[var(--text-2)] hover:bg-surface")}
                >
                  {v === "secretaria" ? "Secretaria · hoy" : "Veterinario · semana"}
                </button>
              ))}
            </div>
            <FiltroAgendaToggle />
          </>
        }
      />
      <div className="space-y-5 p-6">
        {(vista === "veterinario" || rol === "veterinario") && agendas.includes("clinica") && <UrgenciasVet />}
        <CitasDelDia agendas={agendas} />
        {vista === "secretaria" ? <VistaDia agendas={agendas} transferidas={conversaciones.filter((c) => c.estado === "transferida" && (c.agenda === null || agendas.includes(c.agenda)))} /> : <VistaSemana agendas={agendas} />}
        <p className="text-center text-[11.5px] text-[var(--text-3)]">Sin montos de dinero ni cálculos de retorno: el dashboard mide operación y atención.</p>
      </div>
    </div>
  );
}

// Resumen de las citas agendadas para hoy: cuáles ya se hicieron y cuáles
// faltan, por agenda, más lo que Luna agendó hoy en la bandeja.
function CitasDelDia({ agendas }: { agendas: Agenda[] }) {
  const { conversaciones } = useStore();
  const hoy = agendas.flatMap((a) => citasDe(a, 0)).sort((x, y) => x.hora.localeCompare(y.hora));
  const hechas = hoy.filter((c) => c.estado === "completada");
  const ausentes = hoy.filter((c) => c.estado === "ausente");
  const porCumplir = hoy.filter((c) => c.estado !== "completada" && c.estado !== "ausente");
  const agendadasHoy = conversaciones.filter((c) => c.resultado?.tipo === "cita" && c.hora !== "Ayer" && (c.agenda === null || agendas.includes(c.agenda)));
  const porReactivacion = agendadasHoy.filter((c) => c.objetivo === "reactivacion").length;

  const Fila = ({ c }: { c: (typeof hoy)[number] }) => (
    <div className="flex items-center gap-2.5 py-2">
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: AGENDA_INFO[c.agenda].color }} />
      <span className="w-11 shrink-0 text-[13px] font-bold tabular-nums">{c.hora}</span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-semibold">{c.mascota} <span className="font-normal text-[var(--text-3)]">· {cliente(c.clienteId).nombre}</span></p>
        <p className="truncate text-[11.5px] text-[var(--text-3)]">{c.servicio} · {AGENDA_INFO[c.agenda].recurso}{c.origen === "ia" ? " · agendó Luna" : ""}</p>
      </div>
      <EstadoCitaPill estado={c.estado} />
    </div>
  );

  return (
    <Card
      title="Citas agendadas de hoy"
      sub={`${hoy.length} citas · ${hechas.length} hechas · ${porCumplir.length} por cumplir${ausentes.length ? ` · ${ausentes.length} no se presentaron` : ""}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {agendas.map((a) => {
          const h = hoy.filter((c) => c.agenda === a);
          const hh = h.filter((c) => c.estado === "completada").length;
          return (
            <div key={a} className="rounded-xl p-3" style={{ backgroundColor: AGENDA_INFO[a].soft }}>
              <p className="text-[12px] font-bold" style={{ color: AGENDA_INFO[a].color }}>{AGENDA_INFO[a].label}</p>
              <p className="mt-1 text-[24px] font-extrabold leading-none">{hh}<span className="text-[15px] font-bold text-[var(--text-3)]"> / {h.length}</span></p>
              <p className="mt-1 text-[11.5px] text-[var(--text-2)]">hechas · {h.length - hh} por cumplir</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/70">
                <div className="h-1.5 rounded-full" style={{ width: `${pct(hh, h.length)}%`, backgroundColor: AGENDA_INFO[a].color }} />
              </div>
            </div>
          );
        })}
        <div className="rounded-xl bg-violet-50 p-3">
          <p className="flex items-center gap-1 text-[12px] font-bold text-violet-700"><Bot size={13} /> Agendadas hoy por Luna</p>
          <p className="mt-1 text-[24px] font-extrabold leading-none">{agendadasHoy.length}</p>
          <p className="mt-1 text-[11.5px] text-[var(--text-2)]">{porReactivacion} por reactivación · {agendadasHoy.length - porReactivacion} por agendamiento</p>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]"><CalendarClock size={12} /> Por cumplir ({porCumplir.length})</p>
          <div className="divide-y divide-line">
            {porCumplir.length === 0 && <p className="py-2 text-[13px] text-[var(--text-3)]">No quedan citas hoy.</p>}
            {porCumplir.map((c) => <Fila key={c.id} c={c} />)}
          </div>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]"><CalendarCheck size={12} /> Hechas ({hechas.length + ausentes.length})</p>
          <div className="divide-y divide-line">
            {hechas.length + ausentes.length === 0 && <p className="py-2 text-[13px] text-[var(--text-3)]">Todavía ninguna.</p>}
            {[...hechas, ...ausentes].map((c) => <Fila key={c.id} c={c} />)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function sumBandeja(agendas: Agenda[], escala = 1) {
  const r = { whatsapp: 0, instagram: 0, facebook: 0, ia: 0, transferidas: 0, fueraHorario: 0, motivos: {} as Record<string, number> };
  for (const a of agendas) {
    const b = BANDEJA[a];
    r.whatsapp += Math.round(b.canal.whatsapp * escala);
    r.instagram += Math.round(b.canal.instagram * escala);
    r.facebook += Math.round(b.canal.facebook * escala);
    r.ia += Math.round(b.ia * escala);
    r.transferidas += Math.round(b.transferidas * escala);
    r.fueraHorario += Math.round(b.fueraHorario * escala);
    for (const [k, v] of Object.entries(b.motivos)) r.motivos[k] = (r.motivos[k] ?? 0) + Math.round(v * escala);
  }
  return r;
}

function BandejaCards({ agendas, escala, titulo }: { agendas: Agenda[]; escala: number; titulo: string }) {
  const b = sumBandeja(agendas, escala);
  const total = b.ia + b.transferidas;
  const maxCanal = Math.max(b.whatsapp, b.instagram, b.facebook);
  const maxMot = Math.max(...Object.values(b.motivos), 1);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card title={`Bandeja · ${titulo}`} sub={`${total} conversaciones`}>
        <div className="space-y-3">
          <Barra label="WhatsApp" valor={b.whatsapp} max={maxCanal} color="#1ba34d" />
          <Barra label="Instagram" valor={b.instagram} max={maxCanal} color="#c1275b" />
          <Barra label="Facebook" valor={b.facebook} max={maxCanal} color="#1877F2" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-surface p-2.5">
            <p className="flex items-center justify-center gap-1 text-[18px] font-extrabold"><Timer size={15} /> 9 s</p>
            <p className="text-[11px] text-[var(--text-3)]">1.ª respuesta (agente)</p>
          </div>
          <div className="rounded-xl bg-surface p-2.5">
            <p className="flex items-center justify-center gap-1 text-[18px] font-extrabold"><Hourglass size={15} /> {agendas.length === 1 && agendas[0] === "grooming" ? "11" : "6"} min</p>
            <p className="text-[11px] text-[var(--text-3)]">Secretaria toma una transferida</p>
          </div>
        </div>
      </Card>
      <Card title="Resuelto por IA vs transferido" sub="De cada conversación, quién la cerró">
        <div className="flex h-8 overflow-hidden rounded-lg">
          <div className="flex items-center justify-center bg-violet-600 text-[12px] font-bold text-white" style={{ width: `${pct(b.ia, total)}%` }}>{pct(b.ia, total)}% IA</div>
          <div className="flex items-center justify-center bg-sky-600 text-[12px] font-bold text-white" style={{ width: `${pct(b.transferidas, total)}%` }}>{pct(b.transferidas, total)}%</div>
        </div>
        <div className="mt-2 flex justify-between text-[12px] text-[var(--text-3)]">
          <span><Bot size={12} className="inline" /> {b.ia} resueltas por Luna</span>
          <span>{b.transferidas} a secretaria</span>
        </div>
        <p className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Motivo de transferencia</p>
        <div className="space-y-2">
          {Object.entries(b.motivos).map(([k, v]) => (
            <Barra key={k} label={k} valor={v} max={maxMot} color={k === "Urgencia" ? "#dc2626" : "#0284c7"} />
          ))}
        </div>
      </Card>
      <Card title="Fuera de horario" sub="Mensajes que llegaron con la clínica cerrada">
        <p className="flex items-center gap-2 text-[34px] font-extrabold"><Moon size={24} className="text-[var(--text-3)]" /> {b.fueraHorario}</p>
        <p className="text-[12.5px] text-[var(--text-3)]">{pct(b.fueraHorario, total)}% del total. Todos respondidos por el agente al instante; los casos clínicos reciben el número del hospital 24 h y quedan transferidos para la mañana.</p>
      </Card>
    </div>
  );
}

function VistaDia({ agendas, transferidas }: { agendas: Agenda[]; transferidas: { esperaMin?: number }[] }) {
  const hoy = agendas.flatMap((a) => citasDe(a, 0));
  const porConfirmar = CITAS.filter((c) => (c.dia === 0 || c.dia === 1) && c.estado === "por_confirmar" && agendas.includes(c.agenda));
  const maxEspera = Math.max(0, ...transferidas.map((t) => t.esperaMin ?? 0));
  const manana = CITAS.filter((c) => c.dia === 1 && agendas.includes(c.agenda));
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {agendas.map((a) => (
          <MetricCard key={a} Icon={a === "clinica" ? Stethoscope : Scissors} valor={citasDe(a, 0).length} label={`Citas hoy · ${AGENDA_INFO[a].label}`} hint={`Ocupación ${ocupacion(a, 0)}%`} />
        ))}
        <MetricCard Icon={AlertTriangle} valor={transferidas.length} label="Transferidas pendientes" hint={transferidas.length ? `La más antigua espera ${maxEspera} min` : "Nada en espera"} tono={transferidas.length ? "alerta" : undefined} />
        <MetricCard Icon={CalendarClock} valor={porConfirmar.length} label="Citas por confirmar" hint="Hoy y mañana" />
        <MetricCard Icon={CalendarCheck} valor={hoy.filter((c) => c.estado === "completada").length} label="Atendidas hasta ahora" hint={`de ${hoy.length} del día`} />
      </div>

      <BandejaCards agendas={agendas} escala={1 / 6} titulo="hoy" />

      <ReactivacionResumen agendas={agendas} vista="dia" />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Recordatorios para mañana" sub={`${manana.length} citas`}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Enviados", manana.length],
              ["Confirmados", manana.filter((c) => c.estado === "confirmada").length],
              ["Sin respuesta", manana.filter((c) => c.estado === "por_confirmar").length],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-surface p-2.5">
                <p className="text-[20px] font-extrabold">{v}</p>
                <p className="text-[11px] text-[var(--text-3)]">{l}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Próximos espacios libres" sub="Para ofrecer por teléfono o mostrador" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {agendas.map((a) => (
              <div key={a}>
                <p className="mb-1.5 text-[12px] font-bold" style={{ color: AGENDA_INFO[a].color }}>{AGENDA_INFO[a].label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {proximosLibres(a, 6).map((l) => (
                    <span key={`${l.dia}${l.hora}`} className="rounded-lg px-2 py-1 text-[11.5px] font-semibold" style={{ backgroundColor: AGENDA_INFO[a].soft, color: AGENDA_INFO[a].color }}>
                      {etiquetaDia(l.dia)} {l.hora}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function VistaSemana({ agendas }: { agendas: Agenda[] }) {
  const semana = CITAS.filter((c) => c.dia >= -6 && c.dia <= 0 && agendas.includes(c.agenda));
  const porIA = semana.filter((c) => c.origen === "ia").length;
  const canc = semana.filter((c) => c.estado === "cancelada").length;
  const reag = semana.filter((c) => c.estado === "reagendada").length;
  const aus = semana.filter((c) => c.estado === "ausente").length;
  const conf = semana.filter((c) => c.estado === "completada" || c.estado === "confirmada").length;
  const dias = Array.from({ length: 7 }, (_, i) => i - 6).filter((d) => !diaCorto(d).domingo);
  const seg = { programados: 70, enviados: 64, respondidos: 41, citas: 17 };
  const plantillas = PLANTILLAS.filter((p) => p.agenda === "ambas" || agendas.includes(p.agenda));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard Icon={CalendarPlus} valor={semana.length} label="Citas en la semana" hint={`${pct(porIA, semana.length)}% agendadas por IA`} delta={8} />
        <MetricCard Icon={CalendarCheck} valor={`${pct(conf, semana.length)}%`} label="Confirmadas / atendidas" />
        <MetricCard Icon={CalendarX2} valor={canc} label="Cancelaciones" />
        <MetricCard Icon={Repeat} valor={reag} label="Reagendamientos" />
        <MetricCard Icon={UserX} valor={`${pct(aus, semana.length)}%`} label="Ausencias" hint={`${aus} no se presentaron`} delta={-12} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Ocupación por día" sub="% del horario de atención con cita">
          <div className="flex h-44 items-end gap-3">
            {dias.map((d) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-36 w-full items-end justify-center gap-1">
                  {agendas.map((a) => {
                    const o = ocupacion(a, d) ?? 0;
                    return <div key={a} className="w-full max-w-[22px] rounded-t-md" style={{ height: `${o}%`, backgroundColor: AGENDA_INFO[a].color }} title={`${AGENDA_INFO[a].label} ${o}%`} />;
                  })}
                </div>
                <span className="text-[11px] font-semibold text-[var(--text-3)]">{diaCorto(d).nombre}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-[11.5px]">
            {agendas.map((a) => {
              const vals = dias.map((d) => ocupacion(a, d) ?? 0);
              return (
                <span key={a} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: AGENDA_INFO[a].color }} /> {AGENDA_INFO[a].label}: promedio {Math.round(vals.reduce((x, y) => x + y, 0) / vals.length)}%
                </span>
              );
            })}
          </div>
        </Card>
        <Card title="Citas agendadas por IA vs manuales">
          <div className="space-y-4">
            {agendas.map((a) => {
              const s = semana.filter((c) => c.agenda === a);
              const ia = s.filter((c) => c.origen === "ia").length;
              return (
                <div key={a}>
                  <p className="mb-1 text-[12.5px] font-bold" style={{ color: AGENDA_INFO[a].color }}>{AGENDA_INFO[a].label} · {s.length} citas</p>
                  <div className="flex h-7 overflow-hidden rounded-lg text-[11.5px] font-bold text-white">
                    <div className="flex items-center justify-center bg-violet-600" style={{ width: `${pct(ia, s.length)}%` }}>IA {ia}</div>
                    <div className="flex items-center justify-center bg-slate-500" style={{ width: `${100 - pct(ia, s.length)}%` }}>Manual {s.length - ia}</div>
                  </div>
                </div>
              );
            })}
            <p className="text-[12px] text-[var(--text-3)]">
              <Clock size={12} className="inline" /> El 38% de las citas por IA se agendaron fuera de horario.
            </p>
          </div>
        </Card>
      </div>

      <BandejaCards agendas={agendas} escala={1} titulo="semana" />

      <div className="grid gap-5 lg:grid-cols-2">
        {agendas.includes("clinica") && (
          <Card title="Seguimiento de consultas" sub="Solo clínica · 30 días">
            <Embudo color="var(--clinica)" pasos={[{ label: "Programados", valor: seg.programados }, { label: "Enviados", valor: seg.enviados }, { label: "Respondidos", valor: seg.respondidos }, { label: "Nueva cita", valor: seg.citas }]} />
          </Card>
        )}
      </div>

      <ReactivacionResumen agendas={agendas} vista="semana" />

      <Card title="Plantillas de WhatsApp" sub="Envíos, entregados, leídos y respondidos por plantilla">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wider text-[var(--text-3)]">
              <tr>
                <th className="py-2 pr-3">Plantilla</th>
                <th className="py-2 pr-3 text-right">Envíos</th>
                <th className="py-2 pr-3 text-right">Entregados</th>
                <th className="py-2 pr-3 text-right">Leídos</th>
                <th className="py-2 pr-3 text-right">Respondidos</th>
                <th className="py-2">Tasa de respuesta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {plantillas.map((p) => (
                <tr key={p.nombre}>
                  <td className="py-2.5 pr-3"><code className="text-[12.5px]">{p.nombre}</code></td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{p.stats.enviados}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{p.stats.entregados}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{p.stats.leidos}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{p.stats.respondidos}</td>
                  <td className="w-40 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-surface-2"><div className="h-2 rounded-full bg-brand" style={{ width: `${pct(p.stats.respondidos, p.stats.enviados)}%` }} /></div>
                      <span className="w-9 text-right text-[12px] tabular-nums">{pct(p.stats.respondidos, p.stats.enviados)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-[var(--text-3)]"><Inbox size={12} /> Datos de 30 días. Fuente: webhooks de estado de WhatsApp Cloud API.</p>
      </Card>
    </>
  );
}
