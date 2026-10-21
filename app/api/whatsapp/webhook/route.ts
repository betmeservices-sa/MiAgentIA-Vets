// Webhook propio del número de la clínica. Meta lo llama sin sesión, por eso
// está fuera de la puerta del proxy; lo que lo protege es la firma de la app.

import { NextResponse } from "next/server";
import { actualizarEstado, configurado, firmaValida, guardarMensajes, leerAviso, phoneNumberId, verifyToken, type AvisoMeta } from "@/lib/whatsapp";

// Verificación al registrar la URL en Meta: devuelve el challenge si el token coincide.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  if (configurado() && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === verifyToken()) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  if (!configurado()) return NextResponse.json({ error: "WhatsApp sin configurar" }, { status: 503 });
  const cuerpo = await req.text();
  if (!firmaValida(cuerpo, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let aviso: AvisoMeta;
  try {
    aviso = JSON.parse(cuerpo) as AvisoMeta;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { mensajes, estados } = leerAviso(aviso, phoneNumberId());
  try {
    await guardarMensajes(mensajes);
    for (const s of estados) await actualizarEstado(s.wamid, s.estado, s.error);
  } catch (e) {
    // Con 500 Meta reintenta el aviso más tarde: no se pierde el mensaje.
    console.error("[whatsapp] no se pudo guardar el aviso", e);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
