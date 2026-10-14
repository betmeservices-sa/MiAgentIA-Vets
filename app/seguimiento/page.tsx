"use client";

import { useState } from "react";
import { CalendarPlus, Clock, Pill, MessageCircleReply, Plus, Send, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { pct } from "@/lib/format";
import { cliente, SEGUIMIENTOS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { EstadoSeguimiento } from "@/lib/types";
import { Card, Embudo, MetricCard, PageHeader } from "@/components/ui";

const ESTADO: Record<EstadoSeguimiento, { label: string; className: string }> = {
  programado: { label: "Programado", className: "bg-slate-100 text-slate-700" },
  enviado: { label: "Enviado", className: "bg-sky-50 text-sky-700" },
  respondido: { label: "Respondió", className: "bg-violet-50 text-violet-700" },
  transferido: { label: "Transferido a secretaria", className: "bg-rose-50 text-rose-700" },
  nueva_cita: { label: "Nueva cita", className: "bg-emerald-50 text-emerald-700" },
};

const CUANDO = ["24 horas", "3 días", "7 días", "14 días", "No enviar"];

export default function SeguimientoPage() {
  const [cuando, setCuando] = useState("3 días");
  const [tipo, setTipo] = useState("Preguntar evolución");
  const tot = { programados: 64 + 6, enviados: 64, respondidos: 41, citas: 17 };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Seguimiento de consultas" sub="El veterinario decide si se hace seguimiento y cuándo. El agente pregunta, no interpreta." />
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard Icon={Clock} valor={tot.programados} label="Programados (30 días)" />
          <MetricCard Icon={Send} valor={tot.enviados} label="Enviados" />
          <MetricCard Icon={MessageCircleReply} valor={`${pct(tot.respondidos, tot.enviados)}%`} label="Respondidos" hint={`${tot.respondidos} respuestas`} />
          <MetricCard Icon={CalendarPlus} valor={tot.citas} label="Convertidos en nueva cita" hint={`${pct(tot.citas, tot.respondidos)}% de los que respondieron`} />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="Seguimientos" sub="Últimas consultas con regla de seguimiento">
            <div className="divide-y divide-line">
              {SEGUIMIENTOS.map((s) => (
                <div key={s.id} className="flex flex-wrap items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">
                      {s.mascota} <span className="font-normal text-[var(--text-3)]">· {cliente(s.clienteId).nombre}</span>
                    </p>
                    <p className="text-[12px] text-[var(--text-3)]">
                      Consulta: {s.consulta} ({s.fechaConsulta}) · Regla: {s.regla}
                    </p>
                    {s.respuesta && <p className="mt-1 rounded-lg bg-surface px-2 py-1 text-[12px] text-[var(--text-2)]">“{s.respuesta}”</p>}
                  </div>
                  <div className="text-right">
                    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", ESTADO[s.estado].className)}>{ESTADO[s.estado].label}</span>
                    <p className="mt-1 text-[11.5px] text-[var(--text-3)]">{s.envio}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-5">
            {<a href="/receta" className="flex items-center gap-3 rounded-2xl border border-[var(--clinica)] bg-[var(--clinica-soft)] p-4 text-[13px] font-semibold text-[var(--clinica)] hover:opacity-90">
              <Pill size={18} /> <span>Al terminar la consulta: escribe la <b>receta digital</b> y envíala en PDF por WhatsApp →</span>
            </a>}
            <Card title="Al cerrar la consulta" sub="Lo que ve el Dr. Méndez (demo)">
              <p className="text-[12.5px] text-[var(--text-2)]">Canela · Consulta general · hoy 15:00</p>
              <p className="mt-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">¿Cuándo escribirle al cliente?</p>
              <div className="flex flex-wrap gap-1.5">
                {CUANDO.map((c) => (
                  <button key={c} onClick={() => setCuando(c)} className={cn("rounded-lg border px-2.5 py-1 text-[12px] font-semibold", cuando === c ? "border-[var(--clinica)] bg-[var(--clinica-soft)] text-[var(--clinica)]" : "border-line text-[var(--text-2)]")}>
                    {c}
                  </button>
                ))}
              </div>
              <p className="mt-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Tipo</p>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px]">
                <option>Preguntar evolución</option>
                <option>Reacción a vacuna</option>
                <option>Recordar control</option>
              </select>
              <button className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--clinica)] px-3 py-2 text-[13px] font-bold text-white">
                <Plus size={14} /> Programar seguimiento
              </button>
              <p className="mt-2 text-[11.5px] text-[var(--text-3)]">{cuando === "No enviar" ? "No se enviará seguimiento." : `Se enviará la plantilla seguimiento_consulta en ${cuando}.`}</p>
            </Card>

            <Card title="Embudo (30 días)">
              <Embudo
                color="var(--clinica)"
                pasos={[
                  { label: "Programados", valor: tot.programados },
                  { label: "Enviados", valor: tot.enviados },
                  { label: "Respondidos", valor: tot.respondidos },
                  { label: "Nueva cita", valor: tot.citas },
                ]}
              />
            </Card>

            <div className="flex gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900">
              <ShieldAlert size={16} className="shrink-0" />
              <p>
                Si la respuesta es «Sigue igual», «Hablar con la clínica» o menciona un síntoma, el agente <b>no opina</b>: agradece y transfiere a la secretaria con la respuesta resaltada.

              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
