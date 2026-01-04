# is-proto-prop
[![NPM version](https://badge.fury.io/js/is-proto-prop.svg)](https://badge.fury.io/js/is-proto-prop) [![Coverage Status](https://img.shields.io/coveralls/dustinspecker/is-proto-prop.svg)](https://coveralls.io/r/dustinspecker/is-proto-prop?branch=master)

[![Code Climate](https://codeclimate.com/github/dustinspecker/is-proto-prop/badges/gpa.svg)](https://codeclimate.com/github/dustinspecker/is-proto-prop)

> Does a JS type's prototype have a property

## Install
```
npm install --save is-proto-prop
```

## Usage
### ES2015
```javascript
import isProtoProp from 'is-proto-prop';

isProtoProp('array', 'length');
// => true

isProtoProp('Error', 'ignore');
// => false

// `is-proto-props` can only verify native JS types
isProtoProp('gulp', 'task');
// => false
```

## API
### isProtoProp(type, propertyName)
Returns a `Boolean` if `propertyName` is on `type`'s prototype.

#### type
type: `string`

JS type to examine the prototype of. Note: `is-proto-prop` only looks at native JS types.

#### propertyName
type: `string`

Property name to look for on `type`'s prototype. Note: `propertyName` is case sensitive.

## LICENSE
MIT © [Dustin Specker](https://github.com/dustinspecker)
