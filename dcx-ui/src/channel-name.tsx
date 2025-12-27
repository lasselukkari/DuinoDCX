import React from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import pc from './parameters.tsx';

type Props = {
  readonly group: string;
  readonly channelId: string;
  readonly channelName: string;
  readonly onChange: (args: any) => void;
};

function ChannelName({channelName, channelId, onChange, group}: Props) {
  return (
    <div>
      <FormLabel>
        {channelName ? channelId + '. ' + channelName : channelId}
      </FormLabel>
      <pc.ChannelName
        value={channelName}
        group={group}
        channelId={channelId}
        onChange={onChange}
      />
    </div>
  );
}

export default React.memo(ChannelName);
