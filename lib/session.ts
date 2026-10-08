// Sesión del demo: una cookie httpOnly con una firma HMAC. Solo prueba que
// quien la tiene escribió la clave; el demo no tiene usuarios individuales.
// Funciona igual en el proxy (edge) y en las rutas de API (Web Crypto).

export const COOKIE = "vet_sesion";
export const DURACION_S = 60 * 60 * 24 * 7;

export const USUARIO = process.env.DEMO_USER ?? "demoveterinaria";
export const CLAVE = process.env.DEMO_PASSWORD ?? "democ";
const SECRETO = process.env.SESSION_SECRET ?? "patitas-demo-secreto-local";

export async function firmaSesion(): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRETO), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`vet-demo:${USUARIO}:${CLAVE}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sesionValida(valor: string | undefined): Promise<boolean> {
  if (!valor) return false;
  return valor === (await firmaSesion());
}
