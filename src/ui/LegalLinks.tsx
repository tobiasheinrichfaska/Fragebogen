// Impressum and Datenschutz of the Kanzlei homepage in the footer of every screen, the access notice
// included (Tobias 2026-11-15) — from the local configuration, so the public build links nothing.
// They open in a new tab: the questionnaire stays open.
import { APP_CONFIG } from '../config';
import { legalLinks } from '../logic/appConfig';

const LINKS = legalLinks(APP_CONFIG);

export function LegalLinks() {
  if (LINKS.length === 0) return null;
  return (
    <nav className="legal" aria-label="Rechtliche Hinweise">
      {LINKS.map((link, index) => (
        <span key={link.label}>
          {index > 0 && ' · '}
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        </span>
      ))}
    </nav>
  );
}

/** The footer of a screen that has none of its own (access notice, protected link, broken forms). */
export function LegalFooter() {
  if (LINKS.length === 0) return null;
  return (
    <footer className="footer">
      <LegalLinks />
    </footer>
  );
}
