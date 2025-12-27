import React from 'react';
import {FaGlobe} from 'react-icons/fa';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import isEqual from 'lodash.isequal';
import Temperature from './temperature.tsx';
import DelayUnits from './delay-units.tsx';

type Props = {
  readonly setup: {
    airTemperature: number;
    isDelayCorrectionOn: boolean;
    delayUnits: string;
  };
  readonly isXs: boolean;
  readonly onChange: (args: any) => void;
};

function Localization({onChange, setup, isXs}: Props) {
  const {airTemperature, isDelayCorrectionOn, delayUnits} = setup;

  return (
    <Nav>
      <NavDropdown
        title={<FaGlobe />}
        drop={isXs ? 'down' : 'up'}
        className="no-caret right-0 icon-menu"
      >
        <div id="localization-dropup">
          <Temperature
            airTemperature={airTemperature}
            isDelayCorrectionOn={isDelayCorrectionOn}
            delayUnits={delayUnits}
            onChange={onChange}
          />

          <DelayUnits delayUnits={delayUnits} onChange={onChange} />
        </div>
      </NavDropdown>
    </Nav>
  );
}

export default React.memo(Localization, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.setup, nextProps.setup) &&
    previousProps.isXs === nextProps.isXs
  );
});
