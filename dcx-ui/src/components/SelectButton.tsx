import {memo} from 'react';
import Button from 'react-bootstrap/Button';

type Props = {
  readonly onToggle: (args: any) => void;
  readonly group: string;
  readonly channelId: string;
  readonly name: string;
  readonly isSelected: boolean;
  readonly index: number;
};

function SelectButton({
  onToggle,
  group,
  channelId,
  name,
  isSelected,
  index,
}: Props) {
  const muteStyle: React.CSSProperties = {
    float: 'left',
    margin: '1px',
    width: '36px',
    height: '36px',
    padding: '0px',
  };

  return (
    <Button
      className="responsive-rotate-90"
      variant={isSelected ? 'info' : 'primary'}
      style={muteStyle}
      onClick={() => {
        onToggle({group, channelId, isSelected, index});
      }}
    >
      {name}
    </Button>
  );
}

export default memo(SelectButton);
