# is-js-type
[![NPM version](https://badge.fury.io/js/is-js-type.svg)](https://badge.fury.io/js/is-js-type) [![Coverage Status](https://img.shields.io/coveralls/dustinspecker/is-js-type.svg)](https://coveralls.io/r/dustinspecker/is-js-type?branch=main)

[![Code Climate](https://codeclimate.com/github/dustinspecker/is-js-type/badges/gpa.svg)](https://codeclimate.com/github/dustinspecker/is-js-type)

> Is string a JS Type

**Uses [Sindre Sorhus](https://github.com/sindresorhus)' [js-types](https://github.com/sindresorhus/js-types)**

## Install
```
npm install --save is-js-type
```

## Usage
### ES2015
```javascript
import isJsType from 'is-js-type';

isJsType('Array');
// => true

isJsType('Error');
// => true

isJsType('array');
// => false

isJsType('dog');
// => false
```

## LICENSE
MIT © [Dustin Specker](https://github.com/dustinspecker)
