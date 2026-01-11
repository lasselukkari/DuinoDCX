import React from 'react';
import {type TooltipProps} from 'recharts';
import {
  type NameType,
  type ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

type Entry = {
  readonly name: string;
  readonly value: number;
  readonly unit?: string;
  readonly color?: string;
  readonly dataKey?: string;
};

type Props = {
  readonly filter?: (entry: Entry) => boolean;
  readonly payload?: any[];
  readonly label?: any;
} & TooltipProps<ValueType, NameType>;

function PlotTooltip({payload, label, filter}: Props) {
  const renderContent = () => {
    if (payload && payload.length > 0) {
      const items = payload
        .filter((entry: Entry) => (filter ? filter(entry) : true))
        .map((entry: Entry) => {
          return (
            <li
              key={`tooltip-item-${entry.dataKey}`}
              className="recharts-tooltip-item"
              style={{
                display: 'block',
                paddingTop: 4,
                paddingBottom: 4,
                color: entry.color ?? '#000',
              }}
            >
              <span className="recharts-tooltip-item-name">{entry.name}</span>
              <span className="recharts-tooltip-item-separator">: </span>
              <span className="recharts-tooltip-item-value">
                {typeof entry.value === 'number'
                  ? entry.value.toFixed(2)
                  : entry.value}
              </span>
              <span className="recharts-tooltip-item-unit"> {entry.unit}</span>
            </li>
          );
        });

      return (
        <ul
          className="recharts-tooltip-item-list"
          style={{padding: 0, margin: 0}}
        >
          {items}
        </ul>
      );
    }

    return undefined;
  };

  return (
    <div
      className="recharts-default-tooltip"
      style={{
        margin: 0,
        padding: 10,
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        whiteSpace: 'nowrap',
      }}
    >
      <p className="recharts-tooltip-label" style={{margin: 0}}>
        {typeof label === 'number' ? `${Math.floor(label)} Hz` : label}
      </p>
      {renderContent()}
    </div>
  );
}

export default React.memo(PlotTooltip);
