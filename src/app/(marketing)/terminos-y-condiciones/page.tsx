import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Tarely",
  description: "Términos y condiciones de uso de Tarely. Conoce las reglas y condiciones que rigen el uso de nuestra plataforma.",
};

export default function TerminosYCondicionesPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-background to-slate-950" />
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-violet-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-fuchsia-500/6 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-14 md:h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group">
            <Image
              src="/logo/logo_tarely_bg.png"
              alt="Tarely"
              width={40}
              height={40}
              className="h-8 w-8 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Tarely
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 mb-5">
              <FileText className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs text-violet-300">Documento legal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Última actualización: 9 de febrero de 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 sm:space-y-10">
            <Section title="1. Aceptación de los términos">
              <p>
                Al acceder y utilizar Tarely (&ldquo;la plataforma&rdquo;, &ldquo;el servicio&rdquo;),
                accesible desde{" "}
                <a href="https://tarely.com" className="text-violet-400 hover:underline">tarely.com</a>,
                aceptas estar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con
                alguno de estos términos, no deberás utilizar el servicio.
              </p>
            </Section>

            <Section title="2. Descripción del servicio">
              <p>
                Tarely es una plataforma de gestión de tareas potenciada por inteligencia artificial que permite a los usuarios:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Convertir texto desordenado (emails, notas, ideas) en tareas organizadas y priorizadas automáticamente.</li>
                <li>Crear y gestionar workspaces para organizar proyectos.</li>
                <li>Visualizar tareas en vista Kanban y calendario.</li>
                <li>Generar subtareas automáticas mediante IA.</li>
                <li>Colaborar en equipo con otros usuarios.</li>
              </ul>
            </Section>

            <Section title="3. Registro y cuenta">
              <p>Para utilizar Tarely necesitas crear una cuenta proporcionando:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Un nombre de usuario.</li>
                <li>Una dirección de correo electrónico válida.</li>
                <li>Una contraseña segura (mínimo 6 caracteres).</li>
              </ul>
              <p className="mt-3">Eres responsable de:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
                <li>Toda la actividad que ocurra bajo tu cuenta.</li>
                <li>Notificarnos inmediatamente si detectas un uso no autorizado de tu cuenta.</li>
              </ul>
              <p className="mt-3">
                Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos.
              </p>
            </Section>

            <Section title="4. Uso aceptable">
              <p>Te comprometes a utilizar Tarely de manera responsable. Queda prohibido:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Utilizar el servicio para actividades ilegales o no autorizadas.</li>
                <li>Intentar acceder a cuentas de otros usuarios sin autorización.</li>
                <li>Introducir contenido malicioso, virus o código dañino.</li>
                <li>Realizar ingeniería inversa o intentar extraer el código fuente.</li>
                <li>Sobrecargar intencionadamente los servidores o infraestructura.</li>
                <li>Utilizar bots, scripts automatizados o herramientas de scraping sin autorización.</li>
                <li>Compartir contenido que sea ilegal, difamatorio, abusivo u ofensivo.</li>
                <li>Suplantar la identidad de otra persona o entidad.</li>
              </ul>
            </Section>

            <Section title="5. Propiedad intelectual">
              <h4 className="text-white font-medium mt-1 mb-2">5.1. Propiedad de Tarely</h4>
              <p>
                Todos los derechos de propiedad intelectual sobre la plataforma, incluyendo pero no limitado a
                código fuente, diseño, logotipos, textos, gráficos e inteligencia artificial, son propiedad
                exclusiva de Tarely o sus licenciantes.
              </p>
              <h4 className="text-white font-medium mt-4 mb-2">5.2. Contenido del usuario</h4>
              <p>
                Mantienes todos los derechos sobre el contenido que creas en Tarely (tareas, textos, comentarios, etc.).
                Al utilizar el servicio, nos concedes una licencia limitada y no exclusiva para procesar tu contenido
                con el fin de proporcionarte las funcionalidades de la plataforma, incluyendo el procesamiento mediante IA.
              </p>
              <p className="mt-2">
                No utilizamos tu contenido para entrenar modelos de IA ni lo compartimos con terceros más allá de lo
                necesario para el funcionamiento del servicio.
              </p>
            </Section>

            <Section title="6. Servicio gratuito y planes">
              <p>
                Tarely ofrece un plan gratuito que incluye las funcionalidades principales de la plataforma.
                Nos reservamos el derecho de:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Introducir planes de pago con funcionalidades adicionales en el futuro.</li>
                <li>Establecer límites de uso en el plan gratuito.</li>
                <li>Modificar las funcionalidades disponibles en cada plan.</li>
              </ul>
              <p className="mt-3">
                Cualquier cambio en los planes será comunicado con antelación razonable.
              </p>
            </Section>

            <Section title="7. Procesamiento con inteligencia artificial">
              <p>
                Al utilizar las funcionalidades de IA de Tarely, aceptas que:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Los textos que introduzcas serán procesados por servicios de IA de terceros (OpenAI) para generar y priorizar tareas.</li>
                <li>Solo se envía el contenido del texto, sin datos personales identificativos.</li>
                <li>Los resultados generados por la IA son sugerencias y no deben considerarse como asesoramiento profesional.</li>
                <li>No garantizamos la exactitud, completitud ni idoneidad de las tareas generadas por IA.</li>
              </ul>
            </Section>

            <Section title="8. Disponibilidad del servicio">
              <p>
                Nos esforzamos por mantener Tarely disponible de forma continua, pero no garantizamos
                un funcionamiento ininterrumpido. El servicio puede estar temporalmente no disponible por:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Mantenimiento programado o actualizaciones.</li>
                <li>Problemas técnicos imprevistos.</li>
                <li>Circunstancias fuera de nuestro control (fuerza mayor).</li>
              </ul>
              <p className="mt-3">
                No seremos responsables de los daños derivados de la indisponibilidad temporal del servicio.
              </p>
            </Section>

            <Section title="9. Limitación de responsabilidad">
              <p>
                En la máxima medida permitida por la ley:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tarely se proporciona &ldquo;tal cual&rdquo; y &ldquo;según disponibilidad&rdquo;, sin garantías de ningún tipo.</li>
                <li>No somos responsables de pérdidas de datos derivadas del uso del servicio.</li>
                <li>No somos responsables de decisiones tomadas basándose en las sugerencias de la IA.</li>
                <li>Nuestra responsabilidad total ante ti no excederá el importe que hayas pagado por el servicio en los últimos 12 meses.</li>
              </ul>
            </Section>

            <Section title="10. Terminación">
              <p>
                Puedes dejar de utilizar Tarely y solicitar la eliminación de tu cuenta en cualquier momento
                contactándonos por correo electrónico.
              </p>
              <p className="mt-3">
                Nos reservamos el derecho de suspender o cancelar tu cuenta si:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violas estos Términos y Condiciones.</li>
                <li>Utilizas el servicio de forma abusiva o fraudulenta.</li>
                <li>Tu cuenta permanece inactiva durante un período prolongado (más de 12 meses).</li>
              </ul>
              <p className="mt-3">
                En caso de cancelación, tendrás 30 días para exportar tus datos antes de que sean eliminados.
              </p>
            </Section>

            <Section title="11. Modificaciones de los términos">
              <p>
                Nos reservamos el derecho a modificar estos Términos y Condiciones en cualquier momento.
                Los cambios entrarán en vigor una vez publicados en esta página. Si realizamos cambios
                sustanciales, te notificaremos por correo electrónico o mediante un aviso en la plataforma.
              </p>
              <p className="mt-3">
                El uso continuado del servicio después de los cambios implica la aceptación de los nuevos términos.
              </p>
            </Section>

            <Section title="12. Legislación aplicable">
              <p>
                Estos Términos y Condiciones se rigen por la legislación española y la normativa de la
                Unión Europea aplicable. Cualquier controversia será sometida a los tribunales competentes
                de España.
              </p>
            </Section>

            <Section title="13. Contacto">
              <p>
                Si tienes alguna pregunta sobre estos Términos y Condiciones, puedes contactarnos en:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email: <a href="mailto:contacto@tarely.com" className="text-violet-400 hover:underline">contacto@tarely.com</a></li>
                <li>Web: <a href="https://tarely.com" className="text-violet-400 hover:underline">https://tarely.com</a></li>
              </ul>
            </Section>
          </div>

          {/* Footer link */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/politica-de-privacidad" className="text-sm text-violet-400 hover:text-violet-300 hover:underline underline-offset-4 transition-colors">
              Ver Política de Privacidad
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Volver a Tarely
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm sm:text-base text-white/60 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
