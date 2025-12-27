import React, {useState, useEffect} from 'react';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Slider from 'rc-slider';
import {FaPlus, FaMinus} from 'react-icons/fa';
import './NumberParameter.css';
import 'rc-slider/assets/index.css';

type Props = {
  readonly value: number;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly param: string;
  readonly name: string;
  readonly onChange: (args: {
    param: string;
    group?: string;
    channelId?: string;
    eq?: string;
    value: number;
  }) => void;
  readonly formatter?: (value: number, unit?: string) => string;
  readonly group?: string;
  readonly channelId?: string;
  readonly eq?: string;
  readonly hasLabel?: boolean;
  readonly labelFormatter?: (value: number, unit?: string) => string;
};

export function NumberParameter({
  name,
  unit,
  value: initialValue,
  min,
  max,
  step,
  hasLabel = false,
  param,
  group,
  channelId,
  eq,
  onChange,
  formatter = (v, u) => `${Math.round(v * 10) / 10} ${u ? u : ''}`,
  labelFormatter = (v) => v.toString(),
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [moving, setMoving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | undefined>(null);

  // Sync state with props if not moving
  useEffect(() => {
    if (!moving) {
      setValue(initialValue);
    }
  }, [initialValue, moving]);

  const handleOnBeforeChange = () => {
    setMoving(true);
  };

  const handleOnChange = (value_: number | number[]) => {
    const numericValue = Array.isArray(value_) ? value_[0] : value_;
    setValue(numericValue);
  };

  const handleOnAfterChange = (newValue: number | number[]) => {
    const numericValue = Array.isArray(newValue) ? newValue[0] : newValue;
    confirmChange(numericValue);
  };

  const confirmChange = (newValue: number) => {
    if (newValue.toFixed(3) === initialValue.toFixed(3)) {
      setMoving(false);
      return;
    }

    if (newValue > initialValue) {
      setPendingValue(newValue);
      setShowModal(true);
    } else {
      onChange({param, group, channelId, eq, value: newValue});
      setMoving(false);
    }
  };

  const handleModalConfirm = () => {
    if (pendingValue !== null) {
      onChange({param, group, channelId, eq, value: pendingValue});
    }

    setShowModal(false);
    setPendingValue(null);
    setMoving(false);
  };

  const handleModalCancel = () => {
    setValue(initialValue);
    setShowModal(false);
    setPendingValue(null);
    setMoving(false);
  };

  const handleReduction = () => {
    if (value - step >= min) {
      const newValue = value - step;
      // For buttons, we update immediately (no confirm?) Or same logic?
      // Original code did NOT confirm for buttons: onChange(...) directly.
      onChange({param, group, channelId, eq, value: newValue});
    }
  };

  const handleAddition = () => {
    if (value + step <= max) {
      const newValue = value + step;
      onChange({param, group, channelId, eq, value: newValue});
    }
  };

  const marks = {
    [min.toString()]: {
      style: {marginTop: '3px'},
      label: labelFormatter(min, unit),
    },
    [max.toString()]: {
      style: {marginTop: '3px'},
      label: labelFormatter(max, unit),
    },
  };

  const handleStyle = {
    height: 30,
    width: 30,
    marginTop: -15,
  };

  return (
    <FormGroup>
      {hasLabel ? (
        <FormLabel>
          {name}
          <br />
        </FormLabel>
      ) : null}

      <div className="number-param-container">
        <div className="min-number">
          <Button onClick={handleReduction}>
            <FaMinus />
          </Button>
        </div>
        <div className="slider">
          <div className="slider-container">
            <Slider
              value={value}
              handleStyle={handleStyle}
              marks={marks}
              max={max}
              min={min}
              step={step}
              onChange={handleOnChange}
              onBeforeChange={handleOnBeforeChange}
              onAfterChange={handleOnAfterChange}
            />
          </div>
          <div className="current-value">{formatter(value, unit)}</div>
        </div>
        <div className="max-number">
          <Button onClick={handleAddition}>
            <FaPlus />
          </Button>
        </div>
      </div>

      <Modal show={showModal} onHide={handleModalCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm change</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{textAlign: 'center'}}>
          <p>
            You are about to change {name.toLowerCase()} from{' '}
            {formatter(initialValue, unit)} to{' '}
            {formatter(pendingValue || 0, unit)}.
          </p>
          <p>
            This is {formatter((pendingValue || 0) - initialValue, unit)}{' '}
            increase. Are you sure?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleModalConfirm}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </FormGroup>
  );
}

export default React.memo(NumberParameter);
