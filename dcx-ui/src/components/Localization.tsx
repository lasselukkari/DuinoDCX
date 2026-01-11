import {memo} from 'react';
import {FaGlobe} from 'react-icons/fa';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import isEqual from 'react-fast-compare';
import {type Setup} from 'dcx-parser';
import Temperature from '@/components/Temperature.tsx';
import DelayUnits from '@/components/DelayUnits.tsx';

type Props = {
  readonly setup: Setup;
  readonly isXs: boolean;
};

function Localization({setup, isXs}: Props) {
  const {
    airTemperature = 20,
    isDelayCorrectionOn = false,
    delayUnits = 'mm',
  } = setup;

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
          />

          <DelayUnits delayUnits={delayUnits} />
        </div>
      </NavDropdown>
    </Nav>
  );
}

export default memo(Localization, (previousProps, nextProps) => {
  return (
    isEqual(previousProps.setup, nextProps.setup) &&
    previousProps.isXs === nextProps.isXs
  );
});
