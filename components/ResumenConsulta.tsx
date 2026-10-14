"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarPlus, ChevronDown, ClipboardPen, Download, Eye, Mail, NotebookPen, Pill, Plus, ShieldCheck, Trash2, UserPlus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { espaciosLibres, horario } from "@/lib/agenda";
import { AGENDA_INFO, etiquetaDia, fechaDe, fechaLegible, iso } from "@/lib/format";
import { STAFF } from "@/lib/seed";
import { ahora, useStore } from "@/lib/store";
import { descargarReceta, nombreArchivo, verReceta } from "@/lib/recetaPdf";
import type { Agenda, Cita, Cliente, ItemReceta, Receta, ResumenConsulta, Visita } from "@/lib/types";
import { WhatsappIcon } from "./glifos";

/** Resumen de consulta en solo lectura. */
export function ResumenBloque({ r, className }: { r: ResumenConsulta; className?: string }) {
  const filas: [string, string | undefined][] = [
    ["Motivo de consulta", r.motivo],
    ["Hallazgos del examen", r.hallazgos],
    ["Diagnóstico", r.diagnostico],
    ["Tratamiento e indicaciones", r.tratamiento],
    ["Próximo control", r.proximoControl],
  ];
  return (
    <div className={cn("rounded-lg border-l-[3px] border-[var(--clinica)] bg-[var(--clinica-soft)]/60 px-3 py-2.5 text-[12.5px]", className)}>
      {r.pesoKg && (
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="rounded-md bg-card px-2 py-0.5 font-semibold">Peso {r.pesoKg} kg</span>
        </div>
      )}
      <dl className="space-y-1.5">
        {filas.map(([k, v]) =>
          v ? (
            <div key={k} className="grid gap-0.5 sm:grid-cols-[170px_1fr]">
              <dt className="font-semibold text-[var(--clinica)]">{k}</dt>
              <dd className="text-[var(--text)]">{v}</dd>
            </div>
          ) : null,
        )}
      </dl>
      <p className="mt-2 text-[11px] text-[var(--text-3)]">
        {r.autor} · {r.escrito}
      </p>
    </div>
  );
}

const CONTROLES = ["No requiere", "En 3 días", "En 7 días", "En 14 días", "En 30 días"];
const NUEVA = "__nueva__";

// Servicios que se pueden agendar desde el resumen, con su duración en minutos.
const SERVICIOS: Record<Agenda, [string, number][]> = {
  clinica: [
    ["Control post consulta", 20],
    ["Consulta general", 30],
    ["Vacuna múltiple", 20],
    ["Vacuna antirrábica", 15],
    ["Desparasitación", 15],
  ],
  grooming: [
    ["Baño (pequeño)", 120],
    ["Baño (mediano)", 120],
    ["Baño (grande)", 120],
    ["Baño y corte (pequeño)", 120],
    ["Baño y corte (mediano)", 120],
    ["Baño y corte (grande)", 120],
    ["Corte de uñas", 120],
  ],
};

/** Primer día con atención a partir de `desde` días (salta domingos). */
function diaHabil(agenda: Agenda, desde: number) {
  let d = Math.max(1, desde);
  while (!horario(agenda, d)) d++;
  return d;
}

/** Días que se ofrecen para agendar: las próximas 5 semanas con atención. */
function diasDisponibles(agenda: Agenda) {
  return Array.from({ length: 35 }, (_, i) => i + 1).filter((d) => horario(agenda, d));
}

/**
 * Formulario del veterinario para resumir una consulta. Se puede resumir una
 * visita ya atendida o registrar una consulta de hoy sin cita.
 */
export function ResumenModal({
  c,
  visita,
  onClose,
  onAgendada,
}: {
  c: Cliente;
  visita?: Visita;
  onClose: () => void;
  /** Avisa qué cita se agendó para mostrarlo en la ficha. */
  onAgendada?: (cita: Cita) => void;
}) {
  const { visitas, resumenes, guardarResumen, agregarCita } = useStore();
  const [mascota, setMascota] = useState(visita?.mascota ?? c.mascotas[0].nombre);
  const pendientes = visitas
    .filter((v) => v.clienteId === c.id && v.agenda === "clinica" && v.mascota === mascota && !resumenes[v.id])
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const [visitaId, setVisitaId] = useState<string>(visita?.id ?? pendientes[0]?.id ?? NUEVA);
  const previo = visita ? resumenes[visita.id] : undefined;

  const [f, setF] = useState({
    motivo: previo?.motivo ?? "",
    pesoKg: previo?.pesoKg ?? "",
    hallazgos: previo?.hallazgos ?? "",
    diagnostico: previo?.diagnostico ?? "",
    tratamiento: previo?.tratamiento ?? "",
    proximoControl: previo?.proximoControl ?? "No requiere",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  // Agendar la próxima cita desde el resumen: queda en el calendario que corresponda.
  const [agendar, setAgendar] = useState(false);
  const [cal, setCal] = useState<Agenda>("clinica");
  const [servicio, setServicio] = useState(SERVICIOS.clinica[0][0]);
  const [dia, setDia] = useState(() => diaHabil("clinica", 1));
  const libres = agendar ? espaciosLibres(cal, dia) : [];
  const [hora, setHora] = useState("");
  const horaValida = libres.includes(hora) ? hora : "";

  const elegirControl = (x: string) => {
    setF((y) => ({ ...y, proximoControl: x }));
    const n = Number(x.match(/\d+/)?.[0]);
    if (!n) return;
    // Al elegir un control se propone agendarlo ese día en la clínica.
    setAgendar(true);
    setCal("clinica");
    setServicio("Control post consulta");
    setDia(diaHabil("clinica", n));
    setHora("");
  };
  const cambiarCal = (a: Agenda) => {
    setCal(a);
    setServicio(SERVICIOS[a][0][0]);
    setDia((d) => diaHabil(a, d));
    setHora("");
  };

  const completo = f.motivo.trim() && f.hallazgos.trim() && f.diagnostico.trim() && f.tratamiento.trim() && (!agendar || horaValida);

  const guardar = () => {
    if (!completo) return;
    const hora = ahora();
    const v: Visita =
      visita ??
      visitas.find((x) => x.id === visitaId) ?? {
        id: `vis${Date.now()}`,
        clienteId: c.id,
        mascota,
        agenda: "clinica",
        fecha: iso(fechaDe(0)),
        hora,
        servicio: "Consulta general",
        atendio: STAFF.veterinario.nombre,
      };
    guardarResumen(v, {
      motivo: f.motivo.trim(),
      pesoKg: f.pesoKg.trim() || undefined,
      hallazgos: f.hallazgos.trim(),
      diagnostico: f.diagnostico.trim(),
      tratamiento: f.tratamiento.trim(),
      proximoControl: f.proximoControl,
      autor: STAFF.veterinario.nombre,
      escrito: `Hoy · ${hora}`,
    });
    if (agendar && horaValida) {
      const cita: Cita = {
        id: `m${Date.now()}`,
        agenda: cal,
        clienteId: c.id,
        mascota: v.mascota,
        servicio,
        dia,
        hora: horaValida,
        duracionMin: SERVICIOS[cal].find(([s]) => s === servicio)?.[1] ?? 30,
        estado: "confirmada",
        origen: "manual",
      };
      agregarCita(cita);
      onAgendada?.(cita);
    }
    onClose();
  };

  const campo = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-[var(--clinica)]";

  return (
    <Modal titulo={previo ? "Editar resumen de consulta" : "Resumir consulta"} Icon={ClipboardPen} onClose={onClose}>
      <div className="space-y-3">
        {visita ? (
          <p className="rounded-lg bg-surface px-3 py-2 text-[13px]">
            <b>{visita.mascota}</b> · {visita.servicio} · {fechaLegible(visita.fecha)} {visita.hora}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Etiqueta texto="Mascota">
              <select
                value={mascota}
                onChange={(e) => {
                  setMascota(e.target.value);
                  setVisitaId(NUEVA);
                }}
                className={campo}
              >
                {c.mascotas.map((m) => <option key={m.nombre}>{m.nombre}</option>)}
              </select>
            </Etiqueta>
            <Etiqueta texto="Consulta">
              <select value={visitaId} onChange={(e) => setVisitaId(e.target.value)} className={campo}>
                <option value={NUEVA}>Consulta de hoy (sin cita registrada)</option>
                {pendientes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {fechaLegible(v.fecha)} {v.hora} · {v.servicio}
                  </option>
                ))}
              </select>
            </Etiqueta>
          </div>
        )}

        <Etiqueta texto="Motivo de consulta *">
          <input value={f.motivo} onChange={set("motivo")} placeholder="Lo que cuenta el dueño" className={campo} />
        </Etiqueta>
        <div className="sm:w-1/2">
          <Etiqueta texto="Peso (kg)">
            <input value={f.pesoKg} onChange={set("pesoKg")} inputMode="decimal" placeholder="Ej. 12.5" className={campo} />
          </Etiqueta>
        </div>
        <Etiqueta texto="Hallazgos del examen *">
          <textarea value={f.hallazgos} onChange={set("hallazgos")} rows={2} className={campo} />
        </Etiqueta>
        <Etiqueta texto="Diagnóstico *">
          <input value={f.diagnostico} onChange={set("diagnostico")} className={campo} />
        </Etiqueta>
        <Etiqueta texto="Tratamiento e indicaciones *">
          <textarea value={f.tratamiento} onChange={set("tratamiento")} rows={2} className={campo} />
        </Etiqueta>
        <Etiqueta texto="Próximo control">
          <div className="flex flex-wrap gap-1.5">
            {CONTROLES.map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => elegirControl(x)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12.5px] font-semibold",
                  f.proximoControl === x ? "border-[var(--clinica)] bg-[var(--clinica)] text-white" : "border-line text-[var(--text-2)] hover:bg-surface",
                )}
              >
                {x}
              </button>
            ))}
          </div>
        </Etiqueta>

        <div className={cn("rounded-xl border p-3", agendar ? "border-[var(--clinica)]/50 bg-[var(--clinica-soft)]/40" : "border-line")}>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-bold">
            <input type="checkbox" checked={agendar} onChange={(e) => setAgendar(e.target.checked)} className="h-4 w-4 accent-[var(--clinica)]" />
            <CalendarPlus size={15} /> Agendar próxima cita para {visita?.mascota ?? mascota}
          </label>
          {agendar && (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Etiqueta texto="Calendario">
                  <div className="inline-flex w-full rounded-lg border border-line bg-surface p-0.5">
                    {(["clinica", "grooming"] as Agenda[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => cambiarCal(a)}
                        className={cn("flex-1 rounded-md px-2 py-1.5 text-[12.5px] font-semibold", cal === a ? "text-white" : "text-[var(--text-2)]")}
                        style={cal === a ? { backgroundColor: AGENDA_INFO[a].color } : undefined}
                      >
                        {a === "clinica" ? "Veterinaria" : "Grooming"}
                      </button>
                    ))}
                  </div>
                </Etiqueta>
                <Etiqueta texto="Servicio">
                  <select value={servicio} onChange={(e) => setServicio(e.target.value)} className={campo}>
                    {SERVICIOS[cal].map(([s]) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Etiqueta>
              </div>
              <Etiqueta texto="Día">
                <select
                  value={dia}
                  onChange={(e) => {
                    setDia(Number(e.target.value));
                    setHora("");
                  }}
                  className={campo}
                >
                  {diasDisponibles(cal).map((d) => (
                    <option key={d} value={d}>
                      {etiquetaDia(d)}{d > 1 ? ` · en ${d} días` : ""}
                    </option>
                  ))}
                </select>
              </Etiqueta>
              <div>
                <span className="mb-1 block text-[12px] font-semibold text-[var(--text-2)]">Hora disponible *</span>
                {libres.length === 0 ? (
                  <p className="text-[12.5px] text-amber-700">No hay espacios libres ese día. Elige otro día.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {libres.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHora(h)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1 text-[12.5px] font-semibold tabular-nums",
                          horaValida === h ? "border-transparent text-white" : "border-line bg-card text-[var(--text-2)] hover:bg-surface",
                        )}
                        style={horaValida === h ? { backgroundColor: AGENDA_INFO[cal].color } : undefined}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[11.5px] text-[var(--text-3)]">
                Queda confirmada en el calendario de {cal === "clinica" ? "veterinaria" : "grooming"}. Luna le envía el recordatorio al cliente 24 h antes.
              </p>
            </div>
          )}
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-surface px-3 py-2 text-[11.5px] text-[var(--text-3)]">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          Uso interno de la clínica. Luna no envía ni explica este resumen al cliente; si hay control, solo le recuerda agendarlo.
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[12px] text-[var(--text-3)]">{STAFF.veterinario.nombre}</span>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold hover:bg-surface">Cancelar</button>
          <button
            type="button"
            onClick={guardar}
            disabled={!completo}
            className="rounded-lg bg-[var(--clinica)] px-3 py-1.5 text-[13px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {agendar ? "Guardar y agendar" : "Guardar resumen"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const vacio = (): ItemReceta => ({ medicamento: "", dosis: "", frecuencia: "", duracion: "" });

/**
 * Receta desde la ficha del paciente: el veterinario la escribe, revisa el PDF
 * y lo envía por WhatsApp o por correo. Queda en Tratamientos.
 */
export function RecetaModal({ c, onClose, onEnviada }: { c: Cliente; onClose: () => void; onEnviada?: (r: Receta) => void }) {
  const { agregarReceta } = useStore();
  const [mascota, setMascota] = useState(c.mascotas[0].nombre);
  const [items, setItems] = useState<ItemReceta[]>([vacio()]);
  const [indicaciones, setIndicaciones] = useState("");
  const validos = items.filter((i) => i.medicamento.trim());
  const editar = (i: number, cambio: Partial<ItemReceta>) => setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...cambio } : x)));
  const campo = "w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--clinica)]";

  const receta = (canal?: Receta["canal"]): Receta => ({
    id: `rx${Date.now()}`,
    clienteId: c.id,
    mascota,
    hora: ahora(),
    fecha: "Hoy",
    items: validos.map((i) => ({ medicamento: i.medicamento.trim(), dosis: i.dosis.trim(), frecuencia: i.frecuencia.trim(), duracion: i.duracion.trim() })),
    indicaciones: indicaciones.trim() || undefined,
    estado: "enviada",
    canal,
  });

  const enviar = (canal: "whatsapp" | "correo") => {
    if (!validos.length) return;
    const r = receta(canal);
    agregarReceta(r);
    onEnviada?.(r);
    onClose();
  };

  return (
    <Modal titulo="Nueva receta" Icon={Pill} onClose={onClose}>
      <div className="space-y-3">
        {c.mascotas.length > 1 ? (
          <Etiqueta texto="Mascota">
            <select value={mascota} onChange={(e) => setMascota(e.target.value)} className={campo}>
              {c.mascotas.map((m) => (
                <option key={m.nombre}>{m.nombre}</option>
              ))}
            </select>
          </Etiqueta>
        ) : (
          <p className="rounded-lg bg-surface px-3 py-2 text-[13px]">
            <b>{mascota}</b> · {c.mascotas[0].especie} · {c.mascotas[0].raza} · {c.mascotas[0].edad}
          </p>
        )}

        <div>
          <span className="mb-1 block text-[12px] font-semibold text-[var(--text-2)]">Medicamentos *</span>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="rounded-xl border border-line p-2.5">
                <div className="flex items-center gap-2">
                  <Pill size={15} className="shrink-0 text-[var(--clinica)]" />
                  <input
                    value={it.medicamento}
                    onChange={(e) => editar(i, { medicamento: e.target.value })}
                    placeholder="Medicamento y presentación"
                    className={cn(campo, "flex-1 font-semibold")}
                    autoFocus={i === 0}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}
                      aria-label="Quitar medicamento"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input value={it.dosis} onChange={(e) => editar(i, { dosis: e.target.value })} placeholder="Dosis" className={campo} />
                  <input value={it.frecuencia} onChange={(e) => editar(i, { frecuencia: e.target.value })} placeholder="Frecuencia" className={campo} />
                  <input value={it.duracion} onChange={(e) => editar(i, { duracion: e.target.value })} placeholder="Duración (ej. 7 días)" className={campo} />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems((xs) => [...xs, vacio()])}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--clinica)]/50 bg-[var(--clinica-soft)]/50 px-3 py-2 text-[13px] font-bold text-[var(--clinica)] hover:bg-[var(--clinica-soft)]"
            >
              <Plus size={16} /> Agregar otro medicamento
            </button>
          </div>
        </div>

        <Etiqueta texto="Indicaciones">
          <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows={2} placeholder="Cuidados, dieta, cuándo volver…" className={campo} />
        </Etiqueta>

        <div className="rounded-xl border border-line p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[10px] font-extrabold text-rose-600">PDF</span>
              <span className="truncate">{validos.length ? nombreArchivo(receta()) : "La receta se arma al agregar medicamentos"}</span>
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => verReceta(receta())}
                disabled={!validos.length}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] font-semibold hover:bg-surface disabled:opacity-40"
              >
                <Eye size={14} /> Ver
              </button>
              <button
                type="button"
                onClick={() => descargarReceta(receta())}
                disabled={!validos.length}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] font-semibold hover:bg-surface disabled:opacity-40"
              >
                <Download size={14} /> Descargar
              </button>
            </div>
          </div>
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-surface px-3 py-2 text-[11.5px] text-[var(--text-3)]">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          Si el cliente tiene dudas sobre el tratamiento, Luna lo pasa a la clínica: no explica tratamientos.
        </p>
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-[12px] font-semibold text-[var(--text-2)]">Enviar el PDF a {c.nombre} · {STAFF.veterinario.nombre}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => enviar("whatsapp")}
            disabled={!validos.length}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1ba34d] px-3 py-2.5 text-[13px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <WhatsappIcon size={16} />
            <span className="truncate">WhatsApp · {c.telefono}</span>
          </button>
          <button
            type="button"
            onClick={() => enviar("correo")}
            disabled={!validos.length}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-[13px] font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mail size={16} />
            <span className="truncate">Correo · {c.correo}</span>
          </button>
        </div>
        <button type="button" onClick={onClose} className="mt-2 w-full rounded-lg py-1.5 text-[12.5px] font-semibold text-[var(--text-3)] hover:bg-surface">
          Cancelar
        </button>
      </div>
    </Modal>
  );
}

/** Agrega a mano un contacto secundario a una mascota. */
export function ContactoModal({ c, mascota, onClose }: { c: Cliente; mascota: string; onClose: () => void }) {
  const { agregarContacto } = useStore();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("+502 ");
  const [relacion, setRelacion] = useState("");
  const listo = nombre.trim() && telefono.replace(/\D/g, "").length >= 8 && relacion.trim();
  const campo = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-brand";
  const guardar = () => {
    if (!listo) return;
    agregarContacto(c.id, mascota, { nombre: nombre.trim(), telefono: telefono.trim(), relacion: relacion.trim(), desde: "Hoy" });
    onClose();
  };
  return (
    <Modal titulo={`Contacto de ${mascota} ${c.nombre.trim().split(/\s+/).pop()}`} Icon={UserPlus} onClose={onClose}>
      <div className="space-y-3">
        <Etiqueta texto="Nombre *">
          <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ana de Gálvez" className={campo} />
        </Etiqueta>
        <Etiqueta texto="Teléfono (WhatsApp) *">
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" className={campo} />
        </Etiqueta>
        <Etiqueta texto="Relación *">
          <input value={relacion} onChange={(e) => setRelacion(e.target.value)} placeholder={`Ej. Esposa de ${c.nombre.split(" ")[0]}`} className={campo} />
        </Etiqueta>
        <p className="flex items-start gap-1.5 rounded-lg bg-surface px-3 py-2 text-[11.5px] text-[var(--text-3)]">
          <ShieldCheck size={13} className="mt-0.5 shrink-0" />
          Cuando escriba desde este número, Luna lo reconoce como contacto de {mascota} y puede agendar sus citas. El dueño sigue siendo {c.nombre}.
        </p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold hover:bg-surface">Cancelar</button>
        <button type="button" onClick={guardar} disabled={!listo} className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-bold text-white hover:bg-brand-dark disabled:opacity-40">
          Agregar contacto
        </button>
      </div>
    </Modal>
  );
}

export function NotaModal({ c, onClose }: { c: Cliente; onClose: () => void }) {
  const { agregarNota } = useStore();
  const [texto, setTexto] = useState("");
  const guardar = () => {
    if (!texto.trim()) return;
    agregarNota({ id: `n${Date.now()}`, clienteId: c.id, texto: texto.trim(), fecha: iso(fechaDe(0)), hora: ahora(), autor: "Usuario general" });
    onClose();
  };
  return (
    <Modal titulo={`Nota sobre ${c.nombre}`} Icon={NotebookPen} onClose={onClose}>
      <textarea
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={4}
        placeholder="Preferencias, acuerdos, datos útiles para la próxima visita…"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-brand"
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold hover:bg-surface">Cancelar</button>
        <button type="button" onClick={guardar} disabled={!texto.trim()} className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-bold text-white hover:bg-brand-dark disabled:opacity-40">
          Guardar nota
        </button>
      </div>
    </Modal>
  );
}

function Etiqueta({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[var(--text-2)]">{texto}</span>
      {children}
    </label>
  );
}

function Modal({ titulo, Icon, onClose, children }: { titulo: string; Icon: LucideIcon; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[16px] font-bold">
            <Icon size={18} /> {titulo}
          </p>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-[var(--text-3)] hover:bg-surface">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Menú desplegable simple (botón + lista de acciones). */
export function Menu({
  label,
  items,
  Icon,
  compacto,
}: {
  label: string;
  items: { label: string; onClick?: () => void; href?: string }[];
  Icon?: LucideIcon;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAbierto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);
  const item = "block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className={cn("inline-flex items-center gap-1 rounded-lg font-semibold text-brand hover:bg-brand/5", compacto ? "px-1.5 py-1 text-[12.5px]" : "px-2 py-1 text-[13px]")}
      >
        {Icon && <Icon size={14} />}
        {label}
        {!Icon && <ChevronDown size={14} />}
      </button>
      {abierto && (
        <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-line bg-card p-1.5 shadow-lg">
          {items.map((i) =>
            i.href ? (
              <Link key={i.label} href={i.href} className={item} onClick={() => setAbierto(false)}>
                {i.label}
              </Link>
            ) : (
              <button
                key={i.label}
                type="button"
                className={item}
                onClick={() => {
                  setAbierto(false);
                  i.onClick?.();
                }}
              >
                {i.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
