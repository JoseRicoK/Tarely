import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad | Tarely",
  description: "Política de privacidad de Tarely. Conoce cómo recopilamos, usamos y protegemos tus datos personales.",
};

export default function PoliticaDePrivacidadPage() {
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
              <Shield className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs text-violet-300">Documento legal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Política de Privacidad
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Última actualización: 9 de febrero de 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 sm:space-y-10">
            <Section title="1. Introducción">
              <p>
                En Tarely (&ldquo;nosotros&rdquo;, &ldquo;nuestro&rdquo;), accesible desde{" "}
                <a href="https://tarely.com" className="text-violet-400 hover:underline">tarely.com</a>,
                nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad
                describe qué información recopilamos, cómo la utilizamos y cuáles son tus derechos en relación
                con tus datos personales.
              </p>
              <p>
                Al utilizar Tarely, aceptas las prácticas descritas en esta política. Si no estás de acuerdo,
                te recomendamos no utilizar nuestros servicios.
              </p>
            </Section>

            <Section title="2. Responsable del tratamiento">
              <p>
                El responsable del tratamiento de los datos personales recogidos a través de Tarely es:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre comercial: Tarely</li>
                <li>Sitio web: <a href="https://tarely.com" className="text-violet-400 hover:underline">https://tarely.com</a></li>
                <li>Correo de contacto: <a href="mailto:contacto@tarely.com" className="text-violet-400 hover:underline">contacto@tarely.com</a></li>
              </ul>
            </Section>

            <Section title="3. Datos que recopilamos">
              <p>Recopilamos los siguientes tipos de información:</p>
              <h4 className="text-white font-medium mt-4 mb-2">3.1. Datos proporcionados por el usuario</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-white/80">Datos de registro:</strong> nombre, dirección de correo electrónico y contraseña (almacenada de forma encriptada).</li>
                <li><strong className="text-white/80">Avatar:</strong> imagen de perfil que elijas o subas.</li>
                <li><strong className="text-white/80">Contenido del usuario:</strong> tareas, workspaces, subtareas, comentarios y cualquier texto que introduzcas en la plataforma.</li>
              </ul>
              <h4 className="text-white font-medium mt-4 mb-2">3.2. Datos recopilados automáticamente</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-white/80">Cookies de analítica:</strong> si aceptas las cookies, utilizamos Google Analytics (ID: G-DRPLRV9LHY) para recopilar datos de uso anónimos como páginas visitadas, duración de la sesión, tipo de dispositivo y ubicación geográfica aproximada.</li>
                <li><strong className="text-white/80">Cookies técnicas:</strong> cookies necesarias para mantener tu sesión activa y el funcionamiento correcto de la plataforma.</li>
                <li><strong className="text-white/80">Datos de sesión:</strong> dirección IP, tipo de navegador y sistema operativo.</li>
              </ul>
            </Section>

            <Section title="4. Finalidad del tratamiento">
              <p>Utilizamos tus datos para las siguientes finalidades:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Crear y gestionar tu cuenta de usuario.</li>
                <li>Proporcionar las funcionalidades de la plataforma (gestión de tareas, IA, workspaces, etc.).</li>
                <li>Procesar tus textos con inteligencia artificial para generar y priorizar tareas.</li>
                <li>Enviar correos electrónicos transaccionales (confirmación de cuenta, restablecimiento de contraseña).</li>
                <li>Mejorar y optimizar la plataforma mediante analítica web (solo con tu consentimiento).</li>
                <li>Garantizar la seguridad de tu cuenta y prevenir actividades fraudulentas.</li>
              </ul>
            </Section>

            <Section title="5. Base legal del tratamiento">
              <p>El tratamiento de tus datos se basa en:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-white/80">Ejecución del contrato:</strong> el tratamiento es necesario para proporcionarte el servicio que solicitas al registrarte.</li>
                <li><strong className="text-white/80">Consentimiento:</strong> para el uso de cookies de analítica (Google Analytics). Puedes aceptar o rechazar en cualquier momento.</li>
                <li><strong className="text-white/80">Interés legítimo:</strong> para la mejora del servicio y la seguridad de la plataforma.</li>
              </ul>
            </Section>

            <Section title="6. Cookies">
              <p>Tarely utiliza los siguientes tipos de cookies:</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left p-3 text-white/80 font-medium border-b border-white/10">Tipo</th>
                      <th className="text-left p-3 text-white/80 font-medium border-b border-white/10">Finalidad</th>
                      <th className="text-left p-3 text-white/80 font-medium border-b border-white/10">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    <tr className="border-b border-white/5">
                      <td className="p-3">Técnicas (sesión)</td>
                      <td className="p-3">Mantener tu sesión activa</td>
                      <td className="p-3">Sesión</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-3">Preferencias</td>
                      <td className="p-3">Recordar tu preferencia de cookies</td>
                      <td className="p-3">1 año</td>
                    </tr>
                    <tr>
                      <td className="p-3">Analítica (Google Analytics)</td>
                      <td className="p-3">Estadísticas de uso anónimas</td>
                      <td className="p-3">Hasta 2 años</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                Las cookies de analítica solo se activan si aceptas expresamente en el banner de cookies.
                Puedes cambiar tu preferencia en cualquier momento eliminando las cookies de tu navegador.
              </p>
            </Section>

            <Section title="7. Compartición de datos">
              <p>
                No vendemos, alquilamos ni compartimos tus datos personales con terceros con fines comerciales.
                Solo compartimos datos con:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-white/80">Supabase:</strong> como proveedor de infraestructura (base de datos y autenticación). Los datos se almacenan de forma segura en sus servidores.</li>
                <li><strong className="text-white/80">OpenAI:</strong> procesamos los textos que introduces para generar tareas. Solo se envía el contenido necesario, sin datos identificativos personales.</li>
                <li><strong className="text-white/80">Google Analytics:</strong> solo si aceptas cookies de analítica. Los datos son anónimos y agregados.</li>
                <li><strong className="text-white/80">Resend:</strong> para el envío de correos electrónicos transaccionales (solo tu email).</li>
              </ul>
            </Section>

            <Section title="8. Seguridad de los datos">
              <p>
                Implementamos medidas técnicas y organizativas para proteger tus datos:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Las contraseñas se almacenan con hash seguro (bcrypt).</li>
                <li>Toda la comunicación se realiza a través de HTTPS.</li>
                <li>Las sesiones son gestionadas mediante cookies seguras con HttpOnly.</li>
                <li>Acceso restringido a los datos mediante políticas de Row Level Security (RLS).</li>
              </ul>
            </Section>

            <Section title="9. Tus derechos">
              <p>
                De acuerdo con el Reglamento General de Protección de Datos (RGPD), tienes los siguientes derechos:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-white/80">Acceso:</strong> puedes solicitar una copia de los datos que tenemos sobre ti.</li>
                <li><strong className="text-white/80">Rectificación:</strong> puedes modificar tus datos desde tu perfil en cualquier momento.</li>
                <li><strong className="text-white/80">Supresión:</strong> puedes solicitar la eliminación de tu cuenta y todos los datos asociados.</li>
                <li><strong className="text-white/80">Portabilidad:</strong> puedes solicitar tus datos en un formato estructurado y legible.</li>
                <li><strong className="text-white/80">Oposición:</strong> puedes oponerte al tratamiento de tus datos para fines específicos.</li>
                <li><strong className="text-white/80">Revocación del consentimiento:</strong> puedes retirar tu consentimiento para cookies de analítica en cualquier momento.</li>
              </ul>
              <p className="mt-3">
                Para ejercer cualquiera de estos derechos, contacta con nosotros en{" "}
                <a href="mailto:contacto@tarely.com" className="text-violet-400 hover:underline">contacto@tarely.com</a>.
              </p>
            </Section>

            <Section title="10. Retención de datos">
              <p>
                Conservamos tus datos personales mientras mantengas tu cuenta activa. Si solicitas la
                eliminación de tu cuenta, eliminaremos todos tus datos en un plazo máximo de 30 días,
                salvo que exista una obligación legal de conservarlos.
              </p>
            </Section>

            <Section title="11. Menores de edad">
              <p>
                Tarely no está dirigido a menores de 16 años. No recopilamos intencionadamente
                información personal de menores. Si detectamos que un menor se ha registrado,
                procederemos a eliminar sus datos.
              </p>
            </Section>

            <Section title="12. Cambios en esta política">
              <p>
                Nos reservamos el derecho a modificar esta Política de Privacidad en cualquier momento.
                Cualquier cambio será publicado en esta página con la fecha de actualización correspondiente.
                Te recomendamos revisarla periódicamente.
              </p>
            </Section>

            <Section title="13. Contacto">
              <p>
                Si tienes alguna pregunta sobre esta Política de Privacidad o sobre el tratamiento de tus datos,
                puedes contactarnos en:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email: <a href="mailto:contacto@tarely.com" className="text-violet-400 hover:underline">contacto@tarely.com</a></li>
                <li>Web: <a href="https://tarely.com" className="text-violet-400 hover:underline">https://tarely.com</a></li>
              </ul>
            </Section>
          </div>

          {/* Footer link */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/terminos-y-condiciones" className="text-sm text-violet-400 hover:text-violet-300 hover:underline underline-offset-4 transition-colors">
              Ver Términos y Condiciones
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
