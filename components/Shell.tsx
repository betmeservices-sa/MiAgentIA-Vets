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
  Menu,
  PawPrint,
  Pill,
  Stethoscope,
  UserRoundSearch,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AGENDA_INFO, etiquetaDia } from "@/lib/format";
import { CITAS, CLINICA, cliente } from "@/lib/seed";
import { StoreProvider, useStore } from "@/lib/store";
import type { Agenda } from "@/lib/types";
import { AgendaPill, Avatar, EstadoCitaPill } from "./ui";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

// Menú lateral: bandeja, acciones (agrupadas), pacientes y dashboard. Calendarios y
// recordatorios viven en la barra de arriba.
const ACCIONES: NavItem[] = [
  { href: "/receta", label: "Receta", Icon: Pill },
  { href: "/seguimiento", label: "Seguimiento", Icon: Stethoscope },
  { href: "/reactivacion", label: "Reactivación", Icon: UserRoundSearch },
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
        <Recordatorios />
      </div>
    </div>
  );
}

// Próximos recordatorios de cita (hoy, mañana y pasado) en un dropdown.
function Recordatorios() {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { conversacionDe, setConvSel } = useStore();

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

  const proximas = CITAS.filter((c) => c.dia >= 0 && c.dia <= 2 && c.estado !== "completada").sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora));
  const pendientes = proximas.filter((c) => c.estado === "por_confirmar").length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className={cn(
          "relative flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12.5px] font-semibold transition",
          abierto ? "border-brand/50 bg-brand/5 text-brand" : "border-line text-[var(--text-2)] hover:bg-surface",
        )}
      >
        <BellRing size={16} />
        <span className="hidden md:inline">Recordatorios</span>
        <ChevronDown size={14} className={cn("hidden transition md:block", abierto && "rotate-180")} />
        {pendientes > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10.5px] font-bold text-white" title={`${pendientes} por confirmar`}>
            {pendientes}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-card shadow-xl">
          <div className="border-b border-line px-4 py-3">
            <p className="text-[14px] font-bold">Recordatorios de cita</p>
            <p className="text-[12px] text-[var(--text-3)]">Hoy, mañana y pasado · {pendientes} por confirmar</p>
          </div>
          <div className="max-h-[60vh] divide-y divide-line overflow-y-auto">
            {proximas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setConvSel(conversacionDe(c.clienteId));
                  setAbierto(false);
                  router.push("/");
                }}
                className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-surface"
                title="Abrir la conversación con el cliente"
              >
                <div className="w-[68px] shrink-0 text-[12px] leading-tight">
                  <p className="font-bold">{etiquetaDia(c.dia)}</p>
                  <p className="text-[var(--text-3)]">{c.hora}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">
                    {c.mascota} <span className="font-normal text-[var(--text-3)]">· {cliente(c.clienteId).nombre}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <AgendaPill agenda={c.agenda} />
                    <EstadoCitaPill estado={c.estado} />
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Link href="/recordatorios" onClick={() => setAbierto(false)} className="block border-t border-line px-4 py-2.5 text-center text-[12.5px] font-semibold text-brand hover:bg-surface">
            Ver todos los recordatorios
          </Link>
        </div>
      )}
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { conversaciones } = useStore();
  const transferidas = conversaciones.filter((c) => c.estado === "transferida").length;
  const enAcciones = ACCIONES.some((a) => activo(pathname, a.href));
  const [accionesAbierto, setAccionesAbierto] = useState(true);

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

        <button
          type="button"
          onClick={() => setAccionesAbierto((a) => !a)}
          aria-expanded={accionesAbierto}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            enAcciones && !accionesAbierto
              ? "bg-brand text-white shadow-sm shadow-brand/25"
              : enAcciones
                ? "text-[var(--text)] hover:bg-surface"
                : "text-[var(--text-2)] hover:bg-surface hover:text-[var(--text)]",
          )}
        >
          <Zap size={18} strokeWidth={2.1} />
          <span className="min-w-0 flex-1 truncate text-left">Acciones</span>
          <ChevronDown size={16} className={cn("transition", accionesAbierto && "rotate-180")} />
        </button>
        {accionesAbierto && (
          <div className="ml-5 space-y-1 border-l border-line pl-2">
            {ACCIONES.map((a) => (
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
  onClick,
  compacto,
}: NavItem & { activo: boolean; aviso?: number; onClick: () => void; compacto?: boolean }) {
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
        <span className={cn("flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold", a ? "bg-white/25 text-white" : "bg-[#dc2626] text-white")}>
          {aviso}
        </span>
      )}
    </Link>
  );
}
