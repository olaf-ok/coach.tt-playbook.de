import type { LegalContent } from './types';

const LAST_UPDATED_DE = 'Stand: April 2026';
const LAST_UPDATED_EN = 'Last updated: April 2026';
const LAST_UPDATED_ES = 'Última actualización: abril de 2026';

export const termsContent: LegalContent = {
  de: {
    title: 'Nutzungsbedingungen',
    lastUpdated: LAST_UPDATED_DE,
    sections: [
      {
        heading: '1. Anbieter',
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
        heading: '2. Geltungsbereich',
        html: `
          <p>Diese Bedingungen regeln die Nutzung der Webanwendung „TT Playbook Trainer" unter <a href="https://coach.tt-playbook.de" target="_blank" rel="noopener">coach.tt-playbook.de</a> sowie zugehörigen Subdomains (u. a. <code>tv.tt-playbook.de</code>).</p>
        `,
      },
      {
        heading: '3. Leistungsbeschreibung',
        html: `
          <p>TT Playbook Trainer ist ein digitales Whiteboard für Tischtennistrainer:innen. Der Dienst erlaubt das Zeichnen taktischer Übungen auf Tablet oder Smartphone, das Spiegeln der Zeichnung auf ein TV-Gerät, das Speichern von Übungen und Trainingslisten sowie — bei angemeldetem Konto — die serverseitige Datensicherung und geräteübergreifende Synchronisation der Trainingsdaten und App-Einstellungen.</p>
          <ul>
            <li><strong>Free-Plan:</strong> bis zu 5 gespeicherte Übungen, 1 Trainingsliste, voller Zeichen- und TV-Funktionsumfang, Cloud-Sync.</li>
            <li><strong>Pro-Plan:</strong> unbegrenzte Übungen und Trainingslisten, Cloud-Sync.</li>
          </ul>
        `,
      },
      {
        heading: '4. Preise und Zahlung',
        html: `
          <ul>
            <li>Pro monatlich: <strong>9,90 €/Monat</strong> (bzw. <strong>14,90 USD/Monat</strong>)</li>
            <li>Pro jährlich: <strong>99 €/Jahr</strong> (bzw. <strong>149 USD/Jahr</strong>)</li>
          </ul>
          <p>Alle Preise verstehen sich inklusive der gesetzlichen Steuern, soweit anwendbar. Die Zahlungsabwicklung erfolgt über <strong>Stripe</strong>; Karten- oder Bankdaten werden ausschließlich bei Stripe gespeichert.</p>
          <p>Das Abonnement verlängert sich automatisch um den gewählten Abrechnungszeitraum, bis es gekündigt wird.</p>
        `,
      },
      {
        heading: '5. Kündigung',
        html: `
          <p>Das Abonnement kann jederzeit mit Wirkung zum Ende des laufenden Abrechnungszeitraums gekündigt werden. Die Kündigung erfolgt über den Kundenbereich: <em>Einstellungen → Konto → „Abo verwalten"</em>. Dort öffnet sich das von Stripe bereitgestellte Kundenportal.</p>
        `,
      },
      {
        heading: '6. Widerrufsrecht (für Verbraucher in der EU)',
        html: `
          <p>Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
          <p>Um dein Widerrufsrecht auszuüben, musst du uns (<strong>OK-MARKED LLC</strong>, 30 N Gould St Ste R, Sheridan, WY 82801, USA, <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>) mittels einer eindeutigen Erklärung (z. B. per E-Mail) über deinen Entschluss informieren.</p>
          <p><strong>Erlöschen des Widerrufsrechts:</strong> Das Widerrufsrecht erlischt bei digitalen Dienstleistungen gemäß § 356 Abs. 5 BGB, wenn du mit dem Abo-Abschluss ausdrücklich zustimmst, dass wir mit der Ausführung des Vertrages vor Ablauf der Widerrufsfrist beginnen und du bestätigst, dass du dein Widerrufsrecht dadurch verlierst.</p>
          <p>Ein Muster-Widerrufsformular senden wir auf Anfrage an <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>.</p>
        `,
      },
      {
        heading: '7. Verfügbarkeit',
        html: `
          <p>Wir bemühen uns um eine hohe Verfügbarkeit des Dienstes, übernehmen jedoch keine Garantie für eine bestimmte Erreichbarkeit. Wartungsarbeiten können zu temporären Einschränkungen führen.</p>
        `,
      },
      {
        heading: '8. Pflichten der Nutzer:innen',
        html: `
          <ul>
            <li>Wahrheitsgemäße Angaben bei der Registrierung (insbesondere eine gültige E-Mail-Adresse)</li>
            <li>Sichere Aufbewahrung der Zugangsdaten</li>
            <li>Kein Missbrauch des Dienstes (z. B. Reverse Engineering, systematische Überlastung, Weitergabe des Accounts)</li>
            <li>Einhaltung geltender Gesetze bei der Nutzung</li>
          </ul>
        `,
      },
      {
        heading: '9. Haftung',
        html: `
          <p>Wir haften uneingeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für Vorsatz und grobe Fahrlässigkeit. Bei einfacher Fahrlässigkeit ist unsere Haftung auf die Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) beschränkt und der Höhe nach auf die bei Vertragsschluss typischerweise vorhersehbaren Schäden begrenzt. Eine weitergehende Haftung ist ausgeschlossen.</p>
        `,
      },
      {
        heading: '10. Änderungen dieser Bedingungen',
        html: `
          <p>Änderungen dieser Nutzungsbedingungen werden per E-Mail angekündigt und treten frühestens 30 Tage nach Versand in Kraft. Widersprichst du nicht innerhalb dieser Frist, gelten die Änderungen als angenommen; wir weisen in der Ankündigung ausdrücklich auf diese Wirkung hin.</p>
        `,
      },
      {
        heading: '11. Anwendbares Recht und Gerichtsstand',
        html: `
          <p>Es gilt das Recht des US-Bundesstaates Wyoming unter Ausschluss des UN-Kaufrechts. Verbraucher:innen mit gewöhnlichem Aufenthalt in der EU bleiben die zwingenden Verbraucherschutzrechte ihres Wohnsitzstaates unbenommen.</p>
        `,
      },
      {
        heading: '12. Streitbeilegung',
        html: `
          <p>Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>. Wir sind weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        `,
      },
      {
        heading: '13. Kontakt',
        html: `
          <p><a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
    ],
  },
  en: {
    title: 'Terms of Service',
    lastUpdated: LAST_UPDATED_EN,
    sections: [
      {
        heading: '1. Provider',
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
        heading: '2. Scope',
        html: `
          <p>These terms govern the use of the web application "TT Playbook Trainer" at <a href="https://coach.tt-playbook.de" target="_blank" rel="noopener">coach.tt-playbook.de</a> and related subdomains (incl. <code>tv.tt-playbook.de</code>).</p>
        `,
      },
      {
        heading: '3. Service description',
        html: `
          <p>TT Playbook Trainer is a digital whiteboard for table tennis coaches. It allows drawing tactical exercises on a tablet or phone, mirroring the drawing on a TV display, saving exercises and training lists, and — when signed in — server-side backup and cross-device synchronisation of your training data and app settings.</p>
          <ul>
            <li><strong>Free plan:</strong> up to 5 saved exercises, 1 training list, full drawing and TV functionality, cloud sync.</li>
            <li><strong>Pro plan:</strong> unlimited exercises and training lists, cloud sync.</li>
          </ul>
        `,
      },
      {
        heading: '4. Pricing and payment',
        html: `
          <ul>
            <li>Pro monthly: <strong>EUR 9.90/month</strong> (or <strong>USD 14.90/month</strong>)</li>
            <li>Pro yearly: <strong>EUR 99/year</strong> (or <strong>USD 149/year</strong>)</li>
          </ul>
          <p>All prices include statutory taxes where applicable. Payments are processed via <strong>Stripe</strong>; card or bank details are stored only by Stripe.</p>
          <p>Subscriptions renew automatically at the end of each billing period until cancelled.</p>
        `,
      },
      {
        heading: '5. Cancellation',
        html: `
          <p>You can cancel your subscription at any time, effective at the end of the current billing period. Cancellation happens in the customer area: <em>Settings → Account → "Manage subscription"</em>, which opens the Stripe-hosted customer portal.</p>
        `,
      },
      {
        heading: '6. Right of withdrawal (EU consumers)',
        html: `
          <p>You have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period is 14 days from the day of contract conclusion.</p>
          <p>To exercise your right of withdrawal, you must inform us (<strong>OK-MARKED LLC</strong>, 30 N Gould St Ste R, Sheridan, WY 82801, USA, <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>) of your decision by a clear statement (e.g. by email).</p>
          <p><strong>Loss of the right of withdrawal:</strong> Under § 356(5) of the German Civil Code and the comparable EU consumer rules, the right of withdrawal for digital services expires when you expressly consent that we start performing the service before the withdrawal period ends and acknowledge that you thereby lose your right of withdrawal.</p>
          <p>A model withdrawal form is available on request at <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>.</p>
        `,
      },
      {
        heading: '7. Availability',
        html: `
          <p>We aim for high availability but do not guarantee any specific uptime. Maintenance may cause temporary interruptions.</p>
        `,
      },
      {
        heading: '8. User obligations',
        html: `
          <ul>
            <li>Truthful information during registration (especially a valid email address)</li>
            <li>Safe storage of credentials</li>
            <li>No misuse (e.g. reverse engineering, systematic overload, account sharing)</li>
            <li>Compliance with applicable laws</li>
          </ul>
        `,
      },
      {
        heading: '9. Liability',
        html: `
          <p>We are liable without limitation for damages arising from injury to life, body or health, as well as for intent and gross negligence. For simple negligence, our liability is limited to the breach of essential contractual obligations and capped at the damages typically foreseeable at the time of contract conclusion. Further liability is excluded.</p>
        `,
      },
      {
        heading: '10. Changes to these terms',
        html: `
          <p>Changes to these terms will be announced by email and take effect no earlier than 30 days after dispatch. If you do not object within that period, the changes are deemed accepted; we will explicitly point this out in the announcement.</p>
        `,
      },
      {
        heading: '11. Governing law and jurisdiction',
        html: `
          <p>These terms are governed by the laws of the US State of Wyoming, excluding the UN Convention on Contracts for the International Sale of Goods. Consumers resident in the EU retain the mandatory consumer protection rights of their country of residence.</p>
        `,
      },
      {
        heading: '12. Dispute resolution',
        html: `
          <p>The European Commission provides an online dispute resolution platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>. We are not obliged and not willing to participate in dispute resolution proceedings before a consumer arbitration board.</p>
        `,
      },
      {
        heading: '13. Contact',
        html: `
          <p><a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
    ],
  },
  es: {
    title: 'Condiciones de Uso',
    lastUpdated: LAST_UPDATED_ES,
    sections: [
      {
        heading: '1. Proveedor',
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
        heading: '2. Ámbito de aplicación',
        html: `
          <p>Estas condiciones regulan el uso de la aplicación web „TT Playbook Trainer" en <a href="https://coach.tt-playbook.de" target="_blank" rel="noopener">coach.tt-playbook.de</a> y subdominios asociados (incl. <code>tv.tt-playbook.de</code>).</p>
        `,
      },
      {
        heading: '3. Descripción del servicio',
        html: `
          <p>TT Playbook Trainer es una pizarra digital para entrenadores de tenis de mesa. Permite dibujar ejercicios tácticos en tablet o móvil, reflejarlos en un televisor, guardar ejercicios y listas de entrenamiento y —con una cuenta iniciada— realizar copias de seguridad en el servidor y sincronizar los datos de entrenamiento y las preferencias entre dispositivos.</p>
          <ul>
            <li><strong>Plan gratuito:</strong> hasta 5 ejercicios guardados, 1 lista de entrenamiento, funciones completas de dibujo y TV, sincronización en la nube.</li>
            <li><strong>Plan Pro:</strong> ejercicios y listas ilimitados, sincronización en la nube.</li>
          </ul>
        `,
      },
      {
        heading: '4. Precios y pago',
        html: `
          <ul>
            <li>Pro mensual: <strong>9,90 €/mes</strong> (o <strong>14,90 USD/mes</strong>)</li>
            <li>Pro anual: <strong>99 €/año</strong> (o <strong>149 USD/año</strong>)</li>
          </ul>
          <p>Todos los precios incluyen los impuestos legales cuando corresponda. El pago se procesa mediante <strong>Stripe</strong>; los datos bancarios o de tarjeta se almacenan únicamente en Stripe.</p>
          <p>La suscripción se renueva automáticamente al final de cada período de facturación hasta que se cancela.</p>
        `,
      },
      {
        heading: '5. Cancelación',
        html: `
          <p>Puedes cancelar tu suscripción en cualquier momento con efecto al final del período de facturación en curso. La cancelación se gestiona en el área de cliente: <em>Ajustes → Cuenta → „Gestionar suscripción"</em>, que abre el portal de cliente alojado por Stripe.</p>
        `,
      },
      {
        heading: '6. Derecho de desistimiento (consumidores de la UE)',
        html: `
          <p>Tienes derecho a desistir del contrato en un plazo de 14 días sin necesidad de justificación. El plazo comienza el día de celebración del contrato.</p>
          <p>Para ejercer el derecho de desistimiento debes informarnos (<strong>OK-MARKED LLC</strong>, 30 N Gould St Ste R, Sheridan, WY 82801, EE. UU., <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>) mediante una declaración inequívoca (por ejemplo, por correo electrónico).</p>
          <p><strong>Pérdida del derecho:</strong> Conforme a la normativa europea de consumo y § 356(5) del BGB alemán, el derecho de desistimiento se extingue para servicios digitales si aceptas expresamente el inicio de la ejecución antes de que finalice el plazo y reconoces que con ello pierdes el derecho.</p>
          <p>Un modelo de formulario de desistimiento está disponible previa solicitud a <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>.</p>
        `,
      },
      {
        heading: '7. Disponibilidad',
        html: `
          <p>Procuramos una alta disponibilidad del servicio, sin garantía específica de tiempo de actividad. Las tareas de mantenimiento pueden causar interrupciones temporales.</p>
        `,
      },
      {
        heading: '8. Obligaciones del usuario',
        html: `
          <ul>
            <li>Datos veraces en el registro (especialmente una dirección de correo válida)</li>
            <li>Custodia segura de las credenciales</li>
            <li>Uso adecuado (sin ingeniería inversa, sobrecarga sistemática ni compartir la cuenta)</li>
            <li>Cumplimiento de la legislación aplicable</li>
          </ul>
        `,
      },
      {
        heading: '9. Responsabilidad',
        html: `
          <p>Respondemos sin limitación por los daños derivados de lesiones a la vida, el cuerpo o la salud, así como por dolo y culpa grave. Por culpa leve, nuestra responsabilidad se limita a la infracción de obligaciones contractuales esenciales y se acota al daño típicamente previsible en el momento de celebración del contrato. Toda otra responsabilidad queda excluida.</p>
        `,
      },
      {
        heading: '10. Modificaciones de estas condiciones',
        html: `
          <p>Las modificaciones se anunciarán por correo electrónico y entrarán en vigor no antes de 30 días después del envío. Si no te opones dentro de ese plazo, las modificaciones se considerarán aceptadas; lo indicaremos expresamente en el aviso.</p>
        `,
      },
      {
        heading: '11. Derecho aplicable y jurisdicción',
        html: `
          <p>Estas condiciones se rigen por las leyes del estado de Wyoming (EE. UU.), con exclusión del Convenio de las Naciones Unidas sobre los Contratos de Compraventa Internacional de Mercaderías. Los consumidores con residencia habitual en la UE conservan los derechos imperativos de protección al consumidor de su país de residencia.</p>
        `,
      },
      {
        heading: '12. Resolución de conflictos',
        html: `
          <p>La Comisión Europea ofrece una plataforma para la resolución extrajudicial de litigios: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>. No estamos obligados ni dispuestos a participar en procedimientos ante un organismo de arbitraje de consumo.</p>
        `,
      },
      {
        heading: '13. Contacto',
        html: `
          <p><a href="mailto:info@ok-marked.com">info@ok-marked.com</a></p>
        `,
      },
    ],
  },
};
