// Arma el PDF de una receta: encabezado de la clínica, paciente, medicamentos,
// indicaciones y firma. jsPDF se carga solo al usarse (no entra en el servidor).

import { CLINICA, STAFF, cliente } from "./seed";
import { isoDeTexto } from "./format";
import type { Receta } from "./types";

const VERDE: [number, number, number] = [15, 118, 110];
const GRIS: [number, number, number] = [92, 106, 122];
const TEXTO: [number, number, number] = [22, 32, 44];

export function nombreArchivo(r: Receta) {
  const f = isoDeTexto(r.fecha).replace(/-/g, "");
  return `Receta_${r.mascota}_${f}.pdf`;
}

export async function recetaPdf(r: Receta) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const cli = cliente(r.clienteId);
  const m = cli.mascotas.find((x) => x.nombre === r.mascota);
  const ancho = doc.internal.pageSize.getWidth();
  const X = 20;
  const W = ancho - X * 2;
  let y = 22;

  // Encabezado
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...VERDE);
  doc.text(CLINICA.nombre, X, y);
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...GRIS);
  doc.text(`${CLINICA.ciudad} · Tel. 2222-3344 · Urgencias fuera de horario: 2333-4455`, X, (y += 6));
  const [a, mes, d] = isoDeTexto(r.fecha).split("-").map(Number);
  const fecha = new Date(a, mes - 1, d).toLocaleDateString("es-SV", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(10).text(`Fecha: ${fecha}`, ancho - X, 22, { align: "right" });
  doc.setDrawColor(...VERDE).setLineWidth(0.8).line(X, (y += 4), ancho - X, y);

  // Paciente y dueño
  y += 9;
  const dato = (label: string, valor: string, x: number) => {
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...TEXTO).text(`${label}: `, x, y);
    const w = doc.getTextWidth(`${label}: `);
    doc.setFont("helvetica", "normal").text(valor, x + w, y);
  };
  dato("Paciente", r.mascota, X);
  dato("Dueño", cli.nombre, X + W / 2);
  y += 6;
  dato("Especie / raza", m ? `${m.especie} · ${m.raza}` : "—", X);
  dato("Teléfono", cli.telefono, X + W / 2);
  y += 6;
  dato("Edad", m?.edad ?? "—", X);
  dato("Correo", cli.correo, X + W / 2);

  // Medicamentos
  y += 14;
  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(...VERDE).text("Medicamentos", X, y);
  y += 4;
  r.items.forEach((it, i) => {
    y += 9;
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...TEXTO);
    const titulo = doc.splitTextToSize(`${i + 1}. ${it.medicamento}`, W);
    doc.text(titulo, X, y);
    y += titulo.length * 5.5;
    const detalle = [it.dosis, it.frecuencia, it.duracion].filter((t) => t.trim()).join(" · ");
    if (detalle) {
      doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(...GRIS);
      const lineas = doc.splitTextToSize(detalle, W - 6);
      doc.text(lineas, X + 6, y);
      y += lineas.length * 5;
    }
  });

  // Indicaciones
  if (r.indicaciones) {
    y += 8;
    const lineas = doc.splitTextToSize(r.indicaciones, W - 8);
    const alto = 10 + lineas.length * 5;
    doc.setFillColor(244, 246, 249).roundedRect(X, y - 5, W, alto, 2, 2, "F");
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...TEXTO).text("Indicaciones", X + 4, y + 1);
    doc.setFont("helvetica", "normal").setTextColor(...GRIS).text(lineas, X + 4, y + 7);
    y += alto;
  }

  // Firma
  const yFirma = Math.max(y + 35, 225);
  doc.setDrawColor(...GRIS).setLineWidth(0.3).line(ancho - X - 70, yFirma, ancho - X, yFirma);
  doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...TEXTO).text(STAFF.veterinario.nombre, ancho - X - 35, yFirma + 5, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GRIS).text("Médico veterinario", ancho - X - 35, yFirma + 10, { align: "center" });

  doc.setFontSize(8).text("Ante cualquier duda sobre el tratamiento, comuníquese con la clínica.", ancho / 2, 262, { align: "center" });
  return doc;
}

/** Descarga el PDF de la receta. */
export async function descargarReceta(r: Receta) {
  const doc = await recetaPdf(r);
  doc.save(nombreArchivo(r));
}

/** Abre el PDF en una pestaña nueva para revisarlo antes de enviar. */
export async function verReceta(r: Receta) {
  // La pestaña se abre antes de generar el PDF para que el navegador no la bloquee.
  const w = window.open("", "_blank");
  const doc = await recetaPdf(r);
  const url = String(doc.output("bloburl"));
  if (w) w.location.href = url;
  else window.open(url, "_blank");
}
