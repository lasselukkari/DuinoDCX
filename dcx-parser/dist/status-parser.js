export function parseStatus(data) {
    const inputs = [];
    const inputNames = ['A', 'B', 'C'];
    for (const [i, inputName] of inputNames.entries()) {
        const byteIndex = i + 8;
        if (byteIndex < data.length) {
            const value = data[byteIndex];
            const level = value & ~0x20;
            const isLimited = (value & 0x20) !== 0;
            inputs.push({ name: inputName, level, isLimited });
        }
    }
    const outputs = [];
    for (let i = 0; i < 6; i++) {
        const byteIndex = i + 11;
        if (byteIndex < data.length) {
            const value = data[byteIndex];
            const level = value & ~0x20;
            const isLimited = (value & 0x20) !== 0;
            outputs.push({ name: String(i + 1), level, isLimited });
        }
    }
    let free = 0;
    if (data.length > 21) {
        free = data[21];
    }
    return {
        inputs,
        outputs,
        free,
    };
}
//# sourceMappingURL=status-parser.js.map