
import * as fs from 'fs';

const logFile = '../wine_upload_only.log';
const content = fs.readFileSync(logFile, 'utf-8');
const lines = content.split('\n');

interface Packet {
    timestamp: string;
    direction: string;
    length: number;
    data: string[];
    command?: string;
    page?: number;
    type?: string;
}

const packets: Packet[] = [];

for (const line of lines) {
    const match = line.match(/^\[(.*?)\] (APP->DEV|DEV->APP) \[\s*([0-9]+)\] (.*)$/);
    if (match) {
        const timestamp = match[1];
        const direction = match[2];
        const length = parseInt(match[3], 10);
        const hexParts = match[4].trim().split(' ');

        // Parse command details if it's a SysEx message for DCX
        // F0 00 20 32 00 0E [CMD] ...
        let command = '';
        let page = -1;
        let type = '';

        if (hexParts.length > 7 && hexParts[0] === 'F0' && hexParts[1] === '00' && hexParts[2] === '20' && hexParts[3] === '32') {
            const cmdByte = hexParts[6];
            command = cmdByte;

            if (cmdByte === '10') {
                // Check sub-type
                // 10 [TYPE] [TYPE] ...
                // Download response: 10 00 01 00 0C 00 [PAGE]
                // Upload?: 10 01 01 00 02 00 [PAGE] ?

                const byte7 = hexParts[7];
                const byte8 = hexParts[8];
                const byte9 = hexParts[9];
                const byte10 = hexParts[10]; // packet type?
                const byte11 = hexParts[11];

                if (byte7 === '00' && byte10 === '0C') {
                    type = 'DUMP_RESP (Download Format)';
                    if (hexParts[12]) page = parseInt(hexParts[12], 16);
                } else if (byte7 === '01' && byte10 === '02') {
                    type = 'UPLOAD_PACKET? (01 01 00 02)';
                    if (hexParts[12]) page = parseInt(hexParts[12], 16);
                } else {
                    type = `UNKNOWN_10_${byte7}_${byte10}`;
                }
            } else if (cmdByte === '50') {
                type = 'DUMP_REQ';
                // 50 [00/01] [00] [PAGE]
                if (hexParts[7]) {
                    const reqType = hexParts[7];
                    const reqPage = hexParts[9];
                    type += ` Type=${reqType} Page=${reqPage}`;
                }
            } else {
                type = `CMD_${cmdByte}`;
            }
        }

        packets.push({
            timestamp,
            direction,
            length,
            data: hexParts,
            command,
            page,
            type
        });
    }
}

// Print analysis
console.log('Timestamp\tDir\tLen\tCommand\tType\t\tPage');
console.log('-------------------------------------------------------------');
packets.forEach(p => {
    let pageStr = p.page !== -1 ? p.page?.toString() : '';
    console.log(`${p.timestamp}\t${p.direction}\t${p.length}\t${p.command}\t${p.type || ''}\t${pageStr}`);
});

// Check if packets are sequential
console.log('\nSequential Check for DUMP_RESP:');
let lastPage = -1;
packets.filter(p => p.type === 'DUMP_RESP (Download Format)' && p.direction === 'APP->DEV').forEach(p => {
    if (p.page !== undefined) {
        console.log(`Page ${p.page}`);
    }
});
