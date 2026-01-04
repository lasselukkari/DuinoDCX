import {Mutable} from 'type-fest';

export interface PathDescriptor {
	readonly file: string;
	readonly line?: number;
	readonly column?: number;
}

export type PathLike = string | PathDescriptor;
export type ParsedPath = Mutable<Required<PathDescriptor>>;

export interface StringifyOptions {
	/**
	Output the file path.

	Setting this to `false` will result in `8:18` instead of `unicorn.js:8:14`.

	@default true
	*/
	readonly file?: boolean;

	/**
	Output the column.

	Setting this to `false` will result in `unicorn.js:8` instead of `unicorn.js:8:14`.

	@default true
	*/
	readonly column?: boolean;
}

/**
Parse file paths with line and column like `unicorn.js:8:14`.

@param path - The file path to parse. Can also be an object that you want to validate and normalize.

@example
```
import {parseLineColumnPath} from 'line-column-path';

parseLineColumnPath('unicorn.js:8:14');
//=> {file: 'unicorn.js', line: 8, column: 14}
```
*/
export function parseLineColumnPath(path: PathLike): ParsedPath;

/**
Stringify file paths.

@example
```
import {stringifyLineColumnPath} from 'line-column-path';

stringifyLineColumnPath({file: 'unicorn.js', line: 8, column: 14});
//=> 'unicorn.js:8:14'
```
*/
export function stringifyLineColumnPath(
	path: PathDescriptor,
	options?: StringifyOptions
): string;
