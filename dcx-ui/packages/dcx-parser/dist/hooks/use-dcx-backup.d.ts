/**
 * Hook for downloading device backup.
 *
 * Downloads all 12 memory pages and assembles them into a .dcx file.
 */
import type { DcxConnection } from '../transport/types.js';
export type BackupStatus = 'idle' | 'downloading' | 'completed' | 'error';
/**
 * Hook for downloading device backup.
 */
export declare function useDcxBackup(connection: DcxConnection | null): {
    status: BackupStatus;
    progress: number;
    dcxData: Uint8Array<ArrayBufferLike> | null;
    error: string | null;
    start: () => Promise<void>;
    reset: () => void;
};
//# sourceMappingURL=use-dcx-backup.d.ts.map