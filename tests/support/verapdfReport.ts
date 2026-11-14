// Reads the XML report of veraPDF (the PDF/A check of the CI, Tobias 2026-11-14 „A ja“) and fails
// unless every expected file was validated and is compliant; names the failed rules per file.
// Run: node tests/support/verapdfReport.ts <report.xml> <number of files>
import { readFileSync } from 'node:fs';

const [reportPath = '', expectedText = '0'] = process.argv.slice(2);
const report = readFileSync(reportPath, 'utf8');
const expected = Number(expectedText);
const attribute = (tag: string, name: string) =>
  new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] ?? '';

const jobs = [...report.matchAll(/<job>([\s\S]*?)<\/job>/g)].map((match) => match[1] ?? '');
let failed = 0;
for (const job of jobs) {
  const name = /<name>([^<]*)<\/name>/.exec(job)?.[1] ?? '(ohne Namen)';
  const validation = /<validationReport\b[^>]*>/.exec(job)?.[0];
  if (validation === undefined) {
    failed += 1;
    console.log(`FEHLER ${name}: nicht geprüft`);
    continue;
  }
  const profile = attribute(validation, 'profileName');
  if (attribute(validation, 'isCompliant') === 'true') {
    console.log(`OK     ${name} (${profile})`);
    continue;
  }
  failed += 1;
  console.log(`FEHLER ${name} (${profile})`);
  for (const rule of job.matchAll(/<rule\b([^>]*)>([\s\S]*?)<\/rule>/g)) {
    const head = rule[1] ?? '';
    if (attribute(head, 'status') !== 'failed') continue;
    const description = /<description>([\s\S]*?)<\/description>/.exec(rule[2] ?? '')?.[1] ?? '';
    console.log(
      `  ${attribute(head, 'specification')} ${attribute(head, 'clause')}-${attribute(head, 'testNumber')} ` +
        `(${attribute(head, 'failedChecks')}×): ${description.trim()}`,
    );
  }
}
if (jobs.length !== expected) {
  console.log(`FEHLER: ${jobs.length} Dateien geprüft, erwartet ${expected}`);
  process.exitCode = 1;
} else if (failed > 0) {
  console.log(`${failed} von ${jobs.length} Dateien sind nicht PDF/A-2u-konform.`);
  process.exitCode = 1;
} else {
  console.log(`Alle ${jobs.length} Dateien sind PDF/A-2u-konform.`);
}
