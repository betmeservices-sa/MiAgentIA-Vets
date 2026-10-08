"use client";

import { BellRing, CalendarCheck, CalendarX2, Repeat, UserX } from "lucide-react";
import { AGENDA_INFO, etiquetaDia, pct } from "@/lib/format";
import { CITAS, cliente } from "@/lib/seed";
import { pasaFiltro, useStore } from "@/lib/store";
import type { Agenda } from "@/lib/types";
import { AgendaPill, Card, EstadoCitaPill, FiltroAgendaToggle, MetricCard, PageHeader } from "@/components/ui";

export default function RecordatoriosPage() {
  const { filtro } = useStore();
  const proximas = CITAS.filter((c) => c.dia >= 0 && c.dia <= 2 && pasaFiltro(filtro, c.agenda) && c.estado !== "completada").sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora));
  const semana = CITAS.filter((c) => c.dia >= -6 && c.dia <= 0 && pasaFiltro(filtro, c.agenda));
  const enviados = semana.length;
  const confirmados = semana.filter((c) => c.estado === "completada" || c.estado === "confirmada").length;
  const ausencias = semana.filter((c) => c.estado === "ausente").length;
  const reagendados = semana.filter((c) => c.estado === "reagendada").length;
  const cancelados = semana.filter((c) => c.estado === "cancelada").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Recordatorios automáticos" sub="Plantilla recordatorio_cita · 24 h antes · botones Confirmar / Reagendar / Cancelar" right={<FiltroAgendaToggle />} />
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard Icon={BellRing} valor={enviados} label="Enviados (7 días)" />
          <MetricCard Icon={CalendarCheck} valor={`${pct(confirmados, enviados)}%`} label="Confirmados" hint={`${confirmados} citas`} />
          <MetricCard Icon={Repeat} valor={reagendados} label="Reagendados por el cliente" />
          <MetricCard Icon={CalendarX2} valor={cancelados} label="Cancelados" hint="El espacio se libera solo" />
          <MetricCard Icon={UserX} valor={`${pct(ausencias, enviados)}%`} label="Ausencias" hint={`${ausencias} no se presentaron`} tono={ausencias > 3 ? "alerta" : undefined} />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="Cola de recordatorios" sub="Hoy, mañana y pasado mañana">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--text-3)]">
                  <tr>
                    <th className="py-2 pr-3">Cita</th>
                    <th className="py-2 pr-3">Mascota / cliente</th>
                    <th className="py-2 pr-3">Agenda</th>
                    <th className="py-2 pr-3">Recordatorio</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {proximas.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                        {etiquetaDia(c.dia)} {c.hora}
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold">{c.mascota}</p>
                        <p className="text-[12px] text-[var(--text-3)]">{cliente(c.clienteId).nombre}</p>
                      </td>
                      <td className="py-2.5 pr-3"><AgendaPill agenda={c.agenda} /></td>
                      <td className="py-2.5 pr-3 text-[12px] text-[var(--text-2)]">
                        {c.dia === 2 ? "Sale mañana a esta hora" : c.estado === "por_confirmar" ? "Enviado · sin respuesta" : "Enviado · respondido"}
                      </td>
                      <td className="py-2.5"><EstadoCitaPill estado={c.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Reglas configuradas" sub="Por agenda; la clínica las ajusta">
            <div className="space-y-3 text-[13px]">
              {(["clinica", "grooming"] as Agenda[]).filter((a) => pasaFiltro(filtro, a)).map((a) => (
                <div key={a} className="rounded-xl border border-line p-3">
                  <AgendaPill agenda={a} />
                  <ul className="mt-2 space-y-1 text-[var(--text-2)]">
                    <li>• Recordatorio 24 h antes, en horario 8:00–19:00.</li>
                    <li>• Sin respuesta 4 h antes → pasa a «Por confirmar» para que llame la secretaria.</li>
                    <li>• «Cancelar» libera el espacio en el calendario de {AGENDA_INFO[a].recurso}.</li>
                    <li>• «Reagendar» → el agente ofrece espacios solo de esta agenda.</li>
                    {a === "grooming" && <li>• Aviso «tu mascota está lista» cuando el groomer la marca como terminada.</li>}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
