import type { LegalContent } from './types';

const LAST_UPDATED_DE = 'Stand: April 2026';
const LAST_UPDATED_EN = 'Last updated: April 2026';
const LAST_UPDATED_ES = 'Última actualización: abril de 2026';

export const privacyContent: LegalContent = {
  de: {
    title: 'Datenschutzerklärung',
    lastUpdated: LAST_UPDATED_DE,
    sections: [
      {
        heading: '1. Verantwortlicher',
        html: `
          <p><strong>OK-MARKED LLC</strong><br />
          30 N Gould St Ste R<br />
          Sheridan, WY 82801<br />
          USA</p>
          <p>Vertreten durch Olaf Kranz.<br />
          E-Mail: <a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
      {
        heading: '2. Welche Daten wir erheben',
        html: `
          <ul>
            <li><strong>Konto-Daten:</strong> E-Mail-Adresse und Passwort-Hash (Argon2id). Das Passwort im Klartext verlässt nie deinen Browser.</li>
            <li><strong>Session-Cookie:</strong> ein technisch notwendiges HTTP-Only-Cookie zur Anmeldung (Laufzeit 30 Tage, gleitend verlängert).</li>
            <li><strong>Abo-Daten:</strong> Zahlungsstatus, Kunden- und Abonnement-IDs von Stripe. Wir speichern <em>keine</em> Karten- oder Bankdaten.</li>
            <li><strong>Lokale App-Daten:</strong> deine Übungen, Trainingslisten und Einstellungen (Sprache, Theme) werden in deinem Browser (IndexedDB / localStorage) gespeichert. Wenn du angemeldet bist, werden sie zusätzlich serverseitig zur geräteübergreifenden Synchronisation abgelegt — siehe Abschnitt 10.</li>
            <li><strong>Server-Logs:</strong> minimale technische Logs (Zeitstempel, HTTP-Status, IP gekürzt) zur Fehleranalyse.</li>
          </ul>
        `,
      },
      {
        heading: '3. Zwecke der Verarbeitung',
        html: `
          <ul>
            <li>Bereitstellung, Absicherung und Pflege des Dienstes</li>
            <li>Abwicklung des Pro-Abonnements</li>
            <li>Versand transaktionaler E-Mails (Registrierung, Passwort-Zurücksetzen, Zahlungsbestätigungen)</li>
          </ul>
        `,
      },
      {
        heading: '4. Rechtsgrundlagen (für Nutzer:innen in der EU)',
        html: `
          <ul>
            <li>Art. 6 Abs. 1 lit. b DSGVO — Erfüllung des Nutzungsvertrags</li>
            <li>Art. 6 Abs. 1 lit. f DSGVO — berechtigte Interessen (Sicherheit, Fehleranalyse, Missbrauchs-Prävention)</li>
            <li>Art. 6 Abs. 1 lit. a DSGVO — Einwilligung, soweit einschlägig</li>
          </ul>
        `,
      },
      {
        heading: '5. Auftragsverarbeiter und Subprozessoren',
        html: `
          <ul>
            <li><strong>Stripe</strong> — Stripe Payments Europe Limited (Irland) für EU-Nutzer:innen bzw. Stripe, Inc. (USA). Zweck: Zahlungsabwicklung und Kunden-Portal. Stripe-Datenschutzhinweise: <a href="https://stripe.com/privacy" target="_blank" rel="noopener">stripe.com/privacy</a>.</li>
            <li><strong>Resend</strong> — Resend, Inc. (USA). Zweck: Versand transaktionaler E-Mails. Datenübermittlung in die USA auf Grundlage von Standardvertragsklauseln (Art. 46 DSGVO). Datenschutz: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">resend.com/legal/privacy-policy</a>.</li>
            <li><strong>Mittwald CM Service GmbH &amp; Co. KG</strong> — Königsberger Str. 4–6, 32339 Espelkamp, Deutschland. Zweck: Hosting der Anwendung und der Authentifizierungs-Datenbank. Server-Standort: Deutschland.</li>
          </ul>
        `,
      },
      {
        heading: '6. Speicherdauer',
        html: `
          <ul>
            <li>Konto-Daten: bis zur Löschung durch dich oder nach 24 Monaten Inaktivität.</li>
            <li>Abo-/Rechnungsdaten: bis zu 10 Jahre (gesetzliche Aufbewahrungspflichten).</li>
            <li>Server-Logs: max. 14 Tage.</li>
          </ul>
        `,
      },
      {
        heading: '7. Deine Rechte',
        html: `
          <p>Du hast jederzeit das Recht auf:</p>
          <ul>
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung (Art. 18 DSGVO)</li>
            <li>Widerspruch (Art. 21 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Beschwerde bei einer Aufsichtsbehörde</li>
          </ul>
          <p>Anfragen richtest du bitte an <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>. Wir antworten innerhalb der gesetzlichen Fristen.</p>
        `,
      },
      {
        heading: '8. Cookies und lokaler Speicher',
        html: `
          <p>Wir verwenden ausschließlich technisch notwendige Mittel:</p>
          <ul>
            <li>Ein HTTP-Only-Session-Cookie (<code>ttp_session</code>) zur Anmeldung.</li>
            <li><code>localStorage</code> für deine Einstellungen (Sprache, Theme, Währung).</li>
            <li><code>IndexedDB</code> für deine gezeichneten Übungen und Trainingslisten.</li>
          </ul>
          <p>Kein Tracking, keine Werbung, keine Analyse-Cookies.</p>
        `,
      },
      {
        heading: '9. Internationale Datenübermittlung',
        html: `
          <p>Einige Dienstleister (Stripe, Resend) verarbeiten personenbezogene Daten auch in den USA. Diese Übermittlungen erfolgen auf Grundlage von Standardvertragsklauseln nach Art. 46 DSGVO bzw. — soweit einschlägig — auf Basis des EU-US Data Privacy Framework.</p>
        `,
      },
      {
        heading: '10. Cloud-Sync und Trainingsdaten',
        html: `
          <p>Wenn du ein Konto hast und angemeldet bist, synchronisieren wir deine Übungen, Trainingslisten und App-Einstellungen (Sprache, Theme, Währung) über unsere Server.</p>
          <ul>
            <li><strong>Zweck:</strong> geräteübergreifender Zugriff, Datensicherung und Wiederherstellung nach Browser-Cache-Verlust.</li>
            <li><strong>Speicherort:</strong> Server der OK-MARKED LLC, gehostet bei Mittwald in Deutschland (siehe Abschnitt 5).</li>
            <li><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO — die Synchronisation ist zentrale Produktfunktion und Teil der Vertragserfüllung.</li>
            <li><strong>Inhalt:</strong> rein von dir gezeichnete und eingegebene Daten (Pfeile, Notizen, Schlagart-Tags, Titel, Farb- und Zahl-Angaben). Keine externen Inhalte, keine Tracking-Daten.</li>
            <li><strong>Löschung:</strong> Beim Löschen deines Kontos werden alle serverseitig gespeicherten Trainingsdaten unverzüglich und vollständig entfernt. Du kannst einzelne Übungen oder alle Sync-Daten auch jederzeit in der App zurücksetzen.</li>
            <li><strong>Abschalten:</strong> Meldest du dich ab, verbleiben die Daten weiterhin lokal in deinem Browser, werden aber nicht mehr mit dem Server synchronisiert.</li>
            <li><strong>Teilen-Funktion:</strong> Wenn du eine Übung teilst, wird ein öffentlich erreichbarer Link erzeugt. Jede Person mit diesem Link kann die Übung lesen – ohne Login. Du kannst den Link jederzeit unter Einstellungen → Geteilte Übungen widerrufen. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</li>
          </ul>
        `,
      },
      {
        heading: '11. Kontakt',
        html: `
          <p>Für Datenschutzanfragen: <a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: LAST_UPDATED_EN,
    sections: [
      {
        heading: '1. Controller',
        html: `
          <p><strong>OK-MARKED LLC</strong><br />
          30 N Gould St Ste R<br />
          Sheridan, WY 82801<br />
          USA</p>
          <p>Represented by Olaf Kranz.<br />
          Email: <a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
      {
        heading: '2. What data we collect',
        html: `
          <ul>
            <li><strong>Account data:</strong> email address and password hash (Argon2id). Your plaintext password never leaves your browser.</li>
            <li><strong>Session cookie:</strong> a technically required HTTP-only cookie for authentication (30 days, sliding).</li>
            <li><strong>Subscription data:</strong> billing status, customer and subscription IDs from Stripe. We do <em>not</em> store card or bank details.</li>
            <li><strong>Local app data:</strong> your exercises, training lists and settings (language, theme) are stored in your browser (IndexedDB / localStorage). When you are signed in, they are additionally stored on our servers to enable cross-device sync — see section 10.</li>
            <li><strong>Server logs:</strong> minimal technical logs (timestamp, HTTP status, truncated IP) for troubleshooting.</li>
          </ul>
        `,
      },
      {
        heading: '3. Purposes',
        html: `
          <ul>
            <li>Providing, securing and maintaining the service</li>
            <li>Processing the Pro subscription</li>
            <li>Sending transactional email (sign-up, password reset, payment receipts)</li>
          </ul>
        `,
      },
      {
        heading: '4. Legal bases (for users in the EU)',
        html: `
          <ul>
            <li>Art. 6(1)(b) GDPR — performance of the contract</li>
            <li>Art. 6(1)(f) GDPR — legitimate interests (security, troubleshooting, abuse prevention)</li>
            <li>Art. 6(1)(a) GDPR — consent where applicable</li>
          </ul>
        `,
      },
      {
        heading: '5. Processors and sub-processors',
        html: `
          <ul>
            <li><strong>Stripe</strong> — Stripe Payments Europe Limited (Ireland) for EU users or Stripe, Inc. (USA). Purpose: payments and customer portal. Privacy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener">stripe.com/privacy</a>.</li>
            <li><strong>Resend</strong> — Resend, Inc. (USA). Purpose: transactional email. Transfers to the US are based on Standard Contractual Clauses (Art. 46 GDPR). Privacy: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">resend.com/legal/privacy-policy</a>.</li>
            <li><strong>Mittwald CM Service GmbH &amp; Co. KG</strong> — Königsberger Str. 4–6, 32339 Espelkamp, Germany. Purpose: hosting of the application and authentication database. Server location: Germany.</li>
          </ul>
        `,
      },
      {
        heading: '6. Retention',
        html: `
          <ul>
            <li>Account data: until you delete it, or after 24 months of inactivity.</li>
            <li>Billing / invoice data: up to 10 years (statutory retention).</li>
            <li>Server logs: max. 14 days.</li>
          </ul>
        `,
      },
      {
        heading: '7. Your rights',
        html: `
          <p>You have the right to:</p>
          <ul>
            <li>Access (Art. 15 GDPR)</li>
            <li>Rectification (Art. 16 GDPR)</li>
            <li>Erasure (Art. 17 GDPR)</li>
            <li>Restriction (Art. 18 GDPR)</li>
            <li>Objection (Art. 21 GDPR)</li>
            <li>Data portability (Art. 20 GDPR)</li>
            <li>Complaint to a supervisory authority</li>
          </ul>
          <p>Send requests to <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>. We respond within the statutory time limits.</p>
        `,
      },
      {
        heading: '8. Cookies and local storage',
        html: `
          <p>We only use strictly necessary mechanisms:</p>
          <ul>
            <li>An HTTP-only session cookie (<code>ttp_session</code>) for authentication.</li>
            <li><code>localStorage</code> for your settings (language, theme, currency).</li>
            <li><code>IndexedDB</code> for your drawn exercises and training lists.</li>
          </ul>
          <p>No tracking, no ads, no analytics cookies.</p>
        `,
      },
      {
        heading: '9. International data transfers',
        html: `
          <p>Some sub-processors (Stripe, Resend) also process data in the United States. Such transfers are based on Standard Contractual Clauses under Art. 46 GDPR and — where applicable — on the EU-US Data Privacy Framework.</p>
        `,
      },
      {
        heading: '10. Cloud sync and training data',
        html: `
          <p>When you have an account and are signed in, we synchronise your exercises, training lists and app settings (language, theme, currency) across our servers.</p>
          <ul>
            <li><strong>Purpose:</strong> cross-device access, backup, and recovery after browser cache loss.</li>
            <li><strong>Storage location:</strong> servers of OK-MARKED LLC, hosted by Mittwald in Germany (see section 5).</li>
            <li><strong>Legal basis:</strong> Art. 6(1)(b) GDPR — the sync is a core product function and part of contract performance.</li>
            <li><strong>Content:</strong> only data you draw and enter yourself (arrows, notes, stroke-type tags, titles, colour and number info). No external content, no tracking data.</li>
            <li><strong>Deletion:</strong> when you delete your account, all server-side training data is removed immediately and completely. You can also reset individual exercises or all sync data from within the app at any time.</li>
            <li><strong>Signing out:</strong> if you sign out, your data remains in your browser but is no longer synchronised with the server.</li>
            <li><strong>Sharing feature:</strong> when you share an exercise, a publicly accessible link is created. Anyone with the link can view the exercise – no login required. You can revoke the link at any time under Settings → Shared exercises. Legal basis: Art. 6(1)(b) GDPR (contract performance).</li>
          </ul>
        `,
      },
      {
        heading: '11. Contact',
        html: `
          <p>For privacy requests: <a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: LAST_UPDATED_ES,
    sections: [
      {
        heading: '1. Responsable',
        html: `
          <p><strong>OK-MARKED LLC</strong><br />
          30 N Gould St Ste R<br />
          Sheridan, WY 82801<br />
          EE. UU.</p>
          <p>Representado por Olaf Kranz.<br />
          Correo: <a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
      {
        heading: '2. Qué datos recogemos',
        html: `
          <ul>
            <li><strong>Datos de cuenta:</strong> dirección de correo y hash de la contraseña (Argon2id). Tu contraseña en texto plano nunca sale de tu navegador.</li>
            <li><strong>Cookie de sesión:</strong> una cookie HTTP-only técnicamente necesaria para la autenticación (30 días, renovable).</li>
            <li><strong>Datos de suscripción:</strong> estado de pago e identificadores de cliente y suscripción de Stripe. <em>No</em> almacenamos datos de tarjeta ni bancarios.</li>
            <li><strong>Datos locales de la app:</strong> tus ejercicios, listas de entrenamiento y preferencias (idioma, tema) se almacenan en tu navegador (IndexedDB / localStorage). Cuando has iniciado sesión, también se almacenan en nuestros servidores para sincronización entre dispositivos — véase la sección 10.</li>
            <li><strong>Registros del servidor:</strong> registros técnicos mínimos (marca de tiempo, estado HTTP, IP truncada) para la resolución de incidencias.</li>
          </ul>
        `,
      },
      {
        heading: '3. Finalidades',
        html: `
          <ul>
            <li>Prestación, seguridad y mantenimiento del servicio</li>
            <li>Gestión de la suscripción Pro</li>
            <li>Envío de correos transaccionales (registro, restablecimiento de contraseña, confirmaciones de pago)</li>
          </ul>
        `,
      },
      {
        heading: '4. Bases jurídicas (para usuarios de la UE)',
        html: `
          <ul>
            <li>Art. 6.1.b RGPD — ejecución del contrato</li>
            <li>Art. 6.1.f RGPD — intereses legítimos (seguridad, diagnóstico, prevención de abusos)</li>
            <li>Art. 6.1.a RGPD — consentimiento cuando proceda</li>
          </ul>
        `,
      },
      {
        heading: '5. Encargados y subencargados',
        html: `
          <ul>
            <li><strong>Stripe</strong> — Stripe Payments Europe Limited (Irlanda) para usuarios de la UE o Stripe, Inc. (EE. UU.). Finalidad: pagos y portal de cliente. Privacidad: <a href="https://stripe.com/privacy" target="_blank" rel="noopener">stripe.com/privacy</a>.</li>
            <li><strong>Resend</strong> — Resend, Inc. (EE. UU.). Finalidad: envío de correos transaccionales. Las transferencias a EE. UU. se realizan mediante Cláusulas Contractuales Tipo (art. 46 RGPD). Privacidad: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">resend.com/legal/privacy-policy</a>.</li>
            <li><strong>Mittwald CM Service GmbH &amp; Co. KG</strong> — Königsberger Str. 4–6, 32339 Espelkamp, Alemania. Finalidad: alojamiento de la aplicación y de la base de datos de autenticación. Ubicación: Alemania.</li>
          </ul>
        `,
      },
      {
        heading: '6. Plazos de conservación',
        html: `
          <ul>
            <li>Datos de cuenta: hasta su eliminación por tu parte o tras 24 meses de inactividad.</li>
            <li>Datos de facturación/suscripción: hasta 10 años (obligaciones legales de conservación).</li>
            <li>Registros del servidor: máx. 14 días.</li>
          </ul>
        `,
      },
      {
        heading: '7. Tus derechos',
        html: `
          <p>Puedes ejercer los siguientes derechos:</p>
          <ul>
            <li>Acceso (art. 15 RGPD)</li>
            <li>Rectificación (art. 16 RGPD)</li>
            <li>Supresión (art. 17 RGPD)</li>
            <li>Limitación (art. 18 RGPD)</li>
            <li>Oposición (art. 21 RGPD)</li>
            <li>Portabilidad (art. 20 RGPD)</li>
            <li>Reclamación ante una autoridad de control</li>
          </ul>
          <p>Envía tus solicitudes a <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>. Responderemos dentro de los plazos legales.</p>
        `,
      },
      {
        heading: '8. Cookies y almacenamiento local',
        html: `
          <p>Utilizamos únicamente mecanismos estrictamente necesarios:</p>
          <ul>
            <li>Una cookie HTTP-only de sesión (<code>ttp_session</code>) para la autenticación.</li>
            <li><code>localStorage</code> para tus preferencias (idioma, tema, moneda).</li>
            <li><code>IndexedDB</code> para tus ejercicios y listas de entrenamiento.</li>
          </ul>
          <p>Sin seguimiento, sin publicidad, sin cookies analíticas.</p>
        `,
      },
      {
        heading: '9. Transferencias internacionales',
        html: `
          <p>Algunos subencargados (Stripe, Resend) procesan datos también en EE. UU. Estas transferencias se basan en Cláusulas Contractuales Tipo conforme al art. 46 RGPD y, cuando corresponda, en el EU-US Data Privacy Framework.</p>
        `,
      },
      {
        heading: '10. Sincronización en la nube y datos de entrenamiento',
        html: `
          <p>Cuando tienes una cuenta y has iniciado sesión, sincronizamos tus ejercicios, listas de entrenamiento y preferencias (idioma, tema, moneda) a través de nuestros servidores.</p>
          <ul>
            <li><strong>Finalidad:</strong> acceso multidispositivo, copia de seguridad y recuperación tras pérdida de caché del navegador.</li>
            <li><strong>Ubicación:</strong> servidores de OK-MARKED LLC, alojados en Mittwald, Alemania (véase la sección 5).</li>
            <li><strong>Base jurídica:</strong> art. 6.1.b RGPD — la sincronización es una funcionalidad central y parte de la ejecución del contrato.</li>
            <li><strong>Contenido:</strong> únicamente datos que tú dibujas e introduces (flechas, notas, etiquetas de tipo de golpe, títulos, colores y números). Sin contenidos externos ni datos de seguimiento.</li>
            <li><strong>Eliminación:</strong> al eliminar tu cuenta, todos los datos de entrenamiento almacenados en el servidor se borran de inmediato y por completo. También puedes restablecer ejercicios individuales o todos los datos sincronizados desde la app en cualquier momento.</li>
            <li><strong>Cerrar sesión:</strong> si cierras sesión, tus datos permanecen en tu navegador pero ya no se sincronizan con el servidor.</li>
            <li><strong>Función de compartir:</strong> cuando compartes un ejercicio, se genera un enlace públicamente accesible. Cualquier persona con el enlace puede ver el ejercicio, sin inicio de sesión. Puedes revocar el enlace en cualquier momento desde Ajustes → Ejercicios compartidos. Base jurídica: art. 6.1.b RGPD (ejecución del contrato).</li>
          </ul>
        `,
      },
      {
        heading: '11. Contacto',
        html: `
          <p>Para solicitudes de privacidad: <a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
    ],
  },
};
