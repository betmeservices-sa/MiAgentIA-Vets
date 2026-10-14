import type {
  Cita,
  Receta,
  Cliente,
  Conversacion,
  Plantilla,
  RangoInactividad,
  Reactivacion,
  Seguimiento,
  Visita,
  ResumenConsulta,
  Nota,
  Post,
  Campana,
} from "./types";
import { fechaDe, iso, isoDeTexto } from "./format";

// Datos de demo de una clínica veterinaria ficticia en Guatemala. Todo lo que
// el agente "sabe" sale de CONOCIMIENTO: es la información aprobada por la
// clínica y nada más.

export const CLINICA = {
  nombre: "Clínica Veterinaria Patitas",
  corto: "Patitas",
  ciudad: "Ciudad de Guatemala",
  agente: "Luna",
};

export const STAFF = {
  secretaria: { nombre: "Andrea López", cargo: "Secretaria / recepción", iniciales: "AL", color: "#7c3aed" },
  veterinario: { nombre: "Dr. Carlos Méndez", cargo: "Médico veterinario", iniciales: "CM", color: "#0f766e" },
  groomer: { nombre: "Luis Ramírez", cargo: "Groomer", iniciales: "LR", color: "#b45309" },
} as const;

export const CALENDARIOS = {
  clinica: {
    nombre: "Agenda Clínica · Dr. Méndez",
    cuenta: "dr.mendez@patitasvet.gt",
    horario: "Lun a Vie 8:00–18:00 · Sáb 8:00–13:00",
  },
  grooming: {
    nombre: "Agenda Grooming · Luis",
    cuenta: "grooming@patitasvet.gt",
    horario: "Lun a Sáb 8:00–16:00",
  },
} as const;

export const CONOCIMIENTO = {
  clinica: [
    { servicio: "Consulta general", duracion: "30 min", precio: "Por definir" },
    { servicio: "Vacuna múltiple (perro / gato)", duracion: "20 min", precio: "Por definir" },
    { servicio: "Vacuna antirrábica", duracion: "15 min", precio: "Por definir" },
    { servicio: "Desparasitación", duracion: "15 min", precio: "Por definir (según peso)" },
    { servicio: "Control post consulta", duracion: "20 min", precio: "Sin costo dentro de 15 días" },
    { servicio: "Esterilización", duracion: "Requiere evaluación", precio: "Se cotiza tras consulta" },
  ],
  grooming: [
    { servicio: "Baño (pequeño / mediano / grande)", duracion: "1 – 2 h", precio: "Por definir" },
    { servicio: "Baño y corte (pequeño / mediano / grande)", duracion: "1.5 – 2.5 h", precio: "Por definir" },
    { servicio: "Corte de uñas", duracion: "15 min", precio: "Por definir" },
    { servicio: "Limpieza de oídos", duracion: "15 min", precio: "Por definir" },
  ],
  politicas: [
    "Las citas se confirman 24 h antes; si no se confirma, la secretaria llama.",
    "Tolerancia de llegada: 15 minutos. Después se reagenda.",
    "Grooming: se entrega a la hora que indique el groomer; se avisa por WhatsApp.",
    "Formas de pago: efectivo, tarjeta y transferencia.",
    "Urgencias en horario: llamar al 2222-3344. Fuera de horario: Hospital Veterinario 24 h (2333-4455).",
  ],
};

export const CLIENTES: Cliente[] = [
  { id: "c1", nombre: "María José Pérez", telefono: "+502 5512 3344", correo: "mariajose.perez@gmail.com", canal: "whatsapp", mascotas: [{ nombre: "Max", especie: "Perro", raza: "Labrador", edad: "3 años", tamano: "Grande", contactos: [{ nombre: "Jorge Pérez", telefono: "+502 5598 1200", relacion: "Esposo de María José", creadoPorIA: true, desde: "Hoy" }, { nombre: "Valentina Pérez", telefono: "+502 4120 5566", relacion: "Hija de María José", creadoPorIA: true, desde: "Hoy" }] }], ultimaClinica: "12 ago 2026", ultimaGrooming: "20 sep 2026", etiquetas: ["Cliente frecuente"] },
  { id: "c2", nombre: "Jorge Castillo", telefono: "+502 4421 9087", correo: "jorge.castillo@hotmail.com", canal: "instagram", mascotas: [{ nombre: "Toby", especie: "Perro", raza: "Schnauzer", edad: "5 años", tamano: "Mediano" }, { nombre: "Bimba", especie: "Perro", raza: "Cocker spaniel", edad: "2 años", tamano: "Mediano", creadaPorIA: true }], ultimaGrooming: "15 jul 2026" },
  { id: "c3", nombre: "Ana Lucía Morales", telefono: "+502 3098 7765", correo: "analucia.morales@yahoo.com", canal: "whatsapp", mascotas: [{ nombre: "Coco", especie: "Perro", raza: "Beagle", edad: "2 años", tamano: "Mediano" }], ultimaClinica: "3 sep 2026" },
  { id: "c4", nombre: "Roberto Gálvez", telefono: "+502 5590 1123", correo: "roberto.galvez@outlook.com", canal: "facebook", mascotas: [{ nombre: "Rocky", especie: "Perro", raza: "Pastor alemán", edad: "4 años", tamano: "Grande", contactos: [{ nombre: "Ana de Gálvez", telefono: "+502 5590 7781", relacion: "Esposa de Roberto", desde: "2 ago 2026" }] }, { nombre: "Luna", especie: "Perro", raza: "Pastor alemán", edad: "4 años", tamano: "Grande", contactos: [{ nombre: "Ana de Gálvez", telefono: "+502 5590 7781", relacion: "Esposa de Roberto", desde: "2 ago 2026" }] }, { nombre: "Thor", especie: "Perro", raza: "Husky", edad: "2 años", tamano: "Grande" }], ultimaGrooming: "2 ago 2026" },
  { id: "c5", nombre: "Sofía Herrera", telefono: "+502 4789 2210", correo: "sofia.herrera@gmail.com", canal: "whatsapp", mascotas: [{ nombre: "Mishi", especie: "Gato", raza: "Siamés", edad: "6 años" }], ultimaClinica: "18 sep 2026" },
  { id: "c6", nombre: "Daniel Ortiz", telefono: "+502 5023 4471", correo: "daniel.ortiz@hotmail.com", canal: "whatsapp", mascotas: [{ nombre: "Bruno", especie: "Perro", raza: "Bulldog francés", edad: "3 años", tamano: "Pequeño" }], ultimaClinica: "3 oct 2026" },
  { id: "c7", nombre: "Gabriela Rivas", telefono: "+502 3345 8890", correo: "gabriela.rivas@yahoo.com", canal: "whatsapp", mascotas: [{ nombre: "Lola", especie: "Perro", raza: "Poodle", edad: "7 años", tamano: "Pequeño" }], ultimaGrooming: "28 may 2026" },
  { id: "c8", nombre: "Luis Fernando Ac", telefono: "+502 4612 7789", correo: "luisfernando.ac@outlook.com", canal: "instagram", mascotas: [{ nombre: "Simba", especie: "Gato", raza: "Doméstico", edad: "1 año" }] },
  { id: "c9", nombre: "Carmen Estrada", telefono: "+502 5534 0012", correo: "carmen.estrada@gmail.com", canal: "whatsapp", mascotas: [{ nombre: "Canela", especie: "Perro", raza: "Chihuahua", edad: "9 años", tamano: "Pequeño" }], ultimaClinica: "10 jun 2026" },
  { id: "c10", nombre: "Pedro Juárez", telefono: "+502 4098 5521", correo: "pedro.juarez@hotmail.com", canal: "facebook", mascotas: [{ nombre: "Kira", especie: "Perro", raza: "Golden retriever", edad: "8 años", tamano: "Grande" }], ultimaClinica: "22 sep 2026" },
  { id: "c11", nombre: "Valeria Monzón", telefono: "+502 3321 6654", correo: "valeria.monzon@yahoo.com", canal: "whatsapp", mascotas: [{ nombre: "Peluche", especie: "Perro", raza: "Shih tzu", edad: "4 años", tamano: "Pequeño" }], ultimaGrooming: "9 sep 2026" },
  { id: "c12", nombre: "Héctor Pineda", telefono: "+502 5876 4432", correo: "hector.pineda@outlook.com", canal: "whatsapp", mascotas: [{ nombre: "Nala", especie: "Gato", raza: "Persa", edad: "5 años" }], ultimaClinica: "14 feb 2026", optOutMarketing: false },
  { id: "c13", nombre: "Lucía Barrios", telefono: "+502 4455 1290", correo: "lucia.barrios@gmail.com", canal: "whatsapp", mascotas: [{ nombre: "Firulais", especie: "Perro", raza: "Mestizo", edad: "6 años", tamano: "Mediano" }], ultimaClinica: "1 mar 2026" },
  { id: "c14", nombre: "Andrés Cifuentes", telefono: "+502 3011 7766", correo: "andres.cifuentes@hotmail.com", canal: "whatsapp", mascotas: [{ nombre: "Oreo", especie: "Gato", raza: "Doméstico", edad: "3 años" }], ultimaClinica: "20 sep 2026" },
  { id: "c15", nombre: "Paola Sandoval", telefono: "+502 5210 3398", correo: "paola.sandoval@yahoo.com", canal: "instagram", mascotas: [{ nombre: "Chispa", especie: "Perro", raza: "Yorkshire", edad: "2 años", tamano: "Pequeño" }], ultimaGrooming: "1 abr 2026" },
  { id: "c16", nombre: "Miguel Ángel Reyes", telefono: "+502 4987 6610", correo: "miguelangel.reyes@outlook.com", canal: "whatsapp", mascotas: [{ nombre: "Duke", especie: "Perro", raza: "Rottweiler", edad: "5 años", tamano: "Grande" }], ultimaClinica: "5 ene 2026" },
  { id: "c17", nombre: "Fernanda Coronado", telefono: "+502 3678 2201", correo: "fernanda.coronado@gmail.com", canal: "whatsapp", mascotas: [{ nombre: "Pelusa", especie: "Gato", raza: "Angora", edad: "4 años" }], ultimaGrooming: "10 mar 2026" },
  { id: "c18", nombre: "José Luis Recinos", telefono: "+502 5543 8812", correo: "joseluis.recinos@hotmail.com", canal: "facebook", mascotas: [{ nombre: "Rex", especie: "Perro", raza: "Boxer", edad: "6 años", tamano: "Grande" }], ultimaClinica: "30 abr 2026" },
  { id: "c19", nombre: "Diana Velásquez", telefono: "+502 5678 1122", correo: "diana.velasquez@yahoo.com", canal: "whatsapp", creadoPorIA: true, mascotas: [{ nombre: "Rocco", especie: "Perro", raza: "Golden retriever", edad: "10 meses", tamano: "Grande", creadaPorIA: true }] },
  { id: "c20", nombre: "Kevin Ajú", telefono: "+502 3190 4456", correo: "kevin.aju@outlook.com", canal: "whatsapp", creadoPorIA: true, mascotas: [{ nombre: "Michi", especie: "Gato", raza: "Doméstico", edad: "4 meses", creadaPorIA: true }] },
];

export const CONVERSACIONES: Conversacion[] = [
  {
    id: "v3", objetivo: "agendar", clienteId: "c3", canal: "whatsapp", agenda: "clinica", estado: "transferida", motivo: "urgencia", esperaMin: 2, noLeidos: 2, hora: "10:42",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola, urgente!! Coco se comió media barra de chocolate hace como 20 minutos", hora: "10:41" },
      { id: "m2", autor: "ia", texto: "Ana Lucía, gracias por escribir de inmediato. No puedo darte indicaciones médicas, pero esto lo tiene que ver el equipo de la clínica ahora mismo. Te estoy comunicando con Andrea en este momento. Si prefieres, también puedes llamar ya al 2222-3344.", hora: "10:41" },
      { id: "m3", autor: "sistema", texto: "Transferida a secretaria · Motivo: posible urgencia (ingesta de chocolate). El agente dejó de responder.", hora: "10:41" },
      { id: "m4", autor: "cliente", texto: "Ok, estoy esperando", hora: "10:42" },
    ],
  },
  {
    id: "v21", objetivo: "agendar", clienteId: "c18", canal: "facebook", agenda: "clinica", estado: "secretaria", motivo: "urgencia", noLeidos: 0, hora: "10:20",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Buenas, Rex tiene la panza muy inflada y quiere vomitar pero no saca nada. Está muy inquieto", hora: "10:14" },
      { id: "m2", autor: "ia", texto: "José Luis, gracias por avisarnos. No puedo darte indicaciones médicas, pero esto lo tiene que ver el equipo de la clínica de inmediato. Te comunico ahora con Andrea. También puedes llamar al 2222-3344.", hora: "10:14" },
      { id: "m3", autor: "sistema", texto: "Transferida a secretaria · Motivo: posible urgencia (abdomen inflado y arcadas sin vómito). El agente dejó de responder.", hora: "10:14" },
      { id: "m4", autor: "sistema", texto: "Andrea López tomó la conversación. El agente dejó de responder.", hora: "10:16" },
      { id: "m5", autor: "secretaria", texto: "José Luis, tráelo ya por favor. Le aviso al Dr. Méndez para que lo reciba apenas llegues.", hora: "10:17" },
      { id: "m6", autor: "cliente", texto: "Vamos saliendo, llegamos en 20 minutos", hora: "10:20" },
    ],
  },
  {
    id: "v6", objetivo: "seguimiento", clienteId: "c6", canal: "whatsapp", agenda: "clinica", estado: "transferida", motivo: "caso_clinico", esperaMin: 14, noLeidos: 1, hora: "10:30",
    mensajes: [
      { id: "m1", autor: "ia", texto: "Hola Daniel, te escribimos de Clínica Veterinaria Patitas para saber cómo sigue Bruno después de su consulta del 3 de octubre. ¿Cómo ha estado? Cuéntanos si notas algún cambio.", hora: "09:00", plantilla: "seguimiento_consulta", botones: ["Está mejor", "Sigue igual", "Hablar con la clínica"] },
      { id: "m2", autor: "cliente", texto: "Sigue igual. Todavía cojea de la pata de atrás y no quiere subir gradas", hora: "10:29" },
      { id: "m3", autor: "ia", texto: "Gracias por contarnos, Daniel. Le paso tu respuesta al equipo de la clínica para que el Dr. Méndez la revise. Andrea te escribe en un momento.", hora: "10:29" },
      { id: "m4", autor: "sistema", texto: "Transferida a secretaria · Motivo: seguimiento con síntoma persistente (caso clínico).", hora: "10:30" },
    ],
  },
  {
    id: "v4", objetivo: "agendar", clienteId: "c4", canal: "facebook", agenda: "grooming", estado: "transferida", motivo: "excepcion_precio", esperaMin: 26, noLeidos: 1, hora: "10:18",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Buenas, cuánto cobran por bañar 3 perros grandes? Si llevo los 3 me hacen descuento?", hora: "10:16" },
      { id: "m2", autor: "ia", texto: "¡Hola Roberto! Con gusto te ayudo con el baño de los 3. Sobre un precio especial por los 3, eso lo autoriza directamente la clínica: te comunico con Andrea para que te confirme.", hora: "10:16" },
      { id: "m3", autor: "sistema", texto: "Transferida a secretaria · Motivo: excepción de precio (descuento por 3 mascotas).", hora: "10:17" },
      { id: "m4", autor: "cliente", texto: "Va, gracias", hora: "10:18" },
    ],
  },
  {
    id: "v31", objetivo: "recordatorio", resultado: { tipo: "confirmada", texto: "Clínica · mañana 11:30" }, clienteId: "c1", canal: "whatsapp", agenda: "clinica", estado: "ia", noLeidos: 0, hora: "10:27",
    contacto: { nombre: "Valentina Pérez", telefono: "+502 4120 5566", relacion: "Hija de María José", mascota: "Max" },
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola! Max Pérez tiene vacuna mañana, mi mamá no puede ir. ¿Lo puedo llevar yo?", hora: "10:22" },
      { id: "m2", autor: "ia", texto: "¡Hola! Sí, Max Pérez tiene su vacuna múltiple mañana a las 11:30. Este número no está en su perfil, así que primero te registro: ¿cuál es tu nombre y tu relación con Max? Y para confirmar que hablamos del mismo Max Pérez: ¿de qué raza es y qué edad tiene?", hora: "10:22" },
      { id: "m3", autor: "cliente", texto: "Valentina, soy la hija de María José. Es labrador, tiene 3 años", hora: "10:24" },
      { id: "m4", autor: "sistema", texto: "Contacto secundario creado por Luna · Valentina Pérez (+502 4120 5566) · Hija de María José · agregado al perfil de Max Pérez (2.º contacto). Raza y edad verificadas. Queda para revisión de recepción.", hora: "10:24" },
      { id: "m5", autor: "ia", texto: "¡Gracias, Valentina! Ya quedaste como contacto de Max Pérez. Claro que puedes llevarlo tú: ¿te confirmo la cita de mañana a las 11:30 con el Dr. Méndez?", hora: "10:24", botones: ["Confirmar", "Reagendar"] },
      { id: "m6", autor: "cliente", texto: "Confirmar", hora: "10:26" },
      { id: "m7", autor: "ia", texto: "Listo ✅ Cita confirmada: Max Pérez, vacuna múltiple, mañana a las 11:30. Lleva su carné de vacunas, por favor. Le aviso a María José que tú lo llevas.", hora: "10:26" },
      { id: "m8", autor: "sistema", texto: "Cita confirmada en Agenda Clínica (Google Calendar · dr.mendez@patitasvet.gt).", hora: "10:26" },
      { id: "m9", autor: "cliente", texto: "Mil gracias 🙌", hora: "10:27" },
    ],
  },
  {
    id: "v30", objetivo: "agendar", resultado: { tipo: "cita", texto: "Grooming · pasado mañana 10:00" }, clienteId: "c1", canal: "whatsapp", agenda: "grooming", estado: "ia", noLeidos: 0, hora: "10:14",
    contacto: { nombre: "Jorge Pérez", telefono: "+502 5598 1200", relacion: "Esposo de María José", mascota: "Max" },
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Buenas, quiero agendar un baño para Max Pérez", hora: "10:09" },
      { id: "m2", autor: "ia", texto: "¡Hola! Encontré a Max Pérez en nuestra base, pero este número no está registrado en su perfil. ¿Me dices tu nombre y tu relación con Max? Y para confirmar que hablamos del mismo Max Pérez: ¿de qué raza es y qué edad tiene?", hora: "10:09" },
      { id: "m3", autor: "cliente", texto: "Soy Jorge, el esposo de María José. Es labrador y tiene 3 años", hora: "10:11" },
      { id: "m4", autor: "sistema", texto: "Contacto secundario creado por Luna · Jorge Pérez (+502 5598 1200) · Esposo de María José · agregado al perfil de Max Pérez. Raza y edad verificadas. Queda para revisión de recepción.", hora: "10:11" },
      { id: "m5", autor: "ia", texto: "¡Gracias, Jorge! Ya te agregué como contacto de Max Pérez, así la próxima vez te reconozco directo. Para el baño de Max (grande) tengo espacio pasado mañana a las 10:00 o a las 12:00. ¿Cuál prefieres?", hora: "10:11" },
      { id: "m6", autor: "cliente", texto: "10 está bien", hora: "10:13" },
      { id: "m7", autor: "ia", texto: "Listo ✅ Max Pérez queda agendado para baño pasado mañana a las 10:00 con Luis. Le aviso también a María José por si quiere el recordatorio.", hora: "10:13" },
      { id: "m8", autor: "sistema", texto: "Cita creada en Agenda Grooming (Google Calendar · grooming@patitasvet.gt).", hora: "10:13" },
      { id: "m9", autor: "cliente", texto: "Perfecto, gracias", hora: "10:14" },
    ],
  },
  {
    id: "v1", objetivo: "agendar", resultado: { tipo: "cita", texto: "Clínica · mañana 11:30" }, clienteId: "c1", canal: "whatsapp", agenda: "clinica", estado: "ia", noLeidos: 0, hora: "10:05",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola! Quiero llevar a Max a ponerle la vacuna múltiple, qué precio tiene?", hora: "10:02" },
      { id: "m2", autor: "ia", texto: "¡Hola María José! El precio de la vacuna múltiple depende de la vacuna que le corresponda a Max; el Dr. Méndez la confirma en la cita. ¿Quieres que te agende? Tengo espacio mañana a las 9:00 o 11:30.", hora: "10:02" },
      { id: "m3", autor: "cliente", texto: "Mañana 11:30 perfecto", hora: "10:04" },
      { id: "m4", autor: "ia", texto: "Listo ✅ Agendé a Max para vacuna múltiple mañana a las 11:30 con el Dr. Méndez. Te enviaremos un recordatorio un día antes.", hora: "10:04" },
      { id: "m5", autor: "sistema", texto: "Cita creada en Agenda Clínica (Google Calendar · dr.mendez@patitasvet.gt).", hora: "10:04" },
      { id: "m6", autor: "cliente", texto: "Gracias!!", hora: "10:05" },
    ],
  },
  {
    id: "v2", objetivo: "agendar", resultado: { tipo: "cita", texto: "Grooming · jueves 8:00" }, clienteId: "c2", canal: "instagram", agenda: "grooming", estado: "ia", noLeidos: 0, hora: "09:51",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola, cuánto el baño con corte para un schnauzer?", hora: "09:47" },
      { id: "m2", autor: "ia", texto: "¡Hola Jorge! Para un perro mediano como Toby, el baño y corte toma unas 2 horas. ¿Te gustaría agendarlo? Luis tiene espacio el jueves a las 8:00 o a las 10:30.", hora: "09:47" },
      { id: "m3", autor: "cliente", texto: "Jueves a las 8", hora: "09:50" },
      { id: "m4", autor: "ia", texto: "Listo ✅ Toby queda agendado para baño y corte el jueves a las 8:00 con Luis. Te avisamos por aquí cuando esté listo para recoger.", hora: "09:50" },
      { id: "m5", autor: "sistema", texto: "Cita creada en Agenda Grooming (Google Calendar · grooming@patitasvet.gt).", hora: "09:50" },
    ],
  },
  {
    id: "v9", objetivo: "agendar", resultado: { tipo: "cita", texto: "Clínica · hoy 15:00" }, clienteId: "c9", canal: "whatsapp", agenda: "clinica", estado: "ia", noLeidos: 0, hora: "09:32",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Buenos días, Canela tiene diarrea desde ayer, qué le puedo dar?", hora: "09:30" },
      { id: "m2", autor: "ia", texto: "Buenos días, Carmen. No puedo recomendarte medicamentos ni tratamientos: eso solo lo puede indicar el veterinario después de revisar a Canela. Si lo deseas, te agendo una consulta hoy. El Dr. Méndez tiene espacio a las 15:00 o 16:30. Si notas que empeora o está decaída, puedo pasarte ahora con Andrea.", hora: "09:30" },
      { id: "m3", autor: "cliente", texto: "Sí, a las 3 porfa", hora: "09:31" },
      { id: "m4", autor: "ia", texto: "Listo ✅ Consulta general para Canela hoy a las 15:00 con el Dr. Méndez.", hora: "09:31" },
      { id: "m5", autor: "sistema", texto: "Cita creada en Agenda Clínica. Etiqueta: motivo reportado por el cliente (diarrea), sin orientación dada.", hora: "09:31" },
    ],
  },
  {
    id: "v5", objetivo: "recordatorio", resultado: { tipo: "confirmada", texto: "Confirmó · hoy 11:00" }, clienteId: "c5", canal: "whatsapp", agenda: "clinica", estado: "resuelta", noLeidos: 0, hora: "09:12",
    mensajes: [
      { id: "m1", autor: "ia", texto: "Hola Sofía, te recordamos la cita de Mishi para control post consulta hoy a las 11:00 en Clínica Veterinaria Patitas. ¿Nos confirmas tu asistencia?", hora: "08:00", plantilla: "recordatorio_cita", botones: ["Confirmar", "Reagendar", "Cancelar"] },
      { id: "m2", autor: "cliente", texto: "Confirmar", hora: "09:12" },
      { id: "m3", autor: "ia", texto: "¡Gracias Sofía! Cita confirmada. Te esperamos a las 11:00.", hora: "09:12" },
    ],
  },
  {
    id: "v7", objetivo: "reactivacion", resultado: { tipo: "cita", texto: "Grooming · viernes 9:00" }, clienteId: "c7", canal: "whatsapp", agenda: "grooming", estado: "ia", noLeidos: 0, hora: "08:47",
    mensajes: [
      { id: "m1", autor: "ia", texto: "Hola Gabriela, ¡Lola ya merece un baño y corte! 🛁 Su último grooming con nosotros fue en mayo. ¿Te apartamos un espacio esta semana?", hora: "08:30", plantilla: "reactivacion_grooming", botones: ["Agendar grooming", "Ahora no", "No recibir más"] },
      { id: "m2", autor: "cliente", texto: "Agendar grooming", hora: "08:45" },
      { id: "m3", autor: "ia", texto: "¡Qué bueno! Para Lola (poodle pequeño) el baño y corte toma cerca de 1.5 horas. Luis tiene espacio el viernes a las 9:00 o a las 13:00.", hora: "08:45" },
      { id: "m4", autor: "cliente", texto: "Viernes 9", hora: "08:47" },
      { id: "m5", autor: "ia", texto: "Listo ✅ Lola queda agendada el viernes a las 9:00 con Luis.", hora: "08:47" },
    ],
  },
  {
    id: "v10", objetivo: "informacion", clienteId: "c10", canal: "facebook", agenda: "clinica", estado: "secretaria", noLeidos: 0, hora: "08:40",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Buen día, quería saber si ya están los resultados de los exámenes de Kira", hora: "08:35" },
      { id: "m2", autor: "ia", texto: "¡Hola Pedro! Los resultados los entrega el equipo de la clínica. Ya le aviso a Andrea para que te responda.", hora: "08:35" },
      { id: "m3", autor: "sistema", texto: "Andrea López tomó la conversación. El agente dejó de responder.", hora: "08:38" },
      { id: "m4", autor: "secretaria", texto: "Hola Pedro, buen día. Ya están listos; el Dr. Méndez quiere comentarlos contigo. ¿Te queda bien una llamada a las 12:00?", hora: "08:40" },
    ],
  },
  {
    id: "v8", objetivo: "informacion", clienteId: "c8", canal: "instagram", agenda: null, estado: "resuelta", fueraHorario: true, noLeidos: 0, hora: "Ayer",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Holaa abren los sábados? hasta qué hora", hora: "22:40" },
      { id: "m2", autor: "ia", texto: "¡Hola Luis Fernando! Sí: los sábados la clínica atiende de 8:00 a 13:00 y grooming de 8:00 a 16:00. ¿Quieres que te agende algo para Simba?", hora: "22:40" },
      { id: "m3", autor: "cliente", texto: "Por ahora no, gracias!", hora: "22:43" },
    ],
  },
  {
    id: "v11", objetivo: "recordatorio", resultado: { tipo: "reagendada", texto: "Reagendó · sábado 11:00" }, clienteId: "c11", canal: "whatsapp", agenda: "grooming", estado: "ia", noLeidos: 0, hora: "Ayer",
    mensajes: [
      { id: "m1", autor: "ia", texto: "Hola Valeria, te recordamos la cita de Peluche para baño y corte mañana a las 10:00 en Clínica Veterinaria Patitas. ¿Nos confirmas tu asistencia?", hora: "15:00", plantilla: "recordatorio_cita", botones: ["Confirmar", "Reagendar", "Cancelar"] },
      { id: "m2", autor: "cliente", texto: "Reagendar", hora: "15:20" },
      { id: "m3", autor: "ia", texto: "Claro. Luis tiene espacio el sábado a las 8:00 o a las 11:00. ¿Cuál prefieres?", hora: "15:20" },
      { id: "m4", autor: "cliente", texto: "Sábado 11", hora: "15:22" },
      { id: "m5", autor: "ia", texto: "Listo ✅ Moví la cita de Peluche al sábado a las 11:00. El espacio de mañana quedó libre.", hora: "15:22" },
    ],
  },
  {
    id: "v12", objetivo: "reactivacion", resultado: { tipo: "sin_interes", texto: "Ahora no" }, clienteId: "c12", canal: "whatsapp", agenda: "clinica", estado: "resuelta", noLeidos: 0, hora: "Ayer",
    mensajes: [
      { id: "m1", autor: "ia", texto: "Hola Héctor, en Clínica Veterinaria Patitas nos acordamos de Nala. Su última visita a consulta fue en febrero y queremos ayudarte a mantener su salud al día. ¿Te gustaría agendar una cita de control?", hora: "10:00", plantilla: "reactivacion_clinica", botones: ["Agendar cita", "Ahora no", "No recibir más"] },
      { id: "m2", autor: "cliente", texto: "Ahora no", hora: "11:15" },
      { id: "m3", autor: "ia", texto: "Entendido, Héctor. Cuando lo necesites, escríbenos por aquí. ¡Saludos a Nala!", hora: "11:15" },
    ],
  },
  {
    id: "v13", objetivo: "reactivacion", resultado: { tipo: "cita", texto: "Clínica · hoy 12:00" }, clienteId: "c16", canal: "whatsapp", agenda: "clinica", estado: "resuelta", noLeidos: 0, hora: "Ayer",
    mensajes: [
      { id: "m1", autor: "ia", texto: "Hola Miguel Ángel, en Clínica Veterinaria Patitas nos acordamos de Duke. Su última visita a consulta fue en enero y queremos ayudarte a mantener su salud al día. ¿Te gustaría agendar una cita de control?", hora: "10:00", plantilla: "reactivacion_clinica", botones: ["Agendar cita", "Ahora no", "No recibir más"] },
      { id: "m2", autor: "cliente", texto: "Agendar cita", hora: "12:41" },
      { id: "m3", autor: "ia", texto: "¡Perfecto! ¿Qué necesita Duke? Puedo agendar consulta general o su vacuna múltiple.", hora: "12:41" },
      { id: "m4", autor: "cliente", texto: "La vacuna, ya le toca", hora: "12:44" },
      { id: "m5", autor: "ia", texto: "El Dr. Méndez tiene espacio mañana a las 12:00 o a las 16:30. ¿Cuál te queda mejor?", hora: "12:44" },
      { id: "m6", autor: "cliente", texto: "12 está bien", hora: "12:45" },
      { id: "m7", autor: "ia", texto: "Listo ✅ Duke queda agendado para vacuna múltiple mañana a las 12:00 con el Dr. Méndez.", hora: "12:45" },
      { id: "m8", autor: "sistema", texto: "Cita creada en Agenda Clínica. Origen: reactivación.", hora: "12:45" },
    ],
  },
  {
    id: "v14", objetivo: "reactivacion", resultado: { tipo: "cita", texto: "Grooming · hoy 10:30" }, clienteId: "c15", canal: "instagram", agenda: "grooming", estado: "resuelta", noLeidos: 0, hora: "Ayer",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola! Vi su historia, tienen espacio para baño y corte de una yorkie?", hora: "16:02" },
      { id: "m2", autor: "ia", texto: "¡Hola Paola! Qué gusto saludarte de nuevo, hace rato no vemos a Chispa 🐾 Luis tiene espacio mañana a las 10:30 o el sábado a las 8:00.", hora: "16:02" },
      { id: "m3", autor: "cliente", texto: "Mañana 10:30", hora: "16:05" },
      { id: "m4", autor: "ia", texto: "Listo ✅ Chispa queda agendada para baño y corte mañana a las 10:30 con Luis.", hora: "16:05" },
    ],
  },
  {
    id: "v15", objetivo: "reactivacion", clienteId: "c17", canal: "whatsapp", agenda: "grooming", estado: "ia", noLeidos: 1, hora: "10:12",
    mensajes: [
      { id: "m1", autor: "ia", texto: "Hola Fernanda, ¡Pelusa ya merece un baño y corte! Su último grooming con nosotros fue en marzo. ¿Te apartamos un espacio esta semana?", hora: "09:00", plantilla: "reactivacion_grooming", botones: ["Agendar grooming", "Ahora no", "No recibir más"] },
      { id: "m2", autor: "cliente", texto: "Sí, pero solo puedo en la tarde, hay algo el sábado?", hora: "10:12" },
      { id: "m3", autor: "ia", texto: "Los sábados grooming atiende hasta las 16:00. Para Pelusa (gato) el baño toma 1,5 h: tengo el sábado a las 14:00. ¿Te lo aparto?", hora: "10:12" },
    ],
  },
  {
    id: "v16", objetivo: "receta", clienteId: "c13", canal: "whatsapp", agenda: "clinica", estado: "transferida", motivo: "caso_clinico", esperaMin: 4, noLeidos: 1, hora: "10:38",
    mensajes: [
      { id: "m1", autor: "ia", texto: "📄 Receta_Firulais.pdf\n\nHola Lucía, te compartimos la receta de Firulais indicada por el Dr. Méndez en su consulta de hoy.\n\nSi tienes dudas sobre el tratamiento, responde a este mensaje y el equipo de la clínica te contactará.", hora: "09:05", plantilla: "receta_consulta", botones: ["Tengo una duda"] },
      { id: "m5", autor: "cliente", texto: "Gracias! Una pregunta, las gotas se las pongo antes o después de limpiarle el oído?", hora: "10:37" },
      { id: "m6", autor: "ia", texto: "Buena pregunta, Lucía. Las indicaciones del tratamiento te las debe confirmar el equipo de la clínica: ya le paso tu consulta a Andrea para que lo revise con el Dr. Méndez.", hora: "10:37" },
      { id: "m7", autor: "sistema", texto: "Transferida a secretaria · Motivo: duda sobre el tratamiento de la receta (caso clínico).", hora: "10:38" },
    ],
  },
  {
    id: "v17", objetivo: "agendar", resultado: { tipo: "cita", texto: "Clínica · mañana 16:30" }, clienteId: "c19", canal: "whatsapp", agenda: "clinica", estado: "ia", noLeidos: 0, hora: "10:24",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola buenas, quiero vacunar a mi cachorro, tienen espacio esta semana?", hora: "10:19" },
      { id: "m2", autor: "ia", texto: "¡Hola! Con gusto te ayudo 🐾 Es la primera vez que nos escribes desde este número, así que voy a crear el perfil de tu mascota. ¿Me compartes tu nombre y el nombre de tu cachorro?", hora: "10:19" },
      { id: "m3", autor: "cliente", texto: "Diana Velásquez, se llama Rocco", hora: "10:20" },
      { id: "m4", autor: "ia", texto: "Mucho gusto, Diana. ¿De qué raza es Rocco y qué edad tiene?", hora: "10:20" },
      { id: "m5", autor: "cliente", texto: "Es golden, tiene 10 meses", hora: "10:21" },
      { id: "m6", autor: "sistema", texto: "Perfil creado por Luna · Cliente: Diana Velásquez (+502 5678 1122) · Mascota: Rocco — Perro · Golden retriever · 10 meses. Queda para revisión de recepción.", hora: "10:21" },
      { id: "m7", autor: "ia", texto: "¡Listo, ya registré a Rocco! El Dr. Méndez confirma en la cita cuál vacuna le corresponde. Tengo espacio mañana a las 9:00 o a las 16:30.", hora: "10:21" },
      { id: "m8", autor: "cliente", texto: "A las 4:30 porfa", hora: "10:23" },
      { id: "m9", autor: "ia", texto: "Listo ✅ Rocco queda agendado para vacuna múltiple mañana a las 16:30 con el Dr. Méndez. Si tienes su carné de vacunas, tráelo ese día.", hora: "10:24" },
      { id: "m10", autor: "sistema", texto: "Cita creada en Agenda Clínica (Google Calendar · dr.mendez@patitasvet.gt).", hora: "10:24" },
    ],
  },
  {
    id: "v18", objetivo: "agendar", resultado: { tipo: "cita", texto: "Grooming · sábado 10:00" }, clienteId: "c2", canal: "whatsapp", agenda: "grooming", estado: "resuelta", noLeidos: 0, hora: "08:15",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola, ahora quiero llevar a mi otra perrita a baño, se llama Bimba", hora: "08:11" },
      { id: "m2", autor: "ia", texto: "¡Hola Jorge! Tengo registrado a Toby, pero Bimba todavía no está en tu perfil. ¿De qué raza es y qué edad tiene?", hora: "08:11" },
      { id: "m3", autor: "cliente", texto: "Cocker, 2 años", hora: "08:13" },
      { id: "m4", autor: "sistema", texto: "Mascota agregada por Luna al perfil de Jorge Castillo · Bimba — Perro · Cocker spaniel · 2 años · Mediano.", hora: "08:13" },
      { id: "m5", autor: "ia", texto: "¡Listo, agregué a Bimba a tu perfil! El baño para perro mediano toma cerca de 1.5 horas. Luis tiene espacio el sábado a las 10:00 o a las 12:00.", hora: "08:13" },
      { id: "m6", autor: "cliente", texto: "Sábado 10", hora: "08:15" },
      { id: "m7", autor: "ia", texto: "Listo ✅ Bimba queda agendada para baño el sábado a las 10:00 con Luis.", hora: "08:15" },
    ],
  },
  {
    id: "v19", objetivo: "agendar", clienteId: "c20", canal: "facebook", agenda: "clinica", estado: "resuelta", noLeidos: 0, hora: "10:38",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "buenas cuanto cuesta la consulta?", hora: "10:36" },
      { id: "m2", autor: "ia", texto: "¡Hola! La consulta general dura unos 30 minutos. Para agendarla y registrar a tu mascota, escríbenos por WhatsApp aquí: wa.me/50222223344 — ahí te atiendo de inmediato 🐾", hora: "10:36" },
      { id: "m3", autor: "cliente", texto: "va, ahí le escribo", hora: "10:38" },
    ],
  },
  {
    id: "v20", objetivo: "agendar", clienteId: "c20", canal: "whatsapp", agenda: "clinica", estado: "ia", noLeidos: 1, hora: "10:44",
    mensajes: [
      { id: "m1", autor: "cliente", texto: "Hola, les escribí por Facebook, quiero agendar consulta para mi gatita", hora: "10:41" },
      { id: "m2", autor: "ia", texto: "¡Hola! Qué bueno que nos escribes por aquí. Es la primera vez que nos contactas desde este número, así que voy a crear el perfil de tu mascota: ¿me compartes tu nombre y el de tu gatita?", hora: "10:41" },
      { id: "m3", autor: "cliente", texto: "Kevin Ajú, se llama Michi", hora: "10:43" },
      { id: "m4", autor: "ia", texto: "Gracias, Kevin. ¿De qué raza es Michi y qué edad tiene? Si no sabes la raza, con «doméstica» está bien.", hora: "10:43" },
      { id: "m5", autor: "cliente", texto: "doméstica, 4 meses", hora: "10:44" },
      { id: "m6", autor: "sistema", texto: "Perfil creado por Luna · Cliente: Kevin Ajú (+502 3190 4456) · Mascota: Michi — Gato · Doméstico · 4 meses. Queda para revisión de recepción.", hora: "10:44" },
      { id: "m7", autor: "ia", texto: "¡Listo, ya registré a Michi! El Dr. Méndez tiene espacio hoy a las 16:30 o mañana a las 9:00. ¿Cuál prefieres?", hora: "10:44" },
    ],
  },
];

// Citas: las de hoy van a mano; el resto de la semana sale de la tabla de abajo
// para que la ocupación tenga forma realista.
const HOY: Cita[] = [
  { id: "a1", agenda: "clinica", clienteId: "c13", mascota: "Firulais", servicio: "Consulta general", dia: 0, hora: "08:30", duracionMin: 30, estado: "completada", origen: "ia" },
  { id: "a2", agenda: "clinica", clienteId: "c14", mascota: "Oreo", servicio: "Vacuna antirrábica", dia: 0, hora: "09:30", duracionMin: 15, estado: "completada", origen: "ia" },
  { id: "a3", agenda: "clinica", clienteId: "c5", mascota: "Mishi", servicio: "Control post consulta", dia: 0, hora: "11:00", duracionMin: 20, estado: "confirmada", origen: "ia" },
  { id: "a4", agenda: "clinica", clienteId: "c16", mascota: "Duke", servicio: "Vacuna múltiple", dia: 0, hora: "12:00", duracionMin: 20, estado: "por_confirmar", origen: "ia" },
  { id: "a5", agenda: "clinica", clienteId: "c9", mascota: "Canela", servicio: "Consulta general", dia: 0, hora: "15:00", duracionMin: 30, estado: "confirmada", origen: "ia" },
  { id: "a6", agenda: "clinica", clienteId: "c18", mascota: "Rex", servicio: "Desparasitación", dia: 0, hora: "16:00", duracionMin: 15, estado: "por_confirmar", origen: "ia" },
  { id: "a7", agenda: "clinica", clienteId: "c10", mascota: "Kira", servicio: "Consulta general", dia: 0, hora: "17:00", duracionMin: 30, estado: "confirmada", origen: "manual" },
  { id: "g1", agenda: "grooming", clienteId: "c1", mascota: "Max", servicio: "Baño (grande)", dia: 0, hora: "08:00", duracionMin: 120, estado: "completada", origen: "ia" },
  { id: "g2", agenda: "grooming", clienteId: "c15", mascota: "Chispa", servicio: "Baño y corte (pequeño)", dia: 0, hora: "10:30", duracionMin: 90, estado: "en_curso", origen: "ia" },
  { id: "g3", agenda: "grooming", clienteId: "c17", mascota: "Pelusa", servicio: "Baño (gato)", dia: 0, hora: "12:30", duracionMin: 90, estado: "por_confirmar", origen: "manual" },
  { id: "g4", agenda: "grooming", clienteId: "c4", mascota: "Rocky", servicio: "Baño (grande)", dia: 0, hora: "14:00", duracionMin: 120, estado: "confirmada", origen: "ia" },
  { id: "x1", agenda: "clinica", clienteId: "c12", mascota: "Nala", servicio: "Consulta general", dia: -1, hora: "10:00", duracionMin: 30, estado: "ausente", origen: "manual" },
  { id: "x2", agenda: "grooming", clienteId: "c11", mascota: "Peluche", servicio: "Baño y corte (pequeño)", dia: 1, hora: "10:00", duracionMin: 90, estado: "reagendada", origen: "ia" },
  { id: "x3", agenda: "clinica", clienteId: "c1", mascota: "Max", servicio: "Vacuna múltiple", dia: 1, hora: "11:30", duracionMin: 20, estado: "confirmada", origen: "ia" },
  { id: "x4", agenda: "grooming", clienteId: "c2", mascota: "Toby", servicio: "Baño y corte (mediano)", dia: 2, hora: "08:00", duracionMin: 120, estado: "confirmada", origen: "ia" },
  { id: "x5", agenda: "grooming", clienteId: "c7", mascota: "Lola", servicio: "Baño y corte (pequeño)", dia: 3, hora: "09:00", duracionMin: 90, estado: "confirmada", origen: "ia" },
  { id: "x6", agenda: "grooming", clienteId: "c11", mascota: "Peluche", servicio: "Baño y corte (pequeño)", dia: 4, hora: "11:00", duracionMin: 90, estado: "confirmada", origen: "ia" },
  { id: "x7", agenda: "clinica", clienteId: "c6", mascota: "Bruno", servicio: "Control post consulta", dia: -4, hora: "09:00", duracionMin: 20, estado: "cancelada", origen: "manual" },
  { id: "x8", agenda: "clinica", clienteId: "c19", mascota: "Rocco", servicio: "Vacuna múltiple", dia: 1, hora: "16:30", duracionMin: 20, estado: "confirmada", origen: "ia" },
  { id: "x10", agenda: "grooming", clienteId: "c1", mascota: "Max", servicio: "Baño (grande)", dia: 2, hora: "10:00", duracionMin: 120, estado: "confirmada", origen: "ia" },
  { id: "x9", agenda: "grooming", clienteId: "c2", mascota: "Bimba", servicio: "Baño (mediano)", dia: 3, hora: "10:00", duracionMin: 120, estado: "confirmada", origen: "ia" },
];

// Generador determinista para rellenar la semana.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const SERV_C = ["Consulta general", "Vacuna múltiple", "Desparasitación", "Control post consulta", "Vacuna antirrábica"];
const SERV_G = ["Baño (mediano)", "Baño y corte (pequeño)", "Baño y corte (mediano)", "Baño (grande)", "Corte de uñas"];
const HORAS_C = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
const HORAS_G = ["08:00", "10:00", "12:00", "14:00"];

function relleno(): Cita[] {
  const r = rng(42);
  const out: Cita[] = [];
  const usados = new Set(HOY.map((c) => `${c.agenda}|${c.dia}|${c.hora}`));
  for (let dia = -6; dia <= 6; dia++) {
    if (dia === 0) continue;
    for (const agenda of ["clinica", "grooming"] as const) {
      const horas = agenda === "clinica" ? HORAS_C : HORAS_G;
      const ocup = agenda === "clinica" ? 0.35 + r() * 0.4 : 0.4 + r() * 0.5;
      for (const hora of horas) {
        if (r() > ocup || usados.has(`${agenda}|${dia}|${hora}`)) continue;
        const cli = CLIENTES[Math.floor(r() * CLIENTES.length)];
        const pasado = dia < 0;
        const x = r();
        const estado = pasado
          ? x < 0.82 ? "completada" : x < 0.9 ? "ausente" : x < 0.96 ? "cancelada" : "reagendada"
          : dia === 1 ? (x < 0.6 ? "confirmada" : "por_confirmar")
          : x < 0.93 ? "confirmada" : "cancelada";
        out.push({
          id: `r${dia}${agenda[0]}${hora}`,
          agenda,
          clienteId: cli.id,
          mascota: cli.mascotas[0].nombre,
          servicio: (agenda === "clinica" ? SERV_C : SERV_G)[Math.floor(r() * 5)],
          dia,
          hora,
          duracionMin: agenda === "clinica" ? 30 : 120,
          estado,
          origen: r() < 0.64 ? "ia" : "manual",
        });
      }
    }
  }
  return out;
}

export const CITAS: Cita[] = [...HOY, ...relleno()];

export const SEGUIMIENTOS: Seguimiento[] = [
  { id: "s1", clienteId: "c6", mascota: "Bruno", consulta: "Cojera pata trasera", fechaConsulta: "3 oct", regla: "A los 4 días · preguntar evolución", envio: "Hoy 09:00", estado: "transferido", respuesta: "Sigue igual. Todavía cojea…" },
  { id: "s2", clienteId: "c14", mascota: "Oreo", consulta: "Vacuna antirrábica", fechaConsulta: "Hoy", regla: "A las 24 h · reacción a vacuna", envio: "Mañana 10:00", estado: "programado" },
  { id: "s3", clienteId: "c13", mascota: "Firulais", consulta: "Otitis", fechaConsulta: "Hoy", regla: "A los 7 días · recordar control", envio: "14 oct 09:00", estado: "programado" },
  { id: "s4", clienteId: "c10", mascota: "Kira", consulta: "Exámenes de sangre", fechaConsulta: "22 sep", regla: "A los 14 días · control", envio: "6 oct 09:00", estado: "nueva_cita", respuesta: "Agendó control hoy 17:00" },
  { id: "s5", clienteId: "c5", mascota: "Mishi", consulta: "Dermatitis", fechaConsulta: "18 sep", regla: "A los 7 días · preguntar evolución", envio: "25 sep 09:00", estado: "nueva_cita", respuesta: "Está mejor → agendó control" },
  { id: "s6", clienteId: "c3", mascota: "Coco", consulta: "Vacuna múltiple", fechaConsulta: "3 sep", regla: "A las 24 h · reacción a vacuna", envio: "4 sep 10:00", estado: "respondido", respuesta: "Está mejor" },
  { id: "s7", clienteId: "c9", mascota: "Canela", consulta: "Consulta general", fechaConsulta: "Hoy 15:00", regla: "Lo define el Dr. al cerrar la consulta", envio: "Pendiente de regla", estado: "programado" },
  { id: "s8", clienteId: "c18", mascota: "Rex", consulta: "Herida en oreja", fechaConsulta: "30 sep", regla: "A los 5 días · preguntar evolución", envio: "5 oct 09:00", estado: "enviado" },
];

/**
 * Filtro de inactividad para reactivar: días desde la última visita a la
 * agenda. La secretaria escoge el rango y manda el mensaje a los que caen ahí.
 */
export const RANGOS: { id: RangoInactividad; label: string; detalle: string; min: number; max: number }[] = [
  { id: "15d", label: "15 días", detalle: "15 a 29 días sin visita", min: 15, max: 29 },
  { id: "1m", label: "1 mes", detalle: "30 a 59 días sin visita", min: 30, max: 59 },
  { id: "mas1m", label: "Más de 1 mes", detalle: "60 días o más sin visita", min: 60, max: Infinity },
];

export function rangoDe(dias: number): RangoInactividad | null {
  return RANGOS.find((r) => dias >= r.min && dias <= r.max)?.id ?? null;
}

// Clientes de la base de la clínica sin visita reciente, por agenda: un mismo
// cliente puede estar activo en clínica e inactivo en grooming.
export const REACTIVACIONES: Reactivacion[] = [
  { id: "r1", clienteId: "c12", agenda: "clinica", mascota: "Nala", ultimoServicio: "Consulta general · feb 2026", diasInactivo: 235, estado: "no_interesado" },
  { id: "r2", clienteId: "c13", agenda: "clinica", mascota: "Firulais", ultimoServicio: "Vacuna múltiple · mar 2026", diasInactivo: 220, estado: "cita" },
  { id: "r3", clienteId: "c16", agenda: "clinica", mascota: "Duke", ultimoServicio: "Consulta general · ene 2026", diasInactivo: 275, estado: "cita" },
  { id: "r4", clienteId: "c18", agenda: "clinica", mascota: "Rex", ultimoServicio: "Desparasitación · ago 2026", diasInactivo: 48, estado: "respondio" },
  { id: "r5", clienteId: "c9", agenda: "clinica", mascota: "Canela", ultimoServicio: "Vacuna antirrábica · ago 2026", diasInactivo: 41, estado: "detectado" },
  { id: "r6", clienteId: "c3", agenda: "clinica", mascota: "Coco", ultimoServicio: "Vacuna múltiple · 3 sep", diasInactivo: 34, estado: "detectado" },
  { id: "r7", clienteId: "c14", agenda: "clinica", mascota: "Oreo", ultimoServicio: "Consulta general · 20 sep", diasInactivo: 17, estado: "detectado" },
  { id: "r8", clienteId: "c10", agenda: "clinica", mascota: "Kira", ultimoServicio: "Consulta general · 22 sep", diasInactivo: 15, estado: "detectado" },
  { id: "r9", clienteId: "c5", agenda: "clinica", mascota: "Mishi", ultimoServicio: "Dermatitis · 18 sep", diasInactivo: 19, estado: "contactado" },
  { id: "r10", clienteId: "c7", agenda: "grooming", mascota: "Lola", ultimoServicio: "Baño y corte · may 2026", diasInactivo: 132, estado: "cita" },
  { id: "r11", clienteId: "c15", agenda: "grooming", mascota: "Chispa", ultimoServicio: "Baño y corte · abr 2026", diasInactivo: 189, estado: "cita" },
  { id: "r12", clienteId: "c17", agenda: "grooming", mascota: "Pelusa", ultimoServicio: "Baño · mar 2026", diasInactivo: 211, estado: "contactado" },
  { id: "r13", clienteId: "c2", agenda: "grooming", mascota: "Toby", ultimoServicio: "Baño y corte · jul 2026", diasInactivo: 84, estado: "detectado" },
  { id: "r14", clienteId: "c4", agenda: "grooming", mascota: "Rocky", ultimoServicio: "Baño · ago 2026", diasInactivo: 66, estado: "detectado" },
  { id: "r15", clienteId: "c1", agenda: "grooming", mascota: "Max", ultimoServicio: "Baño · 20 sep", diasInactivo: 17, estado: "detectado" },
  { id: "r16", clienteId: "c11", agenda: "grooming", mascota: "Peluche", ultimoServicio: "Baño y corte · 9 sep", diasInactivo: 28, estado: "detectado" },
  { id: "r17", clienteId: "c8", agenda: "grooming", mascota: "Simba", ultimoServicio: "Corte de uñas · ago 2026", diasInactivo: 39, estado: "detectado" },
];

/** Totales de la base completa (la lista de arriba es una muestra). */
export const REACTIVACION_TOTALES = {
  clinica: { detectados: 184, contactados: 120, respondieron: 41, citas: 23, excluidos: 9 },
  grooming: { detectados: 96, contactados: 70, respondieron: 29, citas: 18, excluidos: 4 },
};

export const PLANTILLAS: Plantilla[] = [
  {
    nombre: "confirmacion_cita",
    categoria: "UTILITY",
    agenda: "ambas",
    titulo: "Confirmación de cita",
    cuerpo:
      "Hola {{1}}, tu cita en Clínica Veterinaria Patitas quedó agendada.\n\nMascota: {{2}}\nServicio: {{3}}\nFecha: {{4}}\nHora: {{5}}\n\nSi necesitas cambiarla, responde a este mensaje y te ayudamos.",
    ejemplo: ["María José", "Max", "Vacuna múltiple", "jueves 8 de octubre", "11:30"],
    botones: ["Reagendar"],
    cuando:
      "Al crear una cita cuando la ventana de 24 h de WhatsApp está cerrada: citas que la secretaria agenda por teléfono o en mostrador, o que se crean desde Google Calendar. Si el cliente agendó por chat, la confirmación va como mensaje normal dentro de la conversación (sin plantilla).",
    estadoMeta: "Borrador",
    stats: { enviados: 86, entregados: 84, leidos: 77, respondidos: 12 },
  },
  {
    nombre: "recordatorio_cita",
    categoria: "UTILITY",
    agenda: "ambas",
    titulo: "Recordatorio de cita",
    cuerpo:
      "Hola {{1}}, te recordamos la cita de {{2}} para {{3}} el {{4}} a las {{5}} en Clínica Veterinaria Patitas.\n\n¿Nos confirmas tu asistencia?",
    ejemplo: ["Sofía", "Mishi", "control post consulta", "miércoles 7 de octubre", "11:00"],
    botones: ["Confirmar", "Reagendar", "Cancelar"],
    cuando:
      "24 h antes de cada cita de clínica y de grooming. Si a las 4 h antes no hay respuesta, la cita aparece en «Por confirmar» para que la secretaria llame.",
    estadoMeta: "Borrador",
    stats: { enviados: 312, entregados: 305, leidos: 281, respondidos: 236 },
  },
  {
    nombre: "seguimiento_consulta",
    categoria: "UTILITY",
    agenda: "clinica",
    titulo: "Seguimiento después de la consulta",
    cuerpo:
      "Hola {{1}}, te escribimos de Clínica Veterinaria Patitas para saber cómo sigue {{2}} después de su consulta del {{3}}.\n\n¿Cómo ha estado? Cuéntanos si notas algún cambio.",
    ejemplo: ["Daniel", "Bruno", "3 de octubre"],
    botones: ["Está mejor", "Sigue igual", "Hablar con la clínica"],
    cuando:
      "En el momento que define el veterinario al cerrar la consulta (24 h, 4 días, 7 días…). «Sigue igual» y «Hablar con la clínica» transfieren a la secretaria; el agente no interpreta síntomas.",
    estadoMeta: "Borrador",
    stats: { enviados: 64, entregados: 63, leidos: 58, respondidos: 41 },
  },
  {
    nombre: "reactivacion_clinica",
    categoria: "MARKETING",
    agenda: "clinica",
    titulo: "Reactivación · Clínica",
    cuerpo:
      "Hola {{1}}, en Clínica Veterinaria Patitas nos acordamos de {{2}}. Su última visita a consulta fue en {{3}} y queremos ayudarte a mantener su salud al día.\n\n¿Te gustaría agendar una cita de control?",
    ejemplo: ["Héctor", "Nala", "febrero"],
    botones: ["Agendar cita", "Ahora no", "No recibir más"],
    cuando:
      "Cuando la secretaria lo selecciona en Reactivación según el tiempo sin visita a clínica (15 días, 1 mes o más de 1 mes). Sale en horario de atención y nunca a quien pidió no recibir más.",
    estadoMeta: "Borrador",
    stats: { enviados: 120, entregados: 114, leidos: 92, respondidos: 41 },
  },
  {
    nombre: "reactivacion_grooming",
    categoria: "MARKETING",
    agenda: "grooming",
    titulo: "Reactivación · Grooming",
    cuerpo:
      "Hola {{1}}, ¡{{2}} ya merece un baño y corte! Su último grooming con nosotros fue en {{3}}.\n\n¿Te apartamos un espacio esta semana?",
    ejemplo: ["Gabriela", "Lola", "mayo"],
    botones: ["Agendar grooming", "Ahora no", "No recibir más"],
    cuando:
      "Cuando la secretaria lo selecciona en Reactivación según el tiempo sin grooming (15 días, 1 mes o más de 1 mes). Va separada de la de clínica: un cliente puede estar activo en una agenda e inactivo en la otra.",
    estadoMeta: "Borrador",
    stats: { enviados: 70, entregados: 68, leidos: 61, respondidos: 29 },
  },
  {
    nombre: "receta_consulta",
    categoria: "UTILITY",
    agenda: "clinica",
    titulo: "Receta digital (encabezado: documento PDF)",
    cuerpo:
      "Hola {{1}}, te compartimos la receta de {{2}} indicada por {{3}} en su consulta de hoy.\n\nSi tienes dudas sobre el tratamiento, responde a este mensaje y el equipo de la clínica te contactará.",
    ejemplo: ["Lucía", "Firulais", "el Dr. Méndez"],
    botones: ["Tengo una duda"],
    cuando:
      "Justo al terminar la consulta, cuando el veterinario pulsa «Enviar receta». Lleva el PDF de la receta como encabezado. Si el cliente escribió en las últimas 24 h, el PDF va directo en la conversación sin plantilla. «Tengo una duda» transfiere a la secretaria: el agente no explica tratamientos.",
    estadoMeta: "Borrador",
    stats: { enviados: 41, entregados: 41, leidos: 39, respondidos: 22 },
  },
];

export const RECETAS: Receta[] = [
  {
    id: "rx1", clienteId: "c13", mascota: "Firulais", hora: "09:05", fecha: "Hoy", estado: "duda", indicaciones: "Limpiar los oídos antes de aplicar las gotas. Control en 7 días.",
    items: [
      { medicamento: "Otomax", dosis: "4 gotas en cada oído", frecuencia: "Cada 12 h", duracion: "7 días" },
      { medicamento: "Meloxicam 1.5 mg/ml", dosis: "1 ml", frecuencia: "Cada 24 h con comida", duracion: "5 días" },
    ],
  },
  {
    id: "rx2", clienteId: "c14", mascota: "Oreo", hora: "09:50", fecha: "Hoy", estado: "leida",
    items: [{ medicamento: "Bravecto 10–20 kg", dosis: "1 tableta", frecuencia: "Dosis única", duracion: "Repetir en 3 meses" }],
  },
  {
    id: "rx3", clienteId: "c6", mascota: "Bruno", hora: "Ayer", fecha: "3 oct 2026", estado: "enviada", indicaciones: "Reposo: nada de gradas ni saltos por 10 días.",
    items: [
      { medicamento: "Meloxicam 1.5 mg/ml", dosis: "0.5 ml", frecuencia: "Cada 24 h con comida", duracion: "7 días" },
      { medicamento: "Glucosamina 500 mg", dosis: "1 tableta", frecuencia: "Cada 24 h", duracion: "30 días" },
    ],
  },
  {
    id: "rx4", clienteId: "c1", mascota: "Max", hora: "09:55", fecha: "12 ago 2026", estado: "leida", indicaciones: "Bañar con el shampoo dejándolo actuar 10 minutos. Cambiar el alimento de forma gradual en 7 días.",
    items: [
      { medicamento: "Shampoo clorhexidina 2%", dosis: "Baño completo", frecuencia: "2 veces por semana", duracion: "4 semanas" },
      { medicamento: "Alimento hipoalergénico (proteína hidrolizada)", dosis: "Según peso", frecuencia: "Diario", duracion: "Continuo" },
    ],
  },
  {
    id: "rx5", clienteId: "c5", mascota: "Mishi", hora: "16:20", fecha: "18 sep 2026", estado: "leida", indicaciones: "Aplicar en las zonas sin pelo con guantes. Evitar que se lama por 15 minutos.",
    items: [{ medicamento: "Crema de ketoconazol 2%", dosis: "Capa delgada", frecuencia: "Cada 12 h", duracion: "14 días" }],
  },
  {
    id: "rx6", clienteId: "c3", mascota: "Coco", hora: "11:15", fecha: "22 abr 2026", estado: "leida",
    items: [{ medicamento: "Drontal Plus", dosis: "1 tableta", frecuencia: "Dosis única", duracion: "Repetir en 3 meses" }],
  },
  {
    id: "rx7", clienteId: "c10", mascota: "Kira", hora: "12:05", fecha: "22 sep 2026", estado: "enviada", indicaciones: "Suplemento preventivo por edad.",
    items: [{ medicamento: "Omega 3 (aceite de pescado)", dosis: "1 cápsula", frecuencia: "Cada 24 h con comida", duracion: "60 días" }],
  },
];

export function cliente(id: string): Cliente {
  return CLIENTES.find((c) => c.id === id)!;
}

// Historial de visitas. Las de semanas anteriores van a mano (con resumen
// cuando fue consulta); las de hoy salen de las citas atendidas.
const DR = STAFF.veterinario.nombre;
const GROOMER = STAFF.groomer.nombre;

const HISTORICAS: Visita[] = [
  { id: "h1", clienteId: "c1", mascota: "Max", agenda: "clinica", fecha: "2026-03-05", hora: "10:00", servicio: "Vacuna múltiple", atendio: DR },
  { id: "h2", clienteId: "c1", mascota: "Max", agenda: "clinica", fecha: "2026-08-12", hora: "09:30", servicio: "Consulta general", atendio: DR },
  { id: "h3", clienteId: "c1", mascota: "Max", agenda: "grooming", fecha: "2026-06-18", hora: "08:00", servicio: "Baño (grande)", atendio: GROOMER },
  { id: "h4", clienteId: "c1", mascota: "Max", agenda: "grooming", fecha: "2026-09-20", hora: "10:00", servicio: "Baño y corte (grande)", atendio: GROOMER },
  { id: "h5", clienteId: "c3", mascota: "Coco", agenda: "clinica", fecha: "2026-09-03", hora: "15:00", servicio: "Consulta general", atendio: DR },
  { id: "h6", clienteId: "c3", mascota: "Coco", agenda: "clinica", fecha: "2026-04-22", hora: "11:00", servicio: "Desparasitación", atendio: DR },
  { id: "h7", clienteId: "c5", mascota: "Mishi", agenda: "clinica", fecha: "2026-09-18", hora: "16:00", servicio: "Consulta general", atendio: DR },
  { id: "h8", clienteId: "c6", mascota: "Bruno", agenda: "clinica", fecha: "2026-10-03", hora: "10:30", servicio: "Consulta general", atendio: DR },
  { id: "h9", clienteId: "c6", mascota: "Bruno", agenda: "clinica", fecha: "2026-05-14", hora: "09:00", servicio: "Vacuna múltiple", atendio: DR },
  { id: "h10", clienteId: "c10", mascota: "Kira", agenda: "clinica", fecha: "2026-09-22", hora: "08:30", servicio: "Exámenes de sangre", atendio: DR },
  { id: "h11", clienteId: "c13", mascota: "Firulais", agenda: "clinica", fecha: "2026-03-01", hora: "14:30", servicio: "Vacuna antirrábica", atendio: DR },
  { id: "h12", clienteId: "c4", mascota: "Rocky", agenda: "grooming", fecha: "2026-08-02", hora: "08:00", servicio: "Baño (grande)", atendio: GROOMER },
  { id: "h13", clienteId: "c4", mascota: "Luna", agenda: "grooming", fecha: "2026-08-02", hora: "10:00", servicio: "Baño (grande)", atendio: GROOMER },
  { id: "h14", clienteId: "c4", mascota: "Thor", agenda: "grooming", fecha: "2026-08-02", hora: "12:00", servicio: "Baño (grande)", atendio: GROOMER },
];

// Para el resto de clientes, la última visita registrada en su perfil.
const ULTIMAS: Visita[] = CLIENTES.flatMap((c) => {
  const out: Visita[] = [];
  const ya = (agenda: string) => HISTORICAS.some((h) => h.clienteId === c.id && h.agenda === agenda);
  if (c.ultimaClinica && !ya("clinica"))
    out.push({ id: `u${c.id}c`, clienteId: c.id, mascota: c.mascotas[0].nombre, agenda: "clinica", fecha: isoDeTexto(c.ultimaClinica), hora: "10:00", servicio: "Consulta general", atendio: DR });
  if (c.ultimaGrooming && !ya("grooming"))
    out.push({ id: `u${c.id}g`, clienteId: c.id, mascota: c.mascotas[0].nombre, agenda: "grooming", fecha: isoDeTexto(c.ultimaGrooming), hora: "08:00", servicio: "Baño (mediano)", atendio: GROOMER });
  return out;
});

// Solo las de hoy: el resto de la semana es relleno del calendario.
const ATENDIDAS: Visita[] = CITAS.filter((c) => c.dia === 0 && c.estado === "completada").map((c) => ({
  id: `cita-${c.id}`,
  clienteId: c.clienteId,
  mascota: c.mascota,
  agenda: c.agenda,
  fecha: iso(fechaDe(c.dia)),
  hora: c.hora,
  servicio: c.servicio,
  atendio: c.agenda === "clinica" ? DR : GROOMER,
}));

export const VISITAS: Visita[] = [...HISTORICAS, ...ULTIMAS, ...ATENDIDAS];

/** Resúmenes de consulta ya escritos, por id de visita. */
export const RESUMENES: Record<string, ResumenConsulta> = {
  h2: {
    motivo: "Se rasca mucho las orejas desde hace una semana.",
    pesoKg: "32.4",
    hallazgos: "Enrojecimiento leve en pabellón auricular izquierdo, sin secreción ni mal olor.",
    diagnostico: "Dermatitis alérgica leve",
    tratamiento: "Shampoo medicado 2 veces por semana. Cambio a alimento con proteína hidrolizada.",
    proximoControl: "En 30 días",
    autor: DR,
    escrito: "12 ago 2026 · 10:05",
  },
  h1: {
    motivo: "Refuerzo anual de vacuna múltiple.",
    pesoKg: "31.8",
    hallazgos: "Paciente sano, buena condición corporal.",
    diagnostico: "Sano",
    tratamiento: "Vacuna múltiple aplicada.",
    proximoControl: "Refuerzo en 12 meses",
    autor: DR,
    escrito: "5 mar 2026 · 10:20",
  },
  h5: {
    motivo: "Chequeo anual.",
    pesoKg: "11.2",
    hallazgos: "Sin hallazgos relevantes. Dientes con sarro leve.",
    diagnostico: "Sano",
    tratamiento: "Recomendada limpieza dental en los próximos meses.",
    proximoControl: "En 12 meses",
    autor: DR,
    escrito: "3 sep 2026 · 15:30",
  },
  h7: {
    motivo: "Pérdida de pelo en el lomo y rascado.",
    pesoKg: "4.1",
    hallazgos: "Zonas de alopecia con descamación en región lumbar.",
    diagnostico: "Dermatitis (en estudio)",
    tratamiento: "Tratamiento tópico por 14 días. Control para evaluar evolución.",
    proximoControl: "En 7 días",
    autor: DR,
    escrito: "18 sep 2026 · 16:25",
  },
  h8: {
    motivo: "Cojea de la pata trasera derecha desde hace 2 días.",
    pesoKg: "12.7",
    hallazgos: "Dolor a la manipulación de rodilla derecha. Sin inestabilidad evidente.",
    diagnostico: "Esguince leve de rodilla (descartar lesión de ligamento si no mejora)",
    tratamiento: "Antiinflamatorio 7 días, condroprotector 30 días. Reposo 10 días.",
    proximoControl: "En 4 días (seguimiento por WhatsApp)",
    autor: DR,
    escrito: "3 oct 2026 · 11:00",
  },
  h10: {
    motivo: "Exámenes de rutina por edad (8 años).",
    pesoKg: "29.5",
    hallazgos: "Hemograma y química sanguínea dentro de rangos normales.",
    diagnostico: "Sana",
    tratamiento: "Sin tratamiento.",
    proximoControl: "En 14 días",
    autor: DR,
    escrito: "22 sep 2026 · 12:10",
  },
  "cita-a1": {
    motivo: "Sacude la cabeza y tiene mal olor en los oídos.",
    pesoKg: "14.3",
    hallazgos: "Secreción café en ambos oídos, conducto enrojecido.",
    diagnostico: "Otitis externa bilateral",
    tratamiento: "Gotas óticas 7 días y antiinflamatorio 5 días. Limpieza de oídos antes de cada aplicación.",
    proximoControl: "En 7 días",
    autor: DR,
    escrito: "Hoy · 09:05",
  },
};

export const NOTAS: Nota[] = [
  { id: "n1", clienteId: "c1", texto: "Prefiere citas temprano por la mañana. Max se pone nervioso con otros perros en sala de espera.", fecha: "2026-08-12", hora: "10:10", autor: "Recepción" },
  { id: "n2", clienteId: "c6", texto: "Pidió que le llamen antes de las 5 pm.", fecha: "2026-10-03", hora: "11:05", autor: "Recepción" },
  { id: "n3", clienteId: "c4", texto: "Trae a los 3 perros juntos. Consultó por descuento: lo autoriza la clínica.", fecha: "2026-08-02", hora: "07:50", autor: "Recepción" },
];

// Diseños prediseñados para posts (fondo + título sobre la imagen).
export const DISENOS = [
  { fondo: "linear-gradient(135deg,#0f766e,#14b8a6)", titulo: "Vacunación al día" },
  { fondo: "linear-gradient(135deg,#b45309,#f59e0b)", titulo: "Día de grooming" },
  { fondo: "linear-gradient(135deg,#7c3aed,#c084fc)", titulo: "Agenda por WhatsApp 24/7" },
  { fondo: "linear-gradient(135deg,#be123c,#fb7185)", titulo: "Adopta, no compres" },
];

export const POSTS: Post[] = [
  {
    id: "p1", redes: ["instagram", "facebook"], estado: "publicada", fecha: "2026-10-10", hora: "18:00",
    diseno: DISENOS[0],
    texto: "¿Ya revisaste el carné de vacunas de tu mascota? 🐶🐱 Las vacunas al día la protegen de enfermedades graves. Escríbenos por WhatsApp y Luna te agenda en minutos. #Vacunación #ClínicaVeterinaria #Guatemala",
    stats: { alcance: 2140, meGusta: 186, comentarios: 23, mensajes: 17 },
  },
  {
    id: "p2", redes: ["instagram"], estado: "publicada", fecha: "2026-10-05", hora: "12:30",
    diseno: DISENOS[1],
    texto: "Así salió Peluche de su baño y corte ✂️✨ ¡Quedó listo para el fin de semana! Agenda el grooming de tu mascota por WhatsApp. #Grooming #ShihTzu",
    stats: { alcance: 3380, meGusta: 412, comentarios: 41, mensajes: 26 },
  },
  {
    id: "p3", redes: ["facebook"], estado: "publicada", fecha: "2026-09-28", hora: "09:00",
    diseno: DISENOS[2],
    texto: "Ahora puedes agendar tu cita a cualquier hora por WhatsApp: nuestra asistente Luna te responde al instante y te recuerda la cita un día antes. 📲",
    stats: { alcance: 1520, meGusta: 98, comentarios: 12, mensajes: 31 },
  },
  {
    id: "p4", redes: ["instagram", "facebook"], estado: "programada", fecha: "2026-10-17", hora: "10:00",
    diseno: DISENOS[3],
    texto: "Este sábado acompáñanos en la jornada de adopción junto a refugios de la ciudad 🐾 Habrá orientación para nuevos dueños. #AdoptaNoCompres",
  },
];

export const CAMPANAS: Campana[] = [
  {
    id: "k1", nombre: "Mes de la desparasitación", segmento: "clinica_inactivos", estado: "enviada", fecha: "2026-10-01", hora: "10:00", destinatarios: 64,
    mensaje: "Hola {{nombre}}, en Clínica Veterinaria Patitas este mes estamos recordando la desparasitación. ¿Quieres que agendemos a {{mascota}}?",
    botones: ["Agendar cita", "Ahora no", "No recibir más"],
    stats: { entregados: 62, leidos: 55, respondieron: 21, citas: 12 },
  },
  {
    id: "k2", nombre: "Grooming de fin de mes", segmento: "grooming_inactivos", estado: "enviada", fecha: "2026-09-24", hora: "09:30", destinatarios: 38,
    mensaje: "Hola {{nombre}}, ¿{{mascota}} ya necesita su baño? Tenemos espacios esta semana en grooming. ¿Te agendamos?",
    botones: ["Agendar cita", "Ahora no", "No recibir más"],
    stats: { entregados: 38, leidos: 33, respondieron: 14, citas: 9 },
  },
  {
    id: "k3", nombre: "Chequeo anual de gatos", segmento: "gatos", estado: "programada", fecha: "2026-10-20", hora: "10:00", destinatarios: 6,
    mensaje: "Hola {{nombre}}, los gatos también necesitan su chequeo anual. ¿Agendamos a {{mascota}} con el Dr. Méndez?",
    botones: ["Agendar cita", "Ahora no", "No recibir más"],
  },
];

/** Apellido del dueño (última palabra del nombre). */
export function apellido(c: Cliente): string {
  const partes = c.nombre.replace(/^(Dr\.|Dra\.)\s*/, "").trim().split(/\s+/);
  return partes[partes.length - 1];
}

/** La mascota lleva el apellido del dueño: "Max Pérez". */
export function nombreMascota(nombre: string, c: Cliente): string {
  return `${nombre} ${apellido(c)}`;
}
