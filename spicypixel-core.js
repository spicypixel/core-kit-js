var SpicyPixel;
(function (SpicyPixel) {
    var Core;
    (function (Core) {
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
        Core.ArrayBufferConverter = ArrayBufferConverter;
    })(Core = SpicyPixel.Core || (SpicyPixel.Core = {}));
})(SpicyPixel || (SpicyPixel = {}));

// TODO: Optimize using deferred parsing.
// If a data URL string is passed in and the only operation called is
// toString() then there is no need to parse and increase
// memory consumption. This would complicate the code though
// so only implement if needed.
var SpicyPixel;
(function (SpicyPixel) {
    var Core;
    (function (Core) {
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
                    mediaType = new Core.MediaType(mediaType);
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
                        this.setBase64EncodedData(Core.ArrayBufferConverter.toBase64(data));
                    }
                    else if (options.encoding === "url") {
                        this.setURLEncodedData(encodeURIComponent(Core.ArrayBufferConverter.toBinaryString(data)));
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
                    this._mediaType = this._mediaType || new Core.MediaType(mediaType);
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
                    if (mediaType instanceof Core.MediaType) {
                        this._mediaType = mediaType;
                    }
                    else if (typeof mediaType === "string") {
                        this._mediaType = new Core.MediaType(mediaType);
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
                    return Core.ArrayBufferConverter.fromBase64(this._data);
                }
                else {
                    return Core.ArrayBufferConverter.fromBinaryString(unescape(this._data));
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
        Core.DataURL = DataURL;
    })(Core = SpicyPixel.Core || (SpicyPixel.Core = {}));
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
    var Core;
    (function (Core) {
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
        Core.MediaType = MediaType;
    })(Core = SpicyPixel.Core || (SpicyPixel.Core = {}));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BcnJheUJ1ZmZlckNvbnZlcnRlci50cyIsInNyYy9EYXRhVVJMLnRzIiwic3JjL01lZGlhVHlwZS50cyIsInNyYy9Vbml2ZXJzYWxNb2R1bGUudHMiXSwibmFtZXMiOlsiU3BpY3lQaXhlbCIsIlNwaWN5UGl4ZWwuQ29yZSIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlciIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlci5jb25zdHJ1Y3RvciIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlci50b0Jhc2U2NCIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlci5mcm9tQmFzZTY0IiwiU3BpY3lQaXhlbC5Db3JlLkFycmF5QnVmZmVyQ29udmVydGVyLnRvQmluYXJ5U3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkFycmF5QnVmZmVyQ29udmVydGVyLmZyb21CaW5hcnlTdHJpbmciLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTCIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLmNvbnN0cnVjdG9yIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwubWVkaWFUeXBlIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwuaXNCYXNlNjQiLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC5kYXRhIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwuc2V0QmFzZTY0RW5jb2RlZERhdGEiLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC5zZXRVUkxFbmNvZGVkRGF0YSIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLnRvU3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwudG9KU09OIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwudmFsdWVPZiIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLnRvQXJyYXlCdWZmZXIiLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC50b0Jhc2U2NCIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLnRvQmluYXJ5U3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwudG9Vbmljb2RlU3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwuY3JlYXRlRnJvbUJhc2U2NCIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLmNyZWF0ZUZyb21CaW5hcnlTdHJpbmciLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC5jcmVhdGVGcm9tVW5pY29kZVN0cmluZyIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLmNvbnN0cnVjdG9yIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS50eXBlIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5zdWJ0eXBlIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5wYXJhbWV0ZXJzIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5pc1ZhbGlkIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5oYXNTdWZmaXgiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLmlzVmVuZG9yIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5pc1BlcnNvbmFsIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5pc0V4cGVyaW1lbnRhbCIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUudG9TdHJpbmciLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLnRvSlNPTiIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUudmFsdWVPZiIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUuc2V0U3VidHlwZUFuZFN1ZmZpeCIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUuZmlyc3RTdWJ0eXBlRmFjZXRFcXVhbHMiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLndyYXBRdW90ZXMiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLnVud3JhcFF1b3RlcyIsIlNwaWN5UGl4ZWwuSW1wb3J0cyIsIlNwaWN5UGl4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LE1BQU1BLENBQUNBO2dCQUN4QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ1ZBLElBQUlBLFFBQWVBLEVBQUVBLFFBQWVBLEVBQUVBLFFBQWVBLEVBQUVBLFFBQWVBLENBQUNBO2dCQUV2RUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3RDQSxZQUFZQSxFQUFFQSxDQUFDQTtvQkFDZkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3RDQSxZQUFZQSxFQUFFQSxDQUFDQTtvQkFDakJBLENBQUNBO2dCQUNIQSxDQUFDQTtnQkFFREEsSUFBSUEsV0FBV0EsR0FBR0EsSUFBSUEsV0FBV0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsRUFDN0NBLEtBQUtBLEdBQUdBLElBQUlBLFVBQVVBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO2dCQUV0Q0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0EsSUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7b0JBQzlCQSxRQUFRQSxHQUFHQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDcENBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEdBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUN0Q0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3RDQSxRQUFR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O0lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDckMsQUFDQSw0QkFENEI7UUFDNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixBQUNBLGtCQURrQjtRQUNsQixJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sRUFBRSxDQUFDO0lBQ2hDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7SUFDTCxNQUFNLENBQUMsVUFBVSxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6InNwaWN5cGl4ZWwtY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZSBTcGljeVBpeGVsLkNvcmUge1xuICB2YXIgY2hhcnMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIjtcblxuICBleHBvcnQgY2xhc3MgQXJyYXlCdWZmZXJDb252ZXJ0ZXJcbiAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGNsYXNzIGlzIHN0YXRpYyBhbmQgbm90IG1lYW50IHRvIGJlIGNvbnN0cnVjdGVkJyk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBCYXNlNjQgY29udmVyc2lvbiBmcm9tOlxuICAgICAqXG4gICAgICogYmFzZTY0LWFycmF5YnVmZmVyXG4gICAgICogaHR0cHM6Ly9naXRodWIuY29tL25pa2xhc3ZoL2Jhc2U2NC1hcnJheWJ1ZmZlclxuICAgICAqXG4gICAgICogQ29weXJpZ2h0IChjKSAyMDEyIE5pa2xhcyB2b24gSGVydHplblxuICAgICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAgICAgKi9cbiAgICBzdGF0aWMgdG9CYXNlNjQoYXJyYXlCdWZmZXI6QXJyYXlCdWZmZXIpOnN0cmluZyB7XG4gICAgICAvLyBqc2hpbnQgYml0d2lzZTpmYWxzZVxuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aDtcbiAgICAgIHZhciBiYXNlNjQgPSBcIlwiO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSs9Mykge1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaV0gPj4gMl07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2ldICYgMykgPDwgNCkgfCAoYnl0ZXNbaSArIDFdID4+IDQpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaSArIDFdICYgMTUpIDw8IDIpIHwgKGJ5dGVzW2kgKyAyXSA+PiA2KV07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpICsgMl0gJiA2M107XG4gICAgICB9XG5cbiAgICAgIGlmICgobGVuICUgMykgPT09IDIpIHtcbiAgICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMSkgKyBcIj1cIjtcbiAgICAgIH0gZWxzZSBpZiAobGVuICUgMyA9PT0gMSkge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAyKSArIFwiPT1cIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJhc2U2NDtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOnRydWVcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbUJhc2U2NChiYXNlNjQ6c3RyaW5nKTpBcnJheUJ1ZmZlciB7XG4gICAgICAvLyBqc2hpbnQgYml0d2lzZTpmYWxzZVxuICAgICAgdmFyIGJ1ZmZlckxlbmd0aCA9IGJhc2U2NC5sZW5ndGggKiAwLjc1O1xuICAgICAgdmFyIGxlbiA9IGJhc2U2NC5sZW5ndGg7XG4gICAgICB2YXIgcCA9IDA7XG4gICAgICB2YXIgZW5jb2RlZDE6bnVtYmVyLCBlbmNvZGVkMjpudW1iZXIsIGVuY29kZWQzOm51bWJlciwgZW5jb2RlZDQ6bnVtYmVyO1xuXG4gICAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAxXSA9PT0gXCI9XCIpIHtcbiAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDJdID09PSBcIj1cIikge1xuICAgICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBhcnJheWJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihidWZmZXJMZW5ndGgpLFxuICAgICAgICBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrPTQpIHtcbiAgICAgICAgZW5jb2RlZDEgPSBjaGFycy5pbmRleE9mKGJhc2U2NFtpXSk7XG4gICAgICAgIGVuY29kZWQyID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSsxXSk7XG4gICAgICAgIGVuY29kZWQzID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSsyXSk7XG4gICAgICAgIGVuY29kZWQ0ID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSszXSk7XG5cbiAgICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMSA8PCAyKSB8IChlbmNvZGVkMiA+PiA0KTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDIgJiAxNSkgPDwgNCkgfCAoZW5jb2RlZDMgPj4gMik7XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQzICYgMykgPDwgNikgfCAoZW5jb2RlZDQgJiA2Myk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheWJ1ZmZlcjtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOnRydWVcbiAgICB9XG5cbiAgICBzdGF0aWMgdG9CaW5hcnlTdHJpbmcoYXJyYXlCdWZmZXI6QXJyYXlCdWZmZXIpOnN0cmluZyB7XG4gICAgICB2YXIgYmluYXJ5ID0gXCJcIjtcbiAgICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICAgIHZhciBsZW5ndGggPSBieXRlcy5ieXRlTGVuZ3RoO1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcbiAgICAgICAgYmluYXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICAgICAgICArK2k7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmluYXJ5O1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tQmluYXJ5U3RyaW5nKGJpbmFyeTpzdHJpbmcpOkFycmF5QnVmZmVyIHtcbiAgICAgIHZhciBsZW5ndGggPSBiaW5hcnkubGVuZ3RoO1xuICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb2RlID0gYmluYXJ5LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmIChjb2RlID4gMjU1KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYSBtdWx0aWJ5dGUgY2hhcmFjdGVyIHdhcyBlbmNvdW50ZXJlZCBpbiB0aGUgcHJvdmlkZWQgc3RyaW5nIHdoaWNoIGluZGljYXRlcyBpdCB3YXMgbm90IGVuY29kZWQgYXMgYSBiaW5hcnkgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGJ5dGVzW2ldID0gY29kZTtcbiAgICAgICAgKytpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJ5dGVzLmJ1ZmZlcjtcbiAgICB9XG4gIH1cbn1cbiIsIi8vIFRPRE86IE9wdGltaXplIHVzaW5nIGRlZmVycmVkIHBhcnNpbmcuXG4vLyBJZiBhIGRhdGEgVVJMIHN0cmluZyBpcyBwYXNzZWQgaW4gYW5kIHRoZSBvbmx5IG9wZXJhdGlvbiBjYWxsZWQgaXNcbi8vIHRvU3RyaW5nKCkgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIHBhcnNlIGFuZCBpbmNyZWFzZVxuLy8gbWVtb3J5IGNvbnN1bXB0aW9uLiBUaGlzIHdvdWxkIGNvbXBsaWNhdGUgdGhlIGNvZGUgdGhvdWdoXG4vLyBzbyBvbmx5IGltcGxlbWVudCBpZiBuZWVkZWQuXG5cbmRlY2xhcmUgdmFyIGVzY2FwZTooczpzdHJpbmcpID0+IHN0cmluZztcbmRlY2xhcmUgdmFyIHVuZXNjYXBlOihzOnN0cmluZykgPT4gc3RyaW5nO1xuXG5tb2R1bGUgU3BpY3lQaXhlbC5Db3JlIHtcbiAgLy8gZGF0YTpbPE1JTUUtdHlwZT5dWztjaGFyc2V0PTxlbmNvZGluZz5dWztiYXNlNjRdLDxkYXRhPlxuXG4gIC8vIGRhdGF1cmwgICAgOj0gXCJkYXRhOlwiIFsgbWVkaWF0eXBlIF0gWyBcIjtiYXNlNjRcIiBdIFwiLFwiIGRhdGFcbiAgLy8gbWVkaWF0eXBlICA6PSBbIHR5cGUgXCIvXCIgc3VidHlwZSBdICooIFwiO1wiIHBhcmFtZXRlciApXG4gIC8vIGRhdGEgICAgICAgOj0gKnVybGNoYXJcbiAgLy8gcGFyYW1ldGVyICA6PSBhdHRyaWJ1dGUgXCI9XCIgdmFsdWVcbiAgZXhwb3J0IGNsYXNzIERhdGFVUkwge1xuICAgIHByaXZhdGUgX21lZGlhVHlwZTpNZWRpYVR5cGU7XG4gICAgcHJpdmF0ZSBfaXNCYXNlNjQ6Ym9vbGVhbjtcbiAgICBwcml2YXRlIF9kYXRhOnN0cmluZztcblxuICAgIGdldCBtZWRpYVR5cGUoKTpNZWRpYVR5cGUge1xuICAgICAgcmV0dXJuIHRoaXMuX21lZGlhVHlwZTtcbiAgICB9XG5cbiAgICBzZXQgbWVkaWFUeXBlKG1lZGlhVHlwZTpNZWRpYVR5cGUpIHtcbiAgICAgIGlmKG1lZGlhVHlwZSBpbnN0YW5jZW9mIE1lZGlhVHlwZSkge1xuICAgICAgICB0aGlzLl9tZWRpYVR5cGUgPSBtZWRpYVR5cGU7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2YgbWVkaWFUeXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRoaXMuX21lZGlhVHlwZSA9IG5ldyBNZWRpYVR5cGUoPHN0cmluZz48YW55Pm1lZGlhVHlwZSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWVkaWEgdHlwZSBtdXN0IGJlICdzdHJpbmcnIG9yICdNZWRpYVR5cGUnXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpc0Jhc2U2NCgpOmJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzQmFzZTY0O1xuICAgIH1cblxuICAgIGdldCBkYXRhKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgIH1cblxuICAgIHNldEJhc2U2NEVuY29kZWREYXRhKGJhc2U2NEVuY29kZWREYXRhOnN0cmluZyk6dm9pZCB7XG4gICAgICB0aGlzLl9pc0Jhc2U2NCA9IHRydWU7XG4gICAgICB0aGlzLl9kYXRhID0gYmFzZTY0RW5jb2RlZERhdGE7XG4gICAgfVxuXG4gICAgc2V0VVJMRW5jb2RlZERhdGEodXJsRW5jb2RlZERhdGE6c3RyaW5nKTp2b2lkIHtcbiAgICAgIHRoaXMuX2lzQmFzZTY0ID0gZmFsc2U7XG4gICAgICB0aGlzLl9kYXRhID0gdXJsRW5jb2RlZERhdGE7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoZGF0YTphbnksIG9wdGlvbnM/OmFueSkge1xuICAgICAgLy8gU2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgbWVkaWFUeXBlOiBudWxsLFxuICAgICAgICAgIGVuY29kaW5nOiBcImF1dG9cIlxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZighb3B0aW9ucy5lbmNvZGluZykge1xuICAgICAgICBvcHRpb25zLmVuY29kaW5nID0gXCJhdXRvXCI7XG4gICAgICB9XG5cbiAgICAgIC8vIFZhbGlkYXRlIGVuY29kaW5nXG4gICAgICBpZiAob3B0aW9ucy5lbmNvZGluZyAhPT0gXCJhdXRvXCIgJiYgb3B0aW9ucy5lbmNvZGluZyAhPT0gXCJ1cmxcIiAmJiBvcHRpb25zLmVuY29kaW5nICE9PSBcImJhc2U2NFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gZW5jb2RpbmcgKG11c3QgYmUgJ2F1dG8nLCAndXJsJywgb3IgJ2Jhc2U2NCcpOiBcIiArIG9wdGlvbnMuZW5jb2RpbmcpO1xuICAgICAgfVxuXG4gICAgICAvLyBTYXZlIG1lZGlhIHR5cGVcbiAgICAgIHZhciBtZWRpYVR5cGU6YW55ID0gb3B0aW9ucy5tZWRpYVR5cGU7XG4gICAgICBpZiAodHlwZW9mIG1lZGlhVHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBtZWRpYVR5cGUgPSBuZXcgTWVkaWFUeXBlKG1lZGlhVHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9tZWRpYVR5cGUgPSBtZWRpYVR5cGU7XG5cbiAgICAgIC8vIFNhdmUgZGF0YSBhbmQgcmV0dXJuIGlmIG5vbmVcbiAgICAgIGlmICghZGF0YSkge1xuICAgICAgICB0aGlzLl9pc0Jhc2U2NCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBQYXJzZSBkYXRhXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcImJhc2U2NFwiIHx8IG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYXV0b1wiKSB7XG4gICAgICAgICAgdGhpcy5zZXRCYXNlNjRFbmNvZGVkRGF0YShBcnJheUJ1ZmZlckNvbnZlcnRlci50b0Jhc2U2NChkYXRhKSk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJ1cmxcIikge1xuICAgICAgICAgIHRoaXMuc2V0VVJMRW5jb2RlZERhdGEoZW5jb2RlVVJJQ29tcG9uZW50KEFycmF5QnVmZmVyQ29udmVydGVyLnRvQmluYXJ5U3RyaW5nKGRhdGEpKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgLy8gRW5zdXJlIHRoaXMgaXMgYSBkYXRhIFVSSVxuICAgICAgICB2YXIgc3RhcnRzV2l0aERhdGEgPSBkYXRhLnNsaWNlKDAsIFwiZGF0YTpcIi5sZW5ndGgpID09PSBcImRhdGE6XCI7XG4gICAgICAgIGlmICghc3RhcnRzV2l0aERhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5ICdkYXRhJyBVUkkgc3RyaW5ncyBhcmUgc3VwcG9ydGVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluZCB0aGUgY29tbWEgdGhhdCBzZXBhcmF0ZXMgdGhlIHByZWZpeCBmcm9tIHRoZSBkYXRhXG4gICAgICAgIHZhciBjb21tYUluZGV4ID0gZGF0YS5pbmRleE9mKFwiLFwiKTtcbiAgICAgICAgaWYgKGNvbW1hSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBjb21tYSBpbiBTUUxCbG9iIFVSTFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBwcmVmaXggYW5kIGRhdGFcbiAgICAgICAgdmFyIHByZWZpeCA9IGRhdGEuc2xpY2UoMCwgY29tbWFJbmRleCk7XG4gICAgICAgIHZhciBlbmNvZGVkRGF0YSA9IGRhdGEuc2xpY2UoY29tbWFJbmRleCArIDEpO1xuXG4gICAgICAgIC8vIEdldCBpcyBiYXNlNjRcbiAgICAgICAgdmFyIHByZWZpeFBhcnRzID0gcHJlZml4LnNwbGl0KCc7Jyk7XG4gICAgICAgIHZhciBpc0Jhc2U2NCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHByZWZpeFBhcnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgdmFyIHByZWZpeFBhcnQgPSBwcmVmaXhQYXJ0c1tpXS50cmltKCk7XG4gICAgICAgICAgaWYgKHByZWZpeFBhcnQgPT09IFwiYmFzZTY0XCIpIHtcbiAgICAgICAgICAgIGlzQmFzZTY0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBtZWRpYSB0eXBlXG4gICAgICAgIG1lZGlhVHlwZSA9IHByZWZpeC5zbGljZShcImRhdGE6XCIubGVuZ3RoLCBjb21tYUluZGV4KTtcbiAgICAgICAgbWVkaWFUeXBlID0gbWVkaWFUeXBlLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBtZWRpYVR5cGU7XG4gICAgICAgIHRoaXMuX21lZGlhVHlwZSA9IHRoaXMuX21lZGlhVHlwZSB8fCBuZXcgTWVkaWFUeXBlKG1lZGlhVHlwZSk7XG5cbiAgICAgICAgLy8gQ29udmVydCBlbmNvZGVkIGRhdGEgYXMgbmVlZGVkXG4gICAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcImF1dG9cIikge1xuICAgICAgICAgIC8vIEF1dG8gZW5jb2Rpbmcgc2F2ZXMgdGhlIGRhdGEgVVJJIGFzIGlzXG4gICAgICAgICAgdGhpcy5faXNCYXNlNjQgPSBpc0Jhc2U2NDtcbiAgICAgICAgICB0aGlzLl9kYXRhID0gZW5jb2RlZERhdGE7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJiYXNlNjRcIikge1xuICAgICAgICAgIC8vIENvbnZlcnQgdG8gYmFzZTY0XG4gICAgICAgICAgdGhpcy5faXNCYXNlNjQgPSB0cnVlO1xuICAgICAgICAgIGlmIChpc0Jhc2U2NCkge1xuICAgICAgICAgICAgdGhpcy5fZGF0YSA9IGVuY29kZWREYXRhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhID0gd2luZG93LmJ0b2EodW5lc2NhcGUoZW5jb2RlZERhdGEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJ1cmxcIikge1xuICAgICAgICAgIC8vIENvbnZlcnQgdG8gVVJMIGVuY29kaW5nXG4gICAgICAgICAgdGhpcy5faXNCYXNlNjQgPSBmYWxzZTtcbiAgICAgICAgICBpZiAoIWlzQmFzZTY0KSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhID0gZW5jb2RlZERhdGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgPSBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmF0b2IoZW5jb2RlZERhdGEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuc3VwcG9ydGVkIG9iamVjdCB0eXBlIChtdXN0IGJlIEFycmF5QnVmZmVyIG9yIHN0cmluZyk6IFwiICsgdHlwZW9mIGRhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiBcImRhdGE6XCJcbiAgICAgICAgKyAodGhpcy5fbWVkaWFUeXBlID8gdGhpcy5fbWVkaWFUeXBlLnRvU3RyaW5nKCkgOiBcIlwiKVxuICAgICAgICArICh0aGlzLl9pc0Jhc2U2NCA/IFwiO2Jhc2U2NFwiIDogXCJcIikgKyBcIixcIlxuICAgICAgICArICh0aGlzLl9kYXRhID8gdGhpcy5fZGF0YSA6IFwiXCIpO1xuICAgIH1cblxuICAgIHRvSlNPTigpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHZhbHVlT2YoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICB0b0FycmF5QnVmZmVyKCk6QXJyYXlCdWZmZXIge1xuICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2lzQmFzZTY0KSB7XG4gICAgICAgIHJldHVybiBBcnJheUJ1ZmZlckNvbnZlcnRlci5mcm9tQmFzZTY0KHRoaXMuX2RhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEFycmF5QnVmZmVyQ29udmVydGVyLmZyb21CaW5hcnlTdHJpbmcodW5lc2NhcGUodGhpcy5fZGF0YSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRvQmFzZTY0KCk6c3RyaW5nIHtcbiAgICAgIGlmICghdGhpcy5fZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9pc0Jhc2U2NCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuYnRvYSh1bmVzY2FwZSh0aGlzLl9kYXRhKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdG9CaW5hcnlTdHJpbmcoKTpzdHJpbmcge1xuICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2lzQmFzZTY0KSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuYXRvYih0aGlzLl9kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmVzY2FwZSh0aGlzLl9kYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b1VuaWNvZGVTdHJpbmcoKTpzdHJpbmcge1xuICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2lzQmFzZTY0KSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKHdpbmRvdy5hdG9iKHRoaXMuX2RhdGEpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMuX2RhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tQmFzZTY0KGJhc2U2NDpzdHJpbmcsIG9wdGlvbnM/OmFueSk6RGF0YVVSTCB7XG4gICAgICByZXR1cm4gbmV3IERhdGFVUkwoXCJkYXRhOjtiYXNlNjQsXCIgKyBiYXNlNjQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tQmluYXJ5U3RyaW5nKGJpbmFyeTpzdHJpbmcsIG9wdGlvbnM/OmFueSk6RGF0YVVSTCB7XG4gICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICBlbmNvZGluZzogXCJhdXRvXCJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcImJhc2U2NFwiIHx8IG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYXV0b1wiKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YVVSTChcImRhdGE6O2Jhc2U2NCxcIiArIHdpbmRvdy5idG9hKGJpbmFyeSksIG9wdGlvbnMpO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcInVybFwiKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YVVSTChcImRhdGE6LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGJpbmFyeSksIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tVW5pY29kZVN0cmluZyh0ZXh0OnN0cmluZywgb3B0aW9ucz86YW55KTpEYXRhVVJMIHtcbiAgICAgIHJldHVybiBuZXcgRGF0YVVSTChcImRhdGE6LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRleHQpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cbn1cbiIsIi8qKlxuICogbWVkaWEtdHlwZVxuICogQGF1dGhvciBMb3ZlbGwgRnVsbGVyIChvcmlnaW5hbCBKUylcbiAqIEBhdXRob3IgQWFyb24gT25lYWwgKFR5cGVTY3JpcHQpXG4gKlxuICogVGhpcyBjb2RlIGlzIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSBWZXJzaW9uIDIuMCwgdGhlIHRlcm1zIG9mXG4gKiB3aGljaCBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wLmh0bWxcbiAqL1xuXG5tb2R1bGUgU3BpY3lQaXhlbC5Db3JlIHtcbiAgdmFyIG1lZGlhVHlwZU1hdGNoZXIgPSAvXihhcHBsaWNhdGlvbnxhdWRpb3xpbWFnZXxtZXNzYWdlfG1vZGVsfG11bHRpcGFydHx0ZXh0fHZpZGVvKVxcLyhbYS16QS1aMC05ISMkJV4mXFwqX1xcLVxcK3t9XFx8Jy5gfl17MSwxMjd9KSg7LiopPyQvO1xuICB2YXIgcGFyYW1ldGVyU3BsaXR0ZXIgPSAvOyg/PSg/OlteXFxcIl0qXFxcIlteXFxcIl0qXFxcIikqKD8hW15cXFwiXSpcXFwiKSkvO1xuXG4gIGV4cG9ydCBjbGFzcyBNZWRpYVR5cGUge1xuICAgIHByaXZhdGUgX3R5cGU6c3RyaW5nO1xuICAgIHByaXZhdGUgX3N1YnR5cGU6c3RyaW5nO1xuICAgIHByaXZhdGUgX3BhcmFtZXRlcnM6YW55O1xuICAgIHByaXZhdGUgX3N1ZmZpeDpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc3VidHlwZUZhY2V0czpzdHJpbmdbXTtcblxuICAgIGNvbnN0cnVjdG9yKG1lZGlhVHlwZT86c3RyaW5nKSB7XG4gICAgICB0aGlzLl90eXBlID0gbnVsbDtcbiAgICAgIHRoaXMuc2V0U3VidHlwZUFuZFN1ZmZpeChudWxsKTtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSB7fTtcblxuICAgICAgaWYgKG1lZGlhVHlwZSkge1xuICAgICAgICB2YXIgbWF0Y2ggPSBtZWRpYVR5cGUubWF0Y2gobWVkaWFUeXBlTWF0Y2hlcik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHRoaXMuX3R5cGUgPSBtYXRjaFsxXTtcbiAgICAgICAgICB0aGlzLnNldFN1YnR5cGVBbmRTdWZmaXgobWF0Y2hbMl0pO1xuICAgICAgICAgIGlmIChtYXRjaFszXSkge1xuICAgICAgICAgICAgbWF0Y2hbM10uc3Vic3RyKDEpLnNwbGl0KHBhcmFtZXRlclNwbGl0dGVyKS5mb3JFYWNoKChwYXJhbWV0ZXIpID0+IHtcbiAgICAgICAgICAgICAgdmFyIGtleUFuZFZhbHVlID0gcGFyYW1ldGVyLnNwbGl0KCc9JywgMik7XG4gICAgICAgICAgICAgIGlmIChrZXlBbmRWYWx1ZS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzW2tleUFuZFZhbHVlWzBdLnRvTG93ZXJDYXNlKCkudHJpbSgpXSA9IHRoaXMudW53cmFwUXVvdGVzKGtleUFuZFZhbHVlWzFdLnRyaW0oKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGdldCB0eXBlKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLl90eXBlO1xuICAgIH1cblxuICAgIHNldCB0eXBlKHR5cGU6c3RyaW5nKSB7XG4gICAgICB0aGlzLl90eXBlID0gdHlwZTtcbiAgICB9XG5cbiAgICBnZXQgc3VidHlwZSgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5fc3VidHlwZTtcbiAgICB9XG5cbiAgICBzZXQgc3VidHlwZShzdWJ0eXBlOnN0cmluZykge1xuICAgICAgdGhpcy5zZXRTdWJ0eXBlQW5kU3VmZml4KHN1YnR5cGUpO1xuICAgIH1cblxuICAgIGdldCBwYXJhbWV0ZXJzKCk6YW55IHtcbiAgICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzO1xuICAgIH1cblxuICAgIHNldCBwYXJhbWV0ZXJzKHBhcmFtZXRlcnM6YW55KSB7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gcGFyYW1ldGVycztcbiAgICB9XG5cbiAgICBnZXQgaXNWYWxpZCgpOmJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3R5cGUgIT09IG51bGwgJiYgdGhpcy5fc3VidHlwZSAhPT0gbnVsbCAmJiB0aGlzLl9zdWJ0eXBlICE9PSBcImV4YW1wbGVcIjtcbiAgICB9XG5cbiAgICBnZXQgaGFzU3VmZml4KCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gISF0aGlzLl9zdWZmaXg7XG4gICAgfVxuXG4gICAgZ2V0IGlzVmVuZG9yKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5maXJzdFN1YnR5cGVGYWNldEVxdWFscyhcInZuZFwiKTtcbiAgICB9XG5cbiAgICBnZXQgaXNQZXJzb25hbCgpOmJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRoaXMuZmlyc3RTdWJ0eXBlRmFjZXRFcXVhbHMoXCJwcnNcIik7XG4gICAgfVxuXG4gICAgZ2V0IGlzRXhwZXJpbWVudGFsKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5maXJzdFN1YnR5cGVGYWNldEVxdWFscyhcInhcIikgfHwgdGhpcy5fc3VidHlwZS5zdWJzdHJpbmcoMCwgMikudG9Mb3dlckNhc2UoKSA9PT0gXCJ4LVwiO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICAgIHZhciBzdHIgPSBcIlwiO1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkge1xuICAgICAgICBzdHIgPSBzdHIgKyB0aGlzLl90eXBlICsgXCIvXCIgKyB0aGlzLl9zdWJ0eXBlO1xuICAgICAgICBpZiAodGhpcy5oYXNTdWZmaXgpIHtcbiAgICAgICAgICBzdHIgPSBzdHIgKyBcIitcIiArIHRoaXMuX3N1ZmZpeDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyYW1ldGVyS2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuX3BhcmFtZXRlcnMpO1xuICAgICAgICBpZiAocGFyYW1ldGVyS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIHBhcmFtZXRlcnM6c3RyaW5nW10gPSBbXTtcbiAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgcGFyYW1ldGVyS2V5cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpO1xuICAgICAgICAgIH0pLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaChlbGVtZW50ICsgXCI9XCIgKyB0aGlzLndyYXBRdW90ZXModGhhdC5fcGFyYW1ldGVyc1tlbGVtZW50XSkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHN0ciA9IHN0ciArIFwiO1wiICsgcGFyYW1ldGVycy5qb2luKFwiO1wiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG5cbiAgICB0b0pTT04oKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICB2YWx1ZU9mKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRTdWJ0eXBlQW5kU3VmZml4KHN1YnR5cGU6c3RyaW5nKTp2b2lkIHtcbiAgICAgIHRoaXMuX3N1YnR5cGUgPSBzdWJ0eXBlO1xuICAgICAgdGhpcy5fc3VidHlwZUZhY2V0cyA9IFtdO1xuICAgICAgdGhpcy5fc3VmZml4ID0gbnVsbDtcbiAgICAgIGlmIChzdWJ0eXBlKSB7XG4gICAgICAgIGlmIChzdWJ0eXBlLmluZGV4T2YoXCIrXCIpID4gLTEgJiYgc3VidHlwZS5zdWJzdHIoLTEpICE9PSBcIitcIikge1xuICAgICAgICAgIHZhciBmaXhlcyA9IHN1YnR5cGUuc3BsaXQoXCIrXCIsIDIpO1xuICAgICAgICAgIHRoaXMuX3N1YnR5cGUgPSBmaXhlc1swXTtcbiAgICAgICAgICB0aGlzLl9zdWJ0eXBlRmFjZXRzID0gZml4ZXNbMF0uc3BsaXQoXCIuXCIpO1xuICAgICAgICAgIHRoaXMuX3N1ZmZpeCA9IGZpeGVzWzFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3N1YnR5cGVGYWNldHMgPSBzdWJ0eXBlLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZmlyc3RTdWJ0eXBlRmFjZXRFcXVhbHMoc3RyOnN0cmluZyk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5fc3VidHlwZUZhY2V0cy5sZW5ndGggPiAwICYmIHRoaXMuX3N1YnR5cGVGYWNldHNbMF0gPT09IHN0cjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHdyYXBRdW90ZXMoc3RyOnN0cmluZyk6c3RyaW5nIHtcbiAgICAgIHJldHVybiAoc3RyLmluZGV4T2YoXCI7XCIpID4gLTEpID8gJ1wiJyArIHN0ciArICdcIicgOiBzdHI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1bndyYXBRdW90ZXMoc3RyOnN0cmluZyk6c3RyaW5nIHtcbiAgICAgIHJldHVybiAoc3RyLnN1YnN0cigwLCAxKSA9PT0gJ1wiJyAmJiBzdHIuc3Vic3RyKC0xKSA9PT0gJ1wiJykgPyBzdHIuc3Vic3RyKDEsIHN0ci5sZW5ndGggLSAyKSA6IHN0cjtcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZSBTcGljeVBpeGVsIHtcbiAgICBleHBvcnQgY2xhc3MgSW1wb3J0cyB7XG4gICAgfVxufVxuXG5kZWNsYXJlIHZhciBtb2R1bGU6YW55O1xuZGVjbGFyZSB2YXIgZXhwb3J0czphbnk7XG5kZWNsYXJlIHZhciBkZWZpbmU6YW55O1xuZGVjbGFyZSB2YXIgcmVxdWlyZTphbnk7XG5cbihmdW5jdGlvbiAocm9vdDphbnksIGZhY3Rvcnk6YW55KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBTUQgYW5vbnltb3VzIG1vZHVsZVxuICAgICAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIC8vIENvbW1vbkpTIGFub255bW91cyBtb2R1bGVcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQnJvd3NlciBnbG9iYWxzXG4gICAgICAgIHJvb3QuU3BpY3lQaXhlbCA9IGZhY3RvcnkoKTtcbiAgICB9XG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFNwaWN5UGl4ZWw7XG59KTsiXSwic291cmNlUm9vdCI6Ii4vIn0=