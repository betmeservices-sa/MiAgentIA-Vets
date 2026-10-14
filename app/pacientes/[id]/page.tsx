"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarClock,
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
  PawPrint,
  Pill,
  Plus,
  Scissors,
  Sparkles,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, etiquetaDia, fechaLegible, isoDeTexto, recetaEnCurso } from "@/lib/format";
import { CITAS, CLIENTES, nombreMascota, STAFF } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Agenda, Cita, Cliente, Conversacion, Mascota, Receta, Visita } from "@/lib/types";
import { AgendaPill, Avatar, ChannelBadge, EstadoCitaPill } from "@/components/ui";
import { ContactoModal, Menu, NotaModal, RecetaModal, ResumenBloque, ResumenModal } from "@/components/ResumenConsulta";
import { descargarReceta, nombreArchivo } from "@/lib/recetaPdf";

// Ficha del paciente: a la izquierda el dueño (con su menú de acciones) y sus
// mascotas; al centro la mascota elegida (Overview, Tratamientos, Grooming);
// a la derecha las próximas citas y la conversación.

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

type Modal = { tipo: "resumen"; visita?: Visita } | { tipo: "nota" } | { tipo: "receta" } | { tipo: "contacto"; mascota: string } | null;
type Tab = "overview" | "tratamientos" | "grooming";

interface Acciones {
  abrirConversacion: () => void;
  agendar: (a: Agenda, dia?: number) => void;
  resumir: (v?: Visita) => void;
  nota: () => void;
  receta: () => void;
}

function Ficha({ c }: { c: Cliente }) {
  const router = useRouter();
  const { conversacionDe, setConvSel, setCalendario, setDiaCalendario, visitas, conversaciones } = useStore();
  const [modal, setModal] = useState<Modal>(null);
  const [mascota, setMascota] = useState(c.mascotas[0].nombre);
  const [tab, setTab] = useState<Tab>("overview");
  // Aviso al pie: cita agendada desde un resumen o receta enviada.
  const [aviso, setAviso] = useState<{ tipo: "cita"; cita: Cita } | { tipo: "receta"; receta: Receta } | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(t);
  }, [aviso]);

  const suyas = useMemo(() => visitas.filter((v) => v.clienteId === c.id), [visitas, c.id]);
  const m = c.mascotas.find((x) => x.nombre === mascota) ?? c.mascotas[0];
  const deLaMascota = suyas.filter((v) => v.mascota === m.nombre);
  // La conversación del dueño (las de contactos secundarios son de otra persona).
  const conv = conversaciones.find((x) => x.clienteId === c.id && !x.contacto);

  const abrirConversacion = () => {
    setConvSel(conversacionDe(c.id));
    router.push("/");
  };
  const agendar = (a: Agenda, dia = 0) => {
    setCalendario(a);
    setDiaCalendario(dia);
    router.push("/agendas");
  };
  const acciones: Acciones = {
    abrirConversacion,
    agendar,
    resumir: (v?: Visita) => setModal({ tipo: "resumen", visita: v }),
    nota: () => setModal({ tipo: "nota" }),
    receta: () => setModal({ tipo: "receta" }),
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3 outline-none sm:p-4">
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Dueno c={c} acciones={acciones} />
          <Mascotas
            c={c}
            visitas={suyas}
            sel={m.nombre}
            elegir={(n) => {
              setMascota(n);
              setTab("overview");
            }}
            agregar={(n) => setModal({ tipo: "contacto", mascota: n })}
          />
        </div>
        <div className="min-w-0 lg:row-span-2 2xl:row-span-1">
          <Centro c={c} m={m} tab={tab} setTab={setTab} visitas={deLaMascota} acciones={acciones} />
        </div>
        <div className="space-y-4 lg:col-start-1 2xl:col-start-3 2xl:row-start-1">
          <ProximasCitas c={c} />
          <ConversacionCard conv={conv} abrir={abrirConversacion} />
        </div>
      </div>

      {modal?.tipo === "resumen" && (
        <ResumenModal c={c} visita={modal.visita} mascotaInicial={m.nombre} onClose={() => setModal(null)} onAgendada={(cita) => setAviso({ tipo: "cita", cita })} />
      )}
      {modal?.tipo === "nota" && <NotaModal c={c} onClose={() => setModal(null)} />}
      {modal?.tipo === "contacto" && <ContactoModal c={c} mascota={modal.mascota} onClose={() => setModal(null)} />}
      {modal?.tipo === "receta" && (
        <RecetaModal
          c={c}
          mascotaInicial={m.nombre}
          onClose={() => setModal(null)}
          onEnviada={(receta) => {
            setMascota(receta.mascota);
            setTab("tratamientos");
            setAviso({ tipo: "receta", receta });
          }}
        />
      )}
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
    </div>
  );
}

/* ---------- Columna izquierda: dueño y mascotas ---------- */

function Dueno({ c, acciones }: { c: Cliente; acciones: Acciones }) {
  const tel = c.telefono.replace(/\s/g, "");
  return (
    <section className="rounded-2xl border border-line bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Link href="/pacientes" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--text-2)] hover:text-brand">
          <ChevronLeft size={16} /> Pacientes
        </Link>
        <Menu
          label="Acciones"
          items={[
            { label: "Abrir conversación", onClick: acciones.abrirConversacion },
            { label: "Escribir receta", onClick: acciones.receta },
            { label: "Resumir consulta", onClick: () => acciones.resumir() },
            { label: "Agendar en veterinaria", onClick: () => acciones.agendar("clinica") },
            { label: "Agendar en grooming", onClick: () => acciones.agendar("grooming") },
            { label: "Enviar correo", href: `mailto:${c.correo}` },
            { label: "Llamar", href: `tel:${tel}` },
            { label: "Agregar nota", onClick: acciones.nota },
          ]}
        />
      </div>

      <div className="mt-4 flex items-start gap-3">
        <Avatar nombre={c.nombre} size={48} />
        <div className="min-w-0">
          <h1 className="text-[19px] font-extrabold leading-tight tracking-tight">{c.nombre}</h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-3)]">Dueño · {c.mascotas.length === 1 ? "1 mascota" : `${c.mascotas.length} mascotas`}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-[13px]">
        <Copiable valor={c.correo} href={`mailto:${c.correo}`} />
        <Copiable valor={c.telefono} href={`tel:${tel}`} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <ChannelBadge canal={c.canal} label />
        {c.creadoPorIA && (
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11.5px] font-semibold text-violet-700">
            <Sparkles size={11} /> Creado por Luna
          </span>
        )}
        {c.etiquetas?.map((e) => (
          <span key={e} className="rounded-full bg-surface px-2 py-0.5 text-[11.5px] font-semibold text-[var(--text-2)]">{e}</span>
        ))}
      </div>
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
          navigator.clipboard
            ?.writeText(valor)
            .then(() => {
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1200);
            })
            .catch(() => {});
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

/** Mascotas del dueño: al elegir una, el centro muestra su perfil. */
function Mascotas({
  c,
  visitas,
  sel,
  elegir,
  agregar,
}: {
  c: Cliente;
  visitas: Visita[];
  sel: string;
  elegir: (nombre: string) => void;
  agregar: (nombre: string) => void;
}) {
  const { contactosDe } = useStore();
  const ultima = (m: string, a: Agenda) => visitas.filter((v) => v.mascota === m && v.agenda === a).sort((x, y) => y.fecha.localeCompare(x.fecha))[0];

  return (
    <section className="rounded-2xl border border-line bg-card shadow-sm">
      <p className="px-4 pt-3 pb-2 text-[14px] font-bold">Mascotas ({c.mascotas.length})</p>
      <div className="space-y-2 px-3 pb-3">
        {c.mascotas.map((m) => {
          const activa = m.nombre === sel;
          const contactos = contactosDe(c.id, m.nombre);
          const uc = ultima(m.nombre, "clinica");
          const ug = ultima(m.nombre, "grooming");
          return (
            <div key={m.nombre} className={cn("rounded-xl border transition", activa ? "border-brand bg-brand/[0.04] ring-1 ring-brand" : "border-line hover:border-brand/40")}>
              <button type="button" onClick={() => elegir(m.nombre)} aria-pressed={activa} className="flex w-full items-center gap-2.5 p-3 text-left">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", activa ? "bg-brand text-white" : "bg-surface text-[var(--text-2)]")}>
                  <PawPrint size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold">{nombreMascota(m.nombre, c)}</span>
                    {m.creadaPorIA && <span className="rounded bg-violet-50 px-1 text-[10px] font-semibold text-violet-700">Nueva · Luna</span>}
                  </span>
                  <span className="block truncate text-[12px] text-[var(--text-3)]">
                    {m.especie} · {m.raza} · {m.edad}
                  </span>
                </span>
                <ChevronRight size={16} className={cn("shrink-0 text-[var(--text-3)] transition", activa && "rotate-90 text-brand")} />
              </button>

              {activa && (
                <div className="border-t border-line px-3 pb-3 pt-2.5">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12.5px]">
                    {m.tamano && (
                      <>
                        <dt className="text-[var(--text-3)]">Tamaño</dt>
                        <dd className="font-medium">{m.tamano}</dd>
                      </>
                    )}
                    <dt className="text-[var(--text-3)]">Última clínica</dt>
                    <dd className="font-medium">{uc ? fechaLegible(uc.fecha) : "—"}</dd>
                    <dt className="text-[var(--text-3)]">Último grooming</dt>
                    <dd className="font-medium">{ug ? fechaLegible(ug.fecha) : "—"}</dd>
                  </dl>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">Contactos secundarios</p>
                    <button type="button" onClick={() => agregar(m.nombre)} className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand hover:underline">
                      <Plus size={13} /> Agregar
                    </button>
                  </div>
                  {contactos.length === 0 ? (
                    <p className="mt-1 text-[12px] text-[var(--text-3)]">Solo el dueño. Si escribe otra persona por {nombreMascota(m.nombre, c)}, Luna la agrega aquí.</p>
                  ) : (
                    <div className="mt-1.5 space-y-1.5">
                      {contactos.map((k) => (
                        <div key={k.telefono} className="rounded-lg bg-surface px-2.5 py-1.5 text-[12.5px]">
                          <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                            <UserPlus size={13} className="text-[var(--text-3)]" /> {k.nombre}
                            {k.creadoPorIA && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1 text-[10px] font-semibold text-violet-700">
                                <Sparkles size={9} /> Creado por Luna
                              </span>
                            )}
                          </p>
                          <p className="text-[var(--text-2)]">{k.relacion}</p>
                          <p className="text-[var(--text-3)]">
                            {k.telefono}
                            {k.desde ? ` · desde ${k.desde.toLowerCase() === "hoy" ? "hoy" : k.desde}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!activa && contactos.length > 0 && (
                <p className="-mt-1 flex items-center gap-1 px-3 pb-2.5 pl-[60px] text-[11.5px] text-violet-700">
                  <UserPlus size={11} /> {contactos.length} {contactos.length === 1 ? "contacto secundario" : "contactos secundarios"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Columna central: la mascota elegida ---------- */

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tratamientos", label: "Tratamientos" },
  { id: "grooming", label: "Grooming" },
];

function Centro({ c, m, tab, setTab, visitas, acciones }: { c: Cliente; m: Mascota; tab: Tab; setTab: (t: Tab) => void; visitas: Visita[]; acciones: Acciones }) {
  return (
    <section className="rounded-2xl border border-line bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
          <PawPrint size={22} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold leading-tight tracking-tight">{nombreMascota(m.nombre, c)}</h2>
          <p className="text-[12.5px] text-[var(--text-3)]">
            {m.especie} · {m.raza} · {m.edad}
            {m.tamano ? ` · ${m.tamano}` : ""}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-2 py-3 text-[13px] font-semibold transition sm:px-3 sm:text-[14px]",
              tab === t.id ? "border-brand text-[var(--text)]" : "border-transparent bg-surface/60 text-[var(--text-3)] hover:text-[var(--text)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === "overview" && <TabOverview c={c} m={m} visitas={visitas} acciones={acciones} irA={setTab} />}
        {tab === "tratamientos" && <TabTratamientos c={c} m={m} nueva={acciones.receta} />}
        {tab === "grooming" && <TabGrooming c={c} m={m} visitas={visitas} acciones={acciones} />}
      </div>
    </section>
  );
}

const proximasDe = (c: Cliente, mascota: string, agenda?: Agenda) =>
  CITAS.filter((x) => x.clienteId === c.id && x.mascota === mascota && (!agenda || x.agenda === agenda) && x.dia >= 0 && !["completada", "cancelada", "reagendada"].includes(x.estado)).sort(
    (a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora),
  );

/* Overview */

function TabOverview({ c, m, visitas, acciones, irA }: { c: Cliente; m: Mascota; visitas: Visita[]; acciones: Acciones; irA: (t: Tab) => void }) {
  const { recetas, notas } = useStore();
  const enCurso = recetas.filter((r) => r.clienteId === c.id && r.mascota === m.nombre && recetaEnCurso(r));
  const susNotas = notas.filter((n) => n.clienteId === c.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Cifra Icon={Stethoscope} valor={visitas.filter((v) => v.agenda === "clinica").length} label="Visitas a clínica" color="var(--clinica)" />
        <Cifra Icon={Scissors} valor={visitas.filter((v) => v.agenda === "grooming").length} label="Visitas a grooming" color="var(--grooming)" onClick={() => irA("grooming")} />
        <Cifra Icon={Pill} valor={enCurso.length} label="Tratamientos en curso" color="var(--brand-blue)" onClick={() => irA("tratamientos")} />
        <Cifra Icon={CalendarClock} valor={proximasDe(c, m.nombre).length} label="Citas próximas" color="var(--text-2)" />
      </div>

      <Historial
        visitas={visitas.filter((v) => v.agenda === "clinica")}
        titulo="Historial clínico · últimas visitas"
        sub="Cada consulta con el resumen del veterinario (uso interno)."
        accion={
          <button type="button" onClick={() => acciones.resumir()} className="inline-flex items-center gap-1 rounded-lg bg-[var(--clinica)] px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90">
            <ClipboardPen size={14} /> Resumir consulta
          </button>
        }
        acciones={acciones}
        vacio={`${m.nombre} todavía no tiene visitas a clínica.`}
      />

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
                  <span className="text-[var(--text-2)]">· {i.frecuencia} · {i.duracion}</span>
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-line p-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold">Notas del dueño</p>
          <button type="button" onClick={acciones.nota} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand">
            <Plus size={14} /> Agregar
          </button>
        </div>
        {susNotas.length === 0 && <p className="mt-2 text-[13px] text-[var(--text-3)]">Sin notas.</p>}
        <div className="mt-2 space-y-2">
          {susNotas.slice(0, 3).map((n) => (
            <div key={n.id} className="rounded-lg bg-surface px-3 py-2 text-[13px]">
              <p>{n.texto}</p>
              <p className="mt-1 text-[11.5px] text-[var(--text-3)]">
                {n.autor} · {fechaLegible(n.fecha)} {n.hora}
              </p>
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
    <button type="button" onClick={onClick} className="rounded-xl border border-line p-3 text-left transition hover:border-brand/50 hover:bg-surface">
      {cuerpo}
    </button>
  ) : (
    <div className="rounded-xl border border-line p-3">{cuerpo}</div>
  );
}

/** Línea de tiempo de visitas de una agenda; las de clínica llevan el resumen de consulta. */
function Historial({
  visitas,
  titulo,
  sub,
  accion,
  acciones,
  vacio,
}: {
  visitas: Visita[];
  titulo: string;
  sub: string;
  accion?: ReactNode;
  acciones: Acciones;
  vacio: string;
}) {
  const { resumenes } = useStore();
  const [todas, setTodas] = useState(false);
  const orden = [...visitas].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));
  // La consulta resumida más reciente abre desplegada.
  const [abierta, setAbierta] = useState<string | null>(() => orden.find((v) => resumenes[v.id])?.id ?? null);
  const lista = todas ? orden : orden.slice(0, 5);

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[14px] font-bold">{titulo}</p>
          <p className="text-[12.5px] text-[var(--text-3)]">{sub}</p>
        </div>
        {accion}
      </div>

      {orden.length === 0 && <p className="py-8 text-center text-[13px] text-[var(--text-3)]">{vacio}</p>}
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
                      {fechaLegible(v.fecha)} · {v.hora}
                      <span className="font-normal text-[var(--text-2)]">· {v.servicio}</span>
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

/* Tratamientos */

const ESTADO_RX: Record<Receta["estado"], { label: string; className: string }> = {
  enviada: { label: "Enviada", className: "bg-slate-100 text-slate-700" },
  leida: { label: "Leída por el cliente", className: "bg-sky-50 text-sky-700" },
  duda: { label: "Cliente con duda", className: "bg-rose-50 text-rose-700" },
};

const esHora = (h: string) => /^\d{2}:\d{2}$/.test(h);

function TabTratamientos({ c, m, nueva }: { c: Cliente; m: Mascota; nueva: () => void }) {
  const { recetas, visitas, resumenes } = useStore();
  const [estado, setEstado] = useState<"todos" | "curso" | "fin">("todos");
  const suyas = recetas
    .filter((r) => r.clienteId === c.id && r.mascota === m.nombre)
    .map((r) => ({ r, fecha: isoDeTexto(r.fecha), curso: recetaEnCurso(r) }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const lista = suyas.filter((x) => estado === "todos" || (estado === "curso") === x.curso);

  // Diagnóstico de la consulta del mismo día, si el veterinario la resumió.
  const diagnostico = (fecha: string) => {
    const v = visitas.find((x) => x.clienteId === c.id && x.agenda === "clinica" && x.mascota === m.nombre && x.fecha === fecha && resumenes[x.id]);
    return v ? resumenes[v.id].diagnostico : undefined;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold">Tratamientos</p>
          <p className="text-[12.5px] text-[var(--text-3)]">Recetas que el veterinario le ha dado a {nombreMascota(m.nombre, c)}.</p>
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
      </div>

      {lista.length === 0 && (
        <div className="py-10 text-center text-[13px] text-[var(--text-3)]">
          <Pill size={26} className="mx-auto mb-2 opacity-50" />
          {suyas.length === 0 ? `${m.nombre} todavía no tiene recetas.` : "Sin tratamientos con este filtro."}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {lista.map(({ r, fecha, curso }) => {
          const dx = diagnostico(fecha);
          return (
            <div key={r.id} className="rounded-xl border border-line p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[13.5px] font-bold">
                  <FileText size={15} className="text-[var(--clinica)]" /> {fechaLegible(fecha)}
                  {esHora(r.hora) && <span className="font-normal text-[var(--text-3)]">· {r.hora}</span>}
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

/* Grooming */

function TabGrooming({ c, m, visitas, acciones }: { c: Cliente; m: Mascota; visitas: Visita[]; acciones: Acciones }) {
  const grooming = visitas.filter((v) => v.agenda === "grooming");
  const proxima = proximasDe(c, m.nombre, "grooming")[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--grooming-soft)" }}>
          <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "var(--grooming)" }}>
            Próximo grooming
          </p>
          {proxima ? (
            <>
              <p className="mt-1.5 text-[16px] font-extrabold">
                {etiquetaDia(proxima.dia)} · {proxima.hora}
              </p>
              <p className="text-[12.5px] text-[var(--text-2)]">{proxima.servicio}</p>
              <div className="mt-2">
                <EstadoCitaPill estado={proxima.estado} />
              </div>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-[13px] text-[var(--text-2)]">Sin cita de grooming agendada.</p>
              <button
                type="button"
                onClick={() => acciones.agendar("grooming")}
                className="mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white hover:opacity-90"
                style={{ backgroundColor: "var(--grooming)" }}
              >
                <CalendarPlus size={14} /> Agendar grooming
              </button>
            </>
          )}
        </div>
        <div className="rounded-xl border border-line p-4 text-[12.5px]">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-3)]">Para el groomer</p>
          <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
            <dt className="text-[var(--text-3)]">Especie</dt>
            <dd className="font-medium">{m.especie}</dd>
            <dt className="text-[var(--text-3)]">Raza</dt>
            <dd className="font-medium">{m.raza}</dd>
            <dt className="text-[var(--text-3)]">Tamaño</dt>
            <dd className="font-medium">{m.tamano ?? "—"}</dd>
            <dt className="text-[var(--text-3)]">Visitas</dt>
            <dd className="font-medium">{grooming.length}</dd>
          </dl>
        </div>
      </div>

      <Historial
        visitas={grooming}
        titulo="Historial de grooming"
        sub={`Baños y cortes de ${nombreMascota(m.nombre, c)}.`}
        acciones={acciones}
        vacio={`${m.nombre} todavía no tiene visitas a grooming.`}
      />
    </div>
  );
}

/* ---------- Columna derecha ---------- */

function Lateral({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(true);
  return (
    <section className="rounded-2xl border border-line bg-card shadow-sm">
      <button type="button" onClick={() => setAbierto((a) => !a)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <ChevronDown size={16} className={cn("shrink-0 transition", !abierto && "-rotate-90")} />
        <span className="truncate text-[14px] font-bold">{titulo}</span>
      </button>
      {abierto && <div className="border-t border-line p-3">{children}</div>}
    </section>
  );
}

function ProximasCitas({ c }: { c: Cliente }) {
  const proximas = CITAS.filter((x) => x.clienteId === c.id && x.dia >= 0 && !["completada", "cancelada", "reagendada"].includes(x.estado)).sort(
    (a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora),
  );
  return (
    <Lateral titulo={`Próximas citas (${proximas.length})`}>
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
              <p className="mt-1.5 font-semibold">
                {x.servicio} · {nombreMascota(x.mascota, c)}
              </p>
              <p className="text-[var(--text-3)]">
                {etiquetaDia(x.dia)} · {x.hora}
              </p>
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
