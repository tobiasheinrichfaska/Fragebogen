// PDF out and in — wired up in step 8.
import { fileNameFor } from '../logic/fileNames';
import type { Session } from '../logic/session';
import type { BannerMessage } from './common';

export async function createPdf(session: Session): Promise<BannerMessage> {
  const name = fileNameFor(
    session.form.definition.id,
    session.questionnaire.questionnaireId,
    'handover',
  );
  return Promise.resolve({ tone: 'info', text: `Die PDF „${name}“ folgt im nächsten Schritt.` });
}

export async function openPdfOrImage(
  file: File,
): Promise<
  { ok: true; session: Session; message?: BannerMessage } | { ok: false; message: BannerMessage }
> {
  return Promise.resolve({
    ok: false,
    message: {
      tone: 'info',
      text: `„${file.name}“: PDFs und Fotos lassen sich im nächsten Schritt einlesen.`,
    },
  });
}
