import { Resend } from 'resend';
import { getConfirmationEmailTemplate, getResetPasswordEmailTemplate, getWelcomeEmailTemplate } from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email del remitente - Dominio verificado en Resend
const FROM_EMAIL = 'TareAI <noreply@tarely.com>';

interface SendConfirmationEmailParams {
  to: string;
  name: string;
  confirmationUrl: string;
}

/**
 * Envía un correo de confirmación al usuario
 */
export async function sendConfirmationEmail({
  to,
  name,
  confirmationUrl,
}: SendConfirmationEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '✉️ Confirma tu correo electrónico - Tarely',
      html: getConfirmationEmailTemplate({ name, confirmationUrl }),
    });

    if (error) {
      console.error('Error enviando email de confirmación:', error);
      // No lanzamos error para que no falle el registro
      return { success: false, error: error.message };
    }

    console.log('Email de confirmación enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar email de confirmación:', error);
    // No lanzamos error para que no falle el registro
    return { success: false, error: 'Error al enviar email' };
  }
}

interface SendWelcomeEmailParams {
  to: string;
  name: string;
}

/**
 * Envía un correo de bienvenida después de confirmar la cuenta
 */
export async function sendWelcomeEmail({
  to,
  name,
}: SendWelcomeEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '🎉 ¡Bienvenido a Tarely!',
      html: getWelcomeEmailTemplate({ name }),
    });

    if (error) {
      console.error('Error enviando email de bienvenida:', error);
      // No lanzamos error
      return { success: false, error: error.message };
    }

    console.log('Email de bienvenida enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return { success: false, error: 'Error al enviar email' };
  }
}

interface SendResetPasswordEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

/**
 * Envía un correo para restablecer la contraseña
 */
export async function sendResetPasswordEmail({
  to,
  name,
  resetUrl,
}: SendResetPasswordEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: '🔑 Restablecer contraseña - Tarely',
      html: getResetPasswordEmailTemplate({ name, resetUrl }),
    });

    if (error) {
      console.error('Error enviando email de reset:', error);
      return { success: false, error: error.message };
    }

    console.log('Email de reset enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error al enviar email de reset:', error);
    return { success: false, error: 'Error al enviar email de reset' };
  }
}
