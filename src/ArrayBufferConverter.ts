module SpicyPixel.Core {
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  export class ArrayBufferConverter
  {
    constructor() {
      throw new Error('This class is static and not meant to be constructed');
    }

    /*
     * Base64 conversion from:
     *
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */
    static toBase64(arrayBuffer:ArrayBuffer):string {
      // jshint bitwise:false
      var bytes = new Uint8Array(arrayBuffer);
      var len = bytes.length;
      var base64 = "";

      for (var i = 0; i < len; i+=3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
      }

      if ((len % 3) === 2) {
        base64 = base64.substring(0, base64.length - 1) + "=";
      } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + "==";
      }

      return base64;
      // jshint bitwise:true
    }

    static fromBase64(base64:string):ArrayBuffer {
      // jshint bitwise:false
      var bufferLength = base64.length * 0.75;
      var len = base64.length;
      var p = 0;
      var encoded1:number, encoded2:number, encoded3:number, encoded4:number;

      if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") {
          bufferLength--;
        }
      }

      var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

      for (var i = 0; i < len; i+=4) {
        encoded1 = chars.indexOf(base64[i]);
        encoded2 = chars.indexOf(base64[i+1]);
        encoded3 = chars.indexOf(base64[i+2]);
        encoded4 = chars.indexOf(base64[i+3]);

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }

      return arraybuffer;
      // jshint bitwise:true
    }

    static toBinaryString(arrayBuffer:ArrayBuffer):string {
      var binary = "";
      var bytes = new Uint8Array(arrayBuffer);
      var length = bytes.byteLength;
      var i = 0;
      while (i < length) {
        binary += String.fromCharCode(bytes[i]);
        ++i;
      }
      return binary;
    }

    static fromBinaryString(binary:string):ArrayBuffer {
      var length = binary.length;
      var buffer = new ArrayBuffer(length);
      var bytes = new Uint8Array(buffer);
      var i = 0;
      while (i < length) {
        var code = binary.charCodeAt(i);
        if (code > 255) {
          throw new Error("a multibyte character was encountered in the provided string which indicates it was not encoded as a binary string");
        }
        bytes[i] = code;
        ++i;
      }
      return bytes.buffer;
    }
  }
}
