export type Agenda = "clinica" | "grooming";
export type Canal = "whatsapp" | "instagram" | "facebook";

export interface Mascota {
  nombre: string;
  especie: "Perro" | "Gato";
  raza: string;
  edad: string;
  tamano?: "Pequeño" | "Mediano" | "Grande";
  /** La registró el agente en la conversación (no venía en la base de la clínica). */
  creadaPorIA?: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  canal: Canal;
  mascotas: Mascota[];
  /** Fecha legible de la última visita a cada agenda (texto de demo). */
  ultimaClinica?: string;
  ultimaGrooming?: string;
  etiquetas?: string[];
  /** El cliente pidió no recibir mensajes de marketing. */
  optOutMarketing?: boolean;
  /** Perfil creado por el agente: cliente nuevo que no estaba en la base. */
  creadoPorIA?: boolean;
}

/**
 * Quién atiende la conversación:
 * - ia: la responde el agente.
 * - transferida: el agente la pasó a la secretaria y espera que alguien la tome.
 * - secretaria: una persona la tomó; el agente ya no contesta.
 * - resuelta: cerrada.
 */
export type EstadoConv = "ia" | "transferida" | "secretaria" | "resuelta";

export type MotivoTransferencia = "caso_clinico" | "urgencia" | "excepcion_precio" | "pedido_cliente";

export interface Mensaje {
  id: string;
  autor: "cliente" | "ia" | "secretaria" | "sistema";
  texto: string;
  hora: string;
  plantilla?: string;
  botones?: string[];
}

/** Para qué está la conversación: el agente se enfoca en agendar y reactivar. */
export type Objetivo = "agendar" | "reactivacion" | "recordatorio" | "seguimiento" | "receta" | "informacion";

export interface Conversacion {
  objetivo: Objetivo;
  /** Lo que logró el agente, si ya hay resultado (cita agendada, confirmada…). */
  resultado?: { tipo: "cita" | "confirmada" | "reagendada" | "sin_interes"; texto: string };
  id: string;
  clienteId: string;
  canal: Canal;
  agenda: Agenda | null;
  estado: EstadoConv;
  motivo?: MotivoTransferencia;
  /** Minutos que lleva esperando desde la transferencia. */
  esperaMin?: number;
  noLeidos: number;
  fueraHorario?: boolean;
  hora: string;
  mensajes: Mensaje[];
}

export type EstadoCita =
  | "confirmada"
  | "por_confirmar"
  | "completada"
  | "en_curso"
  | "cancelada"
  | "ausente"
  | "reagendada";

export interface Cita {
  id: string;
  agenda: Agenda;
  clienteId: string;
  mascota: string;
  servicio: string;
  /** Días desde hoy (0 = hoy, -1 = ayer). */
  dia: number;
  hora: string; // "08:30"
  duracionMin: number;
  estado: EstadoCita;
  origen: "ia" | "manual";
}

export type EstadoSeguimiento = "programado" | "enviado" | "respondido" | "nueva_cita" | "transferido";

export interface Seguimiento {
  id: string;
  clienteId: string;
  mascota: string;
  consulta: string;
  fechaConsulta: string;
  regla: string;
  envio: string;
  estado: EstadoSeguimiento;
  respuesta?: string;
}

export type EstadoReactivacion = "detectado" | "contactado" | "respondio" | "cita" | "no_interesado";

/** Tiempo sin visita con el que la secretaria filtra a quién reactivar. */
export type RangoInactividad = "15d" | "1m" | "mas1m";

export interface Reactivacion {
  id: string;
  clienteId: string;
  agenda: Agenda;
  mascota: string;
  ultimoServicio: string;
  /** Días desde la última visita a esa agenda. */
  diasInactivo: number;
  estado: EstadoReactivacion;
}

export interface Plantilla {
  nombre: string;
  categoria: "UTILITY" | "MARKETING";
  agenda: Agenda | "ambas";
  titulo: string;
  cuerpo: string;
  ejemplo: string[];
  botones: string[];
  cuando: string;
  estadoMeta: "Borrador" | "En revisión" | "Aprobada";
  stats: { enviados: number; entregados: number; leidos: number; respondidos: number };
}

export interface ItemReceta {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
}

export type EstadoReceta = "enviada" | "leida" | "duda";

export interface Receta {
  id: string;
  clienteId: string;
  mascota: string;
  hora: string;
  items: ItemReceta[];
  indicaciones?: string;
  /** Fecha de la consulta, como se muestra en el perfil del cliente. */
  fecha?: string;
  estado: EstadoReceta;
}
