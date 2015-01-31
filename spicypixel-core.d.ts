declare module SpicyPixel.Core {
    class ArrayBufferConverter {
        constructor();
        static toBase64(arrayBuffer: ArrayBuffer): string;
        static fromBase64(base64: string): ArrayBuffer;
        static toBinaryString(arrayBuffer: ArrayBuffer): string;
        static fromBinaryString(binary: string): ArrayBuffer;
    }
}

declare var escape: (s: string) => string;
declare var unescape: (s: string) => string;
declare module SpicyPixel.Core {
    class DataURL {
        private _mediaType;
        private _isBase64;
        private _data;
        mediaType: MediaType;
        isBase64: boolean;
        data: string;
        setBase64EncodedData(base64EncodedData: string): void;
        setURLEncodedData(urlEncodedData: string): void;
        constructor(data: any, options?: any);
        toString(): string;
        toJSON(): string;
        valueOf(): string;
        toArrayBuffer(): ArrayBuffer;
        toBase64(): string;
        toBinaryString(): string;
        toUnicodeString(): string;
        static createFromBase64(base64: string, options?: any): DataURL;
        static createFromBinaryString(binary: string, options?: any): DataURL;
        static createFromUnicodeString(text: string, options?: any): DataURL;
    }
}

/**
 * media-type
 * @author Lovell Fuller (original JS)
 * @author Aaron Oneal (TypeScript)
 *
 * This code is distributed under the Apache License Version 2.0, the terms of
 * which may be found at http://www.apache.org/licenses/LICENSE-2.0.html
 */
declare module SpicyPixel.Core {
    class MediaType {
        private _type;
        private _subtype;
        private _parameters;
        private _suffix;
        private _subtypeFacets;
        constructor(mediaType?: string);
        type: string;
        subtype: string;
        parameters: any;
        isValid: boolean;
        hasSuffix: boolean;
        isVendor: boolean;
        isPersonal: boolean;
        isExperimental: boolean;
        toString(): string;
        toJSON(): string;
        valueOf(): string;
        private setSubtypeAndSuffix(subtype);
        private firstSubtypeFacetEquals(str);
        private wrapQuotes(str);
        private unwrapQuotes(str);
    }
}

declare module SpicyPixel.Core {
    class Imports {
    }
}
declare var module: any;
declare var exports: any;
declare var define: any;
declare var require: any;
