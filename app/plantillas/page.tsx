"use client";

import { Copy, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { pct } from "@/lib/format";
import { PLANTILLAS } from "@/lib/seed";
import { AgendaPill, Card, PageHeader } from "@/components/ui";

function rellenar(cuerpo: string, ej: string[]) {
  return cuerpo.replace(/\{\{(\d+)\}\}/g, (_, n) => ej[Number(n) - 1] ?? `{{${n}}}`);
}

export default function PlantillasPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Plantillas de WhatsApp" sub="6 plantillas para enviar a aprobación de Meta · idioma es (Español)" />
      <div className="space-y-5 p-6">
        <div className="flex gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-[12.5px] text-sky-900">
          <Info size={16} className="shrink-0" />
          <p>
            Las plantillas solo se necesitan para escribir <b>primero</b> o fuera de la ventana de 24 h. Si el cliente escribió en las últimas 24 h, el agente responde con texto libre. Las
            de utilidad no llevan promociones (Meta las reclasifica a marketing). Las de marketing llevan botón para darse de baja.
          </p>
        </div>

        {PLANTILLAS.map((p) => (
          <Card
            key={p.nombre}
            title={
              <span className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-surface px-1.5 py-0.5 text-[13px]">{p.nombre}</code>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", p.categoria === "UTILITY" ? "bg-emerald-50 text-emerald-700" : "bg-fuchsia-50 text-fuchsia-700")}>
                  {p.categoria === "UTILITY" ? "Utilidad" : "Marketing"}
                </span>
                {p.agenda === "ambas" ? (
                  <span className="flex gap-1"><AgendaPill agenda="clinica" /><AgendaPill agenda="grooming" /></span>
                ) : (
                  <AgendaPill agenda={p.agenda} />
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{p.estadoMeta}</span>
              </span>
            }
            sub={p.titulo}
            action={
              <button onClick={() => navigator.clipboard?.writeText(p.cuerpo)} className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[12px] font-semibold text-[var(--text-2)] hover:bg-surface">
                <Copy size={12} /> Copiar
              </button>
            }
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Cuerpo (para Meta)</p>
                  <pre className="whitespace-pre-wrap rounded-xl bg-surface p-3 font-sans text-[13px] leading-relaxed">{p.cuerpo}</pre>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Variables (ejemplo para Meta)</p>
                    <ul className="text-[12.5px] text-[var(--text-2)]">
                      {p.ejemplo.map((e, i) => (
                        <li key={i}>
                          <code>{`{{${i + 1}}}`}</code> = {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Botones de respuesta rápida</p>
                    <div className="flex flex-wrap gap-1">
                      {p.botones.map((b) => (
                        <span key={b} className="rounded-lg border border-line px-2 py-0.5 text-[12px] font-semibold">{b}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Cuándo se envía</p>
                  <p className="text-[13px] text-[var(--text-2)]">{p.cuando}</p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Envíos", p.stats.enviados, null],
                    ["Entregados", p.stats.entregados, pct(p.stats.entregados, p.stats.enviados)],
                    ["Leídos", p.stats.leidos, pct(p.stats.leidos, p.stats.enviados)],
                    ["Respondidos", p.stats.respondidos, pct(p.stats.respondidos, p.stats.enviados)],
                  ].map(([l, v, x]) => (
                    <div key={l as string} className="rounded-xl border border-line p-2">
                      <p className="text-[18px] font-extrabold">{v}</p>
                      <p className="text-[11px] text-[var(--text-3)]">{l}{x !== null ? ` · ${x}%` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vista previa estilo WhatsApp */}
              <div className="rounded-2xl bg-[#e5ddd5] p-3">
                <div className="rounded-xl rounded-tl-sm bg-white p-2.5 text-[13px] leading-snug text-[#111b21] shadow-sm">
                  <p className="whitespace-pre-line">{rellenar(p.cuerpo, p.ejemplo)}</p>
                  <p className="mt-1 text-right text-[10px] text-[#667781]">10:00</p>
                </div>
                <div className="mt-1 space-y-1">
                  {p.botones.map((b) => (
                    <div key={b} className="rounded-xl bg-white py-1.5 text-center text-[13px] font-medium text-[#00a5f4] shadow-sm">{b}</div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
