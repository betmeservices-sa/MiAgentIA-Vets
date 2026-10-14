"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  Copy,
  Download,
  FileText,
  Mail,
  MessageCircle,
  NotebookPen,
  PawPrint,
  Phone,
  Pill,
  Plus,
  Scissors,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, etiquetaDia, fechaLegible, isoDeTexto, mesLegible, recetaEnCurso } from "@/lib/format";
import { CITAS, CLIENTES, STAFF } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Agenda, Cita, Cliente, Conversacion, Nota, Receta, Visita } from "@/lib/types";
import { AgendaPill, Avatar, ChannelBadge, EstadoCitaPill } from "@/components/ui";
import { Menu, NotaModal, RecetaModal, ResumenBloque, ResumenModal } from "@/components/ResumenConsulta";
import { descargarReceta, nombreArchivo } from "@/lib/recetaPdf";

// Ficha del paciente al estilo CRM: datos del dueño a la izquierda, actividad
// e historial clínico al centro, mascotas y próximas citas a la derecha.

export default function PacientePage() {
  const { id } = useParams<{ id: string }>();
  const c = CLIENTES.find((x) => x.id === id);
  if (!c) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="font-bold">No encontramos ese paciente.</p>
        <Link href="/pacientes" className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-bold text-white">Volver a Pacientes</Link>
      </div>
    );
  }
  return <Ficha key={c.id} c={c} />;
}

type Modal = { tipo: "resumen"; visita?: Visita } | { tipo: "nota" } | { tipo: "receta" } | null;

function Ficha({ c }: { c: Cliente }) {
  const router = useRouter();
  const { conversacionDe, setConvSel, setCalendario, setDiaCalendario, visitas, conversaciones } = useStore();
  const [modal, setModal] = useState<Modal>(null);
  const [tab, setTab] = useState<Tab>("overview");
  // Aviso al pie: cita agendada desde un resumen o receta enviada.
  const [aviso, setAviso] = useState<{ tipo: "cita"; cita: Cita } | { tipo: "receta"; receta: Receta } | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(t);
  }, [aviso]);

  const suyas = useMemo(() => visitas.filter((v) => v.clienteId === c.id), [visitas, c.id]);
  const conv = conversaciones.find((x) => x.clienteId === c.id);

  const abrirConversacion = () => {
    setConvSel(conversacionDe(c.id));
    router.push("/");
  };
  const agendar = (a: Agenda, dia = 0) => {
    setCalendario(a);
    setDiaCalendario(dia);
    router.push("/agendas");
  };
  const acciones = { abrirConversacion, agendar, resumir: (v?: Visita) => setModal({ tipo: "resumen", visita: v }), nota: () => setModal({ tipo: "nota" }), receta: () => setModal({ tipo: "receta" }) };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3 outline-none sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)] 2xl:grid-cols-[290px_minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Contacto c={c} visitas={suyas} acciones={acciones} />
        </div>
        <div className="min-w-0 lg:row-span-2 2xl:row-span-1">
          <Centro c={c} tab={tab} setTab={setTab} visitas={suyas} acciones={acciones} />
        </div>
        <div className="space-y-4 lg:col-start-1 2xl:col-start-3 2xl:row-start-1">
          <Mascotas c={c} visitas={suyas} />
          <ProximasCitas c={c} agendar={agendar} />
          <ConversacionCard conv={conv} abrir={abrirConversacion} />
        </div>
      </div>

      {modal?.tipo === "resumen" && <ResumenModal c={c} visita={modal.visita} onClose={() => setModal(null)} onAgendada={(cita) => setAviso({ tipo: "cita", cita })} />}
      {aviso && (
        <div role="status" className="fixed bottom-4 left-1/2 z-[70] flex w-[min(520px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-xl bg-[var(--text)] px-4 py-3 text-[13px] text-white shadow-2xl">
          {aviso.tipo === "cita" ? <CalendarPlus size={18} className="shrink-0" /> : <Pill size={18} className="shrink-0" />}
          <span className="min-w-0 flex-1">
            {aviso.tipo === "cita" ? (
              <>
                Cita agendada: <b>{aviso.cita.servicio}</b> de {aviso.cita.mascota}, {etiquetaDia(aviso.cita.dia).toLowerCase()} a las {aviso.cita.hora}.
              </>
            ) : (
              <>
                Receta de <b>{aviso.receta.mascota}</b> enviada por {aviso.receta.canal === "correo" ? `correo a ${c.correo}` : `WhatsApp al ${c.telefono}`}.
              </>
            )}
          </span>
          {aviso.tipo === "cita" ? (
            <button type="button" onClick={() => agendar(aviso.cita.agenda, aviso.cita.dia)} className="shrink-0 font-bold text-violet-300 hover:underline">
              Ver en calendario
            </button>
          ) : (
            <button type="button" onClick={() => descargarReceta(aviso.receta)} className="shrink-0 font-bold text-violet-300 hover:underline">
              Descargar PDF
            </button>
          )}
          <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso" className="shrink-0 text-white/60 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}
      {modal?.tipo === "nota" && <NotaModal c={c} onClose={() => setModal(null)} />}
      {modal?.tipo === "receta" && (
        <RecetaModal
          c={c}
          onClose={() => setModal(null)}
          onEnviada={(receta) => {
            setTab("tratamientos");
            setAviso({ tipo: "receta", receta });
          }}
        />
      )}
    </div>
  );
}

interface Acciones {
  abrirConversacion: () => void;
  agendar: (a: Agenda) => void;
  resumir: (v?: Visita) => void;
  nota: () => void;
  receta: () => void;
}

/* ---------- Columna izquierda: dueño ---------- */

function Contacto({ c, visitas, acciones }: { c: Cliente; visitas: Visita[]; acciones: Acciones }) {

  const rapidas: { label: string; Icon: typeof Mail; onClick?: () => void; href?: string }[] = [
    { label: "Receta", Icon: Pill, onClick: acciones.receta },
    { label: "Correo", Icon: Mail, href: `mailto:${c.correo}` },
    { label: "Chat", Icon: MessageCircle, onClick: acciones.abrirConversacion },
    { label: "Llamar", Icon: Phone, href: `tel:${c.telefono.replace(/\s/g, "")}` },
    { label: "Cita", Icon: CalendarPlus, onClick: () => acciones.agendar("clinica") },
    { label: "Resumen", Icon: ClipboardPen, onClick: () => acciones.resumir() },
  ];

  return (
    <>
      <section className="rounded-2xl border border-line bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/pacientes" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--text-2)] hover:text-brand">
            <ChevronLeft size={16} /> Pacientes
          </Link>
          <Menu
            label="Acciones"
            items={[
              { label: "Abrir conversación", onClick: acciones.abrirConversacion },
              { label: "Agendar en veterinaria", onClick: () => acciones.agendar("clinica") },
              { label: "Agendar en grooming", onClick: () => acciones.agendar("grooming") },
              { label: "Resumir consulta", onClick: () => acciones.resumir() },
              { label: "Agregar nota", onClick: acciones.nota },
              { label: "Escribir receta", onClick: acciones.receta },
            ]}
          />
        </div>

        <div className="mt-4 flex items-start gap-3">
          <Avatar nombre={c.nombre} size={48} />
          <div className="min-w-0">
            <h1 className="text-[19px] font-extrabold leading-tight tracking-tight">{c.nombre}</h1>
            <p className="mt-0.5 text-[12.5px] text-[var(--text-3)]">Dueño de {c.mascotas.map((m) => m.nombre).join(", ")}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-[13px]">
          <Copiable valor={c.correo} href={`mailto:${c.correo}`} />
          <Copiable valor={c.telefono} href={`tel:${c.telefono.replace(/\s/g, "")}`} />
        </div>

        <button
          type="button"
          onClick={acciones.abrirConversacion}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-[13.5px] font-bold text-white shadow-sm shadow-brand/25 hover:bg-brand-dark"
        >
          <MessageCircle size={16} /> Chat con {c.nombre.split(" ")[0]}
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">{c.canal === "whatsapp" ? "WhatsApp" : c.canal === "instagram" ? "Instagram" : "Facebook"}</span>
        </button>

        <div className="mt-4 grid grid-cols-6 gap-1">
          {rapidas.map(({ label, Icon, onClick, href }) => {
            const contenido = (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-[var(--text-2)] transition group-hover:border-brand group-hover:text-brand">
                  <Icon size={16} />
                </span>
                <span className="text-[11px] font-medium text-[var(--text-2)]">{label}</span>
              </>
            );
            return href ? (
              <a key={label} href={href} className="group flex flex-col items-center gap-1">{contenido}</a>
            ) : (
              <button key={label} type="button" onClick={onClick} className="group flex flex-col items-center gap-1">{contenido}</button>
            );
          })}
        </div>
      </section>

      <ResumenCliente c={c} visitas={visitas} />

    </>
  );
}

/** Resumen del cliente en pocas líneas, armado con su historial. */
function ResumenCliente({ c, visitas }: { c: Cliente; visitas: Visita[] }) {
  const { recetas, resumenes } = useStore();
  const [abierto, setAbierto] = useState(true);
  const orden = [...visitas].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  const primera = orden[orden.length - 1];
  const ultima = orden[0];
  const conResumen = orden.find((v) => resumenes[v.id]);
  const proxima = CITAS.filter((x) => x.clienteId === c.id && x.dia >= 0 && !["completada", "cancelada", "reagendada"].includes(x.estado)).sort(
    (a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora),
  )[0];
  const enCurso = recetas.filter((r) => r.clienteId === c.id && recetaEnCurso(r));
  const nClinica = visitas.filter((v) => v.agenda === "clinica").length;
  const nGrooming = visitas.filter((v) => v.agenda === "grooming").length;

  const puntos: ReactNode[] = [
    primera ? <>Cliente desde <b>{mesLegible(primera.fecha).toLowerCase()}</b>.</> : <>Cliente nuevo, todavía sin visitas.</>,
    nClinica + nGrooming > 0 && (
      <>
        <b>{nClinica}</b> {nClinica === 1 ? "visita" : "visitas"} a clínica y <b>{nGrooming}</b> a grooming.
      </>
    ),
    ultima && (
      <>
        Última visita: <b>{fechaLegible(ultima.fecha)}</b>, {ultima.servicio.toLowerCase()} de {ultima.mascota}.
      </>
    ),
    conResumen && (
      <>
        Último diagnóstico ({conResumen.mascota}): <b>{resumenes[conResumen.id].diagnostico}</b>.
      </>
    ),
    enCurso.length > 0 && (
      <>
        En tratamiento: <b>{[...new Set(enCurso.flatMap((r) => r.items.map((i) => i.medicamento.split(" (")[0])))].join(", ")}</b>.
      </>
    ),
    proxima ? (
      <>
        Próxima cita: <b>{etiquetaDia(proxima.dia).toLowerCase()} {proxima.hora}</b>, {proxima.servicio.toLowerCase()} ({AGENDA_INFO[proxima.agenda].label.toLowerCase()}).
      </>
    ) : (
      <>Sin citas próximas.</>
    ),
  ].filter(Boolean);

  return (
    <section className="rounded-2xl border border-line bg-card shadow-sm">
      <button type="button" onClick={() => setAbierto((a) => !a)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <ChevronDown size={16} className={cn("transition", !abierto && "-rotate-90")} />
        <span className="text-[14px] font-bold">Resumen del cliente</span>
      </button>
      {abierto && (
        <ul className="space-y-1.5 border-t border-line px-4 py-3 text-[13px] leading-snug text-[var(--text-2)]">
          {puntos.map((p, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Copiable({ valor, href }: { valor: string; href: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <p className="flex items-center gap-1.5">
      <a href={href} className="min-w-0 truncate font-semibold text-brand hover:underline">{valor}</a>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(valor).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1200);
          }).catch(() => {});
        }}
        title="Copiar"
        aria-label={`Copiar ${valor}`}
        className="shrink-0 rounded p-0.5 text-[var(--text-3)] hover:bg-surface"
      >
        <Copy size={13} />
      </button>
      {copiado && <span className="text-[11px] font-semibold text-emerald-700">Copiado</span>}
    </p>
  );
}

/* ---------- Columna central ---------- */

type Tab = "overview" | "tratamientos" | "actividad";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tratamientos", label: "Tratamientos" },
  { id: "actividad", label: "Actividad" },
];

function Centro({ c, tab, setTab, visitas, acciones }: { c: Cliente; tab: Tab; setTab: (t: Tab) => void; visitas: Visita[]; acciones: Acciones }) {
  return (
    <section className="rounded-2xl border border-line bg-card shadow-sm">
      <div className="grid grid-cols-3 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-2 py-3 text-[13px] font-semibold transition first:rounded-tl-2xl last:rounded-tr-2xl sm:px-3 sm:text-[14px]",
              tab === t.id ? "border-brand bg-card text-[var(--text)]" : "border-transparent bg-surface/60 text-[var(--text-3)] hover:text-[var(--text)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === "overview" && <TabOverview c={c} visitas={visitas} acciones={acciones} irA={setTab} />}
        {tab === "tratamientos" && <TabTratamientos c={c} nueva={acciones.receta} />}
        {tab === "actividad" && <TabActividad c={c} visitas={visitas} acciones={acciones} />}
      </div>
    </section>
  );
}

/* Overview */

function TabOverview({ c, visitas, acciones, irA }: { c: Cliente; visitas: Visita[]; acciones: Acciones; irA: (t: Tab) => void }) {
  const { recetas, notas } = useStore();
  const enCurso = recetas.filter((r) => r.clienteId === c.id && recetaEnCurso(r));
  const susNotas = notas.filter((n) => n.clienteId === c.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra Icon={Stethoscope} valor={visitas.filter((v) => v.agenda === "clinica").length} label="Visitas a clínica" color="var(--clinica)" />
        <Cifra Icon={Scissors} valor={visitas.filter((v) => v.agenda === "grooming").length} label="Visitas a grooming" color="var(--grooming)" />
        <Cifra Icon={Pill} valor={enCurso.length} label="Tratamientos en curso" color="var(--brand-blue)" onClick={() => irA("tratamientos")} />
        <Cifra Icon={NotebookPen} valor={susNotas.length} label="Notas" color="var(--text-2)" onClick={() => irA("actividad")} />
      </div>

      <UltimasVisitas c={c} visitas={visitas} acciones={acciones} />

      {enCurso.length > 0 && (
        <div className="rounded-xl border border-line p-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold">Tratamientos en curso</p>
            <button type="button" onClick={() => irA("tratamientos")} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
              Ver tratamientos <ChevronRight size={14} />
            </button>
          </div>
          <ul className="mt-2 space-y-1.5 text-[13px]">
            {enCurso.flatMap((r) =>
              r.items.map((i) => (
                <li key={r.id + i.medicamento} className="flex flex-wrap items-center gap-x-2">
                  <Pill size={13} className="text-[var(--text-3)]" />
                  <b>{i.medicamento}</b>
                  <span className="text-[var(--text-2)]">· {r.mascota} · {i.frecuencia} · {i.duracion}</span>
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-line p-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold">Notas recientes</p>
          <button type="button" onClick={acciones.nota} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand">
            <Plus size={14} /> Agregar
          </button>
        </div>
        {susNotas.length === 0 && <p className="mt-2 text-[13px] text-[var(--text-3)]">Sin notas.</p>}
        <div className="mt-2 space-y-2">
          {susNotas.slice(0, 3).map((n) => (
            <div key={n.id} className="rounded-lg bg-surface px-3 py-2 text-[13px]">
              <p>{n.texto}</p>
              <p className="mt-1 text-[11.5px] text-[var(--text-3)]">{n.autor} · {fechaLegible(n.fecha)} {n.hora}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cifra({ Icon, valor, label, color, onClick }: { Icon: typeof Mail; valor: number; label: string; color: string; onClick?: () => void }) {
  const cuerpo = (
    <>
      <Icon size={16} style={{ color }} />
      <p className="mt-2 text-[22px] font-extrabold leading-none">{valor}</p>
      <p className="mt-1 text-[12px] text-[var(--text-3)]">{label}</p>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="rounded-xl border border-line p-3 text-left transition hover:border-brand/50 hover:bg-surface">{cuerpo}</button>
  ) : (
    <div className="rounded-xl border border-line p-3">{cuerpo}</div>
  );
}

/* Tratamientos */

const ESTADO_RX: Record<Receta["estado"], { label: string; className: string }> = {
  enviada: { label: "Enviada", className: "bg-slate-100 text-slate-700" },
  leida: { label: "Leída por el cliente", className: "bg-sky-50 text-sky-700" },
  duda: { label: "Cliente con duda", className: "bg-rose-50 text-rose-700" },
};

function TabTratamientos({ c, nueva }: { c: Cliente; nueva: () => void }) {
  const { recetas, visitas, resumenes } = useStore();
  const [estado, setEstado] = useState<"todos" | "curso" | "fin">("todos");
  const [mascota, setMascota] = useState("todas");
  const suyas = recetas
    .filter((r) => r.clienteId === c.id)
    .map((r) => ({ r, fecha: isoDeTexto(r.fecha), curso: recetaEnCurso(r) }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const lista = suyas.filter((x) => (estado === "todos" || (estado === "curso") === x.curso) && (mascota === "todas" || x.r.mascota === mascota));

  // Diagnóstico de la consulta del mismo día, si el veterinario la resumió.
  const diagnostico = (m: string, fecha: string) => {
    const v = visitas.find((x) => x.clienteId === c.id && x.agenda === "clinica" && x.mascota === m && x.fecha === fecha && resumenes[x.id]);
    return v ? resumenes[v.id].diagnostico : undefined;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold">Tratamientos</p>
          <p className="text-[12.5px] text-[var(--text-3)]">Recetas que el veterinario le ha dado a {c.mascotas.length === 1 ? c.mascotas[0].nombre : "sus mascotas"}.</p>
        </div>
        <button type="button" onClick={nueva} className="inline-flex items-center gap-1 rounded-lg bg-[var(--clinica)] px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90">
          <Plus size={14} /> Nueva receta
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(
          [
            ["todos", "Todos"],
            ["curso", "En curso"],
            ["fin", "Finalizados"],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} on={estado === id} onClick={() => setEstado(id)}>
            {label} <span className="opacity-60">{id === "todos" ? suyas.length : suyas.filter((x) => (id === "curso") === x.curso).length}</span>
          </Chip>
        ))}
        {c.mascotas.length > 1 &&
          ["todas", ...c.mascotas.map((m) => m.nombre)].map((m) => (
            <Chip key={m} on={mascota === m} onClick={() => setMascota(m)}>
              {m === "todas" ? "Todas las mascotas" : m}
            </Chip>
          ))}
      </div>

      {lista.length === 0 && (
        <div className="py-10 text-center text-[13px] text-[var(--text-3)]">
          <Pill size={26} className="mx-auto mb-2 opacity-50" />
          {suyas.length === 0 ? "Este paciente todavía no tiene recetas." : "Sin tratamientos con este filtro."}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {lista.map(({ r, fecha, curso }) => {
          const dx = diagnostico(r.mascota, fecha);
          return (
            <div key={r.id} className="rounded-xl border border-line p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[13.5px] font-bold">
                  <FileText size={15} className="text-[var(--clinica)]" /> {r.mascota}
                  <span className="font-normal text-[var(--text-3)]">
                    · {fechaLegible(fecha)}
                    {esHora(r.hora) ? ` · ${r.hora}` : ""}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", curso ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                    {curso ? "En curso" : "Finalizado"}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", ESTADO_RX[r.estado].className)}>
                    {r.estado === "enviada" ? `Enviada por ${r.canal === "correo" ? "correo" : "WhatsApp"}` : ESTADO_RX[r.estado].label}
                  </span>
                  <button
                    type="button"
                    onClick={() => descargarReceta(r)}
                    title={`Descargar ${nombreArchivo(r)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-[var(--text-2)] hover:bg-surface"
                  >
                    <Download size={11} /> PDF
                  </button>
                </div>
              </div>
              {dx && (
                <p className="mt-1.5 text-[12.5px] text-[var(--text-2)]">
                  <b>Diagnóstico de la consulta:</b> {dx}
                </p>
              )}
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-[12.5px]">
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
                      <tr key={i.medicamento} className="border-t border-line">
                        <td className="py-1.5 pr-2 font-semibold">{i.medicamento}</td>
                        <td className="py-1.5 pr-2">{i.dosis}</td>
                        <td className="py-1.5 pr-2">{i.frecuencia}</td>
                        <td className="py-1.5">{i.duracion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {r.indicaciones && (
                <p className="mt-2 rounded-lg bg-surface px-2.5 py-1.5 text-[12.5px] text-[var(--text-2)]">
                  <b>Indicaciones:</b> {r.indicaciones}
                </p>
              )}
              <p className="mt-1.5 text-[11px] text-[var(--text-3)]">Escrita por {STAFF.veterinario.nombre}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-full border px-3 py-1 text-[12.5px] font-semibold", on ? "border-[var(--text)] bg-[var(--text)] text-white" : "border-line text-[var(--text-2)] hover:bg-surface")}
    >
      {children}
    </button>
  );
}

/* Actividad */

type TipoAct = "visita" | "receta" | "conversacion" | "nota";
interface Actividad {
  id: string;
  tipo: TipoAct;
  fecha: string;
  hora: string;
  mascota?: string;
  conResumen?: boolean;
  texto: string;
  nodo: ReactNode;
}

const FILTROS: { id: "todas" | TipoAct | "resumen"; label: string }[] = [
  { id: "todas", label: "Toda la actividad" },
  { id: "visita", label: "Visitas" },
  { id: "resumen", label: "Resúmenes" },
  { id: "receta", label: "Recetas" },
  { id: "conversacion", label: "Conversaciones" },
  { id: "nota", label: "Notas" },
];

const esHora = (h: string) => /^\d{2}:\d{2}$/.test(h);

function TabActividad({ c, visitas, acciones }: { c: Cliente; visitas: Visita[]; acciones: Acciones }) {
  const { recetas, resumenes, notas, conversaciones } = useStore();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todas");
  const [q, setQ] = useState("");
  const [mascota, setMascota] = useState("todas");
  const [contraido, setContraido] = useState<Set<string>>(new Set());
  const [todoContraido, setTodoContraido] = useState(false);

  const todas: Actividad[] = useMemo(() => {
    const out: Actividad[] = [];
    for (const v of visitas) {
      const r = resumenes[v.id];
      out.push({
        id: v.id,
        tipo: "visita",
        fecha: v.fecha,
        hora: v.hora,
        mascota: v.mascota,
        conResumen: !!r,
        texto: [v.servicio, v.mascota, v.atendio, r?.motivo, r?.diagnostico, r?.tratamiento].join(" "),
        nodo: <VisitaDetalle v={v} acciones={acciones} />,
      });
    }
    for (const rx of recetas.filter((r) => r.clienteId === c.id)) {
      out.push({
        id: rx.id,
        tipo: "receta",
        fecha: isoDeTexto(rx.fecha),
        hora: esHora(rx.hora) ? rx.hora : "",
        mascota: rx.mascota,
        texto: [rx.mascota, rx.indicaciones, ...rx.items.map((i) => i.medicamento)].join(" "),
        nodo: <RecetaDetalle r={rx} />,
      });
    }
    for (const cv of conversaciones.filter((x) => x.clienteId === c.id)) {
      out.push({
        id: cv.id,
        tipo: "conversacion",
        fecha: isoDeTexto("Hoy"),
        hora: cv.hora,
        texto: cv.mensajes.map((m) => m.texto).join(" "),
        nodo: <ConversacionDetalle cv={cv} abrir={acciones.abrirConversacion} />,
      });
    }
    for (const n of notas.filter((x) => x.clienteId === c.id)) {
      out.push({ id: n.id, tipo: "nota", fecha: n.fecha, hora: n.hora, texto: n.texto, nodo: <NotaDetalle n={n} /> });
    }
    return out.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  }, [visitas, recetas, conversaciones, notas, resumenes, c.id, acciones]);

  const t = q.trim().toLowerCase();
  const lista = todas.filter(
    (a) =>
      (filtro === "todas" || (filtro === "resumen" ? a.conResumen : a.tipo === filtro)) &&
      (mascota === "todas" || !a.mascota || a.mascota === mascota) &&
      (!t || a.texto.toLowerCase().includes(t)),
  );
  const porMes = lista.reduce<{ mes: string; items: Actividad[] }[]>((acc, a) => {
    const mes = mesLegible(a.fecha);
    const ultimo = acc[acc.length - 1];
    if (ultimo?.mes === mes) ultimo.items.push(a);
    else acc.push({ mes, items: [a] });
    return acc;
  }, []);

  const abierta = (id: string) => (todoContraido ? contraido.has(id) : !contraido.has(id));
  const alternar = (id: string) =>
    setContraido((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-line">
        {FILTROS.map((f) => {
          const n = f.id === "todas" ? todas.length : todas.filter((a) => (f.id === "resumen" ? a.conResumen : a.tipo === f.id)).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2 text-[13px] font-semibold",
                filtro === f.id ? "border-[var(--text)] text-[var(--text)]" : "border-transparent text-[var(--text-3)] hover:text-[var(--text)]",
              )}
            >
              {f.label} <span className="text-[11.5px] opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded-full border border-line px-3 py-1.5">
          <Search size={14} className="text-[var(--text-3)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar en la actividad" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
        </div>
        {c.mascotas.length > 1 && (
          <select value={mascota} onChange={(e) => setMascota(e.target.value)} className="rounded-lg border border-line bg-card px-2.5 py-1.5 text-[13px] font-semibold">
            <option value="todas">Todas las mascotas</option>
            {c.mascotas.map((m) => <option key={m.nombre} value={m.nombre}>{m.nombre}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={() => {
            setTodoContraido((x) => !x);
            setContraido(new Set());
          }}
          className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[var(--text-2)] hover:bg-surface"
        >
          {todoContraido ? "Expandir todo" : "Contraer todo"}
        </button>
      </div>

      {porMes.length === 0 && <p className="py-10 text-center text-[13px] text-[var(--text-3)]">Sin actividad con este filtro.</p>}
      {porMes.map((g) => (
        <div key={g.mes}>
          <p className="mt-5 mb-2 text-[14px] font-bold">{g.mes}</p>
          <div className="space-y-2.5">
            {g.items.map((a) => (
              <ActividadCard key={a.id} a={a} abierta={abierta(a.id)} alternar={() => alternar(a.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const TIPO: Record<TipoAct, { label: string; Icon: typeof Mail }> = {
  visita: { label: "Visita", Icon: PawPrint },
  receta: { label: "Receta", Icon: FileText },
  conversacion: { label: "Conversación", Icon: MessageCircle },
  nota: { label: "Nota", Icon: NotebookPen },
};

function ActividadCard({ a, abierta, alternar }: { a: Actividad; abierta: boolean; alternar: () => void }) {
  const { label, Icon } = TIPO[a.tipo];
  return (
    <div className="rounded-xl border border-line bg-card shadow-sm">
      <button type="button" onClick={alternar} aria-expanded={abierta} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
        <ChevronRight size={15} className={cn("shrink-0 text-[var(--text-3)] transition", abierta && "rotate-90")} />
        <Icon size={15} className="shrink-0 text-[var(--text-2)]" />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">
          {label}
          {a.mascota && <span className="font-normal text-[var(--text-2)]"> · {a.mascota}</span>}
        </span>
        <span className="shrink-0 text-[12px] text-[var(--text-3)]">
          {fechaLegible(a.fecha)}{a.hora && ` · ${a.hora}`}
        </span>
      </button>
      {abierta && <div className="border-t border-line px-3.5 py-3">{a.nodo}</div>}
    </div>
  );
}

function VisitaDetalle({ v, acciones }: { v: Visita; acciones: Acciones }) {
  const { resumenes } = useStore();
  const r = resumenes[v.id];
  return (
    <div className="text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <AgendaPill agenda={v.agenda} />
        <span className="font-semibold">{v.servicio}</span>
        <span className="text-[var(--text-3)]">· atendió {v.atendio}</span>
      </div>
      {v.agenda === "clinica" &&
        (r ? (
          <>
            <ResumenBloque r={r} className="mt-3" />
            <button type="button" onClick={() => acciones.resumir(v)} className="mt-2 text-[12px] font-semibold text-brand hover:underline">
              Editar resumen
            </button>
          </>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-[var(--clinica)]/50 bg-[var(--clinica-soft)] px-3 py-2">
            <span className="text-[12.5px] text-[var(--clinica)]">Esta consulta todavía no tiene resumen.</span>
            <button type="button" onClick={() => acciones.resumir(v)} className="inline-flex items-center gap-1 rounded-lg bg-[var(--clinica)] px-2.5 py-1 text-[12px] font-bold text-white">
              <ClipboardPen size={13} /> Resumir consulta
            </button>
          </div>
        ))}
    </div>
  );
}

function RecetaDetalle({ r }: { r: Receta }) {
  return (
    <div className="text-[12.5px]">
      <ul className="space-y-1">
        {r.items.map((i) => (
          <li key={i.medicamento}>
            <b>{i.medicamento}</b> <span className="text-[var(--text-2)]">· {i.dosis} · {i.frecuencia} · {i.duracion}</span>
          </li>
        ))}
      </ul>
      {r.indicaciones && <p className="mt-2 rounded-lg bg-surface px-2 py-1 text-[var(--text-2)]"><b>Indicaciones:</b> {r.indicaciones}</p>}
    </div>
  );
}

function ConversacionDetalle({ cv, abrir }: { cv: Conversacion; abrir: () => void }) {
  const ultimos = cv.mensajes.filter((m) => m.autor !== "sistema").slice(-2);
  return (
    <div className="text-[13px]">
      <div className="flex items-center gap-2">
        <ChannelBadge canal={cv.canal} label />
        {cv.agenda && <AgendaPill agenda={cv.agenda} />}
      </div>
      <div className="mt-2 space-y-1.5">
        {ultimos.map((m) => (
          <p key={m.id} className="text-[var(--text-2)]">
            <b className="text-[var(--text)]">{m.autor === "cliente" ? "Cliente" : m.autor === "ia" ? "Luna" : "Clínica"}:</b> {m.texto}
          </p>
        ))}
      </div>
      <button type="button" onClick={abrir} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
        Abrir en la bandeja <ChevronRight size={14} />
      </button>
    </div>
  );
}

function NotaDetalle({ n }: { n: Nota }) {
  return (
    <div className="text-[13px]">
      <p>{n.texto}</p>
      <p className="mt-1 text-[11.5px] text-[var(--text-3)]">Escrita por {n.autor}</p>
    </div>
  );
}

/* Últimas visitas (Overview) */

function UltimasVisitas({ c, visitas, acciones }: { c: Cliente; visitas: Visita[]; acciones: Acciones }) {
  const { resumenes } = useStore();
  const [agenda, setAgenda] = useState<"todas" | Agenda>("todas");
  const [mascota, setMascota] = useState("todas");
  const [todas, setTodas] = useState(false);
  const recientes = (vs: Visita[]) => [...vs].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  const orden = recientes(visitas.filter((v) => (agenda === "todas" || v.agenda === agenda) && (mascota === "todas" || v.mascota === mascota)));
  // La consulta resumida más reciente abre desplegada.
  const [abierta, setAbierta] = useState<string | null>(() => recientes(visitas.filter((v) => resumenes[v.id]))[0]?.id ?? null);
  const lista = todas ? orden : orden.slice(0, 5);

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-bold">Historial · últimas visitas</p>
          <p className="text-[12.5px] text-[var(--text-3)]">Las consultas incluyen el resumen del veterinario (uso interno).</p>
        </div>
        <button type="button" onClick={() => acciones.resumir()} className="inline-flex items-center gap-1 rounded-lg bg-[var(--clinica)] px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90">
          <ClipboardPen size={14} /> Resumir consulta
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(["todas", "clinica", "grooming"] as const).map((a) => (
          <Chip key={a} on={agenda === a} onClick={() => setAgenda(a)}>
            {a === "todas" ? "Todas" : a === "clinica" ? "Clínica" : "Grooming"}
          </Chip>
        ))}
        {c.mascotas.length > 1 &&
          ["todas", ...c.mascotas.map((m) => m.nombre)].map((m) => (
            <Chip key={m} on={mascota === m} onClick={() => setMascota(m)}>
              {m === "todas" ? "Todas las mascotas" : m}
            </Chip>
          ))}
      </div>

      {orden.length === 0 && <p className="py-8 text-center text-[13px] text-[var(--text-3)]">Sin visitas registradas.</p>}
      <ol className="relative mt-4 space-y-3 border-l-2 border-line pl-5">
        {lista.map((v) => {
          const r = resumenes[v.id];
          const ver = abierta === v.id;
          return (
            <li key={v.id} className="relative">
              <span className="absolute -left-[27px] top-3.5 h-3 w-3 rounded-full border-2 border-card" style={{ backgroundColor: AGENDA_INFO[v.agenda].color }} />
              <div className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] font-bold">
                      <AgendaPill agenda={v.agenda} />
                      {fechaLegible(v.fecha)} · {v.hora}
                      <span className="font-normal text-[var(--text-2)]">
                        · {v.mascota} · {v.servicio}
                      </span>
                    </p>
                    {v.agenda === "grooming" ? (
                      <p className="mt-1 text-[12.5px] text-[var(--text-3)]">Atendió {v.atendio}</p>
                    ) : r ? (
                      <p className="mt-1 text-[12.5px] text-[var(--text-2)]">
                        <b>Diagnóstico:</b> {r.diagnostico} · <b>Control:</b> {r.proximoControl}
                      </p>
                    ) : (
                      <p className="mt-1 text-[12.5px] text-amber-700">Sin resumen de consulta</p>
                    )}
                  </div>
                  {v.agenda === "clinica" &&
                    (r ? (
                      <button type="button" onClick={() => setAbierta(ver ? null : v.id)} className="text-[12.5px] font-semibold text-brand hover:underline">
                        {ver ? "Ocultar" : "Ver resumen"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => acciones.resumir(v)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--clinica)] px-2 py-1 text-[12px] font-semibold text-[var(--clinica)] hover:bg-[var(--clinica-soft)]"
                      >
                        <ClipboardPen size={13} /> Resumir
                      </button>
                    ))}
                </div>
                {ver && r && (
                  <>
                    <ResumenBloque r={r} className="mt-3" />
                    <button type="button" onClick={() => acciones.resumir(v)} className="mt-2 text-[12px] font-semibold text-brand hover:underline">
                      Editar resumen
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {orden.length > 5 && (
        <button type="button" onClick={() => setTodas((x) => !x)} className="mt-3 text-[12.5px] font-semibold text-brand hover:underline">
          {todas ? "Ver menos" : `Ver todas las visitas (${orden.length})`}
        </button>
      )}
    </div>
  );
}

/* ---------- Columna derecha ---------- */

function Lateral({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  const [abierto, setAbierto] = useState(true);
  return (
    <section className="rounded-2xl border border-line bg-card shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <button type="button" onClick={() => setAbierto((a) => !a)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown size={16} className={cn("shrink-0 transition", !abierto && "-rotate-90")} />
          <span className="truncate text-[14px] font-bold">{titulo}</span>
        </button>
        {accion}
      </div>
      {abierto && <div className="border-t border-line p-3">{children}</div>}
    </section>
  );
}

function Mascotas({ c, visitas }: { c: Cliente; visitas: Visita[] }) {
  const ultima = (m: string, a: Agenda) =>
    visitas.filter((v) => v.mascota === m && v.agenda === a).sort((x, y) => y.fecha.localeCompare(x.fecha))[0];
  return (
    <Lateral titulo={`Mascotas (${c.mascotas.length})`}>
      <div className="space-y-2.5">
        {c.mascotas.map((m) => {
          const uc = ultima(m.nombre, "clinica");
          const ug = ultima(m.nombre, "grooming");
          return (
            <div key={m.nombre} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-[var(--text-2)]"><PawPrint size={16} /></span>
                <p className="font-bold">{m.nombre}</p>
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-300/60">{m.especie}</span>
                {m.creadaPorIA && <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-violet-700">Nueva · Luna</span>}
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12.5px]">
                <dt className="text-[var(--text-3)]">Raza</dt><dd className="font-medium">{m.raza}</dd>
                <dt className="text-[var(--text-3)]">Edad</dt><dd className="font-medium">{m.edad}</dd>
                {m.tamano && (<><dt className="text-[var(--text-3)]">Tamaño</dt><dd className="font-medium">{m.tamano}</dd></>)}
                <dt className="text-[var(--text-3)]">Última clínica</dt><dd className="font-medium">{uc ? fechaLegible(uc.fecha) : "—"}</dd>
                <dt className="text-[var(--text-3)]">Último grooming</dt><dd className="font-medium">{ug ? fechaLegible(ug.fecha) : "—"}</dd>
              </dl>
            </div>
          );
        })}
      </div>
    </Lateral>
  );
}

function ProximasCitas({ c, agendar }: { c: Cliente; agendar: (a: Agenda) => void }) {
  const proximas = CITAS.filter((x) => x.clienteId === c.id && x.dia >= 0 && !["completada", "cancelada", "reagendada"].includes(x.estado)).sort(
    (a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora),
  );
  return (
    <Lateral
      titulo={`Próximas citas (${proximas.length})`}
      accion={
        <Menu
          label="Agendar"
          Icon={Plus}
          compacto
          items={[
            { label: "En veterinaria", onClick: () => agendar("clinica") },
            { label: "En grooming", onClick: () => agendar("grooming") },
          ]}
        />
      }
    >
      {proximas.length === 0 ? (
        <div className="py-4 text-center text-[12.5px] text-[var(--text-3)]">
          <CalendarPlus size={26} className="mx-auto mb-2 opacity-50" />
          No tiene citas próximas.
        </div>
      ) : (
        <div className="space-y-2">
          {proximas.map((x) => (
            <div key={x.id} className="rounded-xl border border-line p-2.5 text-[12.5px]">
              <div className="flex items-center justify-between gap-2">
                <AgendaPill agenda={x.agenda} />
                <EstadoCitaPill estado={x.estado} />
              </div>
              <p className="mt-1.5 font-semibold">{x.servicio} · {x.mascota}</p>
              <p className="text-[var(--text-3)]">{etiquetaDia(x.dia)} · {x.hora}</p>
            </div>
          ))}
        </div>
      )}
    </Lateral>
  );
}

function ConversacionCard({ conv, abrir }: { conv?: Conversacion; abrir: () => void }) {
  const ultimo = conv && [...conv.mensajes].reverse().find((m) => m.autor !== "sistema");
  return (
    <Lateral titulo="Conversación">
      {conv && ultimo ? (
        <div className="text-[12.5px]">
          <div className="flex items-center justify-between">
            <ChannelBadge canal={conv.canal} label />
            <span className="text-[var(--text-3)]">Hoy {conv.hora}</span>
          </div>
          <p className="mt-2 line-clamp-3 text-[var(--text-2)]">{ultimo.texto}</p>
        </div>
      ) : (
        <p className="text-[12.5px] text-[var(--text-3)]">Sin conversación reciente.</p>
      )}
      <button type="button" onClick={abrir} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[13px] font-bold text-white hover:bg-brand-dark">
        <MessageCircle size={15} /> {conv ? "Abrir conversación" : "Iniciar conversación"}
      </button>
    </Lateral>
  );
}
