import React from 'react';
import ReactBreakpoints from 'react-breakpoints';
import ReactDOM from 'react-dom';
import App from './App';

const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200
};

ReactDOM.render(
  <ReactBreakpoints breakpoints={breakpoints}>
    <App />
  </ReactBreakpoints>,
  document.querySelector('#root')
);
