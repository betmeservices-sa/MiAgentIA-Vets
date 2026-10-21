"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, CheckCheck, ChevronLeft, Clock, FileText, MapPin, Phone, Radio, Send, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { telefonoLegible, ventanaAbierta, type ChatReal } from "@/lib/useWhatsappReal";
import type { MensajeWA } from "@/lib/whatsapp";
import { Avatar, ChannelBadge } from "./ui";

// Fila, chat y ficha de las conversaciones del número REAL dentro de la
// bandeja. Van aparte de las de la demostración porque no tienen cliente en
// los datos de demo ni las atiende MIA: las contesta la clínica.

const SV = "America/El_Salvador";
const COLOR = "#1ba34d";

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-SV", { timeZone: SV, hour: "2-digit", minute: "2-digit", hour12: false });
}

function diaCorto(iso: string) {
  const f = (d: Date) => d.toLocaleDateString("es-SV", { timeZone: SV });
  if (f(new Date(iso)) === f(new Date())) return hora(iso);
  return new Date(iso).toLocaleDateString("es-SV", { timeZone: SV, day: "numeric", month: "short" });
}

/** Iniciales seguras: el nombre del perfil puede traer emojis y símbolos ("~🎼Alex"). */
function paraAvatar(nombre: string) {
  return nombre.replace(/[^\p{L}\p{N}\s]/gu, " ").trim() || "WA";
}

function resumen(m: MensajeWA) {
  if (m.texto) return m.texto;
  const tipos: Record<string, string> = { image: "Foto", audio: "Audio", video: "Video", document: "Documento", sticker: "Sticker", location: "Ubicación" };
  return tipos[m.tipo] ?? "Mensaje";
}

function EnVivo() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700" title="Entró al número real de la clínica">
      <Radio size={10} /> En vivo
    </span>
  );
}

export function ItemReal({ c, activa, noLeidos, onClick }: { c: ChatReal; activa: boolean; noLeidos: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full gap-3 border-b border-line/70 px-3.5 py-3 text-left transition", activa ? "bg-brand/5" : "hover:bg-surface")}>
      <div className="relative">
        <Avatar nombre={paraAvatar(c.nombre)} size={42} color={COLOR} />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
          <ChannelBadge canal="whatsapp" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Prioridad media" aria-label="Prioridad media" />
            <span className="truncate">{c.nombre}</span>
          </p>
          <span className="shrink-0 text-[11px] text-[var(--text-3)]">{diaCorto(c.ultimo.ts)}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-[var(--text-2)]">
            {c.ultimo.direccion === "out" && "Tú: "}
            {resumen(c.ultimo)}
          </p>
          {noLeidos > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-accent)] px-1.5 text-[11px] font-bold text-white">{noLeidos}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <EnVivo />
        </div>
      </div>
    </button>
  );
}

export function HiloReal({
  c,
  movil,
  onVolver,
  onVisto,
  enviar,
}: {
  c: ChatReal;
  movil: boolean;
  onVolver: () => void;
  onVisto: (c: ChatReal) => void;
  enviar: (telefono: string, texto: string) => Promise<string | null>;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const abierta = ventanaAbierta(c);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [c.id, c.mensajes.length]);

  // Lo que está abierto en pantalla cuenta como leído, también lo que entra
  // mientras se mira. En el teléfono solo cuando el chat se abrió (no en la lista).
  useEffect(() => {
    if (movil || window.matchMedia("(min-width: 768px)").matches) onVisto(c);
  }, [movil, c, onVisto]);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setError("");
    const fallo = await enviar(c.telefono, t);
    if (fallo) setError(fallo);
    else setTexto("");
    setEnviando(false);
  }

  return (
    <div className={cn("min-w-0 flex-1 flex-col bg-surface", movil ? "flex" : "hidden md:flex")}>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-card px-4 py-2.5">
        <button type="button" onClick={onVolver} className="-ml-1 inline-flex items-center gap-0.5 rounded-lg py-1 pr-1.5 text-[13px] font-semibold text-brand md:hidden">
          <ChevronLeft size={18} /> Volver
        </button>
        <p className="truncate font-bold">{c.nombre}</p>
        <ChannelBadge canal="whatsapp" label />
        <EnVivo />
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {c.mensajes.map((m) => {
          const nuestro = m.direccion === "out";
          return (
            <div key={m.wamid ?? m.id} className={cn("ccg-pop flex", nuestro ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm", nuestro ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-card")}>
                {nuestro && (
                  <p className="mb-0.5 flex items-center gap-1 text-[10.5px] font-bold text-white/80">
                    <UserRound size={11} /> {m.autor ?? "Clínica"}
                  </p>
                )}
                <Adjunto m={m} />
                {m.texto && <p className="whitespace-pre-line break-words">{m.texto}</p>}
                {!m.texto && !m.media_id && <p className="italic opacity-70">{resumen(m)}</p>}
                <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", nuestro ? "text-white/70" : "text-[var(--text-3)]")}>
                  {hora(m.ts)}
                  {nuestro && <EstadoEnvio estado={m.estado} />}
                </p>
                {m.estado === "fallido" && m.error && <p className="mt-1 rounded-md bg-white/15 px-2 py-1 text-[11px]">No llegó: {m.error}</p>}
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      <form onSubmit={alEnviar} className="border-t border-line bg-card p-3">
        {!abierta && (
          <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900">
            <Clock size={13} className="mt-0.5 shrink-0" />
            Pasaron más de 24 horas desde su último mensaje. WhatsApp solo deja escribirle de nuevo con una plantilla aprobada.
          </p>
        )}
        {error && (
          <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[12px] text-rose-800">
            <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        <div className="flex items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={!abierta || enviando}
            placeholder={abierta ? `Responder a ${paraAvatar(c.nombre).split(/\s+/)[0]} por WhatsApp…` : "Ventana de 24 horas cerrada"}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-60"
          />
          <button type="submit" disabled={!abierta || enviando || !texto.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white hover:bg-brand-dark disabled:opacity-50" aria-label="Enviar">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

export function FichaReal({ c }: { c: ChatReal }) {
  return (
    <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-line bg-card p-4 xl:block">
      <div className="flex flex-col items-center text-center">
        <Avatar nombre={paraAvatar(c.nombre)} size={56} color={COLOR} />
        <p className="mt-2 font-bold">{c.nombre}</p>
        <p className="flex items-center gap-1 text-[12.5px] text-[var(--text-3)]">
          <Phone size={12} /> {telefonoLegible(c.telefono)}
        </p>
        <div className="mt-1.5">
          <EnVivo />
        </div>
      </div>

      <p className="mt-5 rounded-xl border border-line p-3 text-[12.5px] text-[var(--text-2)]">
        Todavía no está entre los pacientes de la clínica: el nombre es el de su perfil de WhatsApp.
      </p>

      <p className="mt-5 flex items-start gap-1.5 rounded-xl bg-surface p-2.5 text-[11px] leading-snug text-[var(--text-3)]">
        <ShieldCheck size={13} className="mt-0.5 shrink-0" />
        Los datos de este cliente son propiedad de la clínica. Se pueden exportar o eliminar a solicitud de la clínica.
      </p>
    </aside>
  );
}

function EstadoEnvio({ estado }: { estado: string }) {
  if (estado === "fallido") return <AlertCircle size={12} className="text-rose-200" aria-label="No llegó" />;
  if (estado === "leido") return <CheckCheck size={13} className="text-sky-200" aria-label="Leído" />;
  if (estado === "entregado") return <CheckCheck size={13} aria-label="Entregado" />;
  return <Check size={13} aria-label="Enviado" />;
}

function Adjunto({ m }: { m: MensajeWA }) {
  if (m.tipo === "location" && m.texto) {
    const coords = m.texto.split(" · ").pop();
    return (
      <a href={`https://www.google.com/maps?q=${coords}`} target="_blank" rel="noreferrer" className="mb-1 inline-flex items-center gap-1 font-semibold underline">
        <MapPin size={13} /> Ver ubicación
      </a>
    );
  }
  if (!m.media_id) return null;
  const src = `/api/whatsapp/media/${m.media_id}`;
  if (m.tipo === "image" || m.tipo === "sticker") {
    return (
      <a href={src} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Foto enviada por WhatsApp" className={cn("mb-1 rounded-xl", m.tipo === "sticker" ? "h-28 w-28 object-contain" : "max-h-72 w-auto")} />
      </a>
    );
  }
  if (m.tipo === "audio") return <audio controls src={src} className="mb-1 max-w-full" />;
  if (m.tipo === "video") return <video controls src={src} className="mb-1 max-h-72 rounded-xl" />;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="mb-1 inline-flex items-center gap-1.5 font-semibold underline">
      <FileText size={14} /> {m.media_nombre ?? "Documento"}
    </a>
  );
}
