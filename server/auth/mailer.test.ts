import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendVerificationMail, sendResetMail, detectLang } from './mailer';

describe('mailer (console mode)', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    logSpy.mockClear();
    process.env.MAIL_MODE = 'console';
    process.env.APP_URL = 'https://coach.tt-playbook.de';
  });

  afterEach(() => {
    delete process.env.MAIL_MODE;
    delete process.env.APP_URL;
  });

  it('sendVerificationMail loggt den Link in Console-Mode', async () => {
    await sendVerificationMail('user@example.de', 'tok-123');
    const joined = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('user@example.de');
    expect(joined).toContain('https://coach.tt-playbook.de/verify-email/tok-123');
  });

  it('sendResetMail loggt den Reset-Link in Console-Mode', async () => {
    await sendResetMail('user@example.de', 'tok-456');
    const joined = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('user@example.de');
    expect(joined).toContain('https://coach.tt-playbook.de/reset-password/tok-456');
  });

  it('kein Resend-Call ohne RESEND_API_KEY in Console-Mode', async () => {
    await expect(sendVerificationMail('a@b.de', 't')).resolves.toBeUndefined();
  });

  it('sendVerificationMail sendet auf Spanisch wenn lang=es', async () => {
    await sendVerificationMail('user@example.cr', 'tok-es', 'es');
    const joined = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('Bienvenido');
  });

  it('sendVerificationMail sendet auf Englisch wenn lang=en', async () => {
    await sendVerificationMail('user@example.com', 'tok-en', 'en');
    const joined = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(joined).toContain('Welcome');
  });
});

describe('detectLang', () => {
  it('erkennt Deutsch', () => {
    expect(detectLang('de-DE,de;q=0.9')).toBe('de');
    expect(detectLang('de')).toBe('de');
    expect(detectLang('de-AT')).toBe('de');
  });
  it('erkennt Spanisch', () => {
    expect(detectLang('es-CR,es;q=0.9,en;q=0.8')).toBe('es');
    expect(detectLang('es')).toBe('es');
  });
  it('fällt auf Englisch zurück', () => {
    expect(detectLang('fr-FR,fr;q=0.9')).toBe('en');
    expect(detectLang(null)).toBe('de');
    expect(detectLang('')).toBe('de');
  });
  it('erkennt Englisch', () => {
    expect(detectLang('en-US,en;q=0.9')).toBe('en');
    expect(detectLang('en-GB')).toBe('en');
  });
});
