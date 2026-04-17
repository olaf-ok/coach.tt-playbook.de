import { Resend } from 'resend';

const APP_URL = () => process.env.APP_URL ?? 'https://coach.tt-playbook.de';
const MAIL_FROM = () => process.env.MAIL_FROM ?? 'TT Playbook <noreply@tt-playbook.de>';
const MAIL_MODE = () => process.env.MAIL_MODE ?? 'resend';

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

export async function sendVerificationMail(email: string, token: string): Promise<void> {
  const url = `${APP_URL()}/verify-email/${token}`;
  const subject = 'Bestätige deine E-Mail für TT Playbook Trainer';
  const text = `Willkommen bei TT Playbook Trainer!

Klick auf den folgenden Link, um deine E-Mail-Adresse zu bestätigen:
${url}

Der Link läuft in 24 Stunden ab.

Falls du dich nicht registriert hast, ignoriere diese Mail.`;
  const html = `<p>Willkommen bei TT Playbook Trainer!</p>
<p><a href="${url}">E-Mail bestätigen</a></p>
<p>Der Link läuft in 24 Stunden ab. Falls du dich nicht registriert hast, ignoriere diese Mail.</p>`;
  await send(email, subject, text, html);
}

export async function sendResetMail(email: string, token: string): Promise<void> {
  const url = `${APP_URL()}/reset-password/${token}`;
  const subject = 'Passwort zurücksetzen – TT Playbook Trainer';
  const text = `Du hast einen Passwort-Reset angefordert.

Klick auf den folgenden Link, um ein neues Passwort zu setzen:
${url}

Der Link läuft in 1 Stunde ab.

Falls du das nicht warst, ignoriere diese Mail — dein Passwort bleibt unverändert.`;
  const html = `<p>Du hast einen Passwort-Reset angefordert.</p>
<p><a href="${url}">Neues Passwort setzen</a></p>
<p>Der Link läuft in 1 Stunde ab. Falls du das nicht warst, ignoriere diese Mail.</p>`;
  await send(email, subject, text, html);
}
