"use client";

import { FileText, Lock, PawPrint, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Cliente, EstadoReceta } from "@/lib/types";
import { Avatar, Card, ChannelBadge } from "./ui";

const ESTADO_RX: Record<EstadoReceta, { label: string; className: string }> = {
  enviada: { label: "Enviada por WhatsApp", className: "bg-slate-100 text-slate-700" },
  leida: { label: "Leída por el cliente", className: "bg-sky-50 text-sky-700" },
  duda: { label: "Cliente con duda → secretaria", className: "bg-rose-50 text-rose-700" },
};

/**
 * Perfil del cliente: datos, mascotas y recetas. Las recetas son de solo
 * lectura: las escribe el veterinario y la secretaria las consulta aquí para
 * responder al cliente sin tener que preguntarle al doctor.
 */
export function PerfilCliente({ c, onCerrar }: { c: Cliente; onCerrar: () => void }) {
  const { recetas, rol } = useStore();
  const suyas = recetas.filter((r) => r.clienteId === c.id);

  return (
    <Card
      title={
        <span className="flex items-center gap-2.5">
          <Avatar nombre={c.nombre} size={34} />
          <span className="leading-tight">
            {c.nombre}
            <span className="block text-[12px] font-normal text-[var(--text-3)]">{c.telefono}</span>
          </span>
        </span>
      }
      action={
        <button onClick={onCerrar} aria-label="Cerrar perfil" className="rounded-lg p-1 text-[var(--text-3)] hover:bg-surface">
          <X size={16} />
        </button>
      }
    >
      <div className="flex flex-wrap gap-2 text-[12px] text-[var(--text-2)]">
        <ChannelBadge canal={c.canal} label />
        {c.ultimaClinica && <span className="rounded-md bg-[var(--clinica-soft)] px-1.5 py-0.5 font-semibold text-[var(--clinica)]">Clínica: {c.ultimaClinica}</span>}
        {c.ultimaGrooming && <span className="rounded-md bg-[var(--grooming-soft)] px-1.5 py-0.5 font-semibold text-[var(--grooming)]">Grooming: {c.ultimaGrooming}</span>}
      </div>

      <p className="mt-4 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Mascotas</p>
      <div className="space-y-1">
        {c.mascotas.map((m) => (
          <p key={m.nombre} className="flex items-center gap-1.5 text-[13px]">
            <PawPrint size={13} className="text-[var(--text-3)]" /> <b>{m.nombre}</b>
            <span className="text-[var(--text-2)]">{m.especie} · {m.raza} · {m.edad}</span>
          </p>
        ))}
      </div>

      <p className="mt-4 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
        <span>Recetas ({suyas.length})</span>
        {rol !== "veterinario" && (
          <span className="inline-flex items-center gap-1 normal-case tracking-normal font-semibold">
            <Lock size={11} /> Solo lectura
          </span>
        )}
      </p>
      {suyas.length === 0 && <p className="text-[13px] text-[var(--text-3)]">Sin recetas registradas.</p>}
      <div className="space-y-3">
        {suyas.map((r) => (
          <div key={r.id} className="rounded-xl border border-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[13px] font-bold">
                <FileText size={14} className="text-[var(--clinica)]" /> {r.mascota}
                <span className="font-normal text-[var(--text-3)]">· {r.fecha ?? r.hora}{r.fecha === "Hoy" ? ` ${r.hora}` : ""}</span>
              </p>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", ESTADO_RX[r.estado].className)}>{ESTADO_RX[r.estado].label}</span>
            </div>
            <table className="mt-2 w-full text-left text-[12px]">
              <thead className="text-[10.5px] uppercase tracking-wider text-[var(--text-3)]">
                <tr>
                  <th className="pb-1 pr-2">Medicamento</th>
                  <th className="pb-1 pr-2">Dosis</th>
                  <th className="pb-1 pr-2">Frecuencia</th>
                  <th className="pb-1">Duración</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {r.items.map((i) => (
                  <tr key={i.medicamento}>
                    <td className="py-0.5 pr-2 font-semibold">{i.medicamento}</td>
                    <td className="py-0.5 pr-2">{i.dosis}</td>
                    <td className="py-0.5 pr-2">{i.frecuencia}</td>
                    <td className="py-0.5">{i.duracion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.indicaciones && <p className="mt-2 rounded-lg bg-surface px-2 py-1 text-[12px] text-[var(--text-2)]"><b>Indicaciones:</b> {r.indicaciones}</p>}
            <p className="mt-1.5 text-[11px] text-[var(--text-3)]">Escrita por {STAFF.veterinario.nombre}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
