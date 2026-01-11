import { setupCommands, inputOutputCommands, outputCommands, equalizerCommands, } from '../commands/commands.js';
// ============================================================================
// Constants
// ============================================================================
const INPUT_IDS = ['A', 'B', 'C', 'Sum'];
const OUTPUT_IDS = ['1', '2', '3', '4', '5', '6'];
const EQUALIZER_BANDS = 9;
// Base parameter numbers for each command array
const SETUP_BASE = 0x02;
const INPUT_OUTPUT_BASE = 0x02;
const EQUALIZER_BASE = 0x13;
const OUTPUT_ONLY_BASE = 0x40;
// ============================================================================
// Helpers
// ============================================================================
function toCamelCase(name) {
    return name
        .replaceAll(/\s(.)/g, (match) => match.toUpperCase())
        .replaceAll(/\s/g, '')
        .replace(/^(.)/, (match) => match.toLowerCase());
}
function makeDirectKey(channel, parameter) {
    return `${channel}:${parameter}`;
}
// ============================================================================
// Build Lookup Tables
// ============================================================================
function buildDirectLookup() {
    const lookup = new Map();
    // Wire protocol channels (Standard DCX2496):
    // Channel 0 = Setup
    // Channel 1-3 = Inputs (A, B, C)
    // Channel 4 = Input Sum
    // Channel 5-10 = Outputs (1-6)
    // 1. Setup Parameters (Channel 0)
    // Param number = SETUP_BASE + index (with undefineds filling gaps)
    for (const [i, cmd] of setupCommands.entries()) {
        if (cmd === undefined)
            continue;
        const parameterNumber = SETUP_BASE + i;
        const def = {
            ...cmd,
            key: toCamelCase(cmd.name),
            target: { kind: 'setup' },
        };
        lookup.set(makeDirectKey(0, parameterNumber), def);
    }
    // 2. Channel Parameters (Inputs 1-4, Outputs 5-10)
    for (let ch = 1; ch <= 10; ch++) {
        // Determine Group and ID based on Standard Mapping
        let group;
        let channelId;
        if (ch <= 3) {
            // 1..3 -> A..C
            group = 'inputs';
            channelId = INPUT_IDS[ch - 1]; // Index 0..2 -> A..C
        }
        else if (ch === 4) {
            // 4 -> Sum
            group = 'inputs';
            channelId = 'Sum';
        }
        else {
            // 5..10 -> Out 1..6
            group = 'outputs';
            channelId = OUTPUT_IDS[ch - 5]; // Index 0..5 -> 1..6
        }
        // Channel params: INPUT_OUTPUT_BASE + index
        for (const [i, cmd] of inputOutputCommands.entries()) {
            const parameterNumber = INPUT_OUTPUT_BASE + i;
            const def = {
                ...cmd,
                key: toCamelCase(cmd.name),
                target: { kind: 'channel', group, id: channelId },
            };
            lookup.set(makeDirectKey(ch, parameterNumber), def);
        }
        // 3. EQ Parameters (Same channels)
        // Param number = EQUALIZER_BASE + cmdIndex + band*5
        for (let band = 0; band < EQUALIZER_BANDS; band++) {
            for (const [i, cmd] of equalizerCommands.entries()) {
                const parameterNumber = EQUALIZER_BASE + i + band * 5;
                const def = {
                    ...cmd,
                    key: toCamelCase(cmd.name),
                    target: {
                        kind: 'equalizer',
                        group,
                        channelId,
                        band: band + 1,
                        channelIdProp: channelId,
                    },
                };
                lookup.set(makeDirectKey(ch, parameterNumber), def);
            }
        }
        // Output-only params: OUTPUT_ONLY_BASE + index
        if (group === 'outputs') {
            for (const [i, cmd] of outputCommands.entries()) {
                const parameterNumber = OUTPUT_ONLY_BASE + i;
                const def = {
                    ...cmd,
                    key: toCamelCase(cmd.name),
                    target: { kind: 'channel', group: 'outputs', id: channelId },
                };
                lookup.set(makeDirectKey(ch, parameterNumber), def);
            }
        }
    }
    return lookup;
}
// ============================================================================
// Pre-built Lookup Tables (singleton)
// ============================================================================
/** O(1) lookup by (channel, param) for direct commands */
export const directLookup = buildDirectLookup();
// ============================================================================
// Lookup Functions
// ============================================================================
export function getParameterByDirect(channel, parameter) {
    return directLookup.get(makeDirectKey(channel, parameter));
}
/**
 * Convert raw value to actual value using command definition.
 * This is the old UI's reverseCommandData pattern.
 */
export function convertValue(def, raw) {
    if (def.type === 'bool') {
        return raw !== 0;
    }
    if (def.type === 'enum' && def.values) {
        return def.values[raw] ?? String(raw);
    }
    if (def.type === 'number') {
        const min = def.min ?? 0;
        const step = def.step ?? 1;
        const value = min + step * raw;
        return Math.round(value * 100) / 100;
    }
    return raw;
}
/**
 * Convert actual value to raw value using command definition.
 * This is the old UI's getCommandData pattern.
 */
export function toRawValue(def, value) {
    if (def.type === 'bool') {
        return value === true || value === 'true' || value === 1 ? 1 : 0;
    }
    if (def.type === 'enum' && def.values) {
        if (typeof value === 'number')
            return value;
        const index = def.values.indexOf(value);
        return Math.max(index, 0);
    }
    if (def.type === 'number') {
        const min = def.min ?? 0;
        const step = def.step ?? 1;
        return Math.round((value - min) / step);
    }
    return value;
}
/**
 * Apply a value to the correct location in state.
 */
export function applyToState(state, def, value) {
    const { target, key } = def;
    switch (target.kind) {
        case 'setup': {
            state.setup[key] = value;
            break;
        }
        case 'channel': {
            state[target.group][target.id][key] = value;
            break;
        }
        case 'equalizer': {
            const group = state[target.group];
            const channel = group[target.channelId];
            const bandKey = String(target.band);
            channel.equalizers ||= {};
            channel.equalizers[bandKey][key] = value;
            break;
        }
    }
}
//# sourceMappingURL=param-lookup.js.map