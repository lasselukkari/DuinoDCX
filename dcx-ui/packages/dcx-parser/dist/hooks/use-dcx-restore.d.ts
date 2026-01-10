/**
 * Hook for restoring .dcx file to device.
 *
 * Wraps the RestoreSession class for React usage.
 */
import type {DcxConnection} from '../transport/types.js';

export type RestoreStatus =
  | 'idle'
  | 'initializing'
  | 'transferring'
  | 'completed'
  | 'error';
/**
 * Hook for restoring .dcx file to device.
 */
export declare function useDcxRestore(connection: DcxConnection | undefined): {
  status: RestoreStatus;
  progress: number;
  error: string;
  start: (dcxData: Uint8Array) => Promise<void>;
  reset: () => void;
};
// # sourceMappingURL=use-dcx-restore.d.ts.map
