import * as fs from 'node:fs';
import * as path from 'node:path';
function main() {
    // Load calibration binary (LE mode)
    const data = fs.readFileSync(path.join(process.cwd(), 'test-data/verification/preset_00_calibration.bin'));
    const inputAStart = 121; // Known start of Input A
    console.log(`Scanning for EQ1 match (Freq=180, Q=20, Gain=150)...`);
    console.log(`Input A Start: ${inputAStart}`);
    // Sweep prefix sizes from 30 to 50
    for (let prefix = 30; prefix <= 50; prefix++) {
        const eqStart = inputAStart + prefix;
        // Read 10 bytes for EQ1
        if (eqStart + 10 > data.length)
            continue;
        const freq = data[eqStart] | (data[eqStart + 1] << 8);
        const q = data[eqStart + 2] | (data[eqStart + 3] << 8);
        const gain = data[eqStart + 4] | (data[eqStart + 5] << 8);
        const type = data[eqStart + 6] | (data[eqStart + 7] << 8);
        const shelf = data[eqStart + 8] | (data[eqStart + 9] << 8);
        // Exact match required
        if (freq === 180 && q === 20 && gain === 150) {
            console.log(`\nMATCH FOUND!`);
            console.log(`Prefix: ${prefix} bytes`);
            console.log(`EQ1 Start: ${eqStart}`);
            console.log(`Values: Freq=${freq}, Q=${q}, Gain=${gain}, Type=${type}, Shelf=${shelf}`);
            // Check stride with 8 vs 9 bands
            const end8 = prefix + 8 * 10;
            const end9 = prefix + 9 * 10;
            console.log(`Total size with 8 bands: ${end8} bytes`);
            console.log(`Total size with 9 bands: ${end9} bytes`);
            console.log(`Target stride: 124 bytes`);
            if (end8 === 124)
                console.log(`-> FITS PERFECTLY with 8 bands`);
            if (end9 === 124)
                console.log(`-> FITS PERFECTLY with 9 bands`);
        }
    }
}
main();
//# sourceMappingURL=find-structure.js.map