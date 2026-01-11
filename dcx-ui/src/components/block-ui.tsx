import React from 'react';
// Import Spinner from 'react-bootstrap/Spinner';

type Props = {
  readonly isBlocking?: boolean;

  readonly children: React.ReactNode;

  readonly className?: string;
};

function BlockUi({isBlocking, children, className}: Props) {
  if (!isBlocking) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`position-relative ${className ?? ''}`}
      style={{minHeight: '50px'}}
    >
      {children}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={{
          zIndex: 10,
          cursor: 'not-allowed',
        }}
      />
    </div>
  );
}

export default BlockUi;
