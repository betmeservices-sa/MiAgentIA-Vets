// Puerta del demo: sin cookie de sesión válida, toda página manda a /login.
// Se llama proxy.ts (no middleware.ts) porque así lo pide Next 16.

import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, sesionValida } from "@/lib/session";

// El webhook de WhatsApp lo llama Meta sin sesión: lo protege la firma de la app.
const PUBLICAS = ["/login", "/api/login", "/api/logout", "/api/whatsapp/webhook"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLICAS.includes(pathname)) return NextResponse.next();
  if (await sesionValida(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|brand/|favicon.ico).*)"],
};
