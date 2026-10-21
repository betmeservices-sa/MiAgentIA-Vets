// Módulo WhatsApp del panel: GET trae el número y los mensajes, POST responde.
// Las dos pasan por la puerta de sesión del proxy.

import { NextResponse } from "next/server";
import { configurado, datosNumero, enviarTexto, leerMensajes } from "@/lib/whatsapp";

export async function GET() {
  if (!configurado()) return NextResponse.json({ configurado: false, numero: null, mensajes: [] });
  try {
    const [numero, mensajes] = await Promise.all([datosNumero().catch(() => null), leerMensajes()]);
    return NextResponse.json({ configurado: true, numero, mensajes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudieron leer los mensajes" }, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!configurado()) return NextResponse.json({ error: "WhatsApp no está configurado en este ambiente" }, { status: 503 });
  const { telefono, texto } = (await req.json().catch(() => ({}))) as { telefono?: string; texto?: string };
  const destino = telefono?.replace(/\D/g, "");
  const cuerpo = texto?.trim();
  if (!destino || !cuerpo) return NextResponse.json({ error: "Falta el teléfono o el texto" }, { status: 400 });
  try {
    const mensaje = await enviarTexto(destino, cuerpo, "Usuario general");
    return NextResponse.json({ ok: true, mensaje });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "WhatsApp no aceptó el mensaje" }, { status: 502 });
  }
}
