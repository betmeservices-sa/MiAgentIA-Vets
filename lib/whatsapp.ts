// WhatsApp real de la clínica (Cloud API de Meta). Solo se usa desde rutas de
// servidor: aquí viven el token, el secreto de la app y la llave de Supabase.
// Los mensajes se guardan en la tabla propia del demo (vet_wa_mensajes); el
// resto del panel sigue con los datos de demostración.

import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = "https://graph.facebook.com/v23.0";
const TABLA = "vet_wa_mensajes";

export interface MensajeWA {
  id: number;
  wamid: string | null;
  telefono: string;
  nombre: string | null;
  direccion: "in" | "out";
  tipo: string;
  texto: string | null;
  media_id: string | null;
  media_mime: string | null;
  media_nombre: string | null;
  estado: string;
  error: string | null;
  autor: string | null;
  ts: string;
}

export type FilaNueva = Omit<MensajeWA, "id">;

export interface NumeroWA {
  telefono: string;
  nombre: string;
  calidad: string | null;
  estadoNombre: string | null;
}

const env = () => ({
  token: process.env.WHATSAPP_TOKEN ?? "",
  phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  appSecret: process.env.META_APP_SECRET ?? "",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
});

/** Falta alguna variable: el módulo se muestra como no configurado en vez de fallar. */
export function configurado() {
  const e = env();
  return Boolean(e.token && e.phoneId && e.appSecret && e.verifyToken && e.supabaseUrl && e.supabaseKey);
}

export const phoneNumberId = () => env().phoneId;
export const verifyToken = () => env().verifyToken;

/** Meta firma cada aviso con el secreto de la app (cabecera x-hub-signature-256). */
export function firmaValida(cuerpo: string, firma: string | null) {
  const secreto = env().appSecret;
  if (!secreto || !firma) return false;
  const esperada = Buffer.from("sha256=" + createHmac("sha256", secreto).update(cuerpo).digest("hex"));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

// --- Supabase (PostgREST con la llave de servicio) ---

function sb(ruta: string, init: RequestInit = {}) {
  const { supabaseUrl, supabaseKey } = env();
  return fetch(`${supabaseUrl}/rest/v1/${ruta}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

/** Guarda mensajes; si Meta reenvía uno que ya está (mismo wamid), no lo duplica. */
export async function guardarMensajes(filas: FilaNueva[]) {
  if (filas.length === 0) return;
  const r = await sb(`${TABLA}?on_conflict=wamid`, {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify(filas),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
}

// Los avisos de estado pueden llegar desordenados: solo se avanza, nunca se
// retrocede (un "entregado" tardío no pisa un "leído").
const ORDEN_ESTADO: Record<string, string[]> = {
  entregado: ["enviado"],
  leido: ["enviado", "entregado"],
  fallido: ["enviado", "entregado"],
};

export async function actualizarEstado(wamid: string, estado: string, error?: string) {
  const previos = ORDEN_ESTADO[estado];
  if (!previos) return;
  const r = await sb(`${TABLA}?wamid=eq.${encodeURIComponent(wamid)}&estado=in.(${previos.join(",")})`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(error ? { estado, error } : { estado }),
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
}

/** Los mensajes más recientes, en orden de llegada. */
export async function leerMensajes(limite = 1000): Promise<MensajeWA[]> {
  const r = await sb(`${TABLA}?select=*&order=ts.desc,id.desc&limit=${limite}`);
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return ((await r.json()) as MensajeWA[]).reverse();
}

// --- Graph API ---

async function graph<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${GRAPH}/${ruta}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${env().token}`, "Content-Type": "application/json", ...init.headers },
  });
  const datos = (await r.json().catch(() => ({}))) as T & { error?: { message?: string; error_data?: { details?: string } } };
  if (!r.ok || datos.error) {
    const e = datos.error;
    throw new Error(e?.error_data?.details || e?.message || `Meta respondió ${r.status}`);
  }
  return datos;
}

// La bandeja sondea cada pocos segundos; los datos del número casi no cambian.
let numeroEnCache: { valor: NumeroWA; hasta: number } | null = null;

export async function datosNumero(): Promise<NumeroWA> {
  if (numeroEnCache && numeroEnCache.hasta > Date.now()) return numeroEnCache.valor;
  const d = await graph<{ display_phone_number: string; verified_name: string; quality_rating?: string; name_status?: string }>(
    `${env().phoneId}?fields=display_phone_number,verified_name,quality_rating,name_status`,
  );
  const valor = { telefono: d.display_phone_number, nombre: d.verified_name, calidad: d.quality_rating ?? null, estadoNombre: d.name_status ?? null };
  numeroEnCache = { valor, hasta: Date.now() + 5 * 60 * 1000 };
  return valor;
}

/** Envía texto libre (solo vale dentro de las 24 h desde el último mensaje del cliente). */
export async function enviarTexto(telefono: string, texto: string, autor: string): Promise<FilaNueva> {
  const d = await graph<{ messages?: { id: string }[] }>(`${env().phoneId}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: telefono, type: "text", text: { body: texto, preview_url: false } }),
  });
  const fila: FilaNueva = {
    wamid: d.messages?.[0]?.id ?? null,
    telefono,
    nombre: null,
    direccion: "out",
    tipo: "text",
    texto,
    media_id: null,
    media_mime: null,
    media_nombre: null,
    estado: "enviado",
    error: null,
    autor,
    ts: new Date().toISOString(),
  };
  await guardarMensajes([fila]);
  return fila;
}

/** Baja un adjunto (foto, audio, documento) con el token del servidor. */
export async function bajarMedia(mediaId: string) {
  const info = await graph<{ url: string; mime_type: string }>(mediaId);
  const r = await fetch(info.url, { headers: { Authorization: `Bearer ${env().token}` }, cache: "no-store" });
  if (!r.ok || !r.body) throw new Error(`Meta respondió ${r.status} al bajar el adjunto`);
  return { cuerpo: r.body, mime: info.mime_type };
}

// --- Lectura del aviso de Meta ---

interface MensajeMeta {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  video?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  voice?: { id: string; mime_type: string };
  sticker?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename?: string; caption?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  reaction?: { emoji?: string; message_id: string };
  button?: { text: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
  contacts?: { name?: { formatted_name?: string }; phones?: { phone?: string }[] }[];
}

interface ValorMeta {
  metadata?: { phone_number_id?: string };
  contacts?: { wa_id: string; profile?: { name?: string } }[];
  messages?: MensajeMeta[];
  statuses?: { id: string; status: string; errors?: { title?: string; message?: string }[] }[];
}

export interface AvisoMeta {
  object?: string;
  entry?: { changes?: { field?: string; value?: ValorMeta }[] }[];
}

const ESTADOS_META: Record<string, string> = { delivered: "entregado", read: "leido", failed: "fallido" };

/** Convierte un mensaje de Meta en una fila: texto visible y, si trae, el adjunto. */
export function filaDeMensaje(m: MensajeMeta, nombre: string | null): FilaNueva {
  const media = m.image ?? m.video ?? m.audio ?? m.voice ?? m.sticker ?? m.document;
  let texto: string | null = null;
  if (m.text) texto = m.text.body;
  else if (m.image?.caption || m.video?.caption || m.document?.caption) texto = m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? null;
  else if (m.location) {
    const { latitude, longitude, name, address } = m.location;
    texto = [name, address, `${latitude},${longitude}`].filter(Boolean).join(" · ");
  } else if (m.reaction) texto = m.reaction.emoji ? `Reaccionó ${m.reaction.emoji}` : "Quitó una reacción";
  else if (m.button) texto = m.button.text;
  else if (m.interactive) texto = m.interactive.button_reply?.title ?? m.interactive.list_reply?.title ?? null;
  else if (m.contacts) texto = m.contacts.map((c) => [c.name?.formatted_name, c.phones?.[0]?.phone].filter(Boolean).join(" ")).join("\n");

  return {
    wamid: m.id,
    telefono: m.from,
    nombre,
    direccion: "in",
    tipo: m.type === "voice" ? "audio" : m.type,
    texto,
    media_id: media?.id ?? null,
    media_mime: media?.mime_type ?? null,
    media_nombre: m.document?.filename ?? null,
    estado: "recibido",
    error: null,
    autor: null,
    ts: new Date(Number(m.timestamp) * 1000).toISOString(),
  };
}

/** Lo que trae un aviso para ESTE número: mensajes nuevos y cambios de estado. */
export function leerAviso(aviso: AvisoMeta, miNumero: string) {
  const mensajes: FilaNueva[] = [];
  const estados: { wamid: string; estado: string; error?: string }[] = [];
  for (const entrada of aviso.entry ?? []) {
    for (const cambio of entrada.changes ?? []) {
      const v = cambio.value;
      if (cambio.field !== "messages" || !v || v.metadata?.phone_number_id !== miNumero) continue;
      const nombres = new Map((v.contacts ?? []).map((c) => [c.wa_id, c.profile?.name ?? null]));
      for (const m of v.messages ?? []) mensajes.push(filaDeMensaje(m, nombres.get(m.from) ?? null));
      for (const s of v.statuses ?? []) {
        const estado = ESTADOS_META[s.status];
        if (!estado) continue;
        const e = s.errors?.[0];
        estados.push({ wamid: s.id, estado, error: e ? e.message || e.title : undefined });
      }
    }
  }
  return { mensajes, estados };
}
