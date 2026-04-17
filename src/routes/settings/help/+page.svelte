<script lang="ts">
  import { m } from '$lib/paraglide/messages';
</script>

<section class="help">
  <h2>{m.settings_help_title()}</h2>

  <p class="intro">
    Der TT Playbook Trainer ersetzt das physische Whiteboard in der Halle. Du
    zeichnest Übungen auf Tablet oder Smartphone und überträgst sie live auf
    einen TV — mit klar nummerierten Pfeilen, Schlagart-Codes und einer
    Übungs-Bibliothek, die du jederzeit wieder abrufen kannst.
  </p>

  <article>
    <h3>1. Erste Schritte</h3>
    <ul>
      <li>
        <strong>Konto anlegen:</strong> Einstellungen → Account → „Registrieren".
        E-Mail bestätigen über den Link, der per Mail kommt.
      </li>
      <li>
        <strong>Anmelden:</strong> Mit E-Mail + Passwort einloggen. Im Free-Plan
        kannst du bis zu 5 Übungen anlegen, eine Trainingsliste führen und alle
        Zeichen- und TV-Funktionen voll nutzen.
      </li>
      <li>
        <strong>Pro freischalten:</strong> Einstellungen → Pro → Plan wählen
        (monatlich oder jährlich). Hebt das 5-Übungen-Limit auf, erlaubt
        unbegrenzt Trainingslisten und eigene Schlagart-Codes (kommt).
      </li>
    </ul>
  </article>

  <article>
    <h3>2. Übung zeichnen</h3>
    <p>Hauptansicht ist der Tischtennis-Tisch im Hochformat (Spieler unten, Gegner oben).</p>
    <ul>
      <li>
        <strong>Pfeil zeichnen:</strong> Auf den Tisch tippen und ziehen, oder
        zwei Mal hintereinander tippen (Start + Ziel).
      </li>
      <li>
        <strong>Nummerierung + Farben:</strong> Jeder Pfeil bekommt automatisch
        die nächste Nummer. Farbe folgt der Nummer:
        <em>1=Rot, 2=Grün, 3=Gelb, 4=Lila, 5=Orange, 6=Cyan</em>. Ab dem 7. Schlag
        wiederholen sich die Farben — ein dezenter Hinweis macht das sichtbar.
      </li>
      <li>
        <strong>Schlagart taggen:</strong> Nach dem Zeichnen klappt rechts das
        Schritte-Panel auf. Wähle dort die Schlagart-Codes (z.B. SAQ, VH-T,
        RH-BLQ, FLIP, …) — sie werden dreisprachig angezeigt.
      </li>
      <li>
        <strong>Freitext:</strong> Pro Schlag kannst du einen Kommentar
        ergänzen (z.B. „kurz halten", „auf Außenecke").
      </li>
      <li>
        <strong>Wiederholungen + Dauer:</strong> Im Schritte-Panel oben:
        Preset-Buttons 5/10/15/20 Wdh. und 5/10/15 Minuten oder freie Eingabe.
      </li>
      <li>
        <strong>Pfeil löschen:</strong> Pfeil antippen → Mülleimer im Panel.
        Restliche Pfeile werden automatisch neu nummeriert.
      </li>
      <li>
        <strong>Zurück:</strong> „Zurück"-Button (gebogener Pfeil) im
        Panel-Header — macht den letzten Pfeil rückgängig.
      </li>
      <li>
        <strong>Neue Übung:</strong> „+ Neu"-Button in der Toolbar setzt den
        Tisch zurück.
      </li>
    </ul>
  </article>

  <article>
    <h3>3. Übung speichern</h3>
    <ul>
      <li>
        Name vergeben (Toolbar oben), dann „Speichern". Free-Plan: maximal
        5 Übungen — beim Versuch, eine sechste zu speichern, erscheint die
        Pro-Aufforderung.
      </li>
      <li>
        Bestehende Übung bearbeiten + erneut „Speichern" überschreibt sie.
      </li>
    </ul>
  </article>

  <article>
    <h3>4. Archiv</h3>
    <ul>
      <li>
        <strong>Übersicht:</strong> Alle gespeicherten Übungen mit Mini-Vorschau
        (Thumbnail), Name, Anzahl Schläge.
      </li>
      <li>
        <strong>Suchen:</strong> Suchfeld oben filtert nach Name.
      </li>
      <li>
        <strong>Filtern:</strong> Chips nach Schlagart — zeigt nur Übungen, die
        diesen Code enthalten.
      </li>
      <li>
        <strong>Aktionen pro Übung:</strong> Drei-Punkte-Menü auf der Karte →
        Umbenennen, Duplizieren, Löschen.
      </li>
      <li>
        <strong>Öffnen:</strong> Karte antippen lädt die Übung zum Bearbeiten.
      </li>
    </ul>
  </article>

  <article>
    <h3>5. Trainingslisten</h3>
    <p>
      Bündel mehrerer Übungen, die du nacheinander auf dem TV abspielen kannst —
      ideal für eine Trainingseinheit.
    </p>
    <ul>
      <li>
        <strong>Anlegen:</strong> Trainingslisten → „+ Neue Liste" → Name eingeben.
      </li>
      <li>
        <strong>Übungen hinzufügen:</strong> In der Liste „+ Übung hinzufügen" →
        aus dem Archiv auswählen.
      </li>
      <li>
        <strong>Reihenfolge ändern:</strong> Übungen in der Liste per
        Drag &amp; Drop verschieben.
      </li>
      <li>
        <strong>Auf TV abspielen:</strong> „Auf TV spielen" startet den Player
        auf dem verbundenen TV. Vor/Zurück per Buttons oder Pfeiltasten.
        Schritt-für-Schritt-Navigation innerhalb einer Übung möglich. Escape
        beendet.
      </li>
      <li>
        Free-Plan: 1 Trainingsliste. Pro: unbegrenzt.
      </li>
    </ul>
  </article>

  <article>
    <h3>6. TV-Verbindung</h3>
    <p>
      Tablet/Smartphone steuert die Anzeige, der TV (oder ein an den TV
      angeschlossener Laptop/Stick-PC) zeigt die Übung groß an.
    </p>
    <ol>
      <li>
        Im TV-Browser (Smart-TV, Stick-PC, Laptop am HDMI-Eingang)
        <code>coach.tt-playbook.de/tv</code> öffnen.
      </li>
      <li>Der TV zeigt einen QR-Code und einen vierstelligen Code.</li>
      <li>
        Auf dem Tablet/Smartphone: Einstellungen → TV-Verbindung → entweder QR
        scannen (Kamera-Symbol) oder den Code per Hand eintippen.
      </li>
      <li>
        Sobald verbunden, wird jede Übung, die du zeichnest oder im Archiv
        öffnest, sofort auf dem TV gezeigt.
      </li>
      <li>
        <strong>Anforderung:</strong> Beide Geräte im selben WLAN.
      </li>
      <li>
        <strong>Theme-Sync:</strong> Wechselst du auf dem Tablet zwischen Hell
        und Dunkel, schaltet auch der TV mit.
      </li>
    </ol>
  </article>

  <article>
    <h3>7. Pro-Abo</h3>
    <ul>
      <li>
        <strong>Free:</strong> 5 Übungen, 1 Trainingsliste, voller Zeichen- und
        TV-Modus.
      </li>
      <li>
        <strong>Pro:</strong> Unbegrenzte Übungen, unbegrenzte Trainingslisten,
        eigene Schlagart-Codes (geplant), Cloud-Sync (geplant).
      </li>
      <li>
        <strong>Buchen:</strong> Einstellungen → Pro → Plan-Karte anklicken →
        Stripe-Checkout abschließen. Direkt zurück zur App, Pro-Status ist
        sofort aktiv.
      </li>
      <li>
        <strong>Verwalten:</strong> Einstellungen → Account → „Abo verwalten"
        öffnet das Stripe-Kundenportal: Zahlungsmittel ändern, Rechnungen
        einsehen, Abo kündigen.
      </li>
      <li>
        <strong>Kündigen:</strong> Abo läuft bis zum Ende der bezahlten Periode
        weiter — kein Zugriffsverlust mitten im Monat. Danach Free-Modus.
      </li>
    </ul>
  </article>

  <article>
    <h3>8. Einstellungen</h3>
    <ul>
      <li>
        <strong>Account:</strong> Anmelden, Registrieren, Passwort zurücksetzen,
        Pro-Status, Abo verwalten, Logout.
      </li>
      <li>
        <strong>Sprache:</strong> Deutsch, Englisch, Spanisch oder System-Sprache.
        Wirkt auf die App, die Schlagart-Codes und die E-Mails.
      </li>
      <li>
        <strong>TV-Verbindung:</strong> QR scannen, Code eingeben, Verbindung
        trennen.
      </li>
      <li>
        <strong>Anzeige:</strong> Hell, Dunkel oder System-Modus.
      </li>
      <li>
        <strong>Pro:</strong> Plan buchen, Pro-Status sehen.
      </li>
      <li>
        <strong>Über:</strong> App-Version + Impressum.
      </li>
    </ul>
  </article>

  <article>
    <h3>9. Tipps für die Halle</h3>
    <ul>
      <li>
        Tablet vor dem Training mit dem TV pairen — die Verbindung bleibt für
        die ganze Einheit stehen.
      </li>
      <li>
        Häufig genutzte Übungen einmal anlegen und in eine Trainingsliste
        ziehen — beim nächsten Training nur noch „Auf TV spielen".
      </li>
      <li>
        Im Schritte-Panel den Freitext nutzen, um Coaching-Hinweise pro Schlag
        zu hinterlegen („Tisch verlassen", „kurzer Aufschlag").
      </li>
      <li>
        Helle Hallen → Anzeige auf Hell. Dunkle Hallen → Dunkel. Das Tablet
        steuert beides für TV mit.
      </li>
    </ul>
  </article>

  <article>
    <h3>10. Hilfe &amp; Kontakt</h3>
    <p>
      Fragen, Wünsche, Probleme: <a href="mailto:info@ok-marked.com">info@ok-marked.com</a>.
      Beim Melden eines Bugs hilft eine kurze Beschreibung, was du tun wolltest
      und was statt dessen passiert ist.
    </p>
  </article>
</section>

<style>
  .help {
    padding: 40px;
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 10px;
  }
  .intro {
    color: var(--color-text-secondary);
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
  }
  article {
    background: var(--bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-panel);
    padding: 20px 22px;
  }
  ul,
  ol {
    margin: 0;
    padding: 0 0 0 22px;
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 1.65;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  p {
    margin: 0 0 12px;
    color: var(--color-text-primary);
    font-size: 14px;
    line-height: 1.65;
  }
  article p:last-child {
    margin-bottom: 0;
  }
  strong {
    color: var(--color-text-primary);
    font-weight: 600;
  }
  em {
    color: var(--color-text-secondary);
    font-style: normal;
  }
  code {
    background: var(--bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 13px;
    font-family: ui-monospace, monospace;
    color: var(--color-text-primary);
  }
  a {
    color: var(--color-accent);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  @media (max-width: 767.98px) {
    .help {
      padding: 20px 16px;
      gap: 18px;
    }
    article {
      padding: 16px 18px;
    }
  }
</style>
