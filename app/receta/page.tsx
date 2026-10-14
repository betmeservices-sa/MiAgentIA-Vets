"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Eye, FileText, MessageCircleQuestion, Pill, Plus, Send, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { citasDe } from "@/lib/agenda";
import Link from "next/link";
import { CLINICA, cliente, STAFF } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { EstadoReceta, ItemReceta } from "@/lib/types";
import { Card, MetricCard, PageHeader } from "@/components/ui";

// Herramienta del veterinario: escribe la receta, se arma el PDF y sale por
// WhatsApp al terminar la consulta. No toca inventario ni ventas: si el
// cliente quiere comprar en la clínica, lo resuelve el veterinario o recepción.

const ESTADO: Record<EstadoReceta, { label: string; className: string }> = {
  enviada: { label: "Enviada", className: "bg-slate-100 text-slate-700" },
  leida: { label: "Leída", className: "bg-sky-50 text-sky-700" },
  duda: { label: "Duda → secretaria", className: "bg-rose-50 text-rose-700" },
};

const input = "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--clinica)]";
const vacio = (): ItemReceta => ({ medicamento: "", dosis: "", frecuencia: "", duracion: "" });

export default function RecetaPage() {
  const { recetas, agregarReceta } = useStore();
  const pacientes = citasDe("clinica", 0);
  const [citaId, setCitaId] = useState(pacientes.find((c) => c.mascota === "Canela")?.id ?? pacientes[0]?.id);
  const cita = pacientes.find((c) => c.id === citaId)!;
  const cli = cliente(cita.clienteId);
  const mascota = cli.mascotas.find((m) => m.nombre === cita.mascota);

  const [items, setItems] = useState<ItemReceta[]>([
    { medicamento: "FortiFlora (probiótico)", dosis: "1 sobre sobre la comida", frecuencia: "Cada 24 h", duracion: "7 días" },
    { medicamento: "Metronidazol 250 mg", dosis: "½ tableta", frecuencia: "Cada 12 h", duracion: "5 días" },
  ]);
  const [indicaciones, setIndicaciones] = useState("Dieta blanda (arroz con pollo sin sal) por 3 días. Agua siempre disponible.");
  const [enviada, setEnviada] = useState<string | null>(null);
  const hoja = useRef<HTMLDivElement>(null);

  const fecha = new Date().toLocaleDateString("es-SV", { day: "numeric", month: "long", year: "numeric" });
  const archivo = `Receta_${cita.mascota}_${new Date().toLocaleDateString("es-SV", { day: "2-digit", month: "short" }).replace(/\s|\./g, "")}.pdf`;
  const validos = items.filter((i) => i.medicamento.trim());

  const editar = (i: number, cambio: Partial<ItemReceta>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...cambio } : x)));

  const enviar = () => {
    if (!validos.length) return;
    const hora = new Date().toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", hour12: false });
    agregarReceta({ id: `rx${Date.now()}`, clienteId: cli.id, mascota: cita.mascota, hora, fecha: "Hoy", items: validos, indicaciones: indicaciones.trim() || undefined, estado: "enviada" });
    setEnviada(`${cita.mascota} · ${cli.nombre} (${cli.telefono})`);
  };

  // "Ver PDF": abre la hoja sola y lanza imprimir, de donde se guarda como PDF.
  const verPdf = () => {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w || !hoja.current) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${archivo}</title>
      <style>body{font-family:Arial,sans-serif;margin:40px;color:#16202c}p{margin:2px 0}b{font-weight:700}
      .m{border-bottom:2px solid #0f766e;padding-bottom:10px;display:flex;justify-content:space-between}
      .t{color:#0f766e;font-size:20px;font-weight:800}.s{color:#5c6a7a;font-size:12px}.g{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:14px;font-size:13px}
      .rx{color:#0f766e;font-size:28px;font-weight:800;margin-top:16px}ol{padding-left:0;list-style:none}li{margin:10px 0;font-size:14px}
      .i{background:#f4f6f9;padding:8px;border-radius:6px;font-size:13px;margin-top:14px}.f{margin-top:60px;display:flex;justify-content:flex-end}
      .f div{width:220px;border-top:1px solid #5c6a7a;text-align:center;padding-top:4px;font-size:12px}span{display:none}</style></head>
      <body>${hoja.current.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Receta digital" sub="El veterinario escribe la receta y el paciente la recibe en PDF por WhatsApp al terminar la consulta." />
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MetricCard Icon={FileText} valor={recetas.length + 38} label="Recetas enviadas (30 días)" />
          <MetricCard Icon={CheckCircle2} valor="95%" label="Leídas por el cliente" />
          <MetricCard Icon={MessageCircleQuestion} valor={recetas.filter((r) => r.estado === "duda").length + 6} label="Dudas pasadas a la secretaria" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_440px]">
          <Card title="Nueva receta" sub={`${STAFF.veterinario.nombre} · paciente de la agenda de hoy`}>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Paciente</label>
            <select value={citaId} onChange={(e) => { setCitaId(e.target.value); setEnviada(null); }} className={input}>
              {pacientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.hora} · {c.mascota} ({cliente(c.clienteId).nombre}) · {c.servicio}
                </option>
              ))}
            </select>

            <p className="mt-4 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Medicamentos</p>
            <div className="space-y-2.5">
              {items.map((it, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-2">
                    <Pill size={15} className="shrink-0 text-[var(--clinica)]" />
                    <input value={it.medicamento} onChange={(e) => editar(i, { medicamento: e.target.value })} placeholder="Medicamento y presentación" className={cn(input, "flex-1 font-semibold")} />
                    <button onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-rose-50 hover:text-rose-600" aria-label="Quitar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input value={it.dosis} onChange={(e) => editar(i, { dosis: e.target.value })} placeholder="Dosis" className={input} />
                    <input value={it.frecuencia} onChange={(e) => editar(i, { frecuencia: e.target.value })} placeholder="Frecuencia" className={input} />
                    <input value={it.duracion} onChange={(e) => editar(i, { duracion: e.target.value })} placeholder="Duración" className={input} />
                  </div>
                </div>
              ))}
              <button onClick={() => setItems((xs) => [...xs, vacio()])} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[var(--border-2)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--text-2)] hover:bg-surface">
                <Plus size={14} /> Agregar medicamento
              </button>
            </div>

            <p className="mt-4 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Indicaciones</p>
            <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows={3} className={input} />

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button onClick={verPdf} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-[14px] font-semibold text-[var(--text-2)] hover:bg-surface">
                <Eye size={16} /> Ver PDF
              </button>
              <button onClick={enviar} disabled={!validos.length} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--clinica)] px-4 py-3 text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-40">
                <Send size={16} /> Enviar PDF por WhatsApp
              </button>
            </div>
            {enviada && (
              <p className="ccg-pop mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800">
                <CheckCircle2 size={16} /> Receta enviada a {enviada}. Quedó guardada en el historial del cliente.
              </p>
            )}
          </Card>

          <div className="space-y-4">
            {/* Hoja de la receta: es lo mismo que va en el PDF. */}
            <div ref={hoja} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="m flex items-start justify-between border-b-2 border-[var(--clinica)] pb-3">
                <div>
                  <p className="t text-[16px] font-extrabold" style={{ color: "var(--clinica)" }}>{CLINICA.nombre}</p>
                  <p className="s text-[11px] text-[var(--text-3)]">{CLINICA.ciudad} · Tel. 2222-3344</p>
                </div>
                <p className="s text-[11px] text-[var(--text-3)]">{fecha}</p>
              </div>
              <div className="g mt-3 grid grid-cols-2 gap-1 text-[12px]">
                <p><b>Paciente:</b> {cita.mascota}</p>
                <p><b>Propietario:</b> {cli.nombre}</p>
                <p><b>Especie / raza:</b> {mascota ? `${mascota.especie} · ${mascota.raza}` : "—"}</p>
                <p><b>Edad:</b> {mascota?.edad ?? "—"}</p>
              </div>
              <p className="rx mt-3 text-[20px] font-extrabold" style={{ color: "var(--clinica)" }}>℞</p>
              <ol className="mt-1 space-y-2 text-[12.5px]">
                {validos.map((i, k) => (
                  <li key={k}>
                    <p className="font-bold">{k + 1}. {i.medicamento}</p>
                    <p className="text-[var(--text-2)]">{[i.dosis, i.frecuencia, i.duracion].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ol>
              {indicaciones && <p className="i mt-3 rounded-lg bg-surface p-2 text-[12px] text-[var(--text-2)]"><b>Indicaciones:</b> {indicaciones}</p>}
              <div className="f mt-6 flex justify-end">
                <div className="w-44 border-t border-[var(--text-3)] pt-1 text-center text-[11px]">
                  <p className="font-semibold">{STAFF.veterinario.nombre}</p>
                  <p className="text-[var(--text-3)]">Médico veterinario · Col. 1234</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#e5ddd5] p-3">
              <p className="mb-2 text-center text-[11px] font-semibold text-[#54656f]">Así le llega a {cli.nombre.split(" ")[0]} por WhatsApp</p>
              <div className="rounded-xl rounded-tl-sm bg-white p-2 text-[13px] leading-snug text-[#111b21] shadow-sm">
                <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#f0f2f5] p-2.5">
                  <span className="flex h-9 w-8 items-center justify-center rounded bg-[#e2483d] text-[9px] font-bold text-white">PDF</span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[12.5px] font-semibold">{archivo}</p>
                    <p className="text-[11px] text-[#667781]">1 página · PDF</p>
                  </div>
                </div>
                <p className="px-0.5">
                  Hola {cli.nombre.split(" ")[0]}, te compartimos la receta de {cita.mascota} indicada por el Dr. Méndez en su consulta de hoy.
                  <br /><br />
                  Si tienes dudas sobre el tratamiento, responde a este mensaje y el equipo de la clínica te contactará.
                </p>
              </div>
              <div className="mt-1 rounded-xl bg-white py-1.5 text-center text-[13px] font-medium text-[#00a5f4] shadow-sm">Tengo una duda</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2" title="Recetas enviadas">
            <div className="divide-y divide-line">
              {recetas.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-11 text-[12.5px] font-bold tabular-nums text-[var(--text-3)]">{r.hora}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold">{r.mascota} <span className="font-normal text-[var(--text-3)]">· {cliente(r.clienteId).nombre}</span></p>
                    <p className="truncate text-[12px] text-[var(--text-3)]">{r.items.map((i) => i.medicamento).join(" · ")}</p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", ESTADO[r.estado].className)}>{ESTADO[r.estado].label}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="flex h-fit gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900">
            <ShieldAlert size={16} className="shrink-0" />
            <p>La receta la escribe y la firma el veterinario. MIA no la redacta ni la explica: si el cliente toca «Tengo una duda» o pregunta por la dosis, la conversación pasa a la secretaria.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
