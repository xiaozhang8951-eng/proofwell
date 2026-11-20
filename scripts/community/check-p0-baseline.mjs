import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const baseline = JSON.parse(fs.readFileSync(new URL('./p0-baseline.json', import.meta.url), 'utf8'));
for (const [file, expected] of Object.entries(baseline)) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), expected, `Protected P0/editorial source changed: ${file}`);
}
console.log(`${Object.keys(baseline).length} protected P0, editorial, Google and configuration files match the pre-P1 baseline.`);
