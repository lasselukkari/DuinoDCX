const fs = require('fs');
const path = require('path');

const ROOT = '/Users/lasselukkari/Documents/DuinoDCX';
const SOURCE_ENUMS_DIR = path.join(ROOT, 'dcx-parser-new/src/constants/enums');

// Map of Source Enum Filename (without .ts) -> Array of items
const sourceEnums = {};

// Helper to extract array from TS file content
// Supports: export const name = ['a', 'b', ...];
function extractArray(content, varName) {
    // Regex explanation:
    // (?:export\s+)?const\s+VARNAME\s*=\s*\[
    // ([\s\S]*?)
    // \];
    const pattern = new RegExp(`(?:export\\s+)?const\\s+${varName}\\s*=\\s*\\[([\\s\\S]*?)\\];`);
    const match = content.match(pattern);
    if (!match) return null;

    const body = match[1];
    // Split by comma, but handle newlines and cleanup
    const items = body.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
            // Remove quotes ' or "
            return s.replace(/^['"]|['"]$/g, '');
        });
    return items;
}

// 1. Read Source Enums
const enumFiles = fs.readdirSync(SOURCE_ENUMS_DIR);
enumFiles.forEach(file => {
    if (!file.endsWith('.ts')) return;
    const content = fs.readFileSync(path.join(SOURCE_ENUMS_DIR, file), 'utf8');
    const varName = file.replace('.ts', '').replace(/-([a-z])/g, g => g[1].toUpperCase()); // camelCase
    // Special cases mapping if needed (e.g. log-frequency-scale -> logFrequencyScale)
    // Actually the file content defines the variable name. Let's extract variable name from file content?
    // Regex to find "export const NAME = ["
    const varMatch = content.match(/export\s+const\s+(\w+)\s*=\s*\[/);
    if (varMatch) {
        const actualVarName = varMatch[1];
        const arr = extractArray(content, actualVarName);
        if (arr) {
            sourceEnums[actualVarName] = arr;
            console.log(`Loaded Source Enum: ${actualVarName} (${arr.length} items)`);
        }
    }
});

console.log('--- Checking Duplicates ---\n');

// 2. Check dcx-ui/src/dcx2496/constants.ts
const uiConstantsPath = path.join(ROOT, 'dcx-ui/src/dcx2496/constants.ts');
if (fs.existsSync(uiConstantsPath)) {
    console.log(`Checking ${uiConstantsPath}...`);
    const content = fs.readFileSync(uiConstantsPath, 'utf8');

    // Map of UI var name -> Source var name
    const mappings = {
        'logFrequencyScale': 'logFrequencyScale',
        'logZeroTo4000Ms': 'logZeroTo4000Ms',
        'outputNames': 'outputNames',
        'crossoverFilters': 'crossoverFilters',
        'outputSources': 'outputSources',
        'attackTimes': 'attackTimes',
        'equalizerRatios': 'equalizerRatios',
        'inputSumTypes': 'inputSumTypes',
        'inputAbSources': 'inputAbSources',
        'INPUT_C_GAINS': 'inputCGains', // Different name casing
        'OUTPUT_CONFIGS': 'outputConfigs', // Different name casing
        'STEREO_LINK_MODES': 'stereoLinkModes', // Different name casing
        'EQUALIZER_Q_VALUES': 'equalizerQValues' // Different name casing
    };

    for (const [uiVar, sourceVar] of Object.entries(mappings)) {
        const uiArr = extractArray(content, uiVar);
        const sourceArr = sourceEnums[sourceVar];

        if (!uiArr) {
            console.log(`  [SKIP] Could not find array '${uiVar}' in UI constants`);
            continue;
        }
        if (!sourceArr) {
            console.log(`  [SKIP] Could not find source array for '${sourceVar}' `);
            continue;
        }

        compareArrays(sourceArr, uiArr, `UI ${uiVar} vs Source ${sourceVar}`);
    }
}

// 3. Check dcx-parser-new/src/file/manual-preset-mapper.ts
const manualMapperPath = path.join(ROOT, 'dcx-parser-new/src/file/manual-preset-mapper.ts');
if (fs.existsSync(manualMapperPath)) {
    console.log(`\nChecking ${manualMapperPath}...`);
    const content = fs.readFileSync(manualMapperPath, 'utf8');

    const mappings = {
        'FREQUENCIES': 'logFrequencyScale',
        'OUTPUT_CONFIGS': 'outputConfigs',
        'FILTERS': 'crossoverFilters',
        'EQ_TYPES': 'equalizerTypes',
        'POLARITIES': 'polarities',
        'Q_VALUES': 'equalizerQValues',
        'SHELVING_VALUES': 'equalizerShelvingSlopes',
        'SOURCES': 'outputSources'
    };

    for (const [localVar, sourceVar] of Object.entries(mappings)) {
        const localArr = extractArray(content, localVar);
        const sourceArr = sourceEnums[sourceVar];

        if (!localArr) {
            console.log(`  [SKIP] Could not find array '${localVar}' in manual-preset-mapper`);
            continue;
        }
        if (!sourceArr) {
            console.log(`  [SKIP] Could not find source array for '${sourceVar}'`);
            continue;
        }

        compareArrays(sourceArr, localArr, `Mapper ${localVar} vs Source ${sourceVar}`);
    }
}

function compareArrays(source, target, label) {
    if (source.length !== target.length) {
        console.error(`  [FAIL] ${label}: Length mismatch! Source: ${source.length}, Target: ${target.length}`);
        return;
    }

    let diffCount = 0;
    for (let i = 0; i < source.length; i++) {
        if (source[i] !== target[i]) {
            if (diffCount < 5) {
                console.error(`  [FAIL] ${label}: Mismatch at index ${i}. Source: '${source[i]}', Target: '${target[i]}'`);
            }
            diffCount++;
        }
    }

    if (diffCount === 0) {
        console.log(`  [PASS] ${label} - Identical`);
    } else {
        console.error(`  [FAIL] ${label}: Total ${diffCount} mismatches found.`);
    }
}
