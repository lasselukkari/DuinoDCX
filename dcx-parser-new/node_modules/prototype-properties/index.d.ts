// TOOD: When TypeScript supports `with`.
// import prototypePropertiesJson from './prototype-properties.json' with {type: 'json'};

/**
List of prototype properties for [JavaScript types](https://github.com/sindresorhus/js-types).

@example
```
import prototypeProperties from 'prototype-properties';

console.log(prototypeProperties);
// {
// 	Array: [
// 		'length',
// 		'constructor',
// 		'toString',
// 		'toLocaleString',
// 		'join',
// 		'pop',
// 		…
// 	],
// 	ArrayBuffer: [
// 		'constructor',
// 		'byteLength',
// 		'slice'
// 	],
// 	…
// }
```
*/
// declare const prototypeProperties: typeof prototypePropertiesJson;
declare const prototypeProperties: Record<string, readonly string[]>;

export default prototypeProperties;
