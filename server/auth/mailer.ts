import { Resend } from 'resend';

const APP_URL = () => process.env.APP_URL ?? 'https://coach.tt-playbook.de';
const MAIL_FROM = () => process.env.MAIL_FROM ?? 'TT Playbook <noreply@tt-playbook.de>';
// MAIL_MODE=console in dev (logs link to server console, no API call).
// In prod we require Resend explicitly so a missing env var never silently swallows mail.
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
  await getResend().emails.send({
    from: MAIL_FROM(),
    to,
    subject,
    text,
    html,
  });
}

// Shared HTML shell. Inline styles only — email clients strip <style> blocks.
// Colors match the app's accent blue (#0d62c6). Light background chosen so the
// mail renders identically in Gmail/Apple Mail defaults (dark mode is handled
// by client-side inversion rules).
function wrapHtml(preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>TT Playbook</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1a1d24;">
<span style="display:none;font-size:1px;color:#f3f4f7;max-height:0;max-width:0;overflow:hidden;opacity:0;">${preheader}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f7;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:18px;box-shadow:0 2px 14px rgba(15,23,42,0.06);overflow:hidden;">
<tr><td style="padding:28px 32px 0 32px;">
<div style="font-size:13px;font-weight:600;color:#0d62c6;letter-spacing:1.2px;text-transform:uppercase;">TT Playbook <span style="color:#9aa3b2;font-weight:500;">· Coach</span></div>
</td></tr>
<tr><td style="padding:22px 32px 32px 32px;">
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px 28px 32px;border-top:1px solid #eceef3;">
<p style="margin:0;font-size:12px;line-height:1.6;color:#8a8f9c;">Du bekommst diese Mail, weil deine Adresse bei TT Playbook Coach hinterlegt wurde.<br>Falls das nicht du warst, ignoriere die Nachricht einfach.</p>
<p style="margin:10px 0 0 0;font-size:12px;color:#8a8f9c;"><a href="${APP_URL()}" style="color:#0d62c6;text-decoration:none;">coach.tt-playbook.de</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
<tr><td style="border-radius:12px;background:#0d62c6;">
<a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">${label}</a>
</td></tr>
</table>`;
}

export async function sendVerificationMail(email: string, token: string): Promise<void> {
  const url = `${APP_URL()}/verify-email/${token}`;
  const subject = 'Willkommen — bitte bestätige deine E-Mail';
  const text = `Willkommen bei TT Playbook Coach!

Bestätige deine E-Mail-Adresse, um loszulegen:
${url}

Der Link läuft in 24 Stunden ab.

Falls du dich nicht registriert hast, ignoriere diese Nachricht.

— TT Playbook Coach
${APP_URL()}`;

  const html = wrapHtml(
    'Bestätige deine E-Mail-Adresse für TT Playbook Coach.',
    `<h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;line-height:1.3;color:#1a1d24;">Willkommen bei TT Playbook Coach</h1>
<p style="margin:0 0 8px 0;font-size:15px;line-height:1.55;color:#4a4f5a;">Schön, dass du dabei bist. Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.</p>
${ctaButton(url, 'E-Mail bestätigen')}
<p style="margin:16px 0 0 0;font-size:13px;line-height:1.55;color:#8a8f9c;">Der Link ist 24 Stunden gültig. Falls der Button nicht funktioniert, kopiere diese URL in deinen Browser:</p>
<p style="margin:6px 0 0 0;font-size:12px;line-height:1.5;color:#6a6f7a;word-break:break-all;"><a href="${url}" style="color:#0d62c6;text-decoration:underline;">${url}</a></p>`,
  );

  await send(email, subject, text, html);
}

export async function sendResetMail(email: string, token: string): Promise<void> {
  const url = `${APP_URL()}/reset-password/${token}`;
  const subject = 'Passwort zurücksetzen';
  const text = `Du hast einen Passwort-Reset für TT Playbook Coach angefordert.

Setze hier ein neues Passwort:
${url}

Der Link läuft in 1 Stunde ab.

Falls du das nicht warst, ignoriere diese Nachricht — dein Passwort bleibt unverändert.

— TT Playbook Coach
${APP_URL()}`;

  const html = wrapHtml(
    'Setze ein neues Passwort für TT Playbook Coach.',
    `<h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;line-height:1.3;color:#1a1d24;">Passwort zurücksetzen</h1>
<p style="margin:0 0 8px 0;font-size:15px;line-height:1.55;color:#4a4f5a;">Du hast einen Reset-Link für dein Konto angefordert. Klick auf den Button, um ein neues Passwort zu setzen.</p>
${ctaButton(url, 'Neues Passwort setzen')}
<p style="margin:16px 0 0 0;font-size:13px;line-height:1.55;color:#8a8f9c;">Der Link ist 1 Stunde gültig. Falls der Button nicht funktioniert, kopiere diese URL:</p>
<p style="margin:6px 0 12px 0;font-size:12px;line-height:1.5;color:#6a6f7a;word-break:break-all;"><a href="${url}" style="color:#0d62c6;text-decoration:underline;">${url}</a></p>
<p style="margin:18px 0 0 0;padding:12px 14px;background:#fff7ed;border-left:3px solid #f59e0b;border-radius:6px;font-size:13px;line-height:1.5;color:#7a4e00;">Falls du keinen Reset angefordert hast, ignoriere diese Mail — dein aktuelles Passwort bleibt unverändert.</p>`,
  );

  await send(email, subject, text, html);
}
