"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PLANTILLAS } from "@/lib/seed";
import { PageHeader } from "@/components/ui";

const SECCIONES = [
  ["modulos", "1. Módulos"],
  ["flujos", "2. Flujos"],
  ["plantillas", "3. Plantillas"],
  ["dashboard", "4. Dashboard"],
  ["datos", "5. Datos a pedir"],
  ["supuestos", "6. Supuestos y preguntas"],
] as const;

const MODULOS: { nombre: string; que: string; quien: string; problema: string }[] = [
  {
    nombre: "Bandeja omnicanal",
    que: "Une WhatsApp, Instagram y Facebook en una sola lista, con el historial de cada cliente (mascotas, citas de clínica y de grooming, conversaciones anteriores). No reparte clientes entre personas: el agente atiende todas las conversaciones y se enfoca en agendar y reactivar. Las pestañas van por objetivo (agendamiento, reactivación, recordatorios y seguimiento, requieren atención), cada conversación muestra su resultado (cita agendada, confirmada, reagendada) y un filtro permite escoger qué canales ver. La secretaria puede responder en cualquier conversación; al hacerlo, el agente queda en pausa en esa conversación hasta que lo reactive.",
    quien: "Secretaria (opera). Veterinario y groomer no la usan en el día a día.",
    problema: "Los mensajes quedan repartidos en tres apps y en el celular de alguien. Se pierden mensajes, nadie sabe quién contestó qué y la historia del cliente no está a mano.",
  },
  {
    nombre: "Calendario de clínica",
    que: "Conecta el Google Calendar del veterinario. El agente lee la disponibilidad real y crea, mueve o cancela citas de consulta, vacunas, desparasitación y controles. Respeta el horario de atención, el almuerzo y los bloqueos que el veterinario ponga en su calendario.",
    quien: "Veterinario (su agenda); secretaria (la consulta y agenda manualmente).",
    problema: "Doble agendamiento, citas anotadas en papel o en WhatsApp, y el veterinario sin ver su día completo.",
  },
  {
    nombre: "Calendario de grooming",
    que: "Conecta un Google Calendar separado para el groomer. Las duraciones dependen del tamaño de la mascota y del servicio. Las dos agendas nunca se mezclan: cada servicio está atado a un calendario, y el agente no puede poner grooming en la agenda médica ni al revés.",
    quien: "Groomer (su agenda); secretaria.",
    problema: "Grooming compite con la agenda médica o se lleva «de memoria». Bloques mal calculados provocan esperas y retrasos.",
  },
  {
    nombre: "Respuestas y agendamiento por IA",
    que: "Si alguien que no está en la base de la clínica escribe por WhatsApp, el agente crea el perfil en la misma conversación (el número de WhatsApp queda como teléfono): pide nombre del dueño, nombre de la mascota, raza y edad (y tamaño si es grooming), y lo guarda marcado como «creado por MIA» para que recepción lo revise. Si el cliente existe pero la mascota no, la agrega a su perfil. En Instagram y Facebook no pide datos personales: responde horarios, precios y servicios y, para agendar, invita a continuar por WhatsApp con un enlace directo. El agente responde al instante, también fuera de horario, usando solo la información aprobada por la clínica (horarios, precios, servicios, políticas). Ofrece espacios libres reales y agenda en el calendario que corresponde. No da diagnósticos ni orientación médica. Transfiere en vivo a la secretaria los casos clínicos, las urgencias, las excepciones de precio y las conversaciones en las que el cliente pide hablar con una persona.",
    quien: "Clientes (lo usan sin saberlo); secretaria (recibe lo que el agente transfiere y edita la información aprobada).",
    problema: "Las mismas preguntas todo el día (precio, horario, ¿hay espacio?) y los mensajes nocturnos que se contestan al día siguiente, cuando el cliente ya fue a otra clínica.",
  },
  {
    nombre: "Seguimiento de consultas",
    que: "Al cerrar una consulta, el veterinario decide si se hace seguimiento, cuándo (24 h, 3, 7 o 14 días) y de qué tipo (evolución, reacción a vacuna, recordar control). El agente envía la plantilla y recoge la respuesta. Si el cliente dice que la mascota sigue igual o empeoró, o menciona síntomas, transfiere a la secretaria sin opinar. Si la mascota está mejor, ofrece agendar el control si corresponde.",
    quien: "Veterinario (define la regla); secretaria (atiende lo que se transfiere).",
    problema: "Nadie llama al día siguiente para preguntar cómo sigue la mascota. Se pierden controles y el cliente siente que lo olvidaron.",
  },
  {
    nombre: "Receta digital",
    que: "Herramienta para que el veterinario escriba la receta en el panel al terminar la consulta: paciente de su agenda, medicamentos con dosis, frecuencia y duración, e indicaciones. Se genera un PDF con el membrete de la clínica y su firma, que sale de inmediato al WhatsApp del cliente y queda en su historial. No está ligada al inventario: si el cliente quiere comprar en la clínica, lo resuelven el veterinario o la secretaria.",
    quien: "Veterinario (es el único que la escribe y envía). La secretaria la consulta en el perfil del cliente, solo lectura.",
    problema: "La receta a mano se pierde, no se entiende y no queda registrada. Con el PDF en el WhatsApp, el cliente la tiene apenas sale de la consulta.",
  },
  {
    nombre: "Recordatorios automáticos",
    que: "24 h antes de cada cita de clínica y de grooming sale un recordatorio con los botones Confirmar, Reagendar y Cancelar. «Cancelar» libera el espacio en el calendario y «Reagendar» ofrece espacios de la misma agenda. Si 4 h antes no hay respuesta, la cita pasa a «Por confirmar» para que la secretaria llame.",
    quien: "Secretaria (ve quién no confirmó); veterinario y groomer (ven su agenda confirmada).",
    problema: "Ausencias y espacios vacíos que nadie pudo volver a ocupar.",
  },
  {
    nombre: "Reactivación de clientes inactivos",
    que: "Toma la base de clientes de la clínica y calcula cuánto tiempo lleva cada uno sin visitar, por separado para clínica y para grooming. La secretaria filtra por tiempo sin visita (15 días, 1 mes o más de 1 mes), escoge a quién escribirle y envía el mensaje de reactivación: cada cliente recibe la plantilla de su agenda. Se excluye a quien tiene cita futura o pidió no recibir mensajes, y el agente agenda a quien responde.",
    quien: "Secretaria (elige el rango, selecciona a los clientes y envía).",
    problema: "La base de clientes existe pero no se usa. Un cliente que dejó de venir no recibe ningún contacto.",
  },
  {
    nombre: "Plantillas de WhatsApp",
    que: "Cinco plantillas para aprobar en Meta: confirmación, recordatorio, seguimiento, reactivación de clínica y reactivación de grooming. Se ve el estado de aprobación y el desempeño de cada una.",
    quien: "Secretaria o administración.",
    problema: "Sin plantillas aprobadas, WhatsApp no permite escribirle primero al cliente.",
  },
  {
    nombre: "Dashboard",
    que: "Filtro global Clínica / Grooming y dos vistas: la secretaria ve la operación del día y el veterinario ve el resumen de la semana. No muestra montos de dinero ni cálculos de retorno.",
    quien: "Secretaria (diario) y veterinario (semanal).",
    problema: "No saber cuántas citas se pierden, cuánto espera un cliente transferido o si los recordatorios funcionan.",
  },
];

function Paso({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">{n}</span>
      <div className="text-[14px] leading-relaxed text-[var(--text-2)]">{children}</div>
    </li>
  );
}

function Flujo({ titulo, pasos, nota }: { titulo: string; pasos: ReactNode[]; nota?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h3 className="mb-3 text-[16px] font-bold">{titulo}</h3>
      <ol className="space-y-2.5">
        {pasos.map((p, i) => (
          <Paso key={i} n={i + 1}>{p}</Paso>
        ))}
      </ol>
      {nota && <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] text-[var(--text-3)]">{nota}</p>}
    </div>
  );
}

export default function ProductoPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Documento de producto" sub="Centro de comunicación para clínicas veterinarias · v0.1 · demo Patitas" />
      <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-line bg-card/95 px-6 py-2 backdrop-blur">
        {SECCIONES.map(([id, l]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold text-[var(--text-2)] hover:bg-surface">
            {l}
          </a>
        ))}
      </div>

      <div className="prose-doc mx-auto w-full max-w-5xl space-y-4 p-6">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p>
            <strong>Qué es:</strong> un centro de comunicación para clínicas veterinarias con servicio de grooming. Une los mensajes de WhatsApp, Instagram y Facebook, atiende con un agente de IA que solo dice información aprobada por la clínica y agenda en dos calendarios de Google separados (veterinario y groomer). Además envía recordatorios, seguimientos y campañas de reactivación.
          </p>
          <p className="mt-2">
            <strong>Reglas del producto:</strong> (1) el agente no da diagnóstico ni orientación médica; (2) los casos clínicos, las urgencias y las excepciones de precio se transfieren en vivo a la secretaria; (3) la secretaria puede tomar cualquier conversación en cualquier momento; (4) la información de los clientes es propiedad de la clínica; (5) no incluye agente de voz ni cálculos de ROI.
          </p>
        </div>

        {/* 1 */}
        <h2 id="modulos" className="scroll-mt-16">1. Descripción del producto por módulo</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full text-left">
            <thead className="bg-surface text-[11px] uppercase tracking-wider text-[var(--text-3)]">
              <tr>
                <th className="w-40 px-4 py-2.5">Módulo</th>
                <th className="px-4 py-2.5">Qué hace</th>
                <th className="w-44 px-4 py-2.5">Quién lo usa</th>
                <th className="w-64 px-4 py-2.5">Qué problema resuelve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line align-top text-[13px]">
              {MODULOS.map((m) => (
                <tr key={m.nombre}>
                  <td className="px-4 py-3 font-bold">{m.nombre}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{m.que}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{m.quien}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{m.problema}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2 */}
        <h2 id="flujos" className="scroll-mt-16">2. Flujos principales</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Flujo
            titulo="A. Agendar consulta (clínica)"
            pasos={[
              "El cliente escribe por WhatsApp, Instagram o Facebook («quiero vacunar a Max»).",
              "Si el mensaje llega por Instagram o Facebook, el agente responde la consulta y, para agendar, envía el enlace para seguir por WhatsApp. Por WhatsApp identifica al cliente por su número. Si no está en la base, crea el perfil ahí mismo: pide nombre del dueño, nombre de la mascota, raza y edad, deduce la especie y guarda el perfil marcado para revisión de recepción. Si el cliente existe pero la mascota es nueva, la agrega a su perfil.",
              "Clasifica el servicio con el catálogo de clínica. Si el mensaje describe síntomas, no los evalúa: ofrece consulta general y, si hay señales de urgencia, transfiere (flujo F).",
              "Da el precio aprobado tal como está en la lista. Si el precio depende de algo («según peso»), lo dice así.",
              "Consulta el Google Calendar del veterinario y ofrece 2 o 3 espacios libres reales.",
              "El cliente elige. El agente crea el evento en la Agenda Clínica con mascota, servicio, teléfono y origen = IA.",
              "Confirma en la conversación con fecha, hora y lugar, y programa el recordatorio de 24 h.",
            ]}
            nota="Si el cliente agenda por chat no se usa plantilla: la ventana de 24 h está abierta."
          />
          <Flujo
            titulo="B. Agendar grooming"
            pasos={[
              "El cliente pide baño, corte, uñas, etc.",
              "El agente confirma la mascota y su tamaño (si no está en la ficha, lo pregunta), porque de eso dependen el precio y la duración.",
              "Da el precio aprobado de grooming según tamaño y servicio.",
              "Consulta solo el Google Calendar del groomer y busca un bloque del largo necesario (por ejemplo, 2 h para baño y corte mediano).",
              "Ofrece espacios; el cliente elige; el agente crea el evento en la Agenda Grooming.",
              "Confirma e informa la política de entrega. Si el cliente menciona un problema de piel, heridas o parásitos, no opina y lo pasa a la secretaria para que decida si va primero a consulta.",
            ]}
          />
          <Flujo
            titulo="C. Recordatorio y confirmación"
            pasos={[
              "24 h antes de cada cita (de las dos agendas) sale la plantilla recordatorio_cita con los botones Confirmar, Reagendar y Cancelar.",
              "Confirmar: la cita queda confirmada en el panel y en el calendario.",
              "Reagendar: el agente ofrece espacios de la misma agenda, mueve el evento y libera el espacio anterior.",
              "Cancelar: el agente cancela el evento, libera el espacio y pregunta si quiere agendar otra fecha.",
              "Sin respuesta 4 h antes: la cita aparece en «Por confirmar» en Hoy y en el dashboard para que la secretaria llame.",
              "Después de la hora de la cita, la recepción marca Atendida o No se presentó (dato para el indicador de ausencias).",
            ]}
          />
          <Flujo
            titulo="D. Seguimiento después de la consulta"
            pasos={[
              "Al cerrar la consulta, el veterinario elige si se hace seguimiento, cuándo y de qué tipo. Si no elige nada, no se envía.",
              "En la fecha indicada sale la plantilla seguimiento_consulta con los botones Está mejor, Sigue igual y Hablar con la clínica.",
              "Está mejor: el agente agradece y, si el veterinario dejó un control pendiente, ofrece agendarlo.",
              "Sigue igual, Hablar con la clínica o cualquier texto con síntomas: el agente agradece sin opinar y transfiere a la secretaria con la respuesta resaltada. La secretaria consulta al veterinario.",
              "Todo queda en el historial del cliente y en las métricas de seguimiento.",
            ]}
          />
          <Flujo
            titulo="E. Reactivación de clientes"
            pasos={[
              "Se carga la base de clientes de la clínica con la última visita a clínica y la última a grooming por separado.",
              "El sistema calcula los días sin visita de cada cliente en cada agenda y excluye a quien tiene cita futura en esa agenda, pidió no recibir mensajes o tiene la mascota fallecida.",
              "La secretaria abre Reactivación, usa el filtro global Clínica / Grooming y escoge el rango: 15 días (15 a 29 días sin visita), 1 mes (30 a 59) o más de 1 mes (60 o más).",
              "Revisa la lista del rango, selecciona a todos o solo a algunos y pulsa «Enviar mensaje de reactivación». Cada cliente recibe la plantilla de su agenda (reactivacion_clinica o reactivacion_grooming), en horario de atención.",
              "Agendar: el agente ofrece espacios solo de esa agenda y crea la cita. Ahora no: agradece y se cierra. No recibir más: queda fuera de los mensajes de marketing.",
              "El panel y el dashboard muestran cuántos clientes hay en cada rango, cuántos faltan por contactar y el embudo detectados → contactados → respondieron → citas.",
            ]}
          />
          <Flujo
            titulo="G. Receta digital"
            pasos={[
              "Al terminar la consulta, el veterinario abre «Receta digital» y elige al paciente de su agenda de hoy (los datos del cliente y de la mascota se llenan solos).",
              "Escribe los medicamentos con su dosis, frecuencia y duración, y agrega las indicaciones.",
              "Revisa el PDF con «Ver PDF» si quiere y pulsa «Enviar PDF por WhatsApp».",
              "El PDF sale con la plantilla receta_consulta, o directo en la conversación si la ventana de 24 h está abierta. Queda guardado en el historial del cliente para reenviarlo si lo pierde.",
              "La secretaria no tiene acceso a «Receta digital». Ve las recetas en Clientes y mascotas › perfil del cliente (medicamentos, dosis, indicaciones y si el cliente la leyó), sin poder editarlas.",
              "«Tengo una duda» o cualquier pregunta sobre dosis o tratamiento: el agente no responde el contenido y transfiere a la secretaria como caso clínico.",
            ]}
            nota="El agente nunca redacta, explica ni modifica una receta: solo la entrega."
          />
          <Flujo
            titulo="F. Transferencia a la secretaria"
            pasos={[
              "Disparadores: síntomas o preguntas médicas (caso clínico), señales de urgencia (intoxicación, sangrado, convulsiones, no respira, atropello…), pedidos de descuento o precio fuera de lista (excepción de precio), o el cliente pide hablar con una persona.",
              "El agente responde un mensaje fijo: no da indicaciones, avisa que lo comunica con la secretaria y, si es urgencia, da el número de urgencias de inmediato.",
              "La conversación pasa a «Esperando secretaria» con el motivo y un contador de espera. Las urgencias van primero y con alerta.",
              "Las urgencias también le aparecen al veterinario en Hoy y en el Dashboard, y como una entrada «Sin hora» en su agenda de clínica. Él decide: recibirla ahora (sobrecupo), darle uno de los próximos espacios libres o indicar que no necesita cita. La hora queda en su agenda y la secretaria ve el aviso en la conversación para decírselo al cliente.",
              "Desde ese momento el agente no responde en esa conversación.",
              "La secretaria responde desde la misma bandeja. Al terminar puede resolverla o pulsar «Que MIA siga» para que el agente retome y agende.",
              "Fuera de horario: el agente da el contacto del hospital 24 h para urgencias y deja la conversación transferida para la mañana.",
            ]}
            nota="No hay asignación de clientes a personas. La secretaria puede intervenir en cualquier conversación escribiendo en ella: el agente queda en pausa solo en esa conversación."
          />
        </div>

        {/* 3 */}
        <h2 id="plantillas" className="scroll-mt-16">3. Plantillas de WhatsApp para aprobación de Meta</h2>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p>
            <strong>Recomendación:</strong> mantener la combinación propuesta (confirmación, recordatorio, seguimiento, reactivación de clínica y reactivación de grooming) y sumar una sexta, <strong>receta_consulta</strong> (utilidad, con el PDF como encabezado), para enviar el PDF de la receta digital apenas termina la consulta. En la base hice dos ajustes:
          </p>
          <ul className="mt-2">
            <li>
              <strong>La confirmación solo sale como plantilla cuando la ventana de 24 h está cerrada.</strong> Si el cliente agendó por chat, la confirmación va como mensaje normal y no cuesta plantilla. La plantilla sirve para las citas que la secretaria agenda por teléfono o en mostrador, que hoy son buena parte de la agenda.
            </li>
            <li>
              <strong>Un solo recordatorio para las dos agendas</strong> (el servicio va como variable) en vez de uno por agenda. Así hay menos plantillas que aprobar y mantener, y queda espacio para una plantilla futura de «Tu mascota está lista» (grooming) o de vacunas por vencer, que conviene evaluar después del piloto.
            </li>
          </ul>
          <p className="mt-2">
            Para no tener rechazos: las de utilidad no llevan ofertas (Meta las reclasifica a marketing), ninguna empieza ni termina con una variable, las variables no van seguidas y las de marketing incluyen el botón «No recibir más».
          </p>
        </div>
        <div className="space-y-3">
          {PLANTILLAS.map((p) => (
            <div key={p.nombre} className="rounded-2xl border border-line bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-surface px-1.5 py-0.5 text-[14px] font-bold">{p.nombre}</code>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", p.categoria === "UTILITY" ? "bg-emerald-50 text-emerald-700" : "bg-fuchsia-50 text-fuchsia-700")}>
                  {p.categoria === "UTILITY" ? "Utilidad" : "Marketing"}
                </span>
                <span className="text-[12.5px] text-[var(--text-3)]">Idioma: es · Botones: {p.botones.join(" / ")}</span>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface p-3 font-sans text-[13.5px] leading-relaxed">{p.cuerpo}</pre>
              <p className="mt-2">
                <strong>Ejemplo de variables:</strong> {p.ejemplo.map((e, i) => `{{${i + 1}}} ${e}`).join(" · ")}
              </p>
              <p className="mt-1">
                <strong>Cuándo se envía:</strong> {p.cuando}
              </p>
            </div>
          ))}
        </div>

        {/* 4 */}
        <h2 id="dashboard" className="scroll-mt-16">4. Diseño del dashboard</h2>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p>
            <strong>Filtro global</strong> Todo / Clínica / Grooming arriba a la derecha, que se aplica a todas las tarjetas. El veterinario lo tiene fijo en Clínica y el groomer en Grooming. <strong>Dos vistas:</strong> Secretaria (hoy, en vivo) y Veterinario (últimos 7 días). Ninguna muestra dinero ni ROI. Se puede ver funcionando en <a className="font-semibold text-brand underline" href="/dashboard">/dashboard</a>.
          </p>
          <h3>Vista Secretaria · operación del día</h3>
          <ul>
            <li><strong>Hoy:</strong> citas del día por agenda con su % de ocupación; conversaciones transferidas pendientes <em>con el tiempo de espera de la más antigua</em> (mejora: el número solo no dice si hay alguien esperando 40 minutos); citas por confirmar de hoy y mañana; atendidas hasta ahora / total.</li>
            <li><strong>Bandeja hoy:</strong> conversaciones por canal; tiempo de primera respuesta <em>separado en agente y secretaria</em> (mejora: el del agente siempre son segundos y esconde lo que tarda una persona en tomar una transferida); % resuelto por IA vs transferido; <em>motivo de transferencia</em> (mejora: muestra si sobran transferencias por precio, que se arreglan agregando información aprobada); conversaciones fuera de horario.</li>
            <li><strong>Recordatorios para mañana:</strong> enviados, confirmados, sin respuesta.</li>
            <li><strong>Próximos espacios libres</strong> de cada agenda, para ofrecer por teléfono o en mostrador.</li>
          </ul>
          <h3>Vista Veterinario · resumen semanal</h3>
          <ul>
            <li><strong>Agendas:</strong> citas de la semana; agendadas por IA vs manuales por agenda; <em>% agendadas fuera de horario</em> (mejora); ocupación por día (barras por agenda) y promedio semanal; cancelaciones, reagendamientos y ausencias (% no-show).</li>
            <li><strong>Recordatorios:</strong> enviados, confirmados, ausencias. Mejora: <em>ausencias de citas confirmadas vs no confirmadas</em>, para saber si el recordatorio sirve.</li>
            <li><strong>Seguimiento</strong> (solo clínica): embudo programados → enviados → respondidos → nueva cita, más el <em>número de seguimientos transferidos por síntoma</em> (mejora: le dice al veterinario cuántos casos requirieron su atención).</li>
            <li><strong>Reactivación:</strong> inactivos por rango de tiempo sin visita (15 días, 1 mes, más de 1 mes) con cuántos faltan por contactar, y el embudo inactivos → contactados → respondieron → citas separado por agenda, más los opt-out (mejora: un opt-out alto avisa que la frecuencia o el texto están mal).</li>
            <li><strong>Plantillas:</strong> envíos, entregados, leídos y respondidos por plantilla, con tasa de respuesta, y <em>estado en Meta</em> (aprobada, en revisión o rechazada).</li>
            <li><strong>Bandeja semanal:</strong> los mismos indicadores de la vista de la secretaria, acumulados.</li>
          </ul>
          <h3>Definiciones (para que todos lean lo mismo)</h3>
          <ul>
            <li><strong>Tiempo de primera respuesta (agente):</strong> del primer mensaje del cliente a la primera respuesta. <strong>(Secretaria):</strong> de la transferencia a que alguien toma la conversación.</li>
            <li><strong>Resuelto por IA:</strong> la conversación se cerró sin transferencia ni intervención humana.</li>
            <li><strong>Ocupación:</strong> minutos con cita / minutos de atención del día (sin almuerzo ni bloqueos).</li>
            <li><strong>Ausencia:</strong> cita marcada «No se presentó».</li>
            <li><strong>Fuera de horario:</strong> el primer mensaje llegó fuera del horario de atención de la agenda.</li>
          </ul>
        </div>

        {/* 5 */}
        <h2 id="datos" className="scroll-mt-16">5. Datos que hay que pedirle a la clínica</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Clínica", ["Nombre comercial, dirección, link de Google Maps, parqueo", "Logo y colores (para el panel)", "Teléfono de recepción y teléfono de urgencias", "Hospital o clínica 24 h a la que derivan fuera de horario", "Formas de pago aceptadas"]],
            ["Horarios", ["Horario de clínica por día, almuerzo y feriados", "Horario de grooming por día", "Días u horas bloqueadas recurrentes (cirugías, visitas a domicilio)", "Horario en que pueden salir mensajes automáticos"]],
            ["Servicios y precios · clínica", ["Lista de servicios con duración", "Precio en dólares (USD): exacto, rango o «se cotiza en consulta» para cada uno", "Qué servicios puede agendar el agente y cuáles solo la recepción (cirugías, ecografías…)", "Requisitos previos (ayuno, traer carné de vacunas)"]],
            ["Servicios y precios · grooming", ["Servicios por tamaño (pequeño, mediano, grande) y por especie", "Duración por servicio y tamaño", "Recargos aprobados (pelo enredado, raza difícil), si los hay", "Política de entrega y recogida"]],
            ["Calendarios", ["Cuenta de Google del veterinario y del groomer (o calendarios dedicados) con permiso de edición", "Cuántos veterinarios y groomers hay (¿uno o varios calendarios por agenda?)", "Cómo marcan hoy bloqueos y vacaciones", "Formato del título de los eventos que quieren ver"]],
            ["Canales", ["Número de WhatsApp Business (y si hoy está en la app o en la API)", "Acceso de administrador a la página de Facebook y a la cuenta de Instagram", "Cuenta de Meta Business Manager verificada (o los datos para verificarla)"]],
            ["Base de clientes", ["Formato de receta actual, número de colegiado y firma del veterinario", "Exportación (Excel o CSV) de clientes: nombre, teléfono, mascotas (nombre, especie, raza, tamaño, fecha de nacimiento)", "Última visita a clínica y última a grooming por mascota", "Mascotas fallecidas o clientes que no deben contactarse", "Consentimiento: cómo y cuándo autorizaron recibir WhatsApp"]],
            ["Reglas y personas", ["Nombre de la secretaria y de quién la cubre", "Lista de palabras o situaciones que la clínica considera urgencia", "Quién autoriza excepciones de precio", "Reglas de seguimiento por tipo de consulta (propuesta del veterinario)", "Si los rangos de reactivación (15 días, 1 mes, más de 1 mes) les sirven o prefieren otros", "Tono y nombre del agente; cómo se presenta"]],
          ].map(([t, items]) => (
            <div key={t as string} className="rounded-2xl border border-line bg-card p-4">
              <h3 className="!mt-0">{t}</h3>
              <ul>{(items as string[]).map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>

        {/* 6 */}
        <h2 id="supuestos" className="scroll-mt-16">6. Supuestos y preguntas a validar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h3 className="!mt-0">Supuestos que tomé</h3>
            <ul>
              <li>Hay un veterinario y un groomer, cada uno con un Google Calendar propio.</li>
              <li>La clínica usa o puede migrar a WhatsApp Cloud API (deja de usar la app en ese número).</li>
              <li>La secretaria trabaja desde el panel web en computadora durante el horario de atención.</li>
              <li>Las consultas son de 30 min y el grooming va en bloques de 1,5 a 2,5 h según tamaño.</li>
              <li>La base de clientes se puede exportar con teléfono y última visita por agenda.</li>
              <li>«Excepción de precio» = descuentos, paquetes no listados y cualquier precio que el agente no tenga.</li>
              <li>El agente atiende en español.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <h3 className="!mt-0">Preguntas para producto</h3>
            <ul>
              <li>¿El panel registra «Atendida / No se presentó» o se lee del calendario? (De esto dependen las ausencias.)</li>
              <li>¿Dónde define el veterinario el seguimiento: en el panel, con una etiqueta en el evento de Google Calendar o por WhatsApp interno?</li>
              <li>¿Se permiten varios veterinarios o groomers por agenda en la v1?</li>
              <li>¿Qué pasa con la conversación transferida si nadie responde en X minutos? (¿Alerta por WhatsApp a la secretaria?)</li>
              <li>¿Exportación y borrado de datos a solicitud de la clínica: CSV desde el panel o proceso manual?</li>
              <li>¿Fichas de mascota en nuestro sistema o lectura del software veterinario que ya usen? Los perfiles que crea el agente, ¿se sincronizan con ese software o recepción los pasa?</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5 md:col-span-2">
            <h3 className="!mt-0">Preguntas para la clínica</h3>
            <ul>
              <li>¿Qué software usan hoy para expedientes o facturación? ¿Exporta clientes y visitas?</li>
              <li>Receta digital: ¿el PDF necesita número de colegiado o firma escaneada? ¿Recetan medicamentos controlados que no deban ir por WhatsApp?</li>
              <li>¿Qué situaciones consideran urgencia y qué quieren que diga el agente en ese momento?</li>
              <li>¿Aceptan urgencias sin cita en horario? ¿A dónde derivan fuera de horario?</li>
              <li>Precios: se manejan en dólares (USD) y se definirán más adelante; el demo no muestra montos. ¿Se podrán decir tal cual o prefieren rangos? ¿Cuáles nunca se dicen por chat?</li>
              <li>¿El grooming requiere vacunas al día? ¿El agente debe pedir el carné?</li>
              <li>¿Los rangos de 15 días, 1 mes y más de 1 mes sin visita les sirven? ¿Cuántas veces como máximo quieren contactar al mismo cliente?</li>
              <li>¿Quién cubre a la secretaria en almuerzo o ausencia? ¿El veterinario debe ver las transferencias?</li>
              <li>¿Tienen consentimiento de sus clientes para escribirles por WhatsApp? ¿Cómo lo registraron?</li>
              <li>¿Quieren que el agente se presente como asistente virtual o con un nombre propio?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
