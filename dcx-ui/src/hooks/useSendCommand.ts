import {useCallback} from 'react';
import {toast} from 'react-toastify';
import {buildParameterChangeCommand, type ParameterTarget} from 'dcx-parser';
import {useDcxConnection} from '@/connection/connectionContext.js';

/**
 * A batch command with target and value bundled together.
 */
export type BatchCommand = {
  target: ParameterTarget;
  value: number | boolean | string;
};

/**
 * Hook to provide a sendCommand function that components can use to
 * update device parameters.
 *
 * Overloads:
 * - sendCommand(target, value) - single parameter change
 * - sendCommand(batchCommands) - multiple parameter changes
 */
export const useSendCommand = () => {
  const {connection} = useDcxConnection();

  const sendCommand = useCallback(
    async (
      targetOrBatch: ParameterTarget | BatchCommand[],
      value?: number | boolean | string,
    ) => {
      try {
        // Batch mode: array of {target, value} objects
        if (Array.isArray(targetOrBatch)) {
          for (const cmd of targetOrBatch) {
            const command = buildParameterChangeCommand(cmd.target, cmd.value);
            if (command) {
              // Serial communication requires sequential requests to avoid flooding
              // eslint-disable-next-line no-await-in-loop
              await connection.send(command);
            }
          }
        } else {
          // Single mode: target + value as separate arguments
          const command = buildParameterChangeCommand(targetOrBatch, value!);
          if (command) {
            await connection.send(command);
          }
        }
      } catch (error) {
        console.error('Failed to send command:', error);
        toast.error(`Failed to update settings.`, {
          position: 'bottom-left',
          toastId: 'failed-command',
          autoClose: 5000,
        });
      }
    },
    [connection],
  );

  return sendCommand;
};
