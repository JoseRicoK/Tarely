interface ConfirmationEmailProps {
  name: string;
  confirmationUrl: string;
}

export function getConfirmationEmailTemplate({ name, confirmationUrl }: ConfirmationEmailProps): string {
  // URL del logo en Supabase Storage
  const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/logo_tarely_bg.png`;
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirma tu correo - Tarely</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border-radius: 24px; border: 1px solid rgba(148, 163, 184, 0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);">
          
          <!-- Header con logo -->
          <tr>
            <td style="padding: 48px 40px; text-align: center; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
              <img src="${logoUrl}" alt="Tarely" style="max-width: 80px; height: auto; margin-bottom: 24px; filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.4));" />
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                ¡Bienvenido a Tarely!
              </h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 12px 0 0 0;">
                Tu asistente inteligente para gestión de tareas
              </p>
            </td>
          </tr>

          <!-- Contenido principal -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="color: #f1f5f9; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hola <strong style="color: #ffffff;">${name}</strong>,
              </p>
              
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Gracias por registrarte en <strong style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Tarely</strong>. Estamos emocionados de tenerte con nosotros.
              </p>
              
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Para comenzar a usar tu cuenta, necesitamos que confirmes tu dirección de correo electrónico:
              </p>

              <!-- Botón de confirmación -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${confirmationUrl}" 
                       style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.5), 0 8px 10px -6px rgba(168, 85, 247, 0.5); transition: all 0.3s ease;">
                      ✉️ Confirmar mi correo
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Enlace alternativo -->
              <div style="background-color: rgba(30, 41, 59, 0.5); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
                  O copia y pega este enlace en tu navegador:
                </p>
                <p style="color: #a855f7; font-size: 13px; line-height: 1.6; margin: 0; word-break: break-all; font-family: 'Courier New', monospace;">
                  ${confirmationUrl}
                </p>
              </div>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center; font-style: italic;">
                ⏰ Este enlace expirará en 24 horas por seguridad
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(15, 23, 42, 0.8); padding: 32px 40px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1); border-radius: 0 0 24px 24px;">
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
                Si no creaste una cuenta en Tarely, puedes ignorar este correo.
              </p>
              
              <p style="color: #475569; font-size: 12px; line-height: 1.6; margin: 0;">
                © ${new Date().getFullYear()} Tarely. Todos los derechos reservados.
              </p>
              
              <p style="color: #334155; font-size: 11px; line-height: 1.6; margin: 8px 0 0 0;">
                Gestiona tus tareas con el poder de la IA ✨
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
}

export function getResetPasswordEmailTemplate({ name, resetUrl }: ResetPasswordEmailProps): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/logo_tarely_bg.png`;
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña - Tarely</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border-radius: 24px; border: 1px solid rgba(148, 163, 184, 0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);">
          
          <!-- Header con logo -->
          <tr>
            <td style="padding: 48px 40px; text-align: center; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
              <img src="${logoUrl}" alt="Tarely" style="max-width: 80px; height: auto; margin-bottom: 24px; filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.4));" />
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                Restablecer Contraseña
              </h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 12px 0 0 0;">
                Solicitud de cambio de contraseña
              </p>
            </td>
          </tr>

          <!-- Contenido principal -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="color: #f1f5f9; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hola <strong style="color: #ffffff;">${name}</strong>,
              </p>
              
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Tarely</strong>.
              </p>
              
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Haz clic en el siguiente botón para crear una nueva contraseña:
              </p>

              <!-- Botón de reset -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.5), 0 8px 10px -6px rgba(239, 68, 68, 0.5); transition: all 0.3s ease;">
                      🔑 Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Enlace alternativo -->
              <div style="background-color: rgba(30, 41, 59, 0.5); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
                  O copia y pega este enlace en tu navegador:
                </p>
                <p style="color: #f59e0b; font-size: 13px; line-height: 1.6; margin: 0; word-break: break-all; font-family: 'Courier New', monospace;">
                  ${resetUrl}
                </p>
              </div>

              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0; text-align: center; font-style: italic;">
                ⏰ Este enlace expirará en 1 hora por seguridad
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(15, 23, 42, 0.8); padding: 32px 40px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1); border-radius: 0 0 24px 24px;">
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este correo. Tu cuenta está segura.
              </p>
              
              <p style="color: #475569; font-size: 12px; line-height: 1.6; margin: 0;">
                © ${new Date().getFullYear()} Tarely. Todos los derechos reservados.
              </p>
              
              <p style="color: #334155; font-size: 11px; line-height: 1.6; margin: 8px 0 0 0;">
                Gestiona tus tareas con el poder de la IA ✨
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

interface WelcomeEmailProps {
  name: string;
}

export function getWelcomeEmailTemplate({ name }: WelcomeEmailProps): string {
  // URL del logo en Supabase Storage
  const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/assets/logo_tarely_bg.png`;
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Cuenta Confirmada! - Tarely</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border-radius: 24px; border: 1px solid rgba(148, 163, 184, 0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);">
          
          <!-- Header con logo y check -->
          <tr>
            <td style="padding: 48px 40px; text-align: center; border-bottom: 1px solid rgba(148, 163, 184, 0.1);">
              <img src="${logoUrl}" alt="Tarely" style="max-width: 80px; height: auto; margin-bottom: 24px; filter: drop-shadow(0 0 25px rgba(168, 85, 247, 0.4));" />
              
              <!-- Icono de check -->
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 24px; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.5);">
                <p style="color: #ffffff; font-size: 48px; line-height: 80px; margin: 0; font-weight: bold;">✓</p>
              </div>
              
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                ¡Cuenta Confirmada!
              </h1>
              <p style="color: #94a3b8; font-size: 14px; margin: 12px 0 0 0;">
                Ya puedes empezar a usar Tarely
              </p>
            </td>
          </tr>

          <!-- Contenido principal -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="color: #f1f5f9; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                ¡Excelente, <strong style="color: #ffffff;">${name}</strong>!
              </p>
              
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Tu dirección de correo electrónico ha sido confirmada exitosamente. Ya puedes disfrutar de todas las funcionalidades de <strong style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Tarely</strong>.
              </p>

              <!-- Características destacadas -->
              <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 16px; padding: 28px; margin-bottom: 32px;">
                <h2 style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0; font-weight: 600;">
                  ¿Qué puedes hacer ahora?
                </h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #cbd5e1; font-size: 15px; line-height: 2; padding: 4px 0;">✨ Crear tareas con asistencia de IA</td>
                  </tr>
                  <tr>
                    <td style="color: #cbd5e1; font-size: 15px; line-height: 2; padding: 4px 0;">📊 Organizar tus proyectos en espacios de trabajo</td>
                  </tr>
                  <tr>
                    <td style="color: #cbd5e1; font-size: 15px; line-height: 2; padding: 4px 0;">👥 Colaborar con tu equipo</td>
                  </tr>
                  <tr>
                    <td style="color: #cbd5e1; font-size: 15px; line-height: 2; padding: 4px 0;">📅 Gestionar fechas y prioridades</td>
                  </tr>
                  <tr>
                    <td style="color: #cbd5e1; font-size: 15px; line-height: 2; padding: 4px 0;">🎯 Alcanzar tus objetivos de manera eficiente</td>
                  </tr>
                </table>
              </div>

              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0; text-align: center;">
                Estamos aquí para ayudarte a ser más productivo. <strong style="color: #ffffff;">¡Comienza ahora!</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(15, 23, 42, 0.8); padding: 32px 40px; text-align: center; border-top: 1px solid rgba(148, 163, 184, 0.1); border-radius: 0 0 24px 24px;">
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
                ¿Necesitas ayuda? Estamos aquí para ti.
              </p>
              
              <p style="color: #475569; font-size: 12px; line-height: 1.6; margin: 0;">
                © ${new Date().getFullYear()} Tarely. Todos los derechos reservados.
              </p>
              
              <p style="color: #334155; font-size: 11px; line-height: 1.6; margin: 8px 0 0 0;">
                Gestiona tus tareas con el poder de la IA ✨
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
