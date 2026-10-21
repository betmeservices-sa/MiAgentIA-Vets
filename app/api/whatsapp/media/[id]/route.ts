// Fotos, audios y documentos que mandan los clientes. Meta solo los entrega con
// el token del servidor, así que el panel los pide por aquí (detrás de la sesión).

import { NextResponse } from "next/server";
import { bajarMedia, configurado } from "@/lib/whatsapp";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!configurado()) return NextResponse.json({ error: "WhatsApp sin configurar" }, { status: 503 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Adjunto inválido" }, { status: 400 });
  try {
    const { cuerpo, mime } = await bajarMedia(id);
    return new Response(cuerpo, { headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo bajar el adjunto" }, { status: 502 });
  }
}
