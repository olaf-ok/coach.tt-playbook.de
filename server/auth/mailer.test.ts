import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendVerificationMail, sendResetMail } from './mailer';

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
    // Test verifiziert nur dass kein throw passiert — Resend wird nie importiert im console-Mode.
    await expect(sendVerificationMail('a@b.de', 't')).resolves.toBeUndefined();
  });
});
