import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

type Props = {
  readonly blocking?: boolean;

  readonly children: React.ReactNode;

  readonly className?: string;
};

function BlockUi({blocking, children, className}: Props) {
  if (!blocking) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`position-relative ${className || ''}`}
      style={{minHeight: '50px'}}
    >
      {children}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          zIndex: 10,
          cursor: 'wait',
        }}
      >
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    </div>
  );
}

export default BlockUi;
