import { Resend } from 'resend';

const APP_URL  = () => process.env.APP_URL  ?? 'https://coach.tt-playbook.de';
const MAIL_FROM = () => process.env.MAIL_FROM ?? 'TT Playbook <noreply@tt-playbook.de>';
const ADMIN_NOTIFY_EMAIL = () => process.env.ADMIN_NOTIFY_EMAIL ?? '';
const MAIL_MODE = () =>
  process.env.MAIL_MODE ?? (process.env.NODE_ENV === 'production' ? 'resend' : 'console');

let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY not set');
    resendClient = new Resend(key);
  }
  return resendClient;
}

async function send(to: string, subject: string, text: string, html: string): Promise<void> {
  if (MAIL_MODE() === 'console') {
    console.log(`\n===== MAIL [${to}] =====\nSubject: ${subject}\n\n${text}\n=====\n`);
    return;
  }
  await getResend().emails.send({ from: MAIL_FROM(), to, subject, text, html });
}

// ── Language detection ───────────────────────────────────────────────────────

export type Lang = 'de' | 'en' | 'es';

export function detectLang(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage) return 'de';
  const code = acceptLanguage.split(',')[0].trim().toLowerCase().split('-')[0];
  if (code === 'de') return 'de';
  if (code === 'es') return 'es';
  return 'en';
}

// ── Translations ─────────────────────────────────────────────────────────────

const T = {
  de: {
    verify: {
      subject:  'Willkommen — bitte bestätige deine E-Mail',
      preheader:'Bestätige deine E-Mail-Adresse für TT Playbook Coach.',
      h1:       'Willkommen bei TT Playbook Coach',
      body:     'Schön, dass du dabei bist. Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.',
      cta:      'E-Mail bestätigen',
      validity: 'Der Link ist 24 Stunden gültig.',
      fallback: 'Falls der Button nicht funktioniert, kopiere diese URL:',
    },
    reset: {
      subject:  'Passwort zurücksetzen',
      preheader:'Setze ein neues Passwort für TT Playbook Coach.',
      h1:       'Passwort zurücksetzen',
      body:     'Du hast einen Reset-Link angefordert. Klick auf den Button, um ein neues Passwort zu setzen.',
      cta:      'Neues Passwort setzen',
      validity: 'Der Link ist 1 Stunde gültig.',
      fallback: 'Falls der Button nicht funktioniert, kopiere diese URL:',
      warning:  'Falls du keinen Reset angefordert hast, ignoriere diese Mail — dein Passwort bleibt unverändert.',
    },
    footer: {
      disclaimer: 'Du bekommst diese Mail, weil deine Adresse bei TT Playbook Coach hinterlegt wurde. Falls das nicht du warst, ignoriere sie einfach.',
    },
  },
  en: {
    verify: {
      subject:  'Welcome — please confirm your email',
      preheader:'Confirm your email address for TT Playbook Coach.',
      h1:       'Welcome to TT Playbook Coach',
      body:     'Great to have you on board. Please confirm your email address to activate your account.',
      cta:      'Confirm email',
      validity: 'This link is valid for 24 hours.',
      fallback: 'If the button doesn\'t work, copy this URL:',
    },
    reset: {
      subject:  'Reset your password',
      preheader:'Reset your password for TT Playbook Coach.',
      h1:       'Reset your password',
      body:     'You requested a password reset. Click the button below to set a new password.',
      cta:      'Set new password',
      validity: 'This link is valid for 1 hour.',
      fallback: 'If the button doesn\'t work, copy this URL:',
      warning:  'If you didn\'t request a reset, just ignore this email — your password won\'t change.',
    },
    footer: {
      disclaimer: 'You\'re receiving this email because your address is registered with TT Playbook Coach. If that wasn\'t you, simply ignore it.',
    },
  },
  es: {
    verify: {
      subject:  'Bienvenido/a — confirma tu correo electrónico',
      preheader:'Confirma tu dirección de correo para TT Playbook Coach.',
      h1:       'Bienvenido/a a TT Playbook Coach',
      body:     'Nos alegra tenerte aquí. Confirma tu dirección de correo electrónico para activar tu cuenta.',
      cta:      'Confirmar correo',
      validity: 'Este enlace es válido por 24 horas.',
      fallback: 'Si el botón no funciona, copia esta URL:',
    },
    reset: {
      subject:  'Restablecer contraseña',
      preheader:'Restablece tu contraseña de TT Playbook Coach.',
      h1:       'Restablecer contraseña',
      body:     'Has solicitado restablecer tu contraseña. Haz clic en el botón para crear una nueva.',
      cta:      'Crear nueva contraseña',
      validity: 'Este enlace es válido por 1 hora.',
      fallback: 'Si el botón no funciona, copia esta URL:',
      warning:  'Si no solicitaste este restablecimiento, ignora este correo — tu contraseña no cambiará.',
    },
    footer: {
      disclaimer: 'Recibes este correo porque tu dirección está registrada en TT Playbook Coach. Si no fuiste tú, simplemente ignóralo.',
    },
  },
} as const;

// ── HTML template ─────────────────────────────────────────────────────────────

function wrapHtml(preheader: string, bodyHtml: string, lang: Lang): string {
  const footer = T[lang].footer.disclaimer;
  const appUrl = APP_URL();
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>TT Playbook Coach</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1a1d24;">
<span style="display:none;font-size:1px;color:#f0f2f5;max-height:0;max-width:0;overflow:hidden;opacity:0;">${preheader}</span>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0f2f5;">
<tr><td align="center" style="padding:40px 16px 48px;">

  <!-- Card -->
  <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0"
    style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;box-shadow:0 4px 24px rgba(15,23,42,0.08);overflow:hidden;">

    <!-- Top accent bar -->
    <tr><td style="height:4px;background:linear-gradient(90deg,#0a84ff 0%,#34aadc 100%);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Logo header -->
    <tr><td style="padding:28px 36px 20px 36px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding-right:12px;">
            <!-- Shield icon inline SVG as PNG fallback approach: text brand -->
          </td>
          <td>
            <div style="font-size:11px;font-weight:700;color:#0a84ff;letter-spacing:1.8px;text-transform:uppercase;line-height:1;">TT PLAYBOOK</div>
            <div style="font-size:11px;font-weight:500;color:#8e8e93;letter-spacing:1.2px;text-transform:uppercase;line-height:1;margin-top:3px;">COACH</div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 36px;"><div style="height:1px;background:#e5e5ea;"></div></td></tr>

    <!-- Body -->
    <tr><td style="padding:32px 36px 36px 36px;">
      ${bodyHtml}
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:20px 36px 28px 36px;background:#f9f9fb;border-top:1px solid #e5e5ea;border-radius:0 0 20px 20px;">
      <p style="margin:0;font-size:12px;line-height:1.65;color:#8e8e93;">${footer}</p>
      <p style="margin:10px 0 0 0;font-size:12px;">
        <a href="${appUrl}" style="color:#0a84ff;text-decoration:none;font-weight:500;">coach.tt-playbook.de</a>
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 20px;">
<tr><td style="border-radius:12px;background:#0a84ff;box-shadow:0 2px 8px rgba(10,132,255,0.35);">
<a href="${href}"
   style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.2px;"
>${label}</a>
</td></tr>
</table>`;
}

function fallbackUrl(url: string, label: string): string {
  return `<p style="margin:14px 0 0 0;font-size:12px;line-height:1.5;color:#8e8e93;">${label}</p>
<p style="margin:5px 0 0 0;font-size:12px;line-height:1.5;word-break:break-all;">
  <a href="${url}" style="color:#0a84ff;text-decoration:underline;">${url}</a>
</p>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendVerificationMail(
  email: string,
  token: string,
  lang: Lang = 'de',
): Promise<void> {
  const t = T[lang].verify;
  const url = `${APP_URL()}/verify-email/${token}`;

  const text = `${t.h1}\n\n${t.body}\n\n${url}\n\n${t.validity}\n\n— TT Playbook Coach\n${APP_URL()}`;

  const html = wrapHtml(
    t.preheader,
    `<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;line-height:1.25;color:#1a1d24;">${t.h1}</h1>
<p style="margin:0;font-size:15px;line-height:1.6;color:#48484a;">${t.body}</p>
${ctaButton(url, t.cta)}
<p style="margin:0;font-size:13px;line-height:1.5;color:#8e8e93;">${t.validity}</p>
${fallbackUrl(url, t.fallback)}`,
    lang,
  );

  await send(email, t.subject, text, html);
}

export async function sendResetMail(
  email: string,
  token: string,
  lang: Lang = 'de',
): Promise<void> {
  const t = T[lang].reset;
  const url = `${APP_URL()}/reset-password/${token}`;

  const text = `${t.h1}\n\n${t.body}\n\n${url}\n\n${t.validity}\n\n${t.warning}\n\n— TT Playbook Coach\n${APP_URL()}`;

  const html = wrapHtml(
    t.preheader,
    `<h1 style="margin:0 0 14px 0;font-size:24px;font-weight:700;line-height:1.25;color:#1a1d24;">${t.h1}</h1>
<p style="margin:0;font-size:15px;line-height:1.6;color:#48484a;">${t.body}</p>
${ctaButton(url, t.cta)}
<p style="margin:0;font-size:13px;line-height:1.5;color:#8e8e93;">${t.validity}</p>
${fallbackUrl(url, t.fallback)}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:20px;">
<tr><td style="padding:12px 16px;background:#fff7ed;border-left:3px solid #ff9f0a;border-radius:6px;">
  <p style="margin:0;font-size:13px;line-height:1.5;color:#7a4e00;">${t.warning}</p>
</td></tr>
</table>`,
    lang,
  );

  await send(email, t.subject, text, html);
}

export async function sendNewUserNotification(newUserEmail: string): Promise<void> {
  const adminEmail = ADMIN_NOTIFY_EMAIL();
  if (!adminEmail) return;

  const now = new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const subject = `Neue Anmeldung: ${newUserEmail}`;
  const text = `Neue Registrierung bei TT Playbook Coach\n\nE-Mail: ${newUserEmail}\nZeit: ${now}\n\nAdmin: ${APP_URL()}/admin/users`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1d24;background:#f0f2f5;margin:0;padding:40px 16px;">
<table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0"
  style="max-width:480px;width:100%;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);overflow:hidden;margin:0 auto;">
  <tr><td style="height:4px;background:#0a84ff;font-size:0;">&nbsp;</td></tr>
  <tr><td style="padding:28px 32px 32px;">
    <div style="font-size:11px;font-weight:700;color:#0a84ff;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:20px;">TT PLAYBOOK · ADMIN</div>
    <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#1a1d24;">Neue Anmeldung</h2>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="background:#f9f9fb;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#8e8e93;text-transform:uppercase;letter-spacing:0.8px;width:80px;">E-Mail</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:500;color:#1a1d24;">${newUserEmail}</td>
      </tr>
      <tr style="border-top:1px solid #e5e5ea;">
        <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#8e8e93;text-transform:uppercase;letter-spacing:0.8px;">Zeit</td>
        <td style="padding:12px 16px;font-size:14px;color:#48484a;">${now}</td>
      </tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;">
    <tr><td style="border-radius:10px;background:#1c1c1e;">
      <a href="${APP_URL()}/admin/users"
        style="display:inline-block;padding:12px 24px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
        Admin-Panel öffnen
      </a>
    </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await send(adminEmail, subject, text, html);
}
