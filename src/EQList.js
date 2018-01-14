import React, {Component} from 'react';
import {
  FormGroup,
  ControlLabel,
  FormControl,
  Row,
  Col
} from 'react-bootstrap';
import isEqual from 'lodash.isequal';
import pc from './parameters';
import EQ from './EQ';

class EQs extends Component {
  constructor(props) {
    super(props);
    this.state = {selected: '1'};
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {channel} = this.props;
    const {selected} = this.state;
    return (
      !isEqual(channel, nextProps.channel) || selected !== nextState.selected
    );
  }

  handleEQChange = e => this.setState({selected: e.target.value}); // eslint-disable-line no-undef

  render() {
    const {channel, group, channelId, onChange} = this.props;
    const {selected} = this.state;
    const {eqs, eQ} = channel;
    const eqsKeys = Object.keys(eqs).sort();
    const activeEQs = [];
    let activeFound = false;
    let inUse = 0;

    for (let i = eqsKeys.length - 1; i >= 0; i--) {
      const gain = eqs[eqsKeys[i]].eQGain;
      if (!activeFound && gain && gain !== 0) {
        if (eqs[eqsKeys[i + 1]]) {
          activeEQs.push(eqsKeys[i + 1]);
        }
        activeFound = true;
      }

      if (activeFound) {
        inUse++;
        activeEQs.unshift(eqsKeys[i]);
      }
    }

    if (!activeFound) {
      activeEQs.push(eqsKeys[0]);
    }

    return (
      <div>
        <Row>
          <Col xs={12} sm={6}>
            <pc.EQ
              value={eQ}
              group={group}
              channelId={channelId}
              onChange={onChange}
              includeLabel
            />
          </Col>
          <Col xs={12} sm={6}>
            <FormGroup controlId="formControlsSelect" bsSize="small">
              <ControlLabel>
                Selected eq (
                {inUse}
                {' '}
active)
              </ControlLabel>
              <FormControl
                componentClass="select"
                placeholder="select"
                value={selected}
                onChange={this.handleEQChange}
              >
                {activeEQs.map(eq => (
                  <option key={group + channelId + eq}>
                    {eq}
                  </option>
                ))}
              </FormControl>
            </FormGroup>
          </Col>
        </Row>
        <EQ
          onChange={onChange}
          group={group}
          eq={eqs[selected]}
          id={selected}
          channelId={channelId}
        />
      </div>
    );
  }
}

export default EQs;
