"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BellRing,
  BookOpen,
  CalendarDays,
  ConciergeBell,
  FileText,
  HeartPulse,
  Inbox,
  Lock,
  LogOut,
  Menu,
  MessageSquareText,
  PawPrint,
  Pill,
  Stethoscope,
  Users,
  X,
  type LucideIcon,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CLINICA, STAFF } from "@/lib/seed";
import { StoreProvider, useStore } from "@/lib/store";
import type { Rol } from "@/lib/types";
import { Avatar } from "./ui";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  roles: Rol[];
}

const NAV: NavItem[] = [
  { href: "/", label: "Bandeja", Icon: Inbox, roles: ["secretaria"] },
  { href: "/clientes", label: "Clientes y mascotas", Icon: Users, roles: ["secretaria", "veterinario"] },
  { href: "/hoy", label: "Hoy", Icon: ConciergeBell, roles: ["secretaria", "veterinario", "groomer"] },
  { href: "/agendas", label: "Agendas", Icon: CalendarDays, roles: ["secretaria", "veterinario", "groomer"] },
  { href: "/recordatorios", label: "Recordatorios", Icon: BellRing, roles: ["secretaria"] },
  { href: "/seguimiento", label: "Seguimiento", Icon: Stethoscope, roles: ["secretaria", "veterinario"] },
  { href: "/receta", label: "Receta digital", Icon: Pill, roles: ["veterinario"] },
  { href: "/reactivacion", label: "Reactivación", Icon: UserRoundSearch, roles: ["secretaria"] },
  { href: "/plantillas", label: "Plantillas WhatsApp", Icon: MessageSquareText, roles: ["secretaria"] },
  { href: "/dashboard", label: "Dashboard", Icon: BarChart3, roles: ["secretaria", "veterinario"] },
  { href: "/conocimiento", label: "Info aprobada", Icon: BookOpen, roles: ["secretaria", "veterinario"] },
  { href: "/producto", label: "Documento de producto", Icon: FileText, roles: ["secretaria", "veterinario", "groomer"] },
];

const ROLES: { id: Rol; label: string }[] = [
  { id: "secretaria", label: "Secretaria" },
  { id: "veterinario", label: "Veterinario" },
  { id: "groomer", label: "Groomer" },
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
  const pathname = usePathname();
  const router = useRouter();
  const { rol } = useStore();
  const item = NAV.find((n) => activo(pathname, n.href));
  const permitido = !item || item.roles.includes(rol);
  // Fechas, horas libres y rol guardado dependen del navegador: se pinta
  // después de montar para que el HTML del servidor no choque con el cliente.
  const [listo, setListo] = useState(false);
  useEffect(() => setListo(true), []);

  useEffect(() => {
    if (!permitido) router.replace("/hoy");
  }, [permitido, router]);

  return (
    <div className="flex h-screen overflow-hidden">
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-card px-4 py-2.5 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-surface">
            <Menu size={22} />
          </button>
          <span className="text-sm font-extrabold tracking-tight">{CLINICA.nombre}</span>
        </div>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {!listo ? null : permitido ? (
            children
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Lock size={26} className="text-[var(--text-3)]" />
              <p className="font-bold">Sección restringida para este perfil</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { rol, setRol, conversaciones } = useStore();
  const yo = STAFF[rol];
  const transferidas = conversaciones.filter((c) => c.estado === "transferida").length;

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
        {NAV.filter((n) => n.roles.includes(rol)).map(({ href, label, Icon }) => {
          const a = activo(pathname, href);
          const aviso = href === "/" ? transferidas : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                a ? "bg-brand text-white shadow-sm shadow-brand/25" : "text-[var(--text-2)] hover:bg-surface hover:text-[var(--text)]",
              )}
            >
              <Icon size={18} strokeWidth={2.1} />
              <span className="min-w-0 flex-1 truncate">{label}</span>
              {aviso > 0 && (
                <span className={cn("flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10.5px] font-bold", a ? "bg-white/25 text-white" : "bg-[#dc2626] text-white")}>
                  {aviso}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-line p-3">
        <div>
          <p className="mb-1.5 px-1 text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-3)]">Ver como</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRol(r.id)}
                className={cn(
                  "rounded-lg px-1 py-1.5 text-[11.5px] font-semibold transition",
                  rol === r.id ? "bg-card text-[var(--text)] shadow-sm" : "text-[var(--text-3)] hover:text-[var(--text)]",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <Avatar nombre={yo.nombre} color={yo.color} size={34} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{yo.nombre}</p>
            <p className="truncate text-[11px] text-[var(--text-3)]">{yo.cargo}</p>
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
