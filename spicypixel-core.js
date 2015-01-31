var SpicyPixel;
(function (SpicyPixel) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var ArrayBufferConverter = (function () {
        function ArrayBufferConverter() {
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
        ArrayBufferConverter.toBase64 = function (arrayBuffer) {
            // jshint bitwise:false
            var bytes = new Uint8Array(arrayBuffer);
            var len = bytes.length;
            var base64 = "";
            for (var i = 0; i < len; i += 3) {
                base64 += chars[bytes[i] >> 2];
                base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
                base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
                base64 += chars[bytes[i + 2] & 63];
            }
            if ((len % 3) === 2) {
                base64 = base64.substring(0, base64.length - 1) + "=";
            }
            else if (len % 3 === 1) {
                base64 = base64.substring(0, base64.length - 2) + "==";
            }
            return base64;
            // jshint bitwise:true
        };
        ArrayBufferConverter.fromBase64 = function (base64) {
            // jshint bitwise:false
            var bufferLength = base64.length * 0.75;
            var len = base64.length;
            var p = 0;
            var encoded1, encoded2, encoded3, encoded4;
            if (base64[base64.length - 1] === "=") {
                bufferLength--;
                if (base64[base64.length - 2] === "=") {
                    bufferLength--;
                }
            }
            var arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
            for (var i = 0; i < len; i += 4) {
                encoded1 = chars.indexOf(base64[i]);
                encoded2 = chars.indexOf(base64[i + 1]);
                encoded3 = chars.indexOf(base64[i + 2]);
                encoded4 = chars.indexOf(base64[i + 3]);
                bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
                bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
                bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
            }
            return arraybuffer;
            // jshint bitwise:true
        };
        ArrayBufferConverter.toBinaryString = function (arrayBuffer) {
            var binary = "";
            var bytes = new Uint8Array(arrayBuffer);
            var length = bytes.byteLength;
            var i = 0;
            while (i < length) {
                binary += String.fromCharCode(bytes[i]);
                ++i;
            }
            return binary;
        };
        ArrayBufferConverter.fromBinaryString = function (binary) {
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
        };
        return ArrayBufferConverter;
    })();
    SpicyPixel.ArrayBufferConverter = ArrayBufferConverter;
})(SpicyPixel || (SpicyPixel = {}));

// TODO: Optimize using deferred parsing.
// If a data URL string is passed in and the only operation called is
// toString() then there is no need to parse and increase
// memory consumption. This would complicate the code though
// so only implement if needed.
var SpicyPixel;
(function (SpicyPixel) {
    // data:[<MIME-type>][;charset=<encoding>][;base64],<data>
    // dataurl    := "data:" [ mediatype ] [ ";base64" ] "," data
    // mediatype  := [ type "/" subtype ] *( ";" parameter )
    // data       := *urlchar
    // parameter  := attribute "=" value
    var DataURL = (function () {
        function DataURL(data, options) {
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
            var mediaType = options.mediaType;
            if (typeof mediaType === "string") {
                mediaType = new SpicyPixel.MediaType(mediaType);
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
                    this.setBase64EncodedData(SpicyPixel.ArrayBufferConverter.toBase64(data));
                }
                else if (options.encoding === "url") {
                    this.setURLEncodedData(encodeURIComponent(SpicyPixel.ArrayBufferConverter.toBinaryString(data)));
                }
            }
            else if (typeof data === "string") {
                // Ensure this is a data URI
                var startsWithData = data.slice(0, "data:".length) === "data:";
                if (!startsWithData) {
                    throw new Error("Only 'data' URI strings are supported");
                }
                // Find the comma that separates the prefix from the data
                var commaIndex = data.indexOf(",");
                if (commaIndex === -1) {
                    throw new Error("Missing comma in SQLBlob URL");
                }
                // Get prefix and data
                var prefix = data.slice(0, commaIndex);
                var encodedData = data.slice(commaIndex + 1);
                // Get is base64
                var prefixParts = prefix.split(';');
                var isBase64 = false;
                for (var i = 1; i < prefixParts.length; ++i) {
                    var prefixPart = prefixParts[i].trim();
                    if (prefixPart === "base64") {
                        isBase64 = true;
                        break;
                    }
                }
                // Get media type
                mediaType = prefix.slice("data:".length, commaIndex);
                mediaType = mediaType.length === 0 ? null : mediaType;
                this._mediaType = this._mediaType || new SpicyPixel.MediaType(mediaType);
                // Convert encoded data as needed
                if (options.encoding === "auto") {
                    // Auto encoding saves the data URI as is
                    this._isBase64 = isBase64;
                    this._data = encodedData;
                }
                else if (options.encoding === "base64") {
                    // Convert to base64
                    this._isBase64 = true;
                    if (isBase64) {
                        this._data = encodedData;
                    }
                    else {
                        this._data = window.btoa(unescape(encodedData));
                    }
                }
                else if (options.encoding === "url") {
                    // Convert to URL encoding
                    this._isBase64 = false;
                    if (!isBase64) {
                        this._data = encodedData;
                    }
                    else {
                        this._data = encodeURIComponent(window.atob(encodedData));
                    }
                }
            }
            else {
                throw new Error("unsupported object type (must be ArrayBuffer or string): " + typeof data);
            }
        }
        Object.defineProperty(DataURL.prototype, "mediaType", {
            get: function () {
                return this._mediaType;
            },
            set: function (mediaType) {
                if (mediaType instanceof SpicyPixel.MediaType) {
                    this._mediaType = mediaType;
                }
                else if (typeof mediaType === "string") {
                    this._mediaType = new SpicyPixel.MediaType(mediaType);
                }
                else {
                    throw new Error("Media type must be 'string' or 'MediaType'");
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataURL.prototype, "isBase64", {
            get: function () {
                return this._isBase64;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DataURL.prototype, "data", {
            get: function () {
                return this._data;
            },
            enumerable: true,
            configurable: true
        });
        DataURL.prototype.setBase64EncodedData = function (base64EncodedData) {
            this._isBase64 = true;
            this._data = base64EncodedData;
        };
        DataURL.prototype.setURLEncodedData = function (urlEncodedData) {
            this._isBase64 = false;
            this._data = urlEncodedData;
        };
        DataURL.prototype.toString = function () {
            return "data:" + (this._mediaType ? this._mediaType.toString() : "") + (this._isBase64 ? ";base64" : "") + "," + (this._data ? this._data : "");
        };
        DataURL.prototype.toJSON = function () {
            return this.toString();
        };
        DataURL.prototype.valueOf = function () {
            return this.toString();
        };
        DataURL.prototype.toArrayBuffer = function () {
            if (!this._data) {
                return null;
            }
            if (this._isBase64) {
                return SpicyPixel.ArrayBufferConverter.fromBase64(this._data);
            }
            else {
                return SpicyPixel.ArrayBufferConverter.fromBinaryString(unescape(this._data));
            }
        };
        DataURL.prototype.toBase64 = function () {
            if (!this._data) {
                return this._data;
            }
            if (this._isBase64) {
                return this._data;
            }
            else {
                return window.btoa(unescape(this._data));
            }
        };
        DataURL.prototype.toBinaryString = function () {
            if (!this._data) {
                return this._data;
            }
            if (this._isBase64) {
                return window.atob(this._data);
            }
            else {
                return unescape(this._data);
            }
        };
        DataURL.prototype.toUnicodeString = function () {
            if (!this._data) {
                return this._data;
            }
            if (this._isBase64) {
                return decodeURIComponent(escape(window.atob(this._data)));
            }
            else {
                return decodeURIComponent(this._data);
            }
        };
        DataURL.createFromBase64 = function (base64, options) {
            return new DataURL("data:;base64," + base64, options);
        };
        DataURL.createFromBinaryString = function (binary, options) {
            if (!options) {
                options = {
                    encoding: "auto"
                };
            }
            if (options.encoding === "base64" || options.encoding === "auto") {
                return new DataURL("data:;base64," + window.btoa(binary), options);
            }
            else if (options.encoding === "url") {
                return new DataURL("data:," + encodeURIComponent(binary), options);
            }
        };
        DataURL.createFromUnicodeString = function (text, options) {
            return new DataURL("data:," + encodeURIComponent(text), options);
        };
        return DataURL;
    })();
    SpicyPixel.DataURL = DataURL;
})(SpicyPixel || (SpicyPixel = {}));

/**
 * media-type
 * @author Lovell Fuller (original JS)
 * @author Aaron Oneal (TypeScript)
 *
 * This code is distributed under the Apache License Version 2.0, the terms of
 * which may be found at http://www.apache.org/licenses/LICENSE-2.0.html
 */
var SpicyPixel;
(function (SpicyPixel) {
    var mediaTypeMatcher = /^(application|audio|image|message|model|multipart|text|video)\/([a-zA-Z0-9!#$%^&\*_\-\+{}\|'.`~]{1,127})(;.*)?$/;
    var parameterSplitter = /;(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/;
    var MediaType = (function () {
        function MediaType(mediaType) {
            var _this = this;
            this._type = null;
            this.setSubtypeAndSuffix(null);
            this._parameters = {};
            if (mediaType) {
                var match = mediaType.match(mediaTypeMatcher);
                if (match) {
                    this._type = match[1];
                    this.setSubtypeAndSuffix(match[2]);
                    if (match[3]) {
                        match[3].substr(1).split(parameterSplitter).forEach(function (parameter) {
                            var keyAndValue = parameter.split('=', 2);
                            if (keyAndValue.length === 2) {
                                _this._parameters[keyAndValue[0].toLowerCase().trim()] = _this.unwrapQuotes(keyAndValue[1].trim());
                            }
                        });
                    }
                }
            }
        }
        Object.defineProperty(MediaType.prototype, "type", {
            get: function () {
                return this._type;
            },
            set: function (type) {
                this._type = type;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaType.prototype, "subtype", {
            get: function () {
                return this._subtype;
            },
            set: function (subtype) {
                this.setSubtypeAndSuffix(subtype);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaType.prototype, "parameters", {
            get: function () {
                return this._parameters;
            },
            set: function (parameters) {
                this._parameters = parameters;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaType.prototype, "isValid", {
            get: function () {
                return this._type !== null && this._subtype !== null && this._subtype !== "example";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaType.prototype, "hasSuffix", {
            get: function () {
                return !!this._suffix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaType.prototype, "isVendor", {
            get: function () {
                return this.firstSubtypeFacetEquals("vnd");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaType.prototype, "isPersonal", {
            get: function () {
                return this.firstSubtypeFacetEquals("prs");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MediaType.prototype, "isExperimental", {
            get: function () {
                return this.firstSubtypeFacetEquals("x") || this._subtype.substring(0, 2).toLowerCase() === "x-";
            },
            enumerable: true,
            configurable: true
        });
        MediaType.prototype.toString = function () {
            var _this = this;
            var str = "";
            if (this.isValid) {
                str = str + this._type + "/" + this._subtype;
                if (this.hasSuffix) {
                    str = str + "+" + this._suffix;
                }
                var parameterKeys = Object.keys(this._parameters);
                if (parameterKeys.length > 0) {
                    var parameters = [];
                    var that = this;
                    parameterKeys.sort(function (a, b) {
                        return a.localeCompare(b);
                    }).forEach(function (element) {
                        parameters.push(element + "=" + _this.wrapQuotes(that._parameters[element]));
                    });
                    str = str + ";" + parameters.join(";");
                }
            }
            return str;
        };
        MediaType.prototype.toJSON = function () {
            return this.toString();
        };
        MediaType.prototype.valueOf = function () {
            return this.toString();
        };
        MediaType.prototype.setSubtypeAndSuffix = function (subtype) {
            this._subtype = subtype;
            this._subtypeFacets = [];
            this._suffix = null;
            if (subtype) {
                if (subtype.indexOf("+") > -1 && subtype.substr(-1) !== "+") {
                    var fixes = subtype.split("+", 2);
                    this._subtype = fixes[0];
                    this._subtypeFacets = fixes[0].split(".");
                    this._suffix = fixes[1];
                }
                else {
                    this._subtypeFacets = subtype.split(".");
                }
            }
        };
        MediaType.prototype.firstSubtypeFacetEquals = function (str) {
            return this._subtypeFacets.length > 0 && this._subtypeFacets[0] === str;
        };
        MediaType.prototype.wrapQuotes = function (str) {
            return (str.indexOf(";") > -1) ? '"' + str + '"' : str;
        };
        MediaType.prototype.unwrapQuotes = function (str) {
            return (str.substr(0, 1) === '"' && str.substr(-1) === '"') ? str.substr(1, str.length - 2) : str;
        };
        return MediaType;
    })();
    SpicyPixel.MediaType = MediaType;
})(SpicyPixel || (SpicyPixel = {}));

var SpicyPixel;
(function (SpicyPixel) {
    var Imports = (function () {
        function Imports() {
        }
        return Imports;
    })();
    SpicyPixel.Imports = Imports;
})(SpicyPixel || (SpicyPixel = {}));
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD anonymous module
        define([], factory);
    }
    else if (typeof exports === 'object') {
        // CommonJS anonymous module
        module.exports = factory();
    }
    else {
        // Browser globals
        root.SpicyPixel = factory();
    }
})(this, function () {
    return SpicyPixel;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BcnJheUJ1ZmZlckNvbnZlcnRlci50cyIsInNyYy9EYXRhVVJMLnRzIiwic3JjL01lZGlhVHlwZS50cyIsInNyYy9Vbml2ZXJzYWxNb2R1bGUudHMiXSwibmFtZXMiOlsiU3BpY3lQaXhlbCIsIlNwaWN5UGl4ZWwuQXJyYXlCdWZmZXJDb252ZXJ0ZXIiLCJTcGljeVBpeGVsLkFycmF5QnVmZmVyQ29udmVydGVyLmNvbnN0cnVjdG9yIiwiU3BpY3lQaXhlbC5BcnJheUJ1ZmZlckNvbnZlcnRlci50b0Jhc2U2NCIsIlNwaWN5UGl4ZWwuQXJyYXlCdWZmZXJDb252ZXJ0ZXIuZnJvbUJhc2U2NCIsIlNwaWN5UGl4ZWwuQXJyYXlCdWZmZXJDb252ZXJ0ZXIudG9CaW5hcnlTdHJpbmciLCJTcGljeVBpeGVsLkFycmF5QnVmZmVyQ29udmVydGVyLmZyb21CaW5hcnlTdHJpbmciLCJTcGljeVBpeGVsLkRhdGFVUkwiLCJTcGljeVBpeGVsLkRhdGFVUkwuY29uc3RydWN0b3IiLCJTcGljeVBpeGVsLkRhdGFVUkwubWVkaWFUeXBlIiwiU3BpY3lQaXhlbC5EYXRhVVJMLmlzQmFzZTY0IiwiU3BpY3lQaXhlbC5EYXRhVVJMLmRhdGEiLCJTcGljeVBpeGVsLkRhdGFVUkwuc2V0QmFzZTY0RW5jb2RlZERhdGEiLCJTcGljeVBpeGVsLkRhdGFVUkwuc2V0VVJMRW5jb2RlZERhdGEiLCJTcGljeVBpeGVsLkRhdGFVUkwudG9TdHJpbmciLCJTcGljeVBpeGVsLkRhdGFVUkwudG9KU09OIiwiU3BpY3lQaXhlbC5EYXRhVVJMLnZhbHVlT2YiLCJTcGljeVBpeGVsLkRhdGFVUkwudG9BcnJheUJ1ZmZlciIsIlNwaWN5UGl4ZWwuRGF0YVVSTC50b0Jhc2U2NCIsIlNwaWN5UGl4ZWwuRGF0YVVSTC50b0JpbmFyeVN0cmluZyIsIlNwaWN5UGl4ZWwuRGF0YVVSTC50b1VuaWNvZGVTdHJpbmciLCJTcGljeVBpeGVsLkRhdGFVUkwuY3JlYXRlRnJvbUJhc2U2NCIsIlNwaWN5UGl4ZWwuRGF0YVVSTC5jcmVhdGVGcm9tQmluYXJ5U3RyaW5nIiwiU3BpY3lQaXhlbC5EYXRhVVJMLmNyZWF0ZUZyb21Vbmljb2RlU3RyaW5nIiwiU3BpY3lQaXhlbC5NZWRpYVR5cGUiLCJTcGljeVBpeGVsLk1lZGlhVHlwZS5jb25zdHJ1Y3RvciIsIlNwaWN5UGl4ZWwuTWVkaWFUeXBlLnR5cGUiLCJTcGljeVBpeGVsLk1lZGlhVHlwZS5zdWJ0eXBlIiwiU3BpY3lQaXhlbC5NZWRpYVR5cGUucGFyYW1ldGVycyIsIlNwaWN5UGl4ZWwuTWVkaWFUeXBlLmlzVmFsaWQiLCJTcGljeVBpeGVsLk1lZGlhVHlwZS5oYXNTdWZmaXgiLCJTcGljeVBpeGVsLk1lZGlhVHlwZS5pc1ZlbmRvciIsIlNwaWN5UGl4ZWwuTWVkaWFUeXBlLmlzUGVyc29uYWwiLCJTcGljeVBpeGVsLk1lZGlhVHlwZS5pc0V4cGVyaW1lbnRhbCIsIlNwaWN5UGl4ZWwuTWVkaWFUeXBlLnRvU3RyaW5nIiwiU3BpY3lQaXhlbC5NZWRpYVR5cGUudG9KU09OIiwiU3BpY3lQaXhlbC5NZWRpYVR5cGUudmFsdWVPZiIsIlNwaWN5UGl4ZWwuTWVkaWFUeXBlLnNldFN1YnR5cGVBbmRTdWZmaXgiLCJTcGljeVBpeGVsLk1lZGlhVHlwZS5maXJzdFN1YnR5cGVGYWNldEVxdWFscyIsIlNwaWN5UGl4ZWwuTWVkaWFUeXBlLndyYXBRdW90ZXMiLCJTcGljeVBpeGVsLk1lZGlhVHlwZS51bndyYXBRdW90ZXMiLCJTcGljeVBpeGVsLkltcG9ydHMiLCJTcGljeVBpeGVsLkltcG9ydHMuY29uc3RydWN0b3IiXSwibWFwcGluZ3MiOiJBQUFBLElBQU8sVUFBVSxDQXFHaEI7QUFyR0QsV0FBTyxVQUFVLEVBQUMsQ0FBQztJQUNqQkEsSUFBSUEsS0FBS0EsR0FBR0Esa0VBQWtFQSxDQUFDQTtJQUUvRUEsSUFBYUEsb0JBQW9CQTtRQUUvQkMsU0FGV0Esb0JBQW9CQTtZQUc3QkMsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0Esc0RBQXNEQSxDQUFDQSxDQUFDQTtRQUMxRUEsQ0FBQ0E7UUFFREQ7Ozs7Ozs7O1dBUUdBO1FBQ0lBLDZCQUFRQSxHQUFmQSxVQUFnQkEsV0FBdUJBO1lBQ3JDRSxBQUNBQSx1QkFEdUJBO2dCQUNuQkEsS0FBS0EsR0FBR0EsSUFBSUEsVUFBVUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7WUFDeENBLElBQUlBLEdBQUdBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBO1lBQ3ZCQSxJQUFJQSxNQUFNQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUVoQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsSUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7Z0JBQzlCQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDL0JBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM3REEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xFQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUNyQ0EsQ0FBQ0E7WUFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BCQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxFQUFFQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN4REEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pCQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxFQUFFQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUN6REEsQ0FBQ0E7WUFFREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDZEEsc0JBQXNCQTtRQUN4QkEsQ0FBQ0E7UUFFTUYsK0JBQVVBLEdBQWpCQSxVQUFrQkEsTUFBYUE7WUFDN0JHLEFBQ0FBLHVCQUR1QkE7Z0JBQ25CQSxZQUFZQSxHQUFHQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUN4Q0EsSUFBSUEsR0FBR0EsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDeEJBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1ZBLElBQUlBLFFBQWVBLEVBQUVBLFFBQWVBLEVBQUVBLFFBQWVBLEVBQUVBLFFBQWVBLENBQUNBO1lBRXZFQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdENBLFlBQVlBLEVBQUVBLENBQUNBO2dCQUNmQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdENBLFlBQVlBLEVBQUVBLENBQUNBO2dCQUNqQkEsQ0FBQ0E7WUFDSEEsQ0FBQ0E7WUFFREEsSUFBSUEsV0FBV0EsR0FBR0EsSUFBSUEsV0FBV0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsRUFDN0NBLEtBQUtBLEdBQUdBLElBQUlBLFVBQVVBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO1lBRXRDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxHQUFHQSxFQUFFQSxDQUFDQSxJQUFFQSxDQUFDQSxFQUFFQSxDQUFDQTtnQkFDOUJBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUNwQ0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RDQSxRQUFRQSxHQUFHQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxHQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDdENBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEdBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUV0Q0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQy9DQSxLQUFLQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxRQUFRQSxHQUFHQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFD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QUFPQSxHQUFQQSxPQUNaQSxDQUFBQTtBQUNMQSxDQUFDQSxFQUhNLFVBQVUsS0FBVixVQUFVLFFBR2hCO0FBT0QsQ0FBQyxVQUFVLElBQVEsRUFBRSxPQUFXO0lBQzVCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sTUFBTSxLQUFLLFVBQVUsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM3QyxBQUNBLHVCQUR1QjtRQUN2QixNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyQyxBQUNBLDRCQUQ0QjtRQUM1QixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNKLEFBQ0Esa0JBRGtCO1FBQ2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxFQUFFLENBQUM7SUFDaEMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtJQUNMLE1BQU0sQ0FBQyxVQUFVLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoic3BpY3lwaXhlbC1jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlIFNwaWN5UGl4ZWwge1xuICB2YXIgY2hhcnMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIjtcblxuICBleHBvcnQgY2xhc3MgQXJyYXlCdWZmZXJDb252ZXJ0ZXJcbiAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGNsYXNzIGlzIHN0YXRpYyBhbmQgbm90IG1lYW50IHRvIGJlIGNvbnN0cnVjdGVkJyk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBCYXNlNjQgY29udmVyc2lvbiBmcm9tOlxuICAgICAqXG4gICAgICogYmFzZTY0LWFycmF5YnVmZmVyXG4gICAgICogaHR0cHM6Ly9naXRodWIuY29tL25pa2xhc3ZoL2Jhc2U2NC1hcnJheWJ1ZmZlclxuICAgICAqXG4gICAgICogQ29weXJpZ2h0IChjKSAyMDEyIE5pa2xhcyB2b24gSGVydHplblxuICAgICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAgICAgKi9cbiAgICBzdGF0aWMgdG9CYXNlNjQoYXJyYXlCdWZmZXI6QXJyYXlCdWZmZXIpOnN0cmluZyB7XG4gICAgICAvLyBqc2hpbnQgYml0d2lzZTpmYWxzZVxuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aDtcbiAgICAgIHZhciBiYXNlNjQgPSBcIlwiO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSs9Mykge1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaV0gPj4gMl07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2ldICYgMykgPDwgNCkgfCAoYnl0ZXNbaSArIDFdID4+IDQpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaSArIDFdICYgMTUpIDw8IDIpIHwgKGJ5dGVzW2kgKyAyXSA+PiA2KV07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpICsgMl0gJiA2M107XG4gICAgICB9XG5cbiAgICAgIGlmICgobGVuICUgMykgPT09IDIpIHtcbiAgICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMSkgKyBcIj1cIjtcbiAgICAgIH0gZWxzZSBpZiAobGVuICUgMyA9PT0gMSkge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAyKSArIFwiPT1cIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJhc2U2NDtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOnRydWVcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbUJhc2U2NChiYXNlNjQ6c3RyaW5nKTpBcnJheUJ1ZmZlciB7XG4gICAgICAvLyBqc2hpbnQgYml0d2lzZTpmYWxzZVxuICAgICAgdmFyIGJ1ZmZlckxlbmd0aCA9IGJhc2U2NC5sZW5ndGggKiAwLjc1O1xuICAgICAgdmFyIGxlbiA9IGJhc2U2NC5sZW5ndGg7XG4gICAgICB2YXIgcCA9IDA7XG4gICAgICB2YXIgZW5jb2RlZDE6bnVtYmVyLCBlbmNvZGVkMjpudW1iZXIsIGVuY29kZWQzOm51bWJlciwgZW5jb2RlZDQ6bnVtYmVyO1xuXG4gICAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAxXSA9PT0gXCI9XCIpIHtcbiAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDJdID09PSBcIj1cIikge1xuICAgICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBhcnJheWJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihidWZmZXJMZW5ndGgpLFxuICAgICAgICBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrPTQpIHtcbiAgICAgICAgZW5jb2RlZDEgPSBjaGFycy5pbmRleE9mKGJhc2U2NFtpXSk7XG4gICAgICAgIGVuY29kZWQyID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSsxXSk7XG4gICAgICAgIGVuY29kZWQzID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSsyXSk7XG4gICAgICAgIGVuY29kZWQ0ID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSszXSk7XG5cbiAgICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMSA8PCAyKSB8IChlbmNvZGVkMiA+PiA0KTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDIgJiAxNSkgPDwgNCkgfCAoZW5jb2RlZDMgPj4gMik7XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQzICYgMykgPDwgNikgfCAoZW5jb2RlZDQgJiA2Myk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheWJ1ZmZlcjtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOnRydWVcbiAgICB9XG5cbiAgICBzdGF0aWMgdG9CaW5hcnlTdHJpbmcoYXJyYXlCdWZmZXI6QXJyYXlCdWZmZXIpOnN0cmluZyB7XG4gICAgICB2YXIgYmluYXJ5ID0gXCJcIjtcbiAgICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICAgIHZhciBsZW5ndGggPSBieXRlcy5ieXRlTGVuZ3RoO1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcbiAgICAgICAgYmluYXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICAgICAgICArK2k7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmluYXJ5O1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tQmluYXJ5U3RyaW5nKGJpbmFyeTpzdHJpbmcpOkFycmF5QnVmZmVyIHtcbiAgICAgIHZhciBsZW5ndGggPSBiaW5hcnkubGVuZ3RoO1xuICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb2RlID0gYmluYXJ5LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmIChjb2RlID4gMjU1KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYSBtdWx0aWJ5dGUgY2hhcmFjdGVyIHdhcyBlbmNvdW50ZXJlZCBpbiB0aGUgcHJvdmlkZWQgc3RyaW5nIHdoaWNoIGluZGljYXRlcyBpdCB3YXMgbm90IGVuY29kZWQgYXMgYSBiaW5hcnkgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGJ5dGVzW2ldID0gY29kZTtcbiAgICAgICAgKytpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJ5dGVzLmJ1ZmZlcjtcbiAgICB9XG4gIH1cbn1cbiIsIi8vIFRPRE86IE9wdGltaXplIHVzaW5nIGRlZmVycmVkIHBhcnNpbmcuXG4vLyBJZiBhIGRhdGEgVVJMIHN0cmluZyBpcyBwYXNzZWQgaW4gYW5kIHRoZSBvbmx5IG9wZXJhdGlvbiBjYWxsZWQgaXNcbi8vIHRvU3RyaW5nKCkgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIHBhcnNlIGFuZCBpbmNyZWFzZVxuLy8gbWVtb3J5IGNvbnN1bXB0aW9uLiBUaGlzIHdvdWxkIGNvbXBsaWNhdGUgdGhlIGNvZGUgdGhvdWdoXG4vLyBzbyBvbmx5IGltcGxlbWVudCBpZiBuZWVkZWQuXG5cbmRlY2xhcmUgdmFyIGVzY2FwZTooczpzdHJpbmcpID0+IHN0cmluZztcbmRlY2xhcmUgdmFyIHVuZXNjYXBlOihzOnN0cmluZykgPT4gc3RyaW5nO1xuXG5tb2R1bGUgU3BpY3lQaXhlbCB7XG4gIC8vIGRhdGE6WzxNSU1FLXR5cGU+XVs7Y2hhcnNldD08ZW5jb2Rpbmc+XVs7YmFzZTY0XSw8ZGF0YT5cblxuICAvLyBkYXRhdXJsICAgIDo9IFwiZGF0YTpcIiBbIG1lZGlhdHlwZSBdIFsgXCI7YmFzZTY0XCIgXSBcIixcIiBkYXRhXG4gIC8vIG1lZGlhdHlwZSAgOj0gWyB0eXBlIFwiL1wiIHN1YnR5cGUgXSAqKCBcIjtcIiBwYXJhbWV0ZXIgKVxuICAvLyBkYXRhICAgICAgIDo9ICp1cmxjaGFyXG4gIC8vIHBhcmFtZXRlciAgOj0gYXR0cmlidXRlIFwiPVwiIHZhbHVlXG4gIGV4cG9ydCBjbGFzcyBEYXRhVVJMIHtcbiAgICBwcml2YXRlIF9tZWRpYVR5cGU6TWVkaWFUeXBlO1xuICAgIHByaXZhdGUgX2lzQmFzZTY0OmJvb2xlYW47XG4gICAgcHJpdmF0ZSBfZGF0YTpzdHJpbmc7XG5cbiAgICBnZXQgbWVkaWFUeXBlKCk6TWVkaWFUeXBlIHtcbiAgICAgIHJldHVybiB0aGlzLl9tZWRpYVR5cGU7XG4gICAgfVxuXG4gICAgc2V0IG1lZGlhVHlwZShtZWRpYVR5cGU6TWVkaWFUeXBlKSB7XG4gICAgICBpZihtZWRpYVR5cGUgaW5zdGFuY2VvZiBNZWRpYVR5cGUpIHtcbiAgICAgICAgdGhpcy5fbWVkaWFUeXBlID0gbWVkaWFUeXBlO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAodHlwZW9mIG1lZGlhVHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aGlzLl9tZWRpYVR5cGUgPSBuZXcgTWVkaWFUeXBlKDxzdHJpbmc+PGFueT5tZWRpYVR5cGUpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1lZGlhIHR5cGUgbXVzdCBiZSAnc3RyaW5nJyBvciAnTWVkaWFUeXBlJ1wiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgaXNCYXNlNjQoKTpib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLl9pc0Jhc2U2NDtcbiAgICB9XG5cbiAgICBnZXQgZGF0YSgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICB9XG5cbiAgICBzZXRCYXNlNjRFbmNvZGVkRGF0YShiYXNlNjRFbmNvZGVkRGF0YTpzdHJpbmcpOnZvaWQge1xuICAgICAgdGhpcy5faXNCYXNlNjQgPSB0cnVlO1xuICAgICAgdGhpcy5fZGF0YSA9IGJhc2U2NEVuY29kZWREYXRhO1xuICAgIH1cblxuICAgIHNldFVSTEVuY29kZWREYXRhKHVybEVuY29kZWREYXRhOnN0cmluZyk6dm9pZCB7XG4gICAgICB0aGlzLl9pc0Jhc2U2NCA9IGZhbHNlO1xuICAgICAgdGhpcy5fZGF0YSA9IHVybEVuY29kZWREYXRhO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKGRhdGE6YW55LCBvcHRpb25zPzphbnkpIHtcbiAgICAgIC8vIFNldCBkZWZhdWx0IG9wdGlvbnNcbiAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgIG1lZGlhVHlwZTogbnVsbCxcbiAgICAgICAgICBlbmNvZGluZzogXCJhdXRvXCJcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgaWYoIW9wdGlvbnMuZW5jb2RpbmcpIHtcbiAgICAgICAgb3B0aW9ucy5lbmNvZGluZyA9IFwiYXV0b1wiO1xuICAgICAgfVxuXG4gICAgICAvLyBWYWxpZGF0ZSBlbmNvZGluZ1xuICAgICAgaWYgKG9wdGlvbnMuZW5jb2RpbmcgIT09IFwiYXV0b1wiICYmIG9wdGlvbnMuZW5jb2RpbmcgIT09IFwidXJsXCIgJiYgb3B0aW9ucy5lbmNvZGluZyAhPT0gXCJiYXNlNjRcIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIGVuY29kaW5nIChtdXN0IGJlICdhdXRvJywgJ3VybCcsIG9yICdiYXNlNjQnKTogXCIgKyBvcHRpb25zLmVuY29kaW5nKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2F2ZSBtZWRpYSB0eXBlXG4gICAgICB2YXIgbWVkaWFUeXBlOmFueSA9IG9wdGlvbnMubWVkaWFUeXBlO1xuICAgICAgaWYgKHR5cGVvZiBtZWRpYVR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgbWVkaWFUeXBlID0gbmV3IE1lZGlhVHlwZShtZWRpYVR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWVkaWFUeXBlID0gbWVkaWFUeXBlO1xuXG4gICAgICAvLyBTYXZlIGRhdGEgYW5kIHJldHVybiBpZiBub25lXG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgdGhpcy5faXNCYXNlNjQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgZGF0YVxuICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJiYXNlNjRcIiB8fCBvcHRpb25zLmVuY29kaW5nID09PSBcImF1dG9cIikge1xuICAgICAgICAgIHRoaXMuc2V0QmFzZTY0RW5jb2RlZERhdGEoQXJyYXlCdWZmZXJDb252ZXJ0ZXIudG9CYXNlNjQoZGF0YSkpO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZW5jb2RpbmcgPT09IFwidXJsXCIpIHtcbiAgICAgICAgICB0aGlzLnNldFVSTEVuY29kZWREYXRhKGVuY29kZVVSSUNvbXBvbmVudChBcnJheUJ1ZmZlckNvbnZlcnRlci50b0JpbmFyeVN0cmluZyhkYXRhKSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGlzIGlzIGEgZGF0YSBVUklcbiAgICAgICAgdmFyIHN0YXJ0c1dpdGhEYXRhID0gZGF0YS5zbGljZSgwLCBcImRhdGE6XCIubGVuZ3RoKSA9PT0gXCJkYXRhOlwiO1xuICAgICAgICBpZiAoIXN0YXJ0c1dpdGhEYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT25seSAnZGF0YScgVVJJIHN0cmluZ3MgYXJlIHN1cHBvcnRlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpbmQgdGhlIGNvbW1hIHRoYXQgc2VwYXJhdGVzIHRoZSBwcmVmaXggZnJvbSB0aGUgZGF0YVxuICAgICAgICB2YXIgY29tbWFJbmRleCA9IGRhdGEuaW5kZXhPZihcIixcIik7XG4gICAgICAgIGlmIChjb21tYUluZGV4ID09PSAtMSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgY29tbWEgaW4gU1FMQmxvYiBVUkxcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgcHJlZml4IGFuZCBkYXRhXG4gICAgICAgIHZhciBwcmVmaXggPSBkYXRhLnNsaWNlKDAsIGNvbW1hSW5kZXgpO1xuICAgICAgICB2YXIgZW5jb2RlZERhdGEgPSBkYXRhLnNsaWNlKGNvbW1hSW5kZXggKyAxKTtcblxuICAgICAgICAvLyBHZXQgaXMgYmFzZTY0XG4gICAgICAgIHZhciBwcmVmaXhQYXJ0cyA9IHByZWZpeC5zcGxpdCgnOycpO1xuICAgICAgICB2YXIgaXNCYXNlNjQgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBwcmVmaXhQYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIHZhciBwcmVmaXhQYXJ0ID0gcHJlZml4UGFydHNbaV0udHJpbSgpO1xuICAgICAgICAgIGlmIChwcmVmaXhQYXJ0ID09PSBcImJhc2U2NFwiKSB7XG4gICAgICAgICAgICBpc0Jhc2U2NCA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgbWVkaWEgdHlwZVxuICAgICAgICBtZWRpYVR5cGUgPSBwcmVmaXguc2xpY2UoXCJkYXRhOlwiLmxlbmd0aCwgY29tbWFJbmRleCk7XG4gICAgICAgIG1lZGlhVHlwZSA9IG1lZGlhVHlwZS5sZW5ndGggPT09IDAgPyBudWxsIDogbWVkaWFUeXBlO1xuICAgICAgICB0aGlzLl9tZWRpYVR5cGUgPSB0aGlzLl9tZWRpYVR5cGUgfHwgbmV3IE1lZGlhVHlwZShtZWRpYVR5cGUpO1xuXG4gICAgICAgIC8vIENvbnZlcnQgZW5jb2RlZCBkYXRhIGFzIG5lZWRlZFxuICAgICAgICBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICAvLyBBdXRvIGVuY29kaW5nIHNhdmVzIHRoZSBkYXRhIFVSSSBhcyBpc1xuICAgICAgICAgIHRoaXMuX2lzQmFzZTY0ID0gaXNCYXNlNjQ7XG4gICAgICAgICAgdGhpcy5fZGF0YSA9IGVuY29kZWREYXRhO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIpIHtcbiAgICAgICAgICAvLyBDb252ZXJ0IHRvIGJhc2U2NFxuICAgICAgICAgIHRoaXMuX2lzQmFzZTY0ID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoaXNCYXNlNjQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgPSBlbmNvZGVkRGF0YTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZGF0YSA9IHdpbmRvdy5idG9hKHVuZXNjYXBlKGVuY29kZWREYXRhKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZW5jb2RpbmcgPT09IFwidXJsXCIpIHtcbiAgICAgICAgICAvLyBDb252ZXJ0IHRvIFVSTCBlbmNvZGluZ1xuICAgICAgICAgIHRoaXMuX2lzQmFzZTY0ID0gZmFsc2U7XG4gICAgICAgICAgaWYgKCFpc0Jhc2U2NCkge1xuICAgICAgICAgICAgdGhpcy5fZGF0YSA9IGVuY29kZWREYXRhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhID0gZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5hdG9iKGVuY29kZWREYXRhKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bnN1cHBvcnRlZCBvYmplY3QgdHlwZSAobXVzdCBiZSBBcnJheUJ1ZmZlciBvciBzdHJpbmcpOiBcIiArIHR5cGVvZiBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b1N0cmluZygpOnN0cmluZyB7XG4gICAgICByZXR1cm4gXCJkYXRhOlwiXG4gICAgICAgICsgKHRoaXMuX21lZGlhVHlwZSA/IHRoaXMuX21lZGlhVHlwZS50b1N0cmluZygpIDogXCJcIilcbiAgICAgICAgKyAodGhpcy5faXNCYXNlNjQgPyBcIjtiYXNlNjRcIiA6IFwiXCIpICsgXCIsXCJcbiAgICAgICAgKyAodGhpcy5fZGF0YSA/IHRoaXMuX2RhdGEgOiBcIlwiKTtcbiAgICB9XG5cbiAgICB0b0pTT04oKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICB2YWx1ZU9mKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgdG9BcnJheUJ1ZmZlcigpOkFycmF5QnVmZmVyIHtcbiAgICAgIGlmICghdGhpcy5fZGF0YSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9pc0Jhc2U2NCkge1xuICAgICAgICByZXR1cm4gQXJyYXlCdWZmZXJDb252ZXJ0ZXIuZnJvbUJhc2U2NCh0aGlzLl9kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBBcnJheUJ1ZmZlckNvbnZlcnRlci5mcm9tQmluYXJ5U3RyaW5nKHVuZXNjYXBlKHRoaXMuX2RhdGEpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b0Jhc2U2NCgpOnN0cmluZyB7XG4gICAgICBpZiAoIXRoaXMuX2RhdGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5faXNCYXNlNjQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gd2luZG93LmJ0b2EodW5lc2NhcGUodGhpcy5fZGF0YSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRvQmluYXJ5U3RyaW5nKCk6c3RyaW5nIHtcbiAgICAgIGlmICghdGhpcy5fZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9pc0Jhc2U2NCkge1xuICAgICAgICByZXR1cm4gd2luZG93LmF0b2IodGhpcy5fZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5lc2NhcGUodGhpcy5fZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdG9Vbmljb2RlU3RyaW5nKCk6c3RyaW5nIHtcbiAgICAgIGlmICghdGhpcy5fZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9pc0Jhc2U2NCkge1xuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGVzY2FwZSh3aW5kb3cuYXRvYih0aGlzLl9kYXRhKSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudCh0aGlzLl9kYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbUJhc2U2NChiYXNlNjQ6c3RyaW5nLCBvcHRpb25zPzphbnkpOkRhdGFVUkwge1xuICAgICAgcmV0dXJuIG5ldyBEYXRhVVJMKFwiZGF0YTo7YmFzZTY0LFwiICsgYmFzZTY0LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbUJpbmFyeVN0cmluZyhiaW5hcnk6c3RyaW5nLCBvcHRpb25zPzphbnkpOkRhdGFVUkwge1xuICAgICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgZW5jb2Rpbmc6IFwiYXV0b1wiXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJiYXNlNjRcIiB8fCBvcHRpb25zLmVuY29kaW5nID09PSBcImF1dG9cIikge1xuICAgICAgICByZXR1cm4gbmV3IERhdGFVUkwoXCJkYXRhOjtiYXNlNjQsXCIgKyB3aW5kb3cuYnRvYShiaW5hcnkpLCBvcHRpb25zKTtcbiAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJ1cmxcIikge1xuICAgICAgICByZXR1cm4gbmV3IERhdGFVUkwoXCJkYXRhOixcIiArIGVuY29kZVVSSUNvbXBvbmVudChiaW5hcnkpLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbVVuaWNvZGVTdHJpbmcodGV4dDpzdHJpbmcsIG9wdGlvbnM/OmFueSk6RGF0YVVSTCB7XG4gICAgICByZXR1cm4gbmV3IERhdGFVUkwoXCJkYXRhOixcIiArIGVuY29kZVVSSUNvbXBvbmVudCh0ZXh0KSwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG59XG4iLCIvKipcbiAqIG1lZGlhLXR5cGVcbiAqIEBhdXRob3IgTG92ZWxsIEZ1bGxlciAob3JpZ2luYWwgSlMpXG4gKiBAYXV0aG9yIEFhcm9uIE9uZWFsIChUeXBlU2NyaXB0KVxuICpcbiAqIFRoaXMgY29kZSBpcyBkaXN0cmlidXRlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UgVmVyc2lvbiAyLjAsIHRoZSB0ZXJtcyBvZlxuICogd2hpY2ggbWF5IGJlIGZvdW5kIGF0IGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMC5odG1sXG4gKi9cblxubW9kdWxlIFNwaWN5UGl4ZWwge1xuICB2YXIgbWVkaWFUeXBlTWF0Y2hlciA9IC9eKGFwcGxpY2F0aW9ufGF1ZGlvfGltYWdlfG1lc3NhZ2V8bW9kZWx8bXVsdGlwYXJ0fHRleHR8dmlkZW8pXFwvKFthLXpBLVowLTkhIyQlXiZcXCpfXFwtXFwre31cXHwnLmB+XXsxLDEyN30pKDsuKik/JC87XG4gIHZhciBwYXJhbWV0ZXJTcGxpdHRlciA9IC87KD89KD86W15cXFwiXSpcXFwiW15cXFwiXSpcXFwiKSooPyFbXlxcXCJdKlxcXCIpKS87XG5cbiAgZXhwb3J0IGNsYXNzIE1lZGlhVHlwZSB7XG4gICAgcHJpdmF0ZSBfdHlwZTpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc3VidHlwZTpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyczphbnk7XG4gICAgcHJpdmF0ZSBfc3VmZml4OnN0cmluZztcbiAgICBwcml2YXRlIF9zdWJ0eXBlRmFjZXRzOnN0cmluZ1tdO1xuXG4gICAgY29uc3RydWN0b3IobWVkaWFUeXBlPzpzdHJpbmcpIHtcbiAgICAgIHRoaXMuX3R5cGUgPSBudWxsO1xuICAgICAgdGhpcy5zZXRTdWJ0eXBlQW5kU3VmZml4KG51bGwpO1xuICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IHt9O1xuXG4gICAgICBpZiAobWVkaWFUeXBlKSB7XG4gICAgICAgIHZhciBtYXRjaCA9IG1lZGlhVHlwZS5tYXRjaChtZWRpYVR5cGVNYXRjaGVyKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgdGhpcy5fdHlwZSA9IG1hdGNoWzFdO1xuICAgICAgICAgIHRoaXMuc2V0U3VidHlwZUFuZFN1ZmZpeChtYXRjaFsyXSk7XG4gICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICBtYXRjaFszXS5zdWJzdHIoMSkuc3BsaXQocGFyYW1ldGVyU3BsaXR0ZXIpLmZvckVhY2goKHBhcmFtZXRlcikgPT4ge1xuICAgICAgICAgICAgICB2YXIga2V5QW5kVmFsdWUgPSBwYXJhbWV0ZXIuc3BsaXQoJz0nLCAyKTtcbiAgICAgICAgICAgICAgaWYgKGtleUFuZFZhbHVlLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNba2V5QW5kVmFsdWVbMF0udG9Mb3dlckNhc2UoKS50cmltKCldID0gdGhpcy51bndyYXBRdW90ZXMoa2V5QW5kVmFsdWVbMV0udHJpbSgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHR5cGUoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gICAgfVxuXG4gICAgc2V0IHR5cGUodHlwZTpzdHJpbmcpIHtcbiAgICAgIHRoaXMuX3R5cGUgPSB0eXBlO1xuICAgIH1cblxuICAgIGdldCBzdWJ0eXBlKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdWJ0eXBlO1xuICAgIH1cblxuICAgIHNldCBzdWJ0eXBlKHN1YnR5cGU6c3RyaW5nKSB7XG4gICAgICB0aGlzLnNldFN1YnR5cGVBbmRTdWZmaXgoc3VidHlwZSk7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtZXRlcnMoKTphbnkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgc2V0IHBhcmFtZXRlcnMocGFyYW1ldGVyczphbnkpIHtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzO1xuICAgIH1cblxuICAgIGdldCBpc1ZhbGlkKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5fdHlwZSAhPT0gbnVsbCAmJiB0aGlzLl9zdWJ0eXBlICE9PSBudWxsICYmIHRoaXMuX3N1YnR5cGUgIT09IFwiZXhhbXBsZVwiO1xuICAgIH1cblxuICAgIGdldCBoYXNTdWZmaXgoKTpib29sZWFuIHtcbiAgICAgIHJldHVybiAhIXRoaXMuX3N1ZmZpeDtcbiAgICB9XG5cbiAgICBnZXQgaXNWZW5kb3IoKTpib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLmZpcnN0U3VidHlwZUZhY2V0RXF1YWxzKFwidm5kXCIpO1xuICAgIH1cblxuICAgIGdldCBpc1BlcnNvbmFsKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5maXJzdFN1YnR5cGVGYWNldEVxdWFscyhcInByc1wiKTtcbiAgICB9XG5cbiAgICBnZXQgaXNFeHBlcmltZW50YWwoKTpib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLmZpcnN0U3VidHlwZUZhY2V0RXF1YWxzKFwieFwiKSB8fCB0aGlzLl9zdWJ0eXBlLnN1YnN0cmluZygwLCAyKS50b0xvd2VyQ2FzZSgpID09PSBcIngtXCI7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKTpzdHJpbmcge1xuICAgICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSB7XG4gICAgICAgIHN0ciA9IHN0ciArIHRoaXMuX3R5cGUgKyBcIi9cIiArIHRoaXMuX3N1YnR5cGU7XG4gICAgICAgIGlmICh0aGlzLmhhc1N1ZmZpeCkge1xuICAgICAgICAgIHN0ciA9IHN0ciArIFwiK1wiICsgdGhpcy5fc3VmZml4O1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJhbWV0ZXJLZXlzID0gT2JqZWN0LmtleXModGhpcy5fcGFyYW1ldGVycyk7XG4gICAgICAgIGlmIChwYXJhbWV0ZXJLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgcGFyYW1ldGVyczpzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICBwYXJhbWV0ZXJLZXlzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhLmxvY2FsZUNvbXBhcmUoYik7XG4gICAgICAgICAgfSkuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKGVsZW1lbnQgKyBcIj1cIiArIHRoaXMud3JhcFF1b3Rlcyh0aGF0Ll9wYXJhbWV0ZXJzW2VsZW1lbnRdKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc3RyID0gc3RyICsgXCI7XCIgKyBwYXJhbWV0ZXJzLmpvaW4oXCI7XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIHRvSlNPTigpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHZhbHVlT2YoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFN1YnR5cGVBbmRTdWZmaXgoc3VidHlwZTpzdHJpbmcpOnZvaWQge1xuICAgICAgdGhpcy5fc3VidHlwZSA9IHN1YnR5cGU7XG4gICAgICB0aGlzLl9zdWJ0eXBlRmFjZXRzID0gW107XG4gICAgICB0aGlzLl9zdWZmaXggPSBudWxsO1xuICAgICAgaWYgKHN1YnR5cGUpIHtcbiAgICAgICAgaWYgKHN1YnR5cGUuaW5kZXhPZihcIitcIikgPiAtMSAmJiBzdWJ0eXBlLnN1YnN0cigtMSkgIT09IFwiK1wiKSB7XG4gICAgICAgICAgdmFyIGZpeGVzID0gc3VidHlwZS5zcGxpdChcIitcIiwgMik7XG4gICAgICAgICAgdGhpcy5fc3VidHlwZSA9IGZpeGVzWzBdO1xuICAgICAgICAgIHRoaXMuX3N1YnR5cGVGYWNldHMgPSBmaXhlc1swXS5zcGxpdChcIi5cIik7XG4gICAgICAgICAgdGhpcy5fc3VmZml4ID0gZml4ZXNbMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fc3VidHlwZUZhY2V0cyA9IHN1YnR5cGUuc3BsaXQoXCIuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaXJzdFN1YnR5cGVGYWNldEVxdWFscyhzdHI6c3RyaW5nKTpib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdWJ0eXBlRmFjZXRzLmxlbmd0aCA+IDAgJiYgdGhpcy5fc3VidHlwZUZhY2V0c1swXSA9PT0gc3RyO1xuICAgIH1cblxuICAgIHByaXZhdGUgd3JhcFF1b3RlcyhzdHI6c3RyaW5nKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIChzdHIuaW5kZXhPZihcIjtcIikgPiAtMSkgPyAnXCInICsgc3RyICsgJ1wiJyA6IHN0cjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVud3JhcFF1b3RlcyhzdHI6c3RyaW5nKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIChzdHIuc3Vic3RyKDAsIDEpID09PSAnXCInICYmIHN0ci5zdWJzdHIoLTEpID09PSAnXCInKSA/IHN0ci5zdWJzdHIoMSwgc3RyLmxlbmd0aCAtIDIpIDogc3RyO1xuICAgIH1cbiAgfVxufVxuIiwibW9kdWxlIFNwaWN5UGl4ZWwge1xuICAgIGV4cG9ydCBjbGFzcyBJbXBvcnRzIHtcbiAgICB9XG59XG5cbmRlY2xhcmUgdmFyIG1vZHVsZTphbnk7XG5kZWNsYXJlIHZhciBleHBvcnRzOmFueTtcbmRlY2xhcmUgdmFyIGRlZmluZTphbnk7XG5kZWNsYXJlIHZhciByZXF1aXJlOmFueTtcblxuKGZ1bmN0aW9uIChyb290OmFueSwgZmFjdG9yeTphbnkpIHtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIEFNRCBhbm9ueW1vdXMgbW9kdWxlXG4gICAgICAgIGRlZmluZShbXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gQ29tbW9uSlMgYW5vbnltb3VzIG1vZHVsZVxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICAgICAgcm9vdC5TcGljeVBpeGVsID0gZmFjdG9yeSgpO1xuICAgIH1cbn0pKHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gU3BpY3lQaXhlbDtcbn0pOyJdLCJzb3VyY2VSb290IjoiLi8ifQ==