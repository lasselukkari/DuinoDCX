
dcx-ui [![Build Status](https://travis-ci.com/lasselukkari/dcx-ui.svg?branch=master)](https://travis-ci.org/lasselukkari/dcx-ui)
========
HTML user interface for the [Behringer Ultradrive Pro / DCX2496](https://www.behringer.com/p/P0B6H).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

## Serving the files with Express
```javascript
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static(__dirname + '/node_modules/dcx-ui/dist/'));
app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));
```
