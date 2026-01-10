# is-obj-prop
[![NPM version](https://badge.fury.io/js/is-obj-prop.svg)](https://badge.fury.io/js/is-obj-prop) [![Coverage Status](https://img.shields.io/coveralls/dustinspecker/is-obj-prop.svg)](https://coveralls.io/r/dustinspecker/is-obj-prop?branch=main) [![Code Climate](https://codeclimate.com/github/dustinspecker/is-obj-prop/badges/gpa.svg)](https://codeclimate.com/github/dustinspecker/is-obj-prop)

> Does a JS type have a property

## Install
```
npm install --save is-obj-prop
```

## Usage
### ES2015
```javascript
import isObjProp from 'is-obj-prop';

isObjProp('array', 'length');
// => true

isObjProp('ARRAY', 'push');
// => false

// is-obj-prop can only verify native JS types
isObjProp('gulp', 'task');
// => false;
```

## API
### isObjProp(type, propertyName)
#### type
Type: `string`

A native JS type to examine. Note: `is-obj-prop` can only verify native JS types.

#### propertyName
Type: `string`

Property name to determine if a property of `type`.

## LICENSE
MIT © [Dustin Specker](https://github.com/dustinspecker)
