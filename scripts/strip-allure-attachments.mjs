// Removes Playwright traces and videos from Allure results before the report is published.
// The repository and the report are public, and a trace records everything typed in the
// browser – including the test user's password on the login page.
// Usage: node scripts/strip-allure-attachments.mjs [allure-results]
import fs from 'node:fs';
import path from 'node:path';

const resultsDir = process.argv[2] ?? 'allure-results';
const BLOCKED_TYPES = ['application/zip', 'video/webm'];
const isBlocked = (attachment) =>
  BLOCKED_TYPES.includes(attachment.type) || /trace/i.test(attachment.name);

let removed = 0;

function stripAttachments(item) {
  if (Array.isArray(item.attachments)) {
    item.attachments = item.attachments.filter((attachment) => {
      if (!isBlocked(attachment)) return true;
      fs.rmSync(path.join(resultsDir, attachment.source), { force: true });
      removed++;
      return false;
    });
  }
  for (const step of item.steps ?? []) stripAttachments(step);
}

if (!fs.existsSync(resultsDir)) {
  console.log(`No ${resultsDir} directory – nothing to strip.`);
  process.exit(0);
}

for (const file of fs.readdirSync(resultsDir)) {
  if (!file.endsWith('-result.json') && !file.endsWith('-container.json')) {
    continue;
  }
  const filePath = path.join(resultsDir, file);
  const result = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  stripAttachments(result);
  for (const fixture of [...(result.befores ?? []), ...(result.afters ?? [])]) {
    stripAttachments(fixture);
  }
  fs.writeFileSync(filePath, JSON.stringify(result));
}

console.log(`Removed ${removed} trace/video attachment(s) from ${resultsDir}.`);
