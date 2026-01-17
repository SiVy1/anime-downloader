import type { ASSEvent, ASSStyle } from '../jassub';
export declare const read_: (url: string, ab?: boolean) => any;
export declare const readAsync: (url: string, load: (response: ArrayBuffer) => void, err: (error: unknown) => void) => void;
export declare const libassYCbCrMap: readonly [null, "BT601", null, "BT601", "BT601", "BT709", "BT709", "SMPTE240M", "SMPTE240M", "FCC", "FCC"];
export declare function _applyKeys<T extends (ASSEvent | ASSStyle)>(input: T, output: T): void;
