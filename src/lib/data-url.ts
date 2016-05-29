// TODO: Optimize using deferred parsing.
// If a data URL string is passed in and the only operation called is
// toString() then there is no need to parse and increase
// memory consumption. This would complicate the code though
// so only implement if needed.

import { ArrayBufferConverter } from "./array-buffer-converter";
import { MediaType } from "./media-type";

declare let escape: (s: string) => string;
declare let unescape: (s: string) => string;

// data:[<MIME-type>][;charset=<encoding>][;base64],<data>

// dataurl    := "data:" [ mediatype ] [ ";base64" ] "," data
// mediatype  := [ type "/" subtype ] *( ";" parameter )
// data       := *urlchar
// parameter  := attribute "=" value
export class DataURL {
  private _mediaType: MediaType;
  private _isBase64: boolean;
  private _data: string;

  get mediaType(): MediaType {
    return this._mediaType;
  }

  set mediaType(mediaType: MediaType) {
    if (mediaType instanceof MediaType) {
      this._mediaType = mediaType;
    }
    else if (typeof mediaType === "string") {
      this._mediaType = new MediaType(<string><any>mediaType);
    }
    else {
      throw new Error("Media type must be 'string' or 'MediaType'");
    }
  }

  get isBase64(): boolean {
    return this._isBase64;
  }

  get data(): string {
    return this._data;
  }

  setBase64EncodedData(base64EncodedData: string): void {
    this._isBase64 = true;
    this._data = base64EncodedData;
  }

  setURLEncodedData(urlEncodedData: string): void {
    this._isBase64 = false;
    this._data = urlEncodedData;
  }

  constructor(data: any, options?: any) {
    // Set default options
    if (!options) {
      options = {
        mediaType: null,
        encoding: "auto"
      };
    }

    if (!options.encoding) {
      options.encoding = "auto";
    }

    // Validate encoding
    if (options.encoding !== "auto" && options.encoding !== "url" && options.encoding !== "base64") {
      throw new Error("Unknown encoding (must be 'auto', 'url', or 'base64'): " + options.encoding);
    }

    // Save media type
    let mediaType: any = options.mediaType;
    if (typeof mediaType === "string") {
      mediaType = new MediaType(mediaType);
    }
    this._mediaType = mediaType;

    // Save data and return if none
    if (!data) {
      this._isBase64 = false;
      this._data = data;
      return;
    }

    // Parse data
    if (data instanceof ArrayBuffer) {
      if (options.encoding === "base64" || options.encoding === "auto") {
        this.setBase64EncodedData(ArrayBufferConverter.toBase64(data));
      } else if (options.encoding === "url") {
        this.setURLEncodedData(encodeURIComponent(ArrayBufferConverter.toBinaryString(data)));
      }
    } else if (typeof data === "string") {
      // Ensure this is a data URI
      let startsWithData = data.slice(0, "data:".length) === "data:";
      if (!startsWithData) {
        throw new Error("Only 'data' URI strings are supported");
      }

      // Find the comma that separates the prefix from the data
      let commaIndex = data.indexOf(",");
      if (commaIndex === -1) {
        throw new Error("Missing comma in URL");
      }

      // Get prefix and data
      let prefix = data.slice(0, commaIndex);
      let encodedData = data.slice(commaIndex + 1);

      // Get is base64
      let prefixParts = prefix.split(";");
      let isBase64 = false;
      for (let i = 1; i < prefixParts.length; ++i) {
        let prefixPart = prefixParts[i].trim();
        if (prefixPart === "base64") {
          isBase64 = true;
          break;
        }
      }

      // Get media type
      mediaType = prefix.slice("data:".length, commaIndex);
      mediaType = mediaType.length === 0 ? null : mediaType;
      this._mediaType = this._mediaType || new MediaType(mediaType);

      // Convert encoded data as needed
      if (options.encoding === "auto") {
        // Auto encoding saves the data URI as is
        this._isBase64 = isBase64;
        this._data = encodedData;
      } else if (options.encoding === "base64") {
        // Convert to base64
        this._isBase64 = true;
        if (isBase64) {
          this._data = encodedData;
        } else {
          this._data = window.btoa(unescape(encodedData));
        }
      } else if (options.encoding === "url") {
        // Convert to URL encoding
        this._isBase64 = false;
        if (!isBase64) {
          this._data = encodedData;
        } else {
          this._data = encodeURIComponent(window.atob(encodedData));
        }
      }
    } else {
      throw new Error("unsupported object type (must be ArrayBuffer or string): " + typeof data);
    }
  }

  toString(): string {
    return "data:" +
      (this._mediaType ? this._mediaType.toString() : "") +
      (this._isBase64 ? ";base64" : "") + "," +
      (this._data ? this._data : "");
  }

  toJSON(): string {
    return this.toString();
  }

  valueOf(): string {
    return this.toString();
  }

  toArrayBuffer(): ArrayBuffer {
    if (!this._data) {
      return null;
    }
    if (this._isBase64) {
      return ArrayBufferConverter.fromBase64(this._data);
    } else {
      return ArrayBufferConverter.fromBinaryString(unescape(this._data));
    }
  }

  toBase64(): string {
    if (!this._data) {
      return this._data;
    }
    if (this._isBase64) {
      return this._data;
    } else {
      return window.btoa(unescape(this._data));
    }
  }

  toBinaryString(): string {
    if (!this._data) {
      return this._data;
    }
    if (this._isBase64) {
      return window.atob(this._data);
    } else {
      return unescape(this._data);
    }
  }

  toUnicodeString(): string {
    if (!this._data) {
      return this._data;
    }
    if (this._isBase64) {
      return decodeURIComponent(escape(window.atob(this._data)));
    } else {
      return decodeURIComponent(this._data);
    }
  }

  static createFromBase64(base64: string, options?: any): DataURL {
    return new DataURL("data:;base64," + base64, options);
  }

  static createFromBinaryString(binary: string, options?: any): DataURL {
    if (!options) {
      options = {
        encoding: "auto"
      };
    }
    if (options.encoding === "base64" || options.encoding === "auto") {
      return new DataURL("data:;base64," + window.btoa(binary), options);
    } else if (options.encoding === "url") {
      return new DataURL("data:," + encodeURIComponent(binary), options);
    }
  }

  static createFromUnicodeString(text: string, options?: any): DataURL {
    return new DataURL("data:," + encodeURIComponent(text), options);
  }
}
