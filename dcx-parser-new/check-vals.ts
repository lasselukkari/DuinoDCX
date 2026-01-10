import * as fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('baseline-raw.json', 'utf8'));
console.log(`Raw Index 55: ${data.part0[55]}`);
console.log(`Raw Index 57: ${data.part0[57]}`);
