/**
 * Hook for downloading device backup.
 *
 * Uses the BackupSession state machine to download all 12 memory pages
 * one at a time, waiting for each response before requesting the next.
 */
import type { DcxConnection } from '../transport/types.js';
export type BackupStatus = 'idle' | 'downloading' | 'completed' | 'error';
/**
 * Hook for downloading device backup.
 */
export declare function useDcxBackup(connection: DcxConnection | undefined): {
    status: BackupStatus;
    progress: number;
    dcxData: Uint8Array<ArrayBufferLike> | null;
    error: string | null;
    start: () => Promise<void>;
    reset: () => void;
};
//# sourceMappingURL=use-dcx-backup.d.ts.map