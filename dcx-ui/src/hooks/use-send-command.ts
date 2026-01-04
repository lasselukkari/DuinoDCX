import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { buildParamChangeCommand, type ParameterTarget } from 'dcx-parser';
import { useDcxConnection } from '../connection/connection-context.js';

/**
 * Hook to provide a sendCommand function that components can use to
 * update device parameters.
 * 
 * Now uses buildParamChangeCommand from dcx-parser instead of manual serialization.
 */
export const useSendCommand = () => {
  const { connection } = useDcxConnection();

  const sendCommand = useCallback(
    async (target: ParameterTarget, value: number | boolean | string) => {
      try {
        const command = buildParamChangeCommand(target, value);
        await connection.send(command);
        // State update will happen when backend echoes the command back via SSE
        // and useDcxState processes it
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
