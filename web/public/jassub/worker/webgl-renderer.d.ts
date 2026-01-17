import type { ASSImage } from '../jassub';
export declare const colorMatrixConversionMap: {
    readonly BT601: {
        readonly BT709: Float32Array<ArrayBuffer>;
        readonly BT601: Float32Array<ArrayBuffer>;
    };
    readonly BT709: {
        readonly BT601: Float32Array<ArrayBuffer>;
        readonly BT709: Float32Array<ArrayBuffer>;
    };
    readonly FCC: {
        readonly BT709: Float32Array<ArrayBuffer>;
        readonly BT601: Float32Array<ArrayBuffer>;
    };
    readonly SMPTE240M: {
        readonly BT709: Float32Array<ArrayBuffer>;
        readonly BT601: Float32Array<ArrayBuffer>;
    };
};
export type ColorSpace = keyof typeof colorMatrixConversionMap;
export declare class WebGL2Renderer {
    gl: WebGL2RenderingContext | null;
    program: WebGLProgram | null;
    vao: WebGLVertexArrayObject | null;
    u_resolution: WebGLUniformLocation | null;
    u_destRect: WebGLUniformLocation | null;
    u_color: WebGLUniformLocation | null;
    u_texArray: WebGLUniformLocation | null;
    u_colorMatrix: WebGLUniformLocation | null;
    u_texLayer: WebGLUniformLocation | null;
    texArray: WebGLTexture | null;
    texArrayWidth: number;
    texArrayHeight: number;
    colorMatrix: Float32Array;
    setCanvas(canvas: OffscreenCanvas, width: number, height: number): void;
    createShader(type: number, source: string): WebGLShader | null;
    /**
       * Set the color matrix for color space conversion.
       * Pass null or undefined to use identity (no conversion).
       */
    setColorMatrix(subtitleColorSpace?: 'BT601' | 'BT709' | 'SMPTE240M' | 'FCC', videoColorSpace?: 'BT601' | 'BT709'): void;
    createTexArray(width: number, height: number): void;
    render(images: ASSImage[], heap: Uint8Array): void;
    destroy(): void;
}
