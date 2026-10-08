import { NextResponse } from "next/server";
import { CLAVE, COOKIE, DURACION_S, firmaSesion, USUARIO } from "@/lib/session";

export async function POST(req: Request) {
  const { usuario, password } = (await req.json().catch(() => ({}))) as { usuario?: string; password?: string };
  const ok = usuario?.trim().toLowerCase() === USUARIO.toLowerCase() && password === CLAVE;
  if (!ok) {
    // Un poco de espera para que adivinar claves no sea gratis.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await firmaSesion(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_S,
  });
  return res;
}
