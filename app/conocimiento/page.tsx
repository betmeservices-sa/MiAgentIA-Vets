"use client";

import { Ban, CheckCircle2, ShieldCheck } from "lucide-react";
import { CALENDARIOS, CLINICA, CONOCIMIENTO } from "@/lib/seed";
import type { Agenda } from "@/lib/types";
import { AgendaPill, Card, PageHeader } from "@/components/ui";

const PUEDE = [
  "Responder horarios, ubicación, formas de pago y políticas aprobadas.",
  "Dar los precios de esta lista, tal cual están escritos.",
  "Agendar, reagendar y cancelar en el calendario que corresponde al servicio.",
  "Enviar recordatorios, seguimientos y mensajes de reactivación con plantillas aprobadas.",
];

const NO_PUEDE = [
  "Dar diagnósticos, interpretar síntomas, recomendar medicamentos, dosis o cuidados.",
  "Negociar precios, dar descuentos o cotizar algo que no está en la lista.",
  "Decidir si algo es urgente: ante cualquier señal transfiere y da el número de urgencias.",
  "Seguir respondiendo una conversación que la secretaria tomó.",
];

export default function ConocimientoPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Información aprobada" sub={`Lo único que ${CLINICA.agente} puede decir. Si no está aquí, transfiere a la secretaria.`} />
      <div className="space-y-5 p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title={<span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-emerald-600" /> El agente puede</span>}>
            <ul className="space-y-1.5 text-[13px] text-[var(--text-2)]">{PUEDE.map((p) => <li key={p}>• {p}</li>)}</ul>
          </Card>
          <Card title={<span className="flex items-center gap-1.5"><Ban size={16} className="text-rose-600" /> El agente nunca</span>}>
            <ul className="space-y-1.5 text-[13px] text-[var(--text-2)]">{NO_PUEDE.map((p) => <li key={p}>• {p}</li>)}</ul>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {(["clinica", "grooming"] as Agenda[]).map((a) => (
            <Card key={a} title={<span className="flex items-center gap-2"><AgendaPill agenda={a} /> Servicios y precios</span>} sub={`${CALENDARIOS[a].nombre} · ${CALENDARIOS[a].horario}`}>
              <table className="w-full text-left text-[13px]">
                <thead className="text-[11px] uppercase tracking-wider text-[var(--text-3)]">
                  <tr><th className="py-1.5">Servicio</th><th className="py-1.5">Duración</th><th className="py-1.5 text-right">Precio (USD)</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {CONOCIMIENTO[a].map((s) => (
                    <tr key={s.servicio}>
                      <td className="py-2 font-semibold">{s.servicio}</td>
                      <td className="py-2 text-[var(--text-2)]">{s.duracion}</td>
                      <td className={`py-2 text-right ${s.precio.startsWith("Por definir") ? "text-[var(--text-3)] italic" : ""}`}>{s.precio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11.5px] text-[var(--text-3)]">Los precios se cargarán en dólares (USD) cuando la clínica los apruebe. Mientras tanto, el agente no da montos.</p>
            </Card>
          ))}
        </div>

        <Card title="Políticas">
          <ul className="space-y-1.5 text-[13px] text-[var(--text-2)]">{CONOCIMIENTO.politicas.map((p) => <li key={p}>• {p}</li>)}</ul>
          <p className="mt-4 flex items-center gap-1.5 text-[12px] text-[var(--text-3)]">
            <ShieldCheck size={13} /> Cada cambio queda registrado con quién lo hizo. La clínica aprueba la información antes de que el agente la use.
          </p>
        </Card>
      </div>
    </div>
  );
}
