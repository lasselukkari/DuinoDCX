import {useEffect} from 'react';
import constants from '../dcx2496/constants.js';
import {useDeviceConnection} from '../device-connection-context.js';

type UseDeviceEventsProps = {
  onSearchResponse?: (data: Uint8Array) => void;
  onPingResponse?: (data: Uint8Array) => void;
  onDumpResponse?: (data: Uint8Array) => void;
  onPageDumpResponse?: (data: Uint8Array) => void; // For backup page dumps
  onDirectCommand?: (data: Uint8Array) => void;
  onAckResponse?: (data: Uint8Array) => void;
  onOtherResponse?: (data: Uint8Array) => void;
};

/**
 * Checks if a message is a page dump response (for backup).
 * Page dump format: F0 00 20 32 <DevID> 0E 10 00 01 00 0C 00 <Slot> ...
 * The distinguishing bytes are at indices 7-11: 00 01 00 0C 00
 * NOTE: 0x0C (12) is the correct value per captured traffic, not 0x0D (13)
 */
function isPageDumpResponse(data: Uint8Array): boolean {
  if (data.length < 13) return false;
  return (
    data[7] === 0x00 &&
    data[8] === 0x01 &&
    data[9] === 0x00 &&
    data[10] === 0x0c &&
    data[11] === 0x00
  );
}

export function useDeviceEvents({
  onSearchResponse,
  onPingResponse,
  onDumpResponse,
  onPageDumpResponse,
  onDirectCommand,
  onAckResponse,
  onOtherResponse,
}: UseDeviceEventsProps) {
  const {clientId, addListener, removeListener} = useDeviceConnection();

  useEffect(() => {
    // Wrapper for page dump responses - filters dump responses for page dumps
    const pageDumpHandler = onPageDumpResponse
      ? (data: Uint8Array) => {
          if (isPageDumpResponse(data)) {
            onPageDumpResponse(data);
          }
        }
      : undefined;

    // Register listeners
    if (onSearchResponse)
      addListener(constants.SEARCH_RESPONSE, onSearchResponse);
    if (onPingResponse) addListener(constants.PING_RESPONSE, onPingResponse);
    if (onDumpResponse) addListener(constants.DUMP_RESPONSE, onDumpResponse);
    if (pageDumpHandler) addListener(constants.DUMP_RESPONSE, pageDumpHandler);
    if (onDirectCommand) addListener(constants.DIRECT_COMMAND, onDirectCommand);
    if (onAckResponse) addListener(0x52, onAckResponse);
    if (onOtherResponse) addListener(0x50, onOtherResponse);

    return () => {
      // Unregister listeners
      if (onSearchResponse)
        removeListener(constants.SEARCH_RESPONSE, onSearchResponse);
      if (onPingResponse)
        removeListener(constants.PING_RESPONSE, onPingResponse);
      if (onDumpResponse)
        removeListener(constants.DUMP_RESPONSE, onDumpResponse);
      if (pageDumpHandler)
        removeListener(constants.DUMP_RESPONSE, pageDumpHandler);
      if (onDirectCommand)
        removeListener(constants.DIRECT_COMMAND, onDirectCommand);
      if (onAckResponse) removeListener(0x52, onAckResponse);
      if (onOtherResponse) removeListener(0x50, onOtherResponse);
    };
  }, [
    addListener,
    removeListener,
    onSearchResponse,
    onPingResponse,
    onDumpResponse,
    onPageDumpResponse,
    onDirectCommand,
    onAckResponse,
    onOtherResponse,
  ]);

  return clientId;
}
