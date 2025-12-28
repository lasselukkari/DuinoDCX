import {useCallback} from 'react';
import {toast} from 'react-toastify';
import cloneDeep from 'lodash.clonedeep';
import Parser from '../dcx2496/parser.ts';
import {useDeviceState} from '../device-state-context.tsx';

/**
 * Hook to provide a sendCommand function that components can use to
 * update device parameters without prop drilling onChange.
 */
export const useSendCommand = () => {
  const {device, selected} = useDeviceState();

  const sendCommand = useCallback(
    async (commands: unknown) => {
      if (selected === undefined || !device) {
        console.warn('Cannot send command: device or selected ID missing');
        return;
      }

      // Serialize the command using CLONED device state to avoid mutation
      const data = Parser.serializeCommands(
        selected,
        cloneDeep(device),
        commands,
      );

      try {
        const blob = new Blob([data as any]);

        await fetch(`/api/commands`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {'Content-Type': 'application/binary'},
          body: blob,
        });
        // State update will happen when backend echoes the command back via SSE
        // and App.tsx processes it via onDirectCommand
      } catch (error) {
        console.error('Failed to send command:', error);
        toast.error(`Failed to update settings.`, {
          position: 'bottom-left',
          toastId: 'failed-command',
          autoClose: 5000,
        });
      }
    },
    [device, selected],
  );

  return sendCommand;
};
