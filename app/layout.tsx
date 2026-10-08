import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Patitas · Centro de Comunicación Veterinario",
  description: "Demo MiAgentIA para clínicas veterinarias: bandeja omnicanal, agendas de clínica y grooming, seguimiento, recordatorios y reactivación.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
