import 'rvfc-polyfill';
import { Debug } from './debug';
import type { ASS_Event, ASS_Image, ASS_Style, ClassHandle } from './wasm/types';
import type { ASSRenderer } from './worker/worker';
import type { Remote } from 'abslink';
export type ASSEvent = Omit<ASS_Event, keyof ClassHandle>;
export type ASSStyle = Omit<ASS_Style, keyof ClassHandle>;
export type ASSImage = Omit<ASS_Image, keyof ClassHandle>;
export type JASSUBOptions = {
    timeOffset?: number;
    debug?: boolean;
    prescaleFactor?: number;
    prescaleHeightLimit?: number;
    maxRenderHeight?: number;
    workerUrl?: string;
    wasmUrl?: string;
    modernWasmUrl?: string;
    subUrl?: string;
    subContent?: string;
    fonts?: string[] | Uint8Array[];
    availableFonts?: Record<string, Uint8Array | string>;
    fallbackFont?: string;
    useLocalFonts?: boolean;
    libassMemoryLimit?: number;
    libassGlyphLimit?: number;
} & ({
    video: HTMLVideoElement;
    canvas?: HTMLCanvasElement;
} | {
    video?: HTMLVideoElement;
    canvas: HTMLCanvasElement;
});
export default class JASSUB {
    timeOffset: number;
    prescaleFactor: number;
    prescaleHeightLimit: number;
    maxRenderHeight: number;
    debug: Debug | null;
    renderer: Remote<ASSRenderer>;
    ready: Promise<void>;
    busy: boolean;
    _video: HTMLVideoElement | undefined;
    _videoWidth: number;
    _videoHeight: number;
    _videoColorSpace: string | null;
    _canvas: HTMLCanvasElement;
    _canvasParent: HTMLDivElement | undefined;
    _ctrl: AbortController;
    _ro: ResizeObserver;
    _destroyed: boolean;
    _lastDemandTime: VideoFrameCallbackMetadata;
    _skipped: boolean;
    _worker: Worker;
    constructor(opts: JASSUBOptions);
    static _supportsSIMD?: boolean;
    static _test(): void;
    resize(force?: boolean, width?: number, height?: number, top?: number, left?: number): Promise<void>;
    _getVideoPosition(width?: number, height?: number): {
        width: number;
        height: number;
        x: number;
        y: number;
    };
    _computeCanvasSize(width?: number, height?: number): {
        width: number;
        height: number;
    };
    setVideo(video: HTMLVideoElement): Promise<void>;
    _sendLocalFont(name: string): Promise<void>;
    _getLocalFont(font: string): Promise<void>;
    _handleRVFC(data: VideoFrameCallbackMetadata): void;
    _demandRender(): Promise<void>;
    _updateColorSpace(): Promise<void>;
    _removeListeners(): void;
    destroy(): Promise<void>;
}
