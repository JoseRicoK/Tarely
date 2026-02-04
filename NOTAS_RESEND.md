# 📧 Configuración de Resend para Producción

## 🔓 Plan Gratuito - Limitaciones

Con el plan gratuito de Resend **SOLO puedes enviar emails de prueba a tu propio correo** (el que usaste para registrarte en Resend).

**Tu email en Resend:** josemariark@gmail.com

### ¿Qué significa esto?

- ✅ Puedes registrarte con josemariark@gmail.com y recibirás el correo
- ❌ Si te registras con kartingmarks@gmail.com (u otro email), NO recibirás el correo
- ⚠️ El registro se completará igual, pero el email no se enviará

## 🚀 Soluciones

### Opción 1: Para Testing (GRATIS)
**Registrarte siempre con josemariark@gmail.com**

Mientras desarrollas, usa tu propio email para probar el sistema.

### Opción 2: Verificar un Dominio (GRATIS pero requiere dominio)

1. Ve a [Resend Domains](https://resend.com/domains)
2. Haz clic en "Add Domain"
3. Introduce tu dominio (ej: tareai.com)
4. Añade los registros DNS que te indiquen:
   - SPF
   - DKIM
   - DMARC
5. Espera a que se verifique (puede tardar hasta 72 horas)
6. Actualiza el `FROM_EMAIL` en `src/lib/email.ts`:

```typescript
const FROM_EMAIL = 'TareAI <noreply@tudominio.com>';
```

### Opción 3: Plan de Pago

El plan de pago de Resend te permite enviar emails a cualquier destinatario sin verificar dominio.

## 📝 Estado Actual

**Configuración actual:**
```typescript
const FROM_EMAIL = 'TareAI <onboarding@resend.dev>';
```

**Comportamiento:**
- ✅ El registro funciona correctamente
- ✅ Se guarda el usuario en la base de datos
- ⚠️ El email solo se envía si te registras con: josemariark@gmail.com
- ⚠️ Para otros emails, el registro funciona pero no reciben el correo
- ℹ️ No se muestra error al usuario (el registro se completa igual)

## 🔧 Para Desarrollo

Mientras estás desarrollando, usa estos emails para probar:

**Email que funcionará:**
- josemariark@gmail.com ✅

**Emails que NO recibirán correo (pero el registro funciona):**
- Cualquier otro email ⚠️

## 📊 Logs del Sistema

El sistema registra en consola si el email se envió o no:

```
✅ Éxito:
Email de confirmación enviado exitosamente: { id: '...' }

❌ Error (pero no falla el registro):
Error enviando email de confirmación: {
  statusCode: 403,
  message: 'You can only send testing emails to your own email...'
}
```

## 🎯 Recomendación

Para producción, **verifica tu dominio en Resend**. Es gratis y te da:
- ✅ Enviar a cualquier email
- ✅ Mejor deliverability (menos spam)
- ✅ Branding profesional (noreply@tudominio.com)
- ✅ Sin límites de destinatarios en plan gratuito (100 emails/día)

---

**Documentación oficial de Resend:**
- [Verificar dominio](https://resend.com/docs/dashboard/domains/introduction)
- [Límites del plan gratuito](https://resend.com/pricing)
