"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  NotebookPen,
  PawPrint,
  Phone,
  Plus,
  Scissors,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, etiquetaDia, fechaLegible, isoDeTexto, mesLegible } from "@/lib/format";
import { CITAS, CLIENTES } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Agenda, Cliente, Conversacion, Nota, Receta, Visita } from "@/lib/types";
import { AgendaPill, Avatar, ChannelBadge, EstadoCitaPill } from "@/components/ui";
import { Menu, NotaModal, ResumenBloque, ResumenModal } from "@/components/ResumenConsulta";

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

type Modal = { tipo: "resumen"; visita?: Visita } | { tipo: "nota" } | null;

function Ficha({ c }: { c: Cliente }) {
  const router = useRouter();
  const { conversacionDe, setConvSel, setCalendario, visitas, conversaciones } = useStore();
  const [modal, setModal] = useState<Modal>(null);
  const [tab, setTab] = useState<"resumen" | "actividad" | "historial">("actividad");

  const suyas = useMemo(() => visitas.filter((v) => v.clienteId === c.id), [visitas, c.id]);
  const conv = conversaciones.find((x) => x.clienteId === c.id);

  const abrirConversacion = () => {
    setConvSel(conversacionDe(c.id));
    router.push("/");
  };
  const agendar = (a: Agenda) => {
    setCalendario(a);
    router.push("/agendas");
  };
  const acciones = { abrirConversacion, agendar, resumir: (v?: Visita) => setModal({ tipo: "resumen", visita: v }), nota: () => setModal({ tipo: "nota" }) };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3 outline-none sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)] 2xl:grid-cols-[290px_minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Contacto c={c} conv={conv} visitas={suyas} acciones={acciones} />
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

      {modal?.tipo === "resumen" && <ResumenModal c={c} visita={modal.visita} onClose={() => setModal(null)} />}
      {modal?.tipo === "nota" && <NotaModal c={c} onClose={() => setModal(null)} />}
    </div>
  );
}

interface Acciones {
  abrirConversacion: () => void;
  agendar: (a: Agenda) => void;
  resumir: (v?: Visita) => void;
  nota: () => void;
}

/* ---------- Columna izquierda: dueño ---------- */

function Contacto({ c, conv, visitas, acciones }: { c: Cliente; conv?: Conversacion; visitas: Visita[]; acciones: Acciones }) {
  const [abierto, setAbierto] = useState(true);
  const ultimaVisita = [...visitas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  const rapidas: { label: string; Icon: typeof Mail; onClick?: () => void; href?: string }[] = [
    { label: "Nota", Icon: NotebookPen, onClick: acciones.nota },
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
              { label: "Escribir receta", href: "/receta" },
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

      <section className="rounded-2xl border border-line bg-card shadow-sm">
        <button type="button" onClick={() => setAbierto((a) => !a)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
          <ChevronDown size={16} className={cn("transition", !abierto && "-rotate-90")} />
          <span className="text-[14px] font-bold">Acerca del dueño</span>
        </button>
        {abierto && (
          <dl className="space-y-3 border-t border-line px-4 py-3 text-[13px]">
            <Dato label="Correo">{c.correo}</Dato>
            <Dato label="Teléfono">{c.telefono}</Dato>
            <Dato label="Canal preferido"><ChannelBadge canal={c.canal} label /></Dato>
            <Dato label="Último contacto">{conv ? `Hoy ${conv.hora}` : "—"}</Dato>
            <Dato label="Última visita">{ultimaVisita ? `${fechaLegible(ultimaVisita.fecha)} · ${AGENDA_INFO[ultimaVisita.agenda].label}` : "Sin visitas"}</Dato>
            <Dato label="Origen">
              {c.creadoPorIA ? (
                <span className="inline-flex items-center gap-1 font-semibold text-violet-700"><Sparkles size={12} /> Creado por Luna</span>
              ) : (
                "Base de la clínica"
              )}
            </Dato>
            <Dato label="Mensajes de promociones">{c.optOutMarketing ? "No desea recibir" : "Acepta"}</Dato>
            {c.etiquetas?.length ? (
              <Dato label="Etiquetas">
                <span className="flex flex-wrap gap-1">
                  {c.etiquetas.map((e) => <span key={e} className="rounded-md bg-surface px-1.5 py-0.5 text-[11.5px] font-semibold">{e}</span>)}
                </span>
              </Dato>
            ) : null}
          </dl>
        )}
      </section>
    </>
  );
}

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] text-[var(--text-3)]">{label}</dt>
      <dd className="mt-0.5 break-words font-medium">{children}</dd>
    </div>
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

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "actividad", label: "Actividad" },
  { id: "historial", label: "Historial clínico" },
] as const;

function Centro({
  c,
  tab,
  setTab,
  visitas,
  acciones,
}: {
  c: Cliente;
  tab: "resumen" | "actividad" | "historial";
  setTab: (t: "resumen" | "actividad" | "historial") => void;
  visitas: Visita[];
  acciones: Acciones;
}) {
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
        {tab === "resumen" && <TabResumen c={c} visitas={visitas} acciones={acciones} irA={setTab} />}
        {tab === "actividad" && <TabActividad c={c} visitas={visitas} acciones={acciones} />}
        {tab === "historial" && <TabHistorial c={c} visitas={visitas} acciones={acciones} />}
      </div>
    </section>
  );
}

/* Resumen */

function TabResumen({ c, visitas, acciones, irA }: { c: Cliente; visitas: Visita[]; acciones: Acciones; irA: (t: "actividad" | "historial") => void }) {
  const { recetas, resumenes, notas } = useStore();
  const clinica = visitas.filter((v) => v.agenda === "clinica").sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  const grooming = visitas.filter((v) => v.agenda === "grooming");
  const ultimaConResumen = clinica.find((v) => resumenes[v.id]);
  const susNotas = notas.filter((n) => n.clienteId === c.id);
  const susRecetas = recetas.filter((r) => r.clienteId === c.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra Icon={Stethoscope} valor={clinica.length} label="Visitas a clínica" color="var(--clinica)" />
        <Cifra Icon={Scissors} valor={grooming.length} label="Visitas a grooming" color="var(--grooming)" />
        <Cifra Icon={FileText} valor={susRecetas.length} label="Recetas" color="var(--brand-blue)" />
        <Cifra Icon={NotebookPen} valor={susNotas.length} label="Notas" color="var(--text-2)" />
      </div>

      <div className="rounded-xl border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] font-bold">Último resumen de consulta</p>
          <button type="button" onClick={() => acciones.resumir()} className="inline-flex items-center gap-1 rounded-lg bg-[var(--clinica)] px-2.5 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90">
            <ClipboardPen size={14} /> Resumir consulta
          </button>
        </div>
        {ultimaConResumen ? (
          <>
            <p className="mt-1 text-[12.5px] text-[var(--text-3)]">
              {ultimaConResumen.mascota} · {ultimaConResumen.servicio} · {fechaLegible(ultimaConResumen.fecha)}
            </p>
            <ResumenBloque r={resumenes[ultimaConResumen.id]} className="mt-3" />
          </>
        ) : (
          <p className="mt-2 text-[13px] text-[var(--text-3)]">Todavía no hay consultas resumidas.</p>
        )}
        <button type="button" onClick={() => irA("historial")} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
          Ver historial clínico completo <ChevronRight size={14} />
        </button>
      </div>

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
        <button type="button" onClick={() => irA("actividad")} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
          Ver toda la actividad <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function Cifra({ Icon, valor, label, color }: { Icon: typeof Mail; valor: number; label: string; color: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <Icon size={16} style={{ color }} />
      <p className="mt-2 text-[22px] font-extrabold leading-none">{valor}</p>
      <p className="mt-1 text-[12px] text-[var(--text-3)]">{label}</p>
    </div>
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

/* Historial clínico */

function TabHistorial({ c, visitas, acciones }: { c: Cliente; visitas: Visita[]; acciones: Acciones }) {
  const { resumenes } = useStore();
  const [mascota, setMascota] = useState("todas");
  const [abierta, setAbierta] = useState<string | null>(null);
  const clinica = visitas
    .filter((v) => v.agenda === "clinica" && (mascota === "todas" || v.mascota === mascota))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold">Visitas a clínica</p>
          <p className="text-[12.5px] text-[var(--text-3)]">Cada consulta con el resumen del veterinario. Solo uso interno.</p>
        </div>
        <button type="button" onClick={() => acciones.resumir()} className="inline-flex items-center gap-1 rounded-lg bg-[var(--clinica)] px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90">
          <ClipboardPen size={14} /> Resumir consulta
        </button>
      </div>

      {c.mascotas.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["todas", ...c.mascotas.map((m) => m.nombre)].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMascota(m)}
              className={cn("rounded-full border px-3 py-1 text-[12.5px] font-semibold", mascota === m ? "border-[var(--clinica)] bg-[var(--clinica)] text-white" : "border-line text-[var(--text-2)] hover:bg-surface")}
            >
              {m === "todas" ? "Todas las mascotas" : m}
            </button>
          ))}
        </div>
      )}

      {clinica.length === 0 && <p className="py-10 text-center text-[13px] text-[var(--text-3)]">Sin visitas a clínica registradas.</p>}
      <ol className="relative mt-4 space-y-3 border-l-2 border-[var(--clinica-soft)] pl-5">
        {clinica.map((v) => {
          const r = resumenes[v.id];
          const ver = abierta === v.id;
          return (
            <li key={v.id} className="relative">
              <span className="absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 border-card bg-[var(--clinica)]" />
              <div className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold">
                      {fechaLegible(v.fecha)} · {v.hora} <span className="font-normal text-[var(--text-2)]">· {v.mascota} · {v.servicio}</span>
                    </p>
                    {r ? (
                      <p className="mt-0.5 text-[12.5px] text-[var(--text-2)]">
                        <b>Diagnóstico:</b> {r.diagnostico} · <b>Control:</b> {r.proximoControl}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[12.5px] text-amber-700">Sin resumen de consulta</p>
                    )}
                  </div>
                  {r ? (
                    <button type="button" onClick={() => setAbierta(ver ? null : v.id)} className="text-[12.5px] font-semibold text-brand hover:underline">
                      {ver ? "Ocultar" : "Ver resumen"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => acciones.resumir(v)} className="inline-flex items-center gap-1 rounded-lg border border-[var(--clinica)] px-2 py-1 text-[12px] font-semibold text-[var(--clinica)] hover:bg-[var(--clinica-soft)]">
                      <ClipboardPen size={13} /> Resumir
                    </button>
                  )}
                </div>
                {ver && r && (
                  <>
                    <ResumenBloque r={r} className="mt-3" />
                    <button type="button" onClick={() => acciones.resumir(v)} className="mt-2 text-[12px] font-semibold text-brand hover:underline">Editar resumen</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
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
