"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BellRing,
  CalendarDays,
  ChevronDown,
  HeartPulse,
  Inbox,
  LogOut,
  Megaphone,
  MessageSquareText,
  Menu,
  PawPrint,
  Stethoscope,
  UserRoundSearch,
  Users,
  X,
  Send,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO } from "@/lib/format";
import { CITAS, CLINICA, cliente } from "@/lib/seed";
import { StoreProvider, useStore } from "@/lib/store";
import type { Agenda } from "@/lib/types";
import { Avatar } from "./ui";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

// Menú lateral: bandeja, marketing (agrupado), pacientes y dashboard. Calendarios y
// recordatorios viven en la barra de arriba.
const MARKETING: NavItem[] = [
  { href: "/reactivacion", label: "Reactivación", Icon: UserRoundSearch },
  { href: "/seguimiento", label: "Seguimiento", Icon: Stethoscope },
  { href: "/publicaciones", label: "Publicaciones", Icon: Send },
  { href: "/plantillas", label: "Plantillas WhatsApp", Icon: MessageSquareText },
];

const CALENDARIOS: { id: Agenda; label: string }[] = [
  { id: "clinica", label: "Veterinaria" },
  { id: "grooming", label: "Grooming" },
];

function activo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return (
    <StoreProvider>
      <Layout>{children}</Layout>
    </StoreProvider>
  );
}

function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Fechas y horas libres dependen del navegador: se pinta después de montar
  // para que el HTML del servidor no choque con el cliente.
  const [listo, setListo] = useState(false);
  useEffect(() => setListo(true), []);

  return (
    <div className="flex h-screen overflow-hidden">
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenu={() => setOpen(true)} />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{listo ? children : null}</main>
      </div>
    </div>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { calendario, setCalendario } = useStore();
  const enAgendas = pathname.startsWith("/agendas");

  return (
    <div className="relative z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-card px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={onMenu} aria-label="Abrir menú" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-surface lg:hidden">
          <Menu size={22} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)] md:flex">
          <CalendarDays size={14} /> Calendarios
        </span>
        <div className="inline-flex rounded-xl border border-line bg-surface p-1">
          {CALENDARIOS.map((c) => {
            const on = enAgendas && calendario === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCalendario(c.id);
                  router.push("/agendas");
                }}
                className={cn("rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition sm:px-4", on ? "text-white shadow-sm" : "text-[var(--text-2)] hover:bg-card")}
                style={on ? { backgroundColor: AGENDA_INFO[c.id].color } : undefined}
                aria-pressed={on}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Urgencias />
      </div>
    </div>
  );
}

/** Abre y cierra un dropdown; se cierra al hacer clic fuera o con Escape. */
function useDropdown() {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);
  return { abierto, setAbierto, ref };
}

function BotonAviso({
  abierto,
  onClick,
  Icon,
  label,
  n,
  color,
  titulo,
  tono,
}: {
  abierto: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
  n: number;
  color: string;
  titulo: string;
  tono: "rojo" | "neutro";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={abierto}
      className={cn(
        "relative flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12.5px] font-semibold transition",
        abierto
          ? tono === "rojo"
            ? "border-rose-300 bg-rose-50 text-rose-700"
            : "border-brand/50 bg-brand/5 text-brand"
          : tono === "rojo" && n > 0
            ? "border-rose-200 text-rose-700 hover:bg-rose-50"
            : "border-line text-[var(--text-2)] hover:bg-surface",
      )}
    >
      <Icon size={16} />
      <span className="hidden md:inline">{label}</span>
      <ChevronDown size={14} className={cn("hidden transition md:block", abierto && "rotate-180")} />
      {n > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold text-white ring-2 ring-card"
          style={{ backgroundColor: color }}
          title={titulo}
        >
          {n}
        </span>
      )}
    </button>
  );
}

// Urgencias: conversaciones que MIA pasó a la clínica y esperan respuesta.
// Solo cliente y mascota; al tocar una se abre en la bandeja.
function Urgencias() {
  const { abierto, setAbierto, ref } = useDropdown();
  const router = useRouter();
  const { conversaciones, setConvSel } = useStore();
  const esperando = conversaciones
    .filter((c) => c.estado === "transferida")
    .sort((a, b) => Number(b.motivo === "urgencia") - Number(a.motivo === "urgencia") || (b.esperaMin ?? 0) - (a.esperaMin ?? 0));

  return (
    <div ref={ref} className="relative">
      <BotonAviso
        abierto={abierto}
        onClick={() => setAbierto((a) => !a)}
        Icon={Siren}
        label="Urgencias"
        n={esperando.length}
        color="#dc2626"
        titulo={`${esperando.length} conversaciones esperan respuesta urgente de la clínica`}
        tono="rojo"
      />
      {abierto && (
        <div className="absolute right-0 z-40 mt-2 max-h-[80vh] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-2xl border border-line bg-card shadow-xl">
          <div className="flex items-center justify-between bg-rose-50 px-4 py-3">
            <div>
              <p className="text-[14px] font-bold text-rose-800">Esperan respuesta de la clínica</p>
              <p className="text-[12px] text-rose-700/80">MIA las pasó y dejó de responder</p>
            </div>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1.5 text-[11px] font-bold text-white">{esperando.length}</span>
          </div>
          {esperando.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-[var(--text-3)]">Nada urgente por ahora.</p>}
          <div className="divide-y divide-line">
            {esperando.map((c) => {
              const cli = cliente(c.clienteId);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setConvSel(c.id);
                    setAbierto(false);
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface"
                  title="Abrir la conversación"
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", c.motivo === "urgencia" ? "bg-[#dc2626]" : "bg-amber-500")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{cli.nombre}</span>
                    <span className="flex items-center gap-1 truncate text-[12px] text-[var(--text-2)]">
                      <PawPrint size={11} className="shrink-0 text-[var(--text-3)]" /> {cli.mascotas.map((m) => m.nombre).join(", ")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { conversaciones } = useStore();
  const transferidas = conversaciones.filter((c) => c.estado === "transferida").length;
  // Citas de hoy a pasado mañana que siguen sin confirmar (burbuja naranja).
  const porConfirmar = CITAS.filter((c) => c.dia >= 0 && c.dia <= 2 && c.estado === "por_confirmar").length;
  const enMarketing = MARKETING.some((a) => activo(pathname, a.href));
  const [marketingAbierto, setMarketingAbierto] = useState(true);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-card transition-transform lg:static lg:z-auto lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
            <PawPrint size={20} strokeWidth={2.4} />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight">Patitas</p>
            <p className="text-[11px] font-medium text-brand">Clínica veterinaria · MiAgentIA</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar menú" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-surface lg:hidden">
          <X size={18} />
        </button>
      </div>

      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
          <HeartPulse size={15} className="text-[#146c43]" />
          <p className="text-[12px] font-semibold text-[var(--text-2)]">
            Agente <span className="text-[var(--text)]">{CLINICA.agente}</span> activo
          </p>
          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink href="/" label="Bandeja" Icon={Inbox} activo={activo(pathname, "/")} aviso={transferidas} onClick={onClose} />
        <NavLink href="/recordatorios" label="Recordatorios" Icon={BellRing} activo={activo(pathname, "/recordatorios")} aviso={porConfirmar} avisoColor="#f59e0b" onClick={onClose} />

        <button
          type="button"
          onClick={() => setMarketingAbierto((a) => !a)}
          aria-expanded={marketingAbierto}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            enMarketing && !marketingAbierto
              ? "bg-brand text-white shadow-sm shadow-brand/25"
              : enMarketing
                ? "text-[var(--text)] hover:bg-surface"
                : "text-[var(--text-2)] hover:bg-surface hover:text-[var(--text)]",
          )}
        >
          <Megaphone size={18} strokeWidth={2.1} />
          <span className="min-w-0 flex-1 truncate text-left">Marketing</span>
          <ChevronDown size={16} className={cn("transition", marketingAbierto && "rotate-180")} />
        </button>
        {marketingAbierto && (
          <div className="ml-5 space-y-1 border-l border-line pl-2">
            {MARKETING.map((a) => (
              <NavLink key={a.href} {...a} activo={activo(pathname, a.href)} onClick={onClose} compacto />
            ))}
          </div>
        )}

        <NavLink href="/pacientes" label="Pacientes" Icon={Users} activo={activo(pathname, "/pacientes")} onClick={onClose} />
        <NavLink href="/dashboard" label="Dashboard" Icon={BarChart3} activo={activo(pathname, "/dashboard")} onClick={onClose} />
      </nav>

      <div className="space-y-3 border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar nombre={CLINICA.corto} color="var(--brand-blue)" size={34} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">Usuario general</p>
            <p className="truncate text-[11px] text-[var(--text-3)]">{CLINICA.nombre}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.assign("/login");
            }}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] transition hover:bg-red-50 hover:text-[#a32923]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  Icon,
  activo: a,
  aviso = 0,
  avisoColor = "#dc2626",
  onClick,
  compacto,
}: NavItem & { activo: boolean; aviso?: number; avisoColor?: string; onClick: () => void; compacto?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 font-semibold transition",
        compacto ? "py-2 text-[13px]" : "py-2.5 text-sm",
        a ? "bg-brand text-white shadow-sm shadow-brand/25" : "text-[var(--text-2)] hover:bg-surface hover:text-[var(--text)]",
      )}
    >
      <Icon size={compacto ? 16 : 18} strokeWidth={2.1} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {aviso > 0 && (
        <span
          className={cn("flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold text-white", a && "bg-white/25")}
          style={a ? undefined : { backgroundColor: avisoColor }}
        >
          {aviso}
        </span>
      )}
    </Link>
  );
}
