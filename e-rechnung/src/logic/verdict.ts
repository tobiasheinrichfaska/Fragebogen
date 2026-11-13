// The result of step 1 "Erkennen": is it an e-invoice, in which syntax and profile. Always hints,
// never an approval. Texts are data (texts.ts); this file only decides which apply.
import type { Analysis, InvoicePart, Problem } from './analysis';
import { isoDate } from './dates';
import { decimalEquals, parseDecimal } from './decimal';
import { first } from './mapping';
import type { BtId } from './mapping';
import { profileOf } from './profiles';
import type { Einordnung, ProfileMatch } from './profiles';
import { syntaxById } from './syntax';
import { TEXTS, fill } from './texts';

export type Tone = 'ok' | 'warn' | 'bad';

export interface InvoiceVerdict {
  part: InvoicePart;
  syntaxLabel: string;
  profile: ProfileMatch;
  einordnung: Einordnung;
  /** Short German label of the specification, e.g. "XRechnung 3.0" */
  specLabel: string;
}

export interface Verdict {
  tone: Tone;
  headline: string;
  explanation: string[];
  invoices: InvoiceVerdict[];
  /** Comparison of several invoice XML in one PDF */
  comparison?: { same: boolean; differing: BtId[] };
}

const COMPARED: readonly BtId[] = ['BT-1', 'BT-2', 'BT-5', 'BT-27', 'BT-112'];

function judgeInvoice(part: InvoicePart): InvoiceVerdict {
  const syntax = syntaxById(part.syntax);
  // ZUGFeRD 1.0 is recognised by its namespace; its identifier only refines the label.
  const profile = profileOf(first(part.header, 'BT-24'));
  const einordnung: Einordnung = syntax.en16931 ? profile.einordnung : 'keineERechnung';
  const specLabel = syntax.en16931 ? (profile.entry?.label ?? TEXTS.specUnknown) : syntax.label;
  return { part, syntaxLabel: syntax.label, profile, einordnung, specLabel };
}

function comparable(part: InvoicePart, bt: BtId): string {
  const value = first(part.header, bt) ?? '';
  if (bt === 'BT-2') return isoDate(value) ?? value;
  if (bt === 'BT-27') return value.toLocaleLowerCase('de-DE').replace(/\s+/g, ' ');
  return value;
}

/** Which compared terms differ between the parts (amounts compared as decimals). */
export function differingTerms(parts: readonly InvoicePart[]): BtId[] {
  return COMPARED.filter((bt) => {
    const [head, ...rest] = parts;
    if (!head) return false;
    return rest.some((part) => {
      if (bt === 'BT-112') {
        const a = parseDecimal(first(head.header, bt));
        const b = parseDecimal(first(part.header, bt));
        if (a && b) return !decimalEquals(a, b);
      }
      return comparable(head, bt) !== comparable(part, bt);
    });
  });
}

function problemLine(problem: Problem | undefined): string[] {
  if (!problem) return [];
  return [
    problem.line
      ? fill(TEXTS.problemAtLine, { line: problem.line, message: problem.message })
      : problem.message,
  ];
}

function singleVerdict(analysis: Analysis, invoice: InvoiceVerdict): Verdict {
  const inPdf = analysis.kind === 'pdf';
  const profileName = invoice.profile.entry?.profile ?? invoice.specLabel;
  switch (invoice.einordnung) {
    case 'eRechnung':
      return {
        tone: 'ok',
        headline: fill(TEXTS.eRechnung, { spec: invoice.specLabel }),
        explanation: inPdf
          ? [fill(TEXTS.hybridSource, { name: invoice.part.origin }), TEXTS.xmlCounts]
          : [TEXTS.xmlFile],
        invoices: [invoice],
      };
    case 'keineERechnung':
      return {
        tone: 'bad',
        headline: fill(inPdf ? TEXTS.keineERechnungPdf : TEXTS.keineERechnungXml, {
          profile: profileName,
        }),
        explanation: [
          invoice.part.syntax === 'zugferd1' || invoice.profile.entry?.profile === 'ZUGFeRD 1.0'
            ? TEXTS.zugferd1Reason
            : TEXTS.minimumReason,
        ],
        invoices: [invoice],
      };
    case 'nichtBeurteilt':
      return {
        tone: 'warn',
        headline: TEXTS.nichtBeurteilt,
        explanation: [
          invoice.profile.id
            ? fill(TEXTS.unknownSpec, { id: invoice.profile.id })
            : TEXTS.missingSpec,
          TEXTS.shownAnyway,
        ],
        invoices: [invoice],
      };
  }
}

function fileProblemVerdict(analysis: Analysis): Verdict | undefined {
  const problem = analysis.problem;
  if (!problem) return undefined;
  const text = TEXTS.fileProblems[problem.kind];
  return {
    tone: text.tone,
    headline: text.headline,
    explanation: [...text.explanation, ...problemLine(problem.problems[0])],
    invoices: [],
  };
}

export function verdictOf(analysis: Analysis): Verdict {
  const fileProblem = fileProblemVerdict(analysis);
  if (fileProblem) return fileProblem;

  const invoices = analysis.invoices.map(judgeInvoice);
  const [only] = invoices;
  if (invoices.length === 1 && only) return singleVerdict(analysis, only);

  if (invoices.length > 1) {
    const differing = differingTerms(analysis.invoices);
    const names = analysis.invoices.map((p) => p.origin).join(', ');
    if (differing.length === 0 && only) {
      const base = singleVerdict(analysis, only);
      return {
        ...base,
        tone: base.tone === 'ok' ? 'warn' : base.tone,
        explanation: [
          ...base.explanation,
          fill(TEXTS.sameSeveral, { count: invoices.length, names }),
        ],
        invoices,
        comparison: { same: true, differing },
      };
    }
    return {
      tone: 'warn',
      headline: TEXTS.contradicting,
      explanation: [
        fill(TEXTS.contradictingWhy, { count: invoices.length, names }),
        TEXTS.askSupplier,
      ],
      invoices,
      comparison: { same: false, differing },
    };
  }

  // No invoice XML at all.
  if (analysis.kind === 'xml') {
    return {
      tone: 'warn',
      headline: TEXTS.otherXml,
      explanation: [
        analysis.root
          ? fill(TEXTS.rootIs, {
              name: analysis.root.name,
              namespace: analysis.root.namespace || '–',
            })
          : '',
        TEXTS.otherFormats,
      ].filter((line) => line.length > 0),
      invoices: [],
    };
  }
  const broken = analysis.others.find((o) => o.kind === 'brokenXml' || o.kind === 'doctypeXml');
  if (broken) {
    return {
      tone: 'bad',
      headline: TEXTS.pdfBrokenXml,
      explanation: [
        fill(broken.kind === 'doctypeXml' ? TEXTS.attachmentDoctype : TEXTS.attachmentBroken, {
          name: broken.origin,
        }),
        ...problemLine(broken.problems?.[0]),
        TEXTS.formatError,
      ],
      invoices: [],
    };
  }
  if (analysis.others.length > 0 || (analysis.pdf?.unreadable.length ?? 0) > 0) {
    const names = [...analysis.others.map((o) => o.origin), ...(analysis.pdf?.unreadable ?? [])];
    return {
      tone: 'bad',
      headline: TEXTS.pdfWithoutInvoiceData,
      explanation: [
        fill(TEXTS.attachmentsNoInvoice, { names: names.join(', ') }),
        TEXTS.plainPdfWhy,
      ],
      invoices: [],
    };
  }
  return { tone: 'bad', headline: TEXTS.plainPdf, explanation: [TEXTS.plainPdfWhy], invoices: [] };
}
