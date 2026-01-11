import React, {useState, useEffect} from 'react';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Slider from 'rc-slider';
import {FaPlus, FaMinus} from 'react-icons/fa';
import 'rc-slider/assets/index.css';
import type {ParameterTarget} from 'dcx-parser';
import './NumberParameter.css';
import {useSendCommand} from '@/hooks/useSendCommand.js';

type Props = {
  readonly value: number;
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly name: string;
  readonly target: ParameterTarget;
  readonly formatter?: (value: number, unit?: string) => string;
  readonly hasLabel?: boolean;
  readonly labelFormatter?: (value: number, unit?: string) => string;
};

const defaultFormatter = (v: number | undefined, u?: string) => {
  if (v === undefined || Number.isNaN(v)) {
    return `--- ${u ?? ''}`;
  }

  return `${Math.round(v * 10) / 10} ${u ?? ''}`;
};

const defaultLabelFormatter = (v: number) => v.toString();

export function NumberParameter({
  name,
  unit,
  value: initialValue,
  min,
  max,
  step,
  target,
  hasLabel = false,
  formatter = defaultFormatter,
  labelFormatter = defaultLabelFormatter,
}: Props) {
  const sendCommand = useSendCommand();
  const [value, setValue] = useState(initialValue);
  const [moving, setMoving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [pendingValue, setPendingValue] = useState<number | undefined>(
    undefined,
  );

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
      void sendCommand(target, newValue);
      setMoving(false);
    }
  };

  const handleModalConfirm = () => {
    if (pendingValue !== undefined) {
      void sendCommand(target, pendingValue);
    }

    setShowModal(false);
    setPendingValue(undefined);
    setMoving(false);
  };

  const handleModalCancel = () => {
    setValue(initialValue);
    setShowModal(false);
    setPendingValue(undefined);
    setMoving(false);
  };

  const handleReduction = () => {
    if (value - step >= min) {
      const newValue = value - step;
      void sendCommand(target, newValue);
    }
  };

  const handleAddition = () => {
    if (value + step <= max) {
      const newValue = value + step;
      void sendCommand(target, newValue);
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
    <FormGroup style={{marginBottom: '25px'}}>
      {hasLabel ? (
        <FormLabel style={{marginBottom: '5px', display: 'block'}}>
          {name}
        </FormLabel>
      ) : undefined}

      <div className="number-param-container">
        <div className="min-number">
          <Button variant="secondary" onClick={handleReduction}>
            <FaMinus />
          </Button>
        </div>
        <div className="slider">
          <div className="slider-container">
            <Slider
              value={value}
              styles={{handle: handleStyle}}
              marks={marks}
              max={max}
              min={min}
              step={step}
              onChange={(value_) => {
                handleOnBeforeChange();
                handleOnChange(value_);
              }}
              onChangeComplete={handleOnAfterChange}
            />
          </div>
          <div className="current-value">{formatter(value, unit)}</div>
        </div>
        <div className="max-number">
          <Button variant="secondary" onClick={handleAddition}>
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
            {formatter(pendingValue ?? 0, unit)}.
          </p>
          <p>
            This is {formatter((pendingValue ?? 0) - initialValue, unit)}{' '}
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
