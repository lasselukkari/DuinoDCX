# is-get-set-prop
[![NPM version](https://badge.fury.io/js/is-get-set-prop.svg)](https://badge.fury.io/js/is-get-set-prop) [![Coverage Status](https://img.shields.io/coveralls/dustinspecker/is-get-set-prop.svg)](https://coveralls.io/r/dustinspecker/is-get-set-prop?branch=main)

[![Code Climate](https://codeclimate.com/github/dustinspecker/is-get-set-prop/badges/gpa.svg)](https://codeclimate.com/github/dustinspecker/is-get-set-prop)

> Does a JS type have a getter/setter property

## Install
```
npm install --save is-get-set-prop
```

## Usage
### ES2015
```javascript
import isGetSetProp from 'is-get-set-prop';

isGetSetProp('array', 'length');
// => true

isGetSetProp('ARRAY', 'push');
// => false

// is-get-set-prop can only verify native JS types
isGetSetProp('gulp', 'task');
// => false;
```

## API
### isGetSetProp(type, propertyName)
#### type
Type: `string`

A native JS type to examine. Note: `is-get-set-prop` can only verify native JS types.

#### propertyName
Type: `string`

Property name to determine if a getter/setter of `type`.

## LICENSE
MIT © [Dustin Specker](https://github.com/dustinspecker)
