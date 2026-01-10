# line-column-path

> Parse and stringify file paths with line and column like `unicorn.js:8:14`


## Install

```
$ npm install line-column-path
```


## Usage

```js
import {parseLineColumnPath, stringifyLineColumnPath} from 'line-column-path';

const parsed = parseLineColumnPath('unicorn.js:8:14');
//=> {file: 'unicorn.js', line: 8, column: 14}

stringifyLineColumnPath(parsed);
//=> 'unicorn.js:8:14'
```

## API

### parseLineColumnPath(path)

#### path

Type: `string | object`

The file path to parse.

Can also be an object that you want to validate and normalize.

### stringifyLineColumnPath(path, options?)

#### path

Type: `object`

Object with a `.file` property and optionally a `.line` and `.column` property.

#### options

Type: `object`

##### file

Type: `boolean`\
Default: `true`

Output the file path.

Setting this to `false` will result in `8:18` instead of `unicorn.js:8:14`.

##### column

Type: `boolean`\
Default: `true`

Output the column.

Setting this to `false` will result in `unicorn.js:8` instead of `unicorn.js:8:14`.
