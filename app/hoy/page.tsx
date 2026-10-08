"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck, Siren, CalendarClock, CalendarPlus, Clock, Phone, Scissors, Send, Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, etiquetaDia, minutosDe, MOTIVO } from "@/lib/format";
import { citasDe, proximosLibres } from "@/lib/agenda";
import { CITAS, cliente, STAFF } from "@/lib/seed";
import { pasaFiltro, useStore } from "@/lib/store";
import type { Agenda } from "@/lib/types";
import { UrgenciasVet, useUrgencias } from "@/components/UrgenciasVet";
import { AgendaPill, Card, EstadoCitaPill, FiltroAgendaToggle, MetricCard, PageHeader } from "@/components/ui";

export default function HoyPage() {
  const { filtro, conversaciones, rol } = useStore();
  const agendas = (["clinica", "grooming"] as Agenda[]).filter((a) => pasaFiltro(filtro, a));
  const hoy = agendas.flatMap((a) => citasDe(a, 0));
  const porConfirmar = CITAS.filter((c) => (c.dia === 0 || c.dia === 1) && c.estado === "por_confirmar" && pasaFiltro(filtro, c.agenda));
  const transferidas = conversaciones.filter((c) => c.estado === "transferida" && (c.agenda === null || pasaFiltro(filtro, c.agenda)));
  const esSecretaria = rol === "secretaria";
  const urgencias = useUrgencias();
  const verUrgencias = rol === "veterinario" && agendas.includes("clinica");
  const fecha = new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader
        title={rol === "secretaria" ? "Hoy en la clínica" : `Hola, ${STAFF[rol].nombre.split(" ").slice(0, 2).join(" ")}`}
        sub={`Operación del día · ${fecha}`}
        right={<FiltroAgendaToggle />}
      />
      <div className="space-y-5 p-6">
        {verUrgencias && <UrgenciasVet />}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {agendas.map((a) => (
            <MetricCard
              key={a}
              Icon={a === "clinica" ? Stethoscope : Scissors}
              valor={citasDe(a, 0).length}
              label={`Citas de ${AGENDA_INFO[a].label.toLowerCase()} hoy`}
              hint={`${citasDe(a, 0).filter((c) => c.estado === "completada").length} atendidas · ${citasDe(a, 0).filter((c) => c.origen === "ia").length} agendadas por IA`}
            />
          ))}
          {esSecretaria && (
            <MetricCard Icon={AlertTriangle} valor={transferidas.length} label="Transferidas pendientes" hint="Esperan que la secretaria las tome" tono={transferidas.length ? "alerta" : undefined} />
          )}
          <MetricCard Icon={CalendarClock} valor={porConfirmar.length} label="Citas por confirmar" hint="Hoy y mañana, sin respuesta al recordatorio" />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            {agendas.map((a) => (
              <Card
                key={a}
                title={
                  <span className="flex items-center gap-2">
                    <AgendaPill agenda={a} /> {a === "clinica" ? "Agenda del Dr. Méndez" : "Agenda de Luis (grooming)"}
                  </span>
                }
                sub={`${citasDe(a, 0).length} citas · Google Calendar sincronizado`}
              >
                <div className="divide-y divide-line">
                  {a === "clinica" &&
                    urgencias
                      .filter((u) => !u.decision)
                      .map((u) => (
                        <a key={u.conv.id} href="#urgencias" className="flex items-center gap-3 rounded-lg border border-dashed border-rose-400 bg-rose-50 px-2 py-2.5 hover:bg-rose-100">
                          <span className="w-12 shrink-0 text-[12px] font-bold text-rose-700">Sin hora</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-semibold">
                              {u.mascota} <span className="font-normal text-[var(--text-3)]">· {u.nombre}</span>
                            </p>
                            <p className="truncate text-[12px] text-rose-700">Urgencia marcada por Luna · {rol === "veterinario" ? "elige hora para recibirla" : "esperando que el veterinario le dé hora"}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            <Siren size={11} /> Urgencia
                          </span>
                        </a>
                      ))}
                  {[
                    ...citasDe(a, 0).map((c) => ({ hora: c.hora, cita: c, urg: null as null | (typeof urgencias)[number] })),
                    ...(a === "clinica" ? urgencias.filter((u) => u.decision?.estado === "en_agenda").map((u) => ({ hora: u.decision!.hora!, cita: null, urg: u })) : []),
                  ]
                    .sort((x, y) => minutosDe(x.hora) - minutosDe(y.hora))
                    .map(({ cita: c, urg }) => {
                    if (!c && urg)
                      return (
                        <div key={urg.conv.id} className="flex items-center gap-3 bg-rose-50/70 py-2.5">
                          <span className="w-12 shrink-0 text-[13px] font-bold tabular-nums text-rose-700">{urg.decision!.hora}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-semibold">
                              {urg.mascota} <span className="font-normal text-[var(--text-3)]">· {urg.nombre}</span>
                            </p>
                            <p className="truncate text-[12px] text-rose-700">Urgencia · sobrecupo · marcada por Luna</p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            <Siren size={11} /> Urgencia
                          </span>
                        </div>
                      );
                    if (!c) return null;
                    const cli = cliente(c.clienteId);
                    return (
                      <div key={c.id} className="flex items-center gap-3 py-2.5">
                        <span className="w-12 shrink-0 text-[13px] font-bold tabular-nums" style={{ color: AGENDA_INFO[a].color }}>
                          {c.hora}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold">
                            {c.mascota} <span className="font-normal text-[var(--text-3)]">· {cli.nombre}</span>
                          </p>
                          <p className="text-[12px] text-[var(--text-3)]">
                            {c.servicio} · {c.duracionMin} min · {c.origen === "ia" ? "agendó Luna" : "agendó recepción"}
                          </p>
                        </div>
                        <EstadoCitaPill estado={c.estado} />
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-5">
            {esSecretaria && (
              <Card title="Transferidas a ti" sub="Urgencias y casos clínicos primero" action={<Link href="/" className="text-[12.5px] font-semibold text-brand">Ir a bandeja</Link>}>
                <div className="space-y-2">
                  {transferidas.length === 0 && <p className="text-[13px] text-[var(--text-3)]">Nada pendiente. 🎉</p>}
                  {transferidas.map((c) => (
                    <Link key={c.id} href="/" className="block rounded-xl border border-line p-3 hover:bg-surface">
                      <div className="flex items-center justify-between">
                        <p className="text-[13.5px] font-semibold">{cliente(c.clienteId).nombre}</p>
                        <span className="flex items-center gap-1 text-[11.5px] text-[var(--text-3)]">
                          <Clock size={11} /> {c.esperaMin} min
                        </span>
                      </div>
                      {c.motivo && <span className={cn("mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", MOTIVO[c.motivo].className)}>{MOTIVO[c.motivo].label}</span>}
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            <Card title="Por confirmar" sub="El recordatorio salió y no hay respuesta">
              <div className="space-y-2">
                {porConfirmar.map((c) => (
                  <div key={c.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold">
                        {c.mascota} · {cliente(c.clienteId).nombre.split(" ")[0]}
                      </p>
                      <AgendaPill agenda={c.agenda} />
                    </div>
                    <p className="text-[12px] text-[var(--text-3)]">
                      {etiquetaDia(c.dia)} {c.hora} · {c.servicio}
                    </p>
                    {esSecretaria && (
                      <div className="mt-2 flex gap-1.5">
                        <button className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold text-[var(--text-2)] hover:bg-surface">
                          <Phone size={12} /> Llamar
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold text-[var(--text-2)] hover:bg-surface">
                          <Send size={12} /> Reenviar
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11.5px] font-semibold text-[var(--text-2)] hover:bg-surface">
                          <CalendarCheck size={12} /> Confirmar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Próximos espacios libres" sub="Lo que el agente está ofreciendo">
              <div className="space-y-3">
                {agendas.map((a) => (
                  <div key={a}>
                    <AgendaPill agenda={a} />
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {proximosLibres(a, 5).map((l) => (
                        <span key={`${l.dia}${l.hora}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-semibold" style={{ backgroundColor: AGENDA_INFO[a].soft, color: AGENDA_INFO[a].color }}>
                          <CalendarPlus size={11} /> {etiquetaDia(l.dia)} {l.hora}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
