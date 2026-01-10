const fs = require('fs');
const path = require('path');

const ROOT = '/Users/lasselukkari/Documents/DuinoDCX';
const SOURCE_FILE = path.join(ROOT, 'constants.js');
const DEST_DIR = path.join(ROOT, 'dcx-parser-new/src/constants/enums');

// Mapping from JS constant name to TS filename (kebab-case) and variable name (camelCase)
const MAPPING = {
    'LOG_FREQUENCY_SCALE': { file: 'log-frequency-scale.ts', var: 'logFrequencyScale' },
    'LOG_ZERO_TO_4000_MS': { file: 'log-zero-to-4000-ms.ts', var: 'logZeroTo4000Ms' },
    'OUTPUT_NAMES': { file: 'output-names.ts', var: 'outputNames' },
    'CROSSOVER_FILTERS': { file: 'crossover-filters.ts', var: 'crossoverFilters' },
    'OUTPUT_SOURCES': { file: 'output-sources.ts', var: 'outputSources' },
    'INPUT_AB_SOURCES': { file: 'input-ab-sources.ts', var: 'inputAbSources' },
    'ATTACK_TIMES': { file: 'attack-times.ts', var: 'attackTimes' },
    'EQ_RATIOS': { file: 'equalizer-ratios.ts', var: 'equalizerRatios' },
    'INPUT_SUM_TYPES': { file: 'input-sum-types.ts', var: 'inputSumTypes' },
    'INPUT_C_GAINS': { file: 'input-c-gains.ts', var: 'inputCGains' },
    'OUTPUT_CONFIGS': { file: 'output-configs.ts', var: 'outputConfigs' },
    'STEREO_LINK_MODES': { file: 'stereo-link-modes.ts', var: 'stereoLinkModes' },
    'EQ_Q_VALUES': { file: 'equalizer-q-values.ts', var: 'equalizerQValues' },
    'EQ_TYPES': { file: 'equalizer-types.ts', var: 'equalizerTypes' },
    'EQ_SHELVING_SLOPES': { file: 'equalizer-shelving-slopes.ts', var: 'equalizerShelvingSlopes' },
    'DELAY_UNITS': { file: 'delay-units.ts', var: 'delayUnits' },
    'POLARITIES': { file: 'polarities.ts', var: 'polarities' },
    'INPUTS': { file: 'inputs.ts', var: 'inputs' },
    'OUTPUTS': { file: 'outputs.ts', var: 'outputs' },
    'CHANNELS': { file: 'channels.ts', var: 'channels' },
    'CHANNEL_LEVELS': { file: 'channel-levels.ts', var: 'channelLevels' }
};

// Start reading constants.js
const content = fs.readFileSync(SOURCE_FILE, 'utf8');

// Helper to extract arrays. 
// Uses a simple state machine or eval (dangerous but ok for local verified file)
// Since the file is simple JS, let's try to 'require' it directly if possible?
// 'constants.js' uses `module.exports`, so we can just require it in Node!
const constants = require(SOURCE_FILE);

console.log('Loaded constants.js');

for (const [key, config] of Object.entries(MAPPING)) {
    const val = constants[key];
    if (!val) {
        console.error(`[WARN] Key ${key} not found in constants.js`);
        continue;
    }

    const destPath = path.join(DEST_DIR, config.file);
    const tsContent = `export const ${config.var} = ${JSON.stringify(val, null, 4).replace(/"/g, "'")};\n`;

    // Note: JSON.stringify wraps strings in double quotes. 
    // We replace to single quotes to match existing style if desired, though optional.
    // Also "undefined" in JSON is lost (becomes null or removed). constant.js has `undefined` in CHANNEL_LEVELS.
    // We need to handle `undefined` specifically if it exists.

    let stringified = JSON.stringify(val, null, 4);

    // Fix undefined in array (JSON.stringify converts undefined to null in arrays)
    if (key === 'CHANNEL_LEVELS') {
        // [undefined, -40...] -> [null, -40...] in JSON
        // We want `undefined`.
        // Better to manually generate string for simple arrays?
        stringified = "[\n    undefined,\n    " + val.slice(1).join(',\n    ') + "\n]";
    } else {
        stringified = stringified.replace(/"/g, "'");
    }

    const finalContent = `export const ${config.var} = ${stringified};\n`;

    fs.writeFileSync(destPath, finalContent);
    console.log(`Updated ${config.file} (${val.length} items)`);
}

console.log('Extraction complete.');
