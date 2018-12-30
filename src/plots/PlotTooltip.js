import React, {PureComponent} from 'react';

class DefaultTooltipContent extends PureComponent {
  renderContent() {
    const {payload, filter = () => true} = this.props;

    if (payload && payload.length > 0) {
      const items = payload.filter(filter).map(entry => {
        return (
          <li
            key={`tooltip-item-${entry.dataKey}`}
            className="recharts-tooltip-item"
            style={{
              display: 'block',
              paddingTop: 4,
              paddingBottom: 4,
              color: entry.color || '#000'
            }}
          >
            <span className="recharts-tooltip-item-name">{entry.name}</span>
            <span className="recharts-tooltip-item-separator">: </span>
            <span className="recharts-tooltip-item-value">{entry.value}</span>
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

    return null;
  }

  render() {
    const {label} = this.props;

    return (
      <div
        className="recharts-default-tooltip"
        style={{
          margin: 0,
          padding: 10,
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          whiteSpace: 'nowrap'
        }}
      >
        <p className="recharts-tooltip-label" style={{margin: 0}}>
          {Math.floor(label)} Hz
        </p>
        {this.renderContent()}
      </div>
    );
  }
}

export default DefaultTooltipContent;
