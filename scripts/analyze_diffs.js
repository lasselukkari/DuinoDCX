const fs = require('fs');
const path = require('path');

const ROOT = '/Users/lasselukkari/Documents/DuinoDCX';

function extractArray(content, varName) {
    const pattern = new RegExp(`(?:export\\s+)?const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
    const match = content.match(pattern);
    if (!match) return null;
    return match[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(s => s);
}

const sourceFile = path.join(ROOT, 'dcx-parser-new/src/constants/enums/log-frequency-scale.ts');
const targetFile = path.join(ROOT, 'dcx-parser-new/src/file/manual-preset-mapper.ts');

const sourceContent = fs.readFileSync(sourceFile, 'utf8');
const targetContent = fs.readFileSync(targetFile, 'utf8');

const sourceArr = extractArray(sourceContent, 'logFrequencyScale');
const targetArr = extractArray(targetContent, 'FREQUENCIES');

console.log(`Source Length: ${sourceArr.length}`);
console.log(`Target Length: ${targetArr.length}`);

// Find missing in Source (present in Target)
const missingInSource = targetArr.filter(x => !sourceArr.includes(x));
if (missingInSource.length > 0) {
    console.log('\nValues present in Mapper but MISSING in Source:');
    console.log(missingInSource);
}

// Find missing in Target (present in Source)
const missingInTarget = sourceArr.filter(x => !targetArr.includes(x));
if (missingInTarget.length > 0) {
    console.log('\nValues present in Source but MISSING in Mapper:');
    console.log(missingInTarget);
}
