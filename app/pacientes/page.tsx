"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, MessageCircle, PawPrint, Search, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLIENTES } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { Avatar, Card, ChannelBadge, MetricCard, PageHeader } from "@/components/ui";

type Filtro = "todos" | "nuevos";

export default function PacientesPage() {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [q, setQ] = useState("");
  const { recetas, conversacionDe, setConvSel } = useStore();
  const router = useRouter();
  const abrirConversacion = (clienteId: string) => {
    setConvSel(conversacionDe(clienteId));
    router.push("/");
  };
  // Perfiles que recepción ya revisó (en el demo vive solo en esta pantalla).
  const [revisados, setRevisados] = useState<Set<string>>(new Set());

  const porRevisar = (id: string) => {
    const c = CLIENTES.find((x) => x.id === id)!;
    return (c.creadoPorIA || c.mascotas.some((m) => m.creadaPorIA)) && !revisados.has(id);
  };

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return CLIENTES.filter((c) => filtro === "todos" || c.creadoPorIA || c.mascotas.some((m) => m.creadaPorIA))
      .filter((c) => !t || c.nombre.toLowerCase().includes(t) || c.telefono.replace(/s/g, "").includes(t.replace(/s/g, "")) || c.correo.toLowerCase().includes(t) || c.mascotas.some((m) => m.nombre.toLowerCase().includes(t)))
      .sort((a, b) => Number(porRevisar(b.id)) - Number(porRevisar(a.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, q, revisados]);

  const nuevosClientes = CLIENTES.filter((c) => c.creadoPorIA).length;
  const nuevasMascotas = CLIENTES.flatMap((c) => c.mascotas).filter((m) => m.creadaPorIA).length;
  const pendientes = CLIENTES.filter((c) => porRevisar(c.id)).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Pacientes" sub="Dueños y mascotas de la clínica. Busca un paciente para ver su perfil, sus recetas o entrar a su conversación." />
      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard Icon={Users} valor={CLIENTES.length} label="Clientes registrados" />
          <MetricCard Icon={Sparkles} valor={nuevosClientes} label="Clientes creados por Luna (7 días)" />
          <MetricCard Icon={PawPrint} valor={nuevasMascotas} label="Mascotas registradas por Luna" />
          <MetricCard Icon={CheckCircle2} valor={pendientes} label="Perfiles por revisar" hint="Recepción confirma los datos" tono={pendientes ? "alerta" : undefined} />
        </div>

        <Card
          title="Perfiles"
          sub="Haz clic en un paciente para abrir su ficha: actividad, historial clínico y recetas"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5">
                <Search size={14} className="text-[var(--text-3)]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar dueño, mascota, teléfono o correo" className="w-64 bg-transparent text-[13px] outline-none" />
              </div>
              <div className="inline-flex rounded-lg border border-line p-0.5">
                {(["todos", "nuevos"] as Filtro[]).map((f) => (
                  <button key={f} onClick={() => setFiltro(f)} className={cn("rounded-md px-2.5 py-1 text-[12.5px] font-semibold", filtro === f ? "bg-brand text-white" : "text-[var(--text-2)]")}>
                    {f === "todos" ? "Todos" : "Creados por Luna"}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-[var(--text-3)]">
                <tr>
                  <th className="py-2 pr-3">Dueño</th>
                  <th className="py-2 pr-3">Mascotas (especie · raza · edad)</th>
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Recetas</th>
                  <th className="py-2 pr-3">Origen</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line align-top">
                {lista.map((c) => {
                  const pend = porRevisar(c.id);
                  return (
                    <tr key={c.id} onClick={() => router.push(`/pacientes/${c.id}`)} className={cn("cursor-pointer hover:bg-surface", pend && "bg-violet-50/40")}>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar nombre={c.nombre} size={32} />
                          <div className="leading-tight">
                            <p className="font-semibold">{c.nombre}</p>
                            <p className="text-[12px] text-[var(--text-3)]">{c.telefono}</p>
                            <p className="text-[12px] text-[var(--text-3)]">{c.correo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        {c.mascotas.map((m) => (
                          <p key={m.nombre} className="flex flex-wrap items-center gap-1.5">
                            <b>{m.nombre}</b>
                            <span className="text-[var(--text-2)]">{m.especie} · {m.raza} · {m.edad}</span>
                            {m.creadaPorIA && <span className="rounded bg-violet-100 px-1 text-[10px] font-semibold text-violet-700">Nueva · Luna</span>}
                          </p>
                        ))}
                      </td>
                      <td className="py-2.5 pr-3"><ChannelBadge canal={c.canal} label /></td>
                      <td className="py-2.5 pr-3">
                        {recetas.some((r) => r.clienteId === c.id) ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--clinica-soft)] px-1.5 py-0.5 text-[11.5px] font-semibold text-[var(--clinica)]">
                            <FileText size={12} /> {recetas.filter((r) => r.clienteId === c.id).length}
                          </span>
                        ) : (
                          <span className="text-[var(--text-3)]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-[12px]">
                        {c.creadoPorIA ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-violet-700"><Sparkles size={12} /> Creado por Luna</span>
                        ) : (
                          <span className="text-[var(--text-3)]">Base de la clínica</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-col items-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); abrirConversacion(c.id); }} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-brand/40 bg-brand/5 px-2 py-1 text-[11.5px] font-semibold text-brand hover:bg-brand/10">
                          <MessageCircle size={12} /> Conversación
                        </button>
                        {pend ? (
                          <button onClick={(e) => { e.stopPropagation(); setRevisados((s) => new Set(s).add(c.id)); }} className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-white px-2 py-1 text-[11.5px] font-semibold text-violet-700 hover:bg-violet-50">
                            <CheckCircle2 size={12} /> Marcar revisado
                          </button>
                        ) : (c.creadoPorIA || c.mascotas.some((m) => m.creadaPorIA)) ? (
                          <span className="text-[11.5px] font-semibold text-emerald-700">Revisado</span>
                        ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Cómo crea Luna un perfil" sub="Solo por WhatsApp y solo cuando el número no está en la base de la clínica">
          <ol className="grid gap-3 text-[13px] text-[var(--text-2)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1. Detecta que es nuevo", "Busca el número de WhatsApp en la base. Si no hay coincidencia, avisa que va a crear el perfil. En Instagram y Facebook no pide datos: responde la consulta y, para agendar, invita a seguir por WhatsApp."],
              ["2. Pide 4 datos", "Nombre del dueño, nombre de la mascota, raza y edad. Deduce la especie por la raza; en grooming también confirma el tamaño."],
              ["3. Crea el perfil", "Guarda cliente y mascota en la base de la clínica y deja una nota en la conversación. Si el cliente ya existe y la mascota no, la agrega a su perfil."],
              ["4. Sigue con la cita", "Continúa agendando sin volver a pedir datos. Recepción revisa el perfil cuando pueda."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-xl border border-line p-3">
                <p className="font-bold text-[var(--text)]">{t}</p>
                <p className="mt-1">{d}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
