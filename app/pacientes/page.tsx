"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, MessageCircle, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { etiquetaDia, fechaLegible, recetaEnCurso } from "@/lib/format";
import { CITAS, CLIENTES } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Canal } from "@/lib/types";
import { AgendaPill, Avatar, ChannelBadge } from "@/components/ui";

// Lista de pacientes al estilo de "Contacts" de un CRM: vistas en pestañas,
// buscador, filtros y tabla. Cada fila abre la ficha del paciente.

type Vista = "todos" | "confirmar" | "tratamiento" | "luna" | "revisar";
type Orden = { col: "nombre" | "ultima" | "proxima"; asc: boolean };

const sinEspacios = (t: string) => t.replace(/\s/g, "");

export default function PacientesPage() {
  const router = useRouter();
  const { recetas, visitas, conversacionDe, setConvSel } = useStore();
  const [vista, setVista] = useState<Vista>("todos");
  const [q, setQ] = useState("");
  const [canal, setCanal] = useState<"todos" | Canal>("todos");
  const [especie, setEspecie] = useState<"todas" | "Perro" | "Gato">("todas");
  const [orden, setOrden] = useState<Orden>({ col: "ultima", asc: false });
  // Perfiles creados por Luna que recepción ya revisó (en el demo vive solo en esta pantalla).
  const [revisados, setRevisados] = useState<Set<string>>(new Set());

  const abrirChat = (id: string) => {
    setConvSel(conversacionDe(id));
    router.push("/");
  };

  // Datos derivados por cliente: última visita, próxima cita y tratamiento en curso.
  const filas = useMemo(
    () =>
      CLIENTES.map((c) => {
        const ultima = visitas.filter((v) => v.clienteId === c.id).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora))[0];
        const proxima = CITAS.filter((x) => x.clienteId === c.id && x.dia >= 0 && !["completada", "cancelada", "reagendada"].includes(x.estado)).sort(
          (a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora),
        )[0];
        const porConfirmar = CITAS.some((x) => x.clienteId === c.id && x.dia >= 0 && x.estado === "por_confirmar");
        const tratamiento = recetas.some((r) => r.clienteId === c.id && recetaEnCurso(r));
        const deLuna = !!c.creadoPorIA || c.mascotas.some((m) => m.creadaPorIA);
        return { c, ultima, proxima, porConfirmar, tratamiento, deLuna, porRevisar: deLuna && !revisados.has(c.id) };
      }),
    [visitas, recetas, revisados],
  );

  const enVista = (f: (typeof filas)[number], v: Vista) =>
    v === "todos" || (v === "confirmar" && f.porConfirmar) || (v === "tratamiento" && f.tratamiento) || (v === "luna" && f.deLuna) || (v === "revisar" && f.porRevisar);

  const VISTAS: { id: Vista; label: string }[] = [
    { id: "todos", label: "Todos los pacientes" },
    { id: "confirmar", label: "Cita por confirmar" },
    { id: "tratamiento", label: "En tratamiento" },
    { id: "luna", label: "Creados por Luna" },
    { id: "revisar", label: "Por revisar" },
  ];

  const t = q.trim().toLowerCase();
  const lista = filas
    .filter((f) => enVista(f, vista))
    .filter((f) => canal === "todos" || f.c.canal === canal)
    .filter((f) => especie === "todas" || f.c.mascotas.some((m) => m.especie === especie))
    .filter(
      ({ c }) =>
        !t ||
        c.nombre.toLowerCase().includes(t) ||
        c.correo.toLowerCase().includes(t) ||
        sinEspacios(c.telefono).includes(sinEspacios(t)) ||
        c.mascotas.some((m) => m.nombre.toLowerCase().includes(t) || m.raza.toLowerCase().includes(t)),
    )
    .sort((a, b) => {
      const s = orden.asc ? 1 : -1;
      if (orden.col === "nombre") return s * a.c.nombre.localeCompare(b.c.nombre);
      if (orden.col === "ultima") return s * ((a.ultima?.fecha ?? "").localeCompare(b.ultima?.fecha ?? ""));
      const pa = a.proxima ? a.proxima.dia * 10000 + Number(a.proxima.hora.replace(":", "")) : Infinity;
      const pb = b.proxima ? b.proxima.dia * 10000 + Number(b.proxima.hora.replace(":", "")) : Infinity;
      return s * (pa === pb ? 0 : pa < pb ? -1 : 1);
    });

  const ordenar = (col: Orden["col"]) => setOrden((o) => (o.col === col ? { col, asc: !o.asc } : { col, asc: col !== "ultima" }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line bg-card px-6 pt-4">
        <div className="w-full">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-[22px] font-extrabold tracking-tight">Pacientes</h1>
            <span className="text-[13px] text-[var(--text-3)]">{CLIENTES.length} registros</span>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto">
            {VISTAS.map((v) => {
              const n = filas.filter((f) => enVista(f, v.id)).length;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVista(v.id)}
                  className={cn(
                    "shrink-0 rounded-t-lg border border-b-0 px-3.5 py-2 text-[13px] font-semibold transition",
                    vista === v.id ? "border-line bg-surface text-[var(--text)]" : "border-transparent text-[var(--text-3)] hover:text-[var(--text)]",
                  )}
                >
                  {v.label} <span className="ml-0.5 text-[11.5px] opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-line bg-card shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
            <div className="flex min-w-[220px] flex-1 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 sm:max-w-xs">
              <Search size={14} className="text-[var(--text-3)]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar dueño, mascota, raza, teléfono o correo" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
            </div>
            <Filtro label="Canal" value={canal} onChange={(v) => setCanal(v as typeof canal)} opciones={[["todos", "Todos"], ["whatsapp", "WhatsApp"], ["instagram", "Instagram"], ["facebook", "Facebook"]]} />
            <Filtro label="Especie" value={especie} onChange={(v) => setEspecie(v as typeof especie)} opciones={[["todas", "Todas"], ["Perro", "Perro"], ["Gato", "Gato"]]} />
            <span className="ml-auto text-[12.5px] text-[var(--text-3)]">{lista.length} {lista.length === 1 ? "paciente" : "pacientes"}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[13px]">
              <thead className="bg-surface/70 text-[11px] uppercase tracking-wider text-[var(--text-3)]">
                <tr>
                  <Th onClick={() => ordenar("nombre")} activo={orden.col === "nombre"} asc={orden.asc}>Nombre</Th>
                  <th className="px-3 py-2.5 font-bold">Mascotas</th>
                  <th className="px-3 py-2.5 font-bold">Correo</th>
                  <th className="px-3 py-2.5 font-bold">Teléfono</th>
                  <Th onClick={() => ordenar("ultima")} activo={orden.col === "ultima"} asc={orden.asc}>Última visita</Th>
                  <Th onClick={() => ordenar("proxima")} activo={orden.col === "proxima"} asc={orden.asc}>Próxima cita</Th>
                  <th className="px-3 py-2.5 font-bold">Canal</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {lista.map(({ c, ultima, proxima, tratamiento, deLuna, porRevisar }) => (
                  <tr key={c.id} onClick={() => router.push(`/pacientes/${c.id}`)} className={cn("group cursor-pointer align-top hover:bg-surface/70", porRevisar && "bg-violet-50/40")}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar nombre={c.nombre} size={32} />
                        <div className="min-w-0 leading-tight">
                          <Link href={`/pacientes/${c.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-brand hover:underline">
                            {c.nombre}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {tratamiento && <span className="rounded bg-emerald-50 px-1 text-[10.5px] font-semibold text-emerald-700">En tratamiento</span>}
                            {deLuna && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-violet-50 px-1 text-[10.5px] font-semibold text-violet-700">
                                <Sparkles size={10} /> {porRevisar ? "Por revisar" : "Luna · revisado"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {c.mascotas.map((m) => (
                        <p key={m.nombre} className="whitespace-nowrap">
                          <b>{m.nombre}</b> <span className="text-[var(--text-3)]">· {m.raza} · {m.edad}</span>
                        </p>
                      ))}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--text-2)]">{c.correo}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-2)]">{c.telefono}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {ultima ? (
                        <div className="flex flex-col items-start gap-1">
                          <span>{fechaLegible(ultima.fecha)}</span>
                          <AgendaPill agenda={ultima.agenda} />
                        </div>
                      ) : (
                        <span className="text-[var(--text-3)]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {proxima ? (
                        <div className="flex flex-col items-start gap-1">
                          <span>{etiquetaDia(proxima.dia)} · {proxima.hora}</span>
                          <AgendaPill agenda={proxima.agenda} />
                        </div>
                      ) : (
                        <span className="text-[var(--text-3)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5"><ChannelBadge canal={c.canal} label /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirChat(c.id);
                          }}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-brand/40 bg-brand/5 px-2 py-1 text-[11.5px] font-semibold text-brand hover:bg-brand/10"
                        >
                          <MessageCircle size={12} /> Chat
                        </button>
                        {porRevisar && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRevisados((s) => new Set(s).add(c.id));
                            }}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-violet-300 bg-white px-2 py-1 text-[11.5px] font-semibold text-violet-700 hover:bg-violet-50"
                          >
                            <CheckCircle2 size={12} /> Marcar revisado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lista.length === 0 && <p className="p-10 text-center text-[13px] text-[var(--text-3)]">Ningún paciente coincide con la búsqueda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick, activo, asc }: { children: string; onClick: () => void; activo: boolean; asc: boolean }) {
  const Icon = !activo ? ArrowUpDown : asc ? ArrowUp : ArrowDown;
  return (
    <th className="px-3 py-2.5">
      <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1 font-bold uppercase tracking-wider", activo ? "text-[var(--text)]" : "hover:text-[var(--text)]")}>
        {children} <Icon size={12} />
      </button>
    </th>
  );
}

function Filtro({ label, value, onChange, opciones }: { label: string; value: string; onChange: (v: string) => void; opciones: [string, string][] }) {
  return (
    <label className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px]", value === opciones[0][0] ? "border-line" : "border-brand/50 bg-brand/5")}>
      <span className="font-semibold text-[var(--text-3)]">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent font-semibold outline-none">
        {opciones.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

