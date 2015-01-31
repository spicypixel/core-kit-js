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
    var Core;
    (function (Core) {
        var Imports = (function () {
            function Imports() {
            }
            return Imports;
        })();
        Core.Imports = Imports;
    })(Core = SpicyPixel.Core || (SpicyPixel.Core = {}));
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
        root.SpicyPixel = root.SpicyPixel || {};
        root.SpicyPixel.Core = factory();
    }
})(this, function () {
    return SpicyPixel.Core;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9BcnJheUJ1ZmZlckNvbnZlcnRlci50cyIsInNyYy9EYXRhVVJMLnRzIiwic3JjL01lZGlhVHlwZS50cyIsInNyYy9Vbml2ZXJzYWxNb2R1bGUudHMiXSwibmFtZXMiOlsiU3BpY3lQaXhlbCIsIlNwaWN5UGl4ZWwuQ29yZSIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlciIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlci5jb25zdHJ1Y3RvciIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlci50b0Jhc2U2NCIsIlNwaWN5UGl4ZWwuQ29yZS5BcnJheUJ1ZmZlckNvbnZlcnRlci5mcm9tQmFzZTY0IiwiU3BpY3lQaXhlbC5Db3JlLkFycmF5QnVmZmVyQ29udmVydGVyLnRvQmluYXJ5U3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkFycmF5QnVmZmVyQ29udmVydGVyLmZyb21CaW5hcnlTdHJpbmciLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTCIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLmNvbnN0cnVjdG9yIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwubWVkaWFUeXBlIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwuaXNCYXNlNjQiLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC5kYXRhIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwuc2V0QmFzZTY0RW5jb2RlZERhdGEiLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC5zZXRVUkxFbmNvZGVkRGF0YSIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLnRvU3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwudG9KU09OIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwudmFsdWVPZiIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLnRvQXJyYXlCdWZmZXIiLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC50b0Jhc2U2NCIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLnRvQmluYXJ5U3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwudG9Vbmljb2RlU3RyaW5nIiwiU3BpY3lQaXhlbC5Db3JlLkRhdGFVUkwuY3JlYXRlRnJvbUJhc2U2NCIsIlNwaWN5UGl4ZWwuQ29yZS5EYXRhVVJMLmNyZWF0ZUZyb21CaW5hcnlTdHJpbmciLCJTcGljeVBpeGVsLkNvcmUuRGF0YVVSTC5jcmVhdGVGcm9tVW5pY29kZVN0cmluZyIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLmNvbnN0cnVjdG9yIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS50eXBlIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5zdWJ0eXBlIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5wYXJhbWV0ZXJzIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5pc1ZhbGlkIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5oYXNTdWZmaXgiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLmlzVmVuZG9yIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5pc1BlcnNvbmFsIiwiU3BpY3lQaXhlbC5Db3JlLk1lZGlhVHlwZS5pc0V4cGVyaW1lbnRhbCIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUudG9TdHJpbmciLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLnRvSlNPTiIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUudmFsdWVPZiIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUuc2V0U3VidHlwZUFuZFN1ZmZpeCIsIlNwaWN5UGl4ZWwuQ29yZS5NZWRpYVR5cGUuZmlyc3RTdWJ0eXBlRmFjZXRFcXVhbHMiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLndyYXBRdW90ZXMiLCJTcGljeVBpeGVsLkNvcmUuTWVkaWFUeXBlLnVud3JhcFF1b3RlcyIsIlNwaWN5UGl4ZWwuQ29yZS5JbXBvcnRzIiwiU3BpY3lQaXhlbC5Db3JlLkltcG9ydHMuY29uc3RydWN0b3IiXSwibWFwcGluZ3MiOiJBQUFBLElBQU8sVUFBVSxDQXFHaEI7QUFyR0QsV0FBTyxVQUFVO0lBQUNBLElBQUFBLElBQUlBLENBcUdyQkE7SUFyR2lCQSxXQUFBQSxJQUFJQSxFQUFDQSxDQUFDQTtRQUN0QkMsSUFBSUEsS0FBS0EsR0FBR0Esa0VBQWtFQSxDQUFDQTtRQUUvRUEsSUFBYUEsb0JBQW9CQTtZQUUvQkMsU0FGV0Esb0JBQW9CQTtnQkFHN0JDLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLHNEQUFzREEsQ0FBQ0EsQ0FBQ0E7WUFDMUVBLENBQUNBO1lBRUREOzs7Ozs7OztlQVFHQTtZQUNJQSw2QkFBUUEsR0FBZkEsVUFBZ0JBLFdBQXVCQTtnQkFDckNFLEFBQ0FBLHVCQUR1QkE7b0JBQ25CQSxLQUFLQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtnQkFDeENBLElBQUlBLEdBQUdBLEdBQUdBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBO2dCQUN2QkEsSUFBSUEsTUFBTUEsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBRWhCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxHQUFHQSxFQUFFQSxDQUFDQSxJQUFFQSxDQUFDQSxFQUFFQSxDQUFDQTtvQkFDOUJBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUMvQkEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzdEQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbEVBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBO2dCQUNyQ0EsQ0FBQ0E7Z0JBRURBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUNwQkEsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7Z0JBQ3hEQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3pCQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxFQUFFQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDekRBLENBQUNBO2dCQUVEQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtnQkFDZEEsc0JBQXNCQTtZQUN4QkEsQ0FBQ0E7WUFFTUYsK0JBQVVBLEdBQWpCQSxVQUFrQkEsTUFBYUE7Z0JBQzdCRyxBQUNBQSx1QkFEdUJBO29CQUNuQkEsWUFBWUEsR0FBR0EsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxHQUFHQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtnQkFDeEJBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNWQSxJQUFJQSxRQUFlQSxFQUFFQSxRQUFlQSxFQUFFQSxRQUFlQSxFQUFFQSxRQUFlQSxDQUFDQTtnQkFFdkVBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO29CQUN0Q0EsWUFBWUEsRUFBRUEsQ0FBQ0E7b0JBQ2ZBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO3dCQUN0Q0EsWUFBWUEsRUFBRUEsQ0FBQ0E7b0JBQ2pCQSxDQUFDQTtnQkFDSEEsQ0FBQ0E7Z0JBRURBLElBQUlBLFdBQVdBLEdBQUdBLElBQUlBLFdBQVdBLENBQUNBLFlBQVlBLENBQUNBLEVBQzdDQSxLQUFLQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtnQkFFdENBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLEdBQUdBLEVBQUVBLENBQUNBLElBQUVBLENBQUNBLEVBQUVBLENBQUNBO29CQUM5QkEsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3BDQSxRQUFRQSxHQUFHQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxHQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdENBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEdBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUN0Q0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBRXRDQSxLQUFLQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxRQUFRQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDL0NBLEtBQUtBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLFFBQVFBLEdBQUdBLEVBQUVBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUN0REEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsR0FBR0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZEQSxDQUFDQTtnQkFFREEsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0E7Z0JBQ25CQSxzQkFBc0JBO1lBQ3hCQSxDQUFDQTtZQUVNSCxtQ0FBY0EsR0FBckJBLFVBQXNCQSxXQUF1QkE7Z0JBQzNDSSxJQUFJQSxNQUFNQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDaEJBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLFVBQVVBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO2dCQUN4Q0EsSUFBSUEsTUFBTUEsR0FBR0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0E7Z0JBQzlCQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDVkEsT0FBT0EsQ0FBQ0EsR0FBR0EsTUFBTUEsRUFBRUEsQ0FBQ0E7b0JBQ2xCQSxNQUFNQSxJQUFJQSxNQUFNQSxDQUFDQSxZQUFZQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDeENBLEVBQUVBLENBQUNBLENBQUNBO2dCQUNOQSxDQUFDQTtnQkFDREEsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDaEJBLENBQUNBO1lBRU1KLHFDQUFnQkEsR0FBdkJBLFVBQXdCQSxNQUFhQTtnQkFDbkNLLElBQUlBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO2dCQUMzQkEsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsV0FBV0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JDQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxVQUFVQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtnQkFDbkNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNWQSxPQUFPQSxDQUFDQSxHQUFHQSxNQUFNQSxFQUFFQSxDQUFDQTtvQkFDbEJBLElBQUlBLElBQUlBLEdBQUdBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUNoQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ2ZBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLG9IQUFvSEEsQ0FBQ0EsQ0FBQ0E7b0JBQ3hJQSxDQUFDQTtvQkFDREEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7b0JBQ2hCQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDTkEsQ0FBQ0E7Z0JBQ0RBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBO1lBQ3RCQSxDQUFDQTtZQUNITCwyQkFBQ0E7UUFBREEsQ0FqR0FELEFBaUdDQyxJQUFBRDtRQWpHWUEseUJBQW9CQSxHQUFwQkEsb0JBaUdaQSxDQUFBQTtJQUNIQSxDQUFDQSxFQXJHaUJELElBQUlBLEdBQUpBLGVBQUlBLEtBQUpBLGVBQUlBLFFBcUdyQkE7QUFBREEsQ0FBQ0EsRUFyR00sVUFBVSxLQUFWLFVBQVUsUUFxR2hCOztBQ3JHRCx5Q0FBeUM7QUFDekMscUVBQXFFO0FBQ3JFLHlEQUF5RDtBQUN6RCw0REFBNEQ7QUFDNUQsK0JBQStCO0FBSy9CLElBQU8sVUFBVSxDQWlPaEI7QUFqT0QsV0FBTyxVQUFVO0lBQUNBLElBQUFBLElBQUlBLENBaU9yQkE7SUFqT2lCQSxXQUFBQSxJQUFJQSxFQUFDQSxDQUFDQTtRQUN0QkMsQUFNQUEsMERBTjBEQTtRQUUxREEsNkRBQTZEQTtRQUM3REEsd0RBQXdEQTtRQUN4REEseUJBQXlCQTtRQUN6QkEsb0NBQW9DQTtZQUN2QkEsT0FBT0E7WUF1Q2xCTyxTQXZDV0EsT0FBT0EsQ0F1Q05BLElBQVFBLEVBQUVBLE9BQVlBO2dCQUNoQ0MsQUFDQUEsc0JBRHNCQTtnQkFDdEJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO29CQUNiQSxPQUFPQSxHQUFHQTt3QkFDUkEsU0FBU0EsRUFBRUEsSUFBSUE7d0JBQ2ZBLFFBQVFBLEVBQUVBLE1BQU1BO3FCQUNqQkEsQ0FBQ0E7Z0JBQ0pBLENBQUNBO2dCQUVEQSxFQUFFQSxDQUFBQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDckJBLE9BQU9BLENBQUNBLFFBQVFBLEdBQUdBLE1BQU1BLENBQUNBO2dCQUM1QkEsQ0FBQ0E7Z0JBRURBLEFBQ0FBLG9CQURvQkE7Z0JBQ3BCQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxNQUFNQSxJQUFJQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxLQUFLQSxJQUFJQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDL0ZBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLHlEQUF5REEsR0FBR0EsT0FBT0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2hHQSxDQUFDQTtnQkFFREEsQUFDQUEsa0JBRGtCQTtvQkFDZEEsU0FBU0EsR0FBT0EsT0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0E7Z0JBQ3RDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxTQUFTQSxLQUFLQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbENBLFNBQVNBLEdBQUdBLElBQUlBLGNBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO2dCQUN2Q0EsQ0FBQ0E7Z0JBQ0RBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLFNBQVNBLENBQUNBO2dCQUU1QkEsQUFDQUEsK0JBRCtCQTtnQkFDL0JBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO29CQUNWQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxLQUFLQSxDQUFDQTtvQkFDdkJBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO29CQUNsQkEsTUFBTUEsQ0FBQ0E7Z0JBQ1RBLENBQUNBO2dCQUVEQSxBQUNBQSxhQURhQTtnQkFDYkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsWUFBWUEsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxRQUFRQSxJQUFJQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDakVBLElBQUlBLENBQUNBLG9CQUFvQkEsQ0FBQ0EseUJBQW9CQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDakVBLENBQUNBO29CQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdENBLElBQUlBLENBQUNBLGlCQUFpQkEsQ0FBQ0Esa0JBQWtCQSxDQUFDQSx5QkFBb0JBLENBQUNBLGNBQWNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUN4RkEsQ0FBQ0E7Z0JBQ0hBLENBQUNBO2dCQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxJQUFJQSxLQUFLQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDcENBLEFBQ0FBLDRCQUQ0QkE7d0JBQ3hCQSxjQUFjQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxFQUFFQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxLQUFLQSxPQUFPQSxDQUFDQTtvQkFDL0RBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLGNBQWNBLENBQUNBLENBQUNBLENBQUNBO3dCQUNwQkEsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsdUNBQXVDQSxDQUFDQSxDQUFDQTtvQkFDM0RBLENBQUNBO29CQUVEQSxBQUNBQSx5REFEeURBO3dCQUNyREEsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7b0JBQ25DQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdEJBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLDhCQUE4QkEsQ0FBQ0EsQ0FBQ0E7b0JBQ2xEQSxDQUFDQTtvQkFFREEsQUFDQUEsc0JBRHNCQTt3QkFDbEJBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEVBQUVBLFVBQVVBLENBQUNBLENBQUNBO29CQUN2Q0EsSUFBSUEsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBRTdDQSxBQUNBQSxnQkFEZ0JBO3dCQUNaQSxXQUFXQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtvQkFDcENBLElBQUlBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBO29CQUNyQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsV0FBV0EsQ0FBQ0EsTUFBTUEsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7d0JBQzVDQSxJQUFJQSxVQUFVQSxHQUFHQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTt3QkFDdkNBLEVBQUVBLENBQUNBLENBQUNBLFVBQVVBLEtBQUtBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBOzRCQUM1QkEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0E7NEJBQ2hCQSxLQUFLQSxDQUFDQTt3QkFDUkEsQ0FBQ0E7b0JBQ0hBLENBQUNBO29CQUVEQSxBQUNBQSxpQkFEaUJBO29CQUNqQkEsU0FBU0EsR0FBR0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3JEQSxTQUFTQSxHQUFHQSxTQUFTQSxDQUFDQSxNQUFNQSxLQUFLQSxDQUFDQSxHQUFHQSxJQUFJQSxHQUFHQSxTQUFTQSxDQUFDQTtvQkFDdERBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBLFVBQVVBLElBQUlBLElBQUlBLGNBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO29CQUU5REEsQUFDQUEsaUNBRGlDQTtvQkFDakNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFFBQVFBLEtBQUtBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBO3dCQUNoQ0EsQUFDQUEseUNBRHlDQTt3QkFDekNBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLFFBQVFBLENBQUNBO3dCQUMxQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsV0FBV0EsQ0FBQ0E7b0JBQzNCQSxDQUFDQTtvQkFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsS0FBS0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3pDQSxBQUNBQSxvQkFEb0JBO3dCQUNwQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0E7d0JBQ3RCQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDYkEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsV0FBV0EsQ0FBQ0E7d0JBQzNCQSxDQUFDQTt3QkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7NEJBQ05BLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBLENBQUNBO3dCQUNsREEsQ0FBQ0E7b0JBQ0hBLENBQUNBO29CQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdENBLEFBQ0FBLDBCQUQwQkE7d0JBQzFCQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxLQUFLQSxDQUFDQTt3QkFDdkJBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBOzRCQUNkQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxXQUFXQSxDQUFDQTt3QkFDM0JBLENBQUNBO3dCQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTs0QkFDTkEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0Esa0JBQWtCQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDNURBLENBQUNBO29CQUNIQSxDQUFDQTtnQkFDSEEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNOQSxNQUFNQSxJQUFJQSxLQUFLQSxDQUFDQSwyREFBMkRBLEdBQUdBLE9BQU9BLElBQUlBLENBQUNBLENBQUNBO2dCQUM3RkEsQ0FBQ0E7WUFDSEEsQ0FBQ0E7WUFuSURELHNCQUFJQSw4QkFBU0E7cUJBQWJBO29CQUNFRSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQTtnQkFDekJBLENBQUNBO3FCQUVERixVQUFjQSxTQUFtQkE7b0JBQy9CRSxFQUFFQSxDQUFBQSxDQUFDQSxTQUFTQSxZQUFZQSxjQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbENBLElBQUlBLENBQUNBLFVBQVVBLEdBQUdBLFNBQVNBLENBQUNBO29CQUM5QkEsQ0FBQ0E7b0JBQ0RBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLFNBQVNBLEtBQUtBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBO3dCQUN2Q0EsSUFBSUEsQ0FBQ0EsVUFBVUEsR0FBR0EsSUFBSUEsY0FBU0EsQ0FBY0EsU0FBU0EsQ0FBQ0EsQ0FBQ0E7b0JBQzFEQSxDQUFDQTtvQkFDREEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7d0JBQ0pBLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLDRDQUE0Q0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hFQSxDQUFDQTtnQkFDSEEsQ0FBQ0E7OztlQVpBRjtZQWNEQSxzQkFBSUEsNkJBQVFBO3FCQUFaQTtvQkFDRUcsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0E7Z0JBQ3hCQSxDQUFDQTs7O2VBQUFIO1lBRURBLHNCQUFJQSx5QkFBSUE7cUJBQVJBO29CQUNFSSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDcEJBLENBQUNBOzs7ZUFBQUo7WUFFREEsc0NBQW9CQSxHQUFwQkEsVUFBcUJBLGlCQUF3QkE7Z0JBQzNDSyxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDdEJBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLGlCQUFpQkEsQ0FBQ0E7WUFDakNBLENBQUNBO1lBRURMLG1DQUFpQkEsR0FBakJBLFVBQWtCQSxjQUFxQkE7Z0JBQ3JDTSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxLQUFLQSxDQUFDQTtnQkFDdkJBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLGNBQWNBLENBQUNBO1lBQzlCQSxDQUFDQTtZQXFHRE4sMEJBQVFBLEdBQVJBO2dCQUNFTyxNQUFNQSxDQUFDQSxPQUFPQSxHQUNWQSxDQUFDQSxJQUFJQSxDQUFDQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxHQUNuREEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsU0FBU0EsR0FBR0EsRUFBRUEsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FDdkNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBO1lBQ3JDQSxDQUFDQTtZQUVEUCx3QkFBTUEsR0FBTkE7Z0JBQ0VRLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBO1lBQ3pCQSxDQUFDQTtZQUVEUix5QkFBT0EsR0FBUEE7Z0JBQ0VTLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBO1lBQ3pCQSxDQUFDQTtZQUVEVCwrQkFBYUEsR0FBYkE7Z0JBQ0VVLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO29CQUNoQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQ2RBLENBQUNBO2dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkJBLE1BQU1BLENBQUNBLHlCQUFvQkEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JEQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ05BLE1BQU1BLENBQUNBLHlCQUFvQkEsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDckVBLENBQUNBO1lBQ0hBLENBQUNBO1lBRURWLDBCQUFRQSxHQUFSQTtnQkFDRVcsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDcEJBLENBQUNBO2dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkJBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO2dCQUNwQkEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNOQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDM0NBLENBQUNBO1lBQ0hBLENBQUNBO1lBRURYLGdDQUFjQSxHQUFkQTtnQkFDRVksRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDcEJBLENBQUNBO2dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkJBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNqQ0EsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNOQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDOUJBLENBQUNBO1lBQ0hBLENBQUNBO1lBRURaLGlDQUFlQSxHQUFmQTtnQkFDRWEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2hCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDcEJBLENBQUNBO2dCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbkJBLE1BQU1BLENBQUNBLGtCQUFrQkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzdEQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ05BLE1BQU1BLENBQUNBLGtCQUFrQkEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hDQSxDQUFDQTtZQUNIQSxDQUFDQTtZQUVNYix3QkFBZ0JBLEdBQXZCQSxVQUF3QkEsTUFBYUEsRUFBRUEsT0FBWUE7Z0JBQ2pEYyxNQUFNQSxDQUFDQSxJQUFJQSxPQUFPQSxDQUFDQSxlQUFlQSxHQUFHQSxNQUFNQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUN4REEsQ0FBQ0E7WUFFTWQsOEJBQXNCQSxHQUE3QkEsVUFBOEJBLE1BQWFBLEVBQUVBLE9BQVlBO2dCQUN2RGUsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2JBLE9BQU9BLEdBQUdBO3dCQUNSQSxRQUFRQSxFQUFFQSxNQUFNQTtxQkFDakJBLENBQUNBO2dCQUNKQSxDQUFDQTtnQkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsUUFBUUEsS0FBS0EsUUFBUUEsSUFBSUEsT0FBT0EsQ0FBQ0EsUUFBUUEsS0FBS0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2pFQSxNQUFNQSxDQUFDQSxJQUFJQSxPQUFPQSxDQUFDQSxlQUFlQSxHQUFHQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDckVBLENBQUNBO2dCQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxRQUFRQSxLQUFLQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdENBLE1BQU1BLENBQUNBLElBQUlBLE9BQU9BLENBQUNBLFFBQVFBLEdBQUdBLGtCQUFrQkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsT0FBT0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3JFQSxDQUFDQTtZQUNIQSxDQUFDQTtZQUVNZiwrQkFBdUJBLEdBQTlCQSxVQUErQkEsSUFBV0EsRUFBRUEsT0FBWUE7Z0JBQ3REZ0IsTUFBTUEsQ0FBQ0EsSUFBSUEsT0FBT0EsQ0FBQ0EsUUFBUUEsR0FBR0Esa0JBQWtCQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUNuRUEsQ0FBQ0E7WUFDSGhCLGNBQUNBO1FBQURBLENBek5BUCxBQXlOQ08sSUFBQVA7UUF6TllBLFlBQU9BLEdBQVBBLE9BeU5aQSxDQUFBQTtJQUNIQSxDQUFDQSxFQWpPaUJELElBQUlBLEdBQUpBLGVBQUlBLEtBQUpBLGVBQUlBLFFBaU9yQkE7QUFBREEsQ0FBQ0EsRUFqT00sVUFBVSxLQUFWLFVBQVUsUUFpT2hCOztBQzFPRDs7Ozs7OztHQU9HO0FBRUgsSUFBTyxVQUFVLENBdUloQjtBQXZJRCxXQUFPLFVBQVU7SUFBQ0EsSUFBQUEsSUFBSUEsQ0F1SXJCQTtJQXZJaUJBLFdBQUFBLElBQUlBLEVBQUNBLENBQUNBO1FBQ3RCQyxJQUFJQSxnQkFBZ0JBLEdBQUdBLGlIQUFpSEEsQ0FBQ0E7UUFDeklBLElBQUlBLGlCQUFpQkEsR0FBR0Esd0NBQXdDQSxDQUFDQTtRQUVqRUEsSUFBYUEsU0FBU0E7WUFPcEJ3QixTQVBXQSxTQUFTQSxDQU9SQSxTQUFpQkE7Z0JBUC9CQyxpQkFrSUNBO2dCQTFIR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0JBQ2xCQSxJQUFJQSxDQUFDQSxtQkFBbUJBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUMvQkEsSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBRXRCQSxFQUFFQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDZEEsSUFBSUEsS0FBS0EsR0FBR0EsU0FBU0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQTtvQkFDOUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO3dCQUNWQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdEJBLElBQUlBLENBQUNBLG1CQUFtQkEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ25DQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDYkEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxVQUFDQSxTQUFTQTtnQ0FDNURBLElBQUlBLFdBQVdBLEdBQUdBLFNBQVNBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO2dDQUMxQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsTUFBTUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0NBQzdCQSxLQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQTtnQ0FDbkdBLENBQUNBOzRCQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDTEEsQ0FBQ0E7b0JBQ0hBLENBQUNBO2dCQUNIQSxDQUFDQTtZQUNIQSxDQUFDQTtZQUVERCxzQkFBSUEsMkJBQUlBO3FCQUFSQTtvQkFDRUUsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7Z0JBQ3BCQSxDQUFDQTtxQkFFREYsVUFBU0EsSUFBV0E7b0JBQ2xCRSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDcEJBLENBQUNBOzs7ZUFKQUY7WUFNREEsc0JBQUlBLDhCQUFPQTtxQkFBWEE7b0JBQ0VHLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBO2dCQUN2QkEsQ0FBQ0E7cUJBRURILFVBQVlBLE9BQWNBO29CQUN4QkcsSUFBSUEsQ0FBQ0EsbUJBQW1CQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtnQkFDcENBLENBQUNBOzs7ZUFKQUg7WUFNREEsc0JBQUlBLGlDQUFVQTtxQkFBZEE7b0JBQ0VJLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBO2dCQUMxQkEsQ0FBQ0E7cUJBRURKLFVBQWVBLFVBQWNBO29CQUMzQkksSUFBSUEsQ0FBQ0EsV0FBV0EsR0FBR0EsVUFBVUEsQ0FBQ0E7Z0JBQ2hDQSxDQUFDQTs7O2VBSkFKO1lBTURBLHNCQUFJQSw4QkFBT0E7cUJBQVhBO29CQUNFSyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxLQUFLQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxRQUFRQSxLQUFLQSxJQUFJQSxJQUFJQSxJQUFJQSxDQUFDQSxRQUFRQSxLQUFLQSxTQUFTQSxDQUFDQTtnQkFDdEZBLENBQUNBOzs7ZUFBQUw7WUFFREEsc0JBQUlBLGdDQUFTQTtxQkFBYkE7b0JBQ0VNLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBO2dCQUN4QkEsQ0FBQ0E7OztlQUFBTjtZQUVEQSxzQkFBSUEsK0JBQVFBO3FCQUFaQTtvQkFDRU8sTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsdUJBQXVCQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDN0NBLENBQUNBOzs7ZUFBQVA7WUFFREEsc0JBQUlBLGlDQUFVQTtxQkFBZEE7b0JBQ0VRLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLHVCQUF1QkEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzdDQSxDQUFDQTs7O2VBQUFSO1lBRURBLHNCQUFJQSxxQ0FBY0E7cUJBQWxCQTtvQkFDRVMsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsdUJBQXVCQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxXQUFXQSxFQUFFQSxLQUFLQSxJQUFJQSxDQUFDQTtnQkFDbkdBLENBQUNBOzs7ZUFBQVQ7WUFFREEsNEJBQVFBLEdBQVJBO2dCQUFBVSxpQkFvQkNBO2dCQW5CQ0EsSUFBSUEsR0FBR0EsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBQ2JBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO29CQUNqQkEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsR0FBR0EsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7b0JBQzdDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbkJBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBO29CQUNqQ0EsQ0FBQ0E7b0JBQ0RBLElBQUlBLGFBQWFBLEdBQUdBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO29CQUNsREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzdCQSxJQUFJQSxVQUFVQSxHQUFZQSxFQUFFQSxDQUFDQTt3QkFDN0JBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO3dCQUNoQkEsYUFBYUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0E7NEJBQ3RCQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDNUJBLENBQUNBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFVBQUNBLE9BQU9BOzRCQUNqQkEsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsR0FBR0EsR0FBR0EsS0FBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzlFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDSEEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3pDQSxDQUFDQTtnQkFDSEEsQ0FBQ0E7Z0JBQ0RBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBO1lBQ2JBLENBQUNBO1lBRURWLDBCQUFNQSxHQUFOQTtnQkFDRVcsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0E7WUFDekJBLENBQUNBO1lBRURYLDJCQUFPQSxHQUFQQTtnQkFDRVksTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0E7WUFDekJBLENBQUNBO1lBRU9aLHVDQUFtQkEsR0FBM0JBLFVBQTRCQSxPQUFjQTtnQkFDeENhLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLE9BQU9BLENBQUNBO2dCQUN4QkEsSUFBSUEsQ0FBQ0EsY0FBY0EsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBQ3pCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDcEJBLEVBQUVBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLENBQUNBLENBQUNBO29CQUNaQSxFQUFFQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxJQUFJQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDNURBLElBQUlBLEtBQUtBLEdBQUdBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO3dCQUNsQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3pCQSxJQUFJQSxDQUFDQSxjQUFjQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTt3QkFDMUNBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUMxQkEsQ0FBQ0E7b0JBQUNBLElBQUlBLENBQUNBLENBQUNBO3dCQUNOQSxJQUFJQSxDQUFDQSxjQUFjQSxHQUFHQSxPQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtvQkFDM0NBLENBQUNBO2dCQUNIQSxDQUFDQTtZQUNIQSxDQUFDQTtZQUVPYiwyQ0FBdUJBLEdBQS9CQSxVQUFnQ0EsR0FBVUE7Z0JBQ3hDYyxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxJQUFJQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQTtZQUMxRUEsQ0FBQ0E7WUFFT2QsOEJBQVVBLEdBQWxCQSxVQUFtQkEsR0FBVUE7Z0JBQzNCZSxNQUFNQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxPQUFPQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN6REEsQ0FBQ0E7WUFFT2YsZ0NBQVlBLEdBQXBCQSxVQUFxQkEsR0FBVUE7Z0JBQzdCZ0IsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDcEdBLENBQUNBO1lBQ0hoQixnQkFBQ0E7UUFBREEsQ0FsSUF4QixBQWtJQ3dCLElBQUF4QjtRQWxJWUEsY0FBU0EsR0FBVEEsU0FrSVpBLENBQUFBO0lBQ0hBLENBQUNBLEVBdklpQkQsSUFBSUEsR0FBSkEsZUFBSUEsS0FBSkEsZUFBSUEsUUF1SXJCQTtBQUFEQSxDQUFDQSxFQXZJTSxVQUFVLEtBQVYsVUFBVSxRQXVJaEI7O0FDaEpELElBQU8sVUFBVSxDQUdoQjtBQUhELFdBQU8sVUFBVTtJQUFDQSxJQUFBQSxJQUFJQSxDQUdyQkE7SUFIaUJBLFdBQUFBLElBQUlBLEVBQUNBLENBQUNBO1FBQ3BCQyxJQUFhQSxPQUFPQTtZQUFwQnlDLFNBQWFBLE9BQU9BO1lBQ3BCQyxDQUFDQTtZQUFERCxjQUFDQTtRQUFEQSxDQURBekMsQUFDQ3lDLElBQUF6QztRQURZQSxZQUFPQSxHQUFQQSxPQUNaQSxDQUFBQTtJQUNMQSxDQUFDQSxFQUhpQkQsSUFBSUEsR0FBSkEsZUFBSUEsS0FBSkEsZUFBSUEsUUFHckJBO0FBQURBLENBQUNBLEVBSE0sVUFBVSxLQUFWLFVBQVUsUUFHaEI7QUFPRCxDQUFDLFVBQVUsSUFBUSxFQUFFLE9BQVc7SUFDNUIsRUFBRSxDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssVUFBVSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzdDLEFBQ0EsdUJBRHVCO1FBQ3ZCLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLEFBQ0EsNEJBRDRCO1FBQzVCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUFDLElBQUksQ0FBQyxDQUFDO1FBQ0osQUFDQSxrQkFEa0I7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxPQUFPLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO0lBQ0wsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoic3BpY3lwaXhlbC1jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlIFNwaWN5UGl4ZWwuQ29yZSB7XG4gIHZhciBjaGFycyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiO1xuXG4gIGV4cG9ydCBjbGFzcyBBcnJheUJ1ZmZlckNvbnZlcnRlclxuICB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoaXMgY2xhc3MgaXMgc3RhdGljIGFuZCBub3QgbWVhbnQgdG8gYmUgY29uc3RydWN0ZWQnKTtcbiAgICB9XG5cbiAgICAvKlxuICAgICAqIEJhc2U2NCBjb252ZXJzaW9uIGZyb206XG4gICAgICpcbiAgICAgKiBiYXNlNjQtYXJyYXlidWZmZXJcbiAgICAgKiBodHRwczovL2dpdGh1Yi5jb20vbmlrbGFzdmgvYmFzZTY0LWFycmF5YnVmZmVyXG4gICAgICpcbiAgICAgKiBDb3B5cmlnaHQgKGMpIDIwMTIgTmlrbGFzIHZvbiBIZXJ0emVuXG4gICAgICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuICAgICAqL1xuICAgIHN0YXRpYyB0b0Jhc2U2NChhcnJheUJ1ZmZlcjpBcnJheUJ1ZmZlcik6c3RyaW5nIHtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOmZhbHNlXG4gICAgICB2YXIgYnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gICAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoO1xuICAgICAgdmFyIGJhc2U2NCA9IFwiXCI7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKz0zKSB7XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpXSA+PiAyXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaV0gJiAzKSA8PCA0KSB8IChieXRlc1tpICsgMV0gPj4gNCldO1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbKChieXRlc1tpICsgMV0gJiAxNSkgPDwgMikgfCAoYnl0ZXNbaSArIDJdID4+IDYpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2kgKyAyXSAmIDYzXTtcbiAgICAgIH1cblxuICAgICAgaWYgKChsZW4gJSAzKSA9PT0gMikge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAxKSArIFwiPVwiO1xuICAgICAgfSBlbHNlIGlmIChsZW4gJSAzID09PSAxKSB7XG4gICAgICAgIGJhc2U2NCA9IGJhc2U2NC5zdWJzdHJpbmcoMCwgYmFzZTY0Lmxlbmd0aCAtIDIpICsgXCI9PVwiO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYmFzZTY0O1xuICAgICAgLy8ganNoaW50IGJpdHdpc2U6dHJ1ZVxuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tQmFzZTY0KGJhc2U2NDpzdHJpbmcpOkFycmF5QnVmZmVyIHtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOmZhbHNlXG4gICAgICB2YXIgYnVmZmVyTGVuZ3RoID0gYmFzZTY0Lmxlbmd0aCAqIDAuNzU7XG4gICAgICB2YXIgbGVuID0gYmFzZTY0Lmxlbmd0aDtcbiAgICAgIHZhciBwID0gMDtcbiAgICAgIHZhciBlbmNvZGVkMTpudW1iZXIsIGVuY29kZWQyOm51bWJlciwgZW5jb2RlZDM6bnVtYmVyLCBlbmNvZGVkNDpudW1iZXI7XG5cbiAgICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDFdID09PSBcIj1cIikge1xuICAgICAgICBidWZmZXJMZW5ndGgtLTtcbiAgICAgICAgaWYgKGJhc2U2NFtiYXNlNjQubGVuZ3RoIC0gMl0gPT09IFwiPVwiKSB7XG4gICAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGFycmF5YnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmZlckxlbmd0aCksXG4gICAgICAgIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSs9NCkge1xuICAgICAgICBlbmNvZGVkMSA9IGNoYXJzLmluZGV4T2YoYmFzZTY0W2ldKTtcbiAgICAgICAgZW5jb2RlZDIgPSBjaGFycy5pbmRleE9mKGJhc2U2NFtpKzFdKTtcbiAgICAgICAgZW5jb2RlZDMgPSBjaGFycy5pbmRleE9mKGJhc2U2NFtpKzJdKTtcbiAgICAgICAgZW5jb2RlZDQgPSBjaGFycy5pbmRleE9mKGJhc2U2NFtpKzNdKTtcblxuICAgICAgICBieXRlc1twKytdID0gKGVuY29kZWQxIDw8IDIpIHwgKGVuY29kZWQyID4+IDQpO1xuICAgICAgICBieXRlc1twKytdID0gKChlbmNvZGVkMiAmIDE1KSA8PCA0KSB8IChlbmNvZGVkMyA+PiAyKTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDMgJiAzKSA8PCA2KSB8IChlbmNvZGVkNCAmIDYzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5YnVmZmVyO1xuICAgICAgLy8ganNoaW50IGJpdHdpc2U6dHJ1ZVxuICAgIH1cblxuICAgIHN0YXRpYyB0b0JpbmFyeVN0cmluZyhhcnJheUJ1ZmZlcjpBcnJheUJ1ZmZlcik6c3RyaW5nIHtcbiAgICAgIHZhciBiaW5hcnkgPSBcIlwiO1xuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgdmFyIGxlbmd0aCA9IGJ5dGVzLmJ5dGVMZW5ndGg7XG4gICAgICB2YXIgaSA9IDA7XG4gICAgICB3aGlsZSAoaSA8IGxlbmd0aCkge1xuICAgICAgICBiaW5hcnkgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSk7XG4gICAgICAgICsraTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBiaW5hcnk7XG4gICAgfVxuXG4gICAgc3RhdGljIGZyb21CaW5hcnlTdHJpbmcoYmluYXJ5OnN0cmluZyk6QXJyYXlCdWZmZXIge1xuICAgICAgdmFyIGxlbmd0aCA9IGJpbmFyeS5sZW5ndGg7XG4gICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGxlbmd0aCk7XG4gICAgICB2YXIgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcbiAgICAgICAgdmFyIGNvZGUgPSBiaW5hcnkuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGNvZGUgPiAyNTUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhIG11bHRpYnl0ZSBjaGFyYWN0ZXIgd2FzIGVuY291bnRlcmVkIGluIHRoZSBwcm92aWRlZCBzdHJpbmcgd2hpY2ggaW5kaWNhdGVzIGl0IHdhcyBub3QgZW5jb2RlZCBhcyBhIGJpbmFyeSBzdHJpbmdcIik7XG4gICAgICAgIH1cbiAgICAgICAgYnl0ZXNbaV0gPSBjb2RlO1xuICAgICAgICArK2k7XG4gICAgICB9XG4gICAgICByZXR1cm4gYnl0ZXMuYnVmZmVyO1xuICAgIH1cbiAgfVxufVxuIiwiLy8gVE9ETzogT3B0aW1pemUgdXNpbmcgZGVmZXJyZWQgcGFyc2luZy5cbi8vIElmIGEgZGF0YSBVUkwgc3RyaW5nIGlzIHBhc3NlZCBpbiBhbmQgdGhlIG9ubHkgb3BlcmF0aW9uIGNhbGxlZCBpc1xuLy8gdG9TdHJpbmcoKSB0aGVuIHRoZXJlIGlzIG5vIG5lZWQgdG8gcGFyc2UgYW5kIGluY3JlYXNlXG4vLyBtZW1vcnkgY29uc3VtcHRpb24uIFRoaXMgd291bGQgY29tcGxpY2F0ZSB0aGUgY29kZSB0aG91Z2hcbi8vIHNvIG9ubHkgaW1wbGVtZW50IGlmIG5lZWRlZC5cblxuZGVjbGFyZSB2YXIgZXNjYXBlOihzOnN0cmluZykgPT4gc3RyaW5nO1xuZGVjbGFyZSB2YXIgdW5lc2NhcGU6KHM6c3RyaW5nKSA9PiBzdHJpbmc7XG5cbm1vZHVsZSBTcGljeVBpeGVsLkNvcmUge1xuICAvLyBkYXRhOls8TUlNRS10eXBlPl1bO2NoYXJzZXQ9PGVuY29kaW5nPl1bO2Jhc2U2NF0sPGRhdGE+XG5cbiAgLy8gZGF0YXVybCAgICA6PSBcImRhdGE6XCIgWyBtZWRpYXR5cGUgXSBbIFwiO2Jhc2U2NFwiIF0gXCIsXCIgZGF0YVxuICAvLyBtZWRpYXR5cGUgIDo9IFsgdHlwZSBcIi9cIiBzdWJ0eXBlIF0gKiggXCI7XCIgcGFyYW1ldGVyIClcbiAgLy8gZGF0YSAgICAgICA6PSAqdXJsY2hhclxuICAvLyBwYXJhbWV0ZXIgIDo9IGF0dHJpYnV0ZSBcIj1cIiB2YWx1ZVxuICBleHBvcnQgY2xhc3MgRGF0YVVSTCB7XG4gICAgcHJpdmF0ZSBfbWVkaWFUeXBlOk1lZGlhVHlwZTtcbiAgICBwcml2YXRlIF9pc0Jhc2U2NDpib29sZWFuO1xuICAgIHByaXZhdGUgX2RhdGE6c3RyaW5nO1xuXG4gICAgZ2V0IG1lZGlhVHlwZSgpOk1lZGlhVHlwZSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWVkaWFUeXBlO1xuICAgIH1cblxuICAgIHNldCBtZWRpYVR5cGUobWVkaWFUeXBlOk1lZGlhVHlwZSkge1xuICAgICAgaWYobWVkaWFUeXBlIGluc3RhbmNlb2YgTWVkaWFUeXBlKSB7XG4gICAgICAgIHRoaXMuX21lZGlhVHlwZSA9IG1lZGlhVHlwZTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHR5cGVvZiBtZWRpYVR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhpcy5fbWVkaWFUeXBlID0gbmV3IE1lZGlhVHlwZSg8c3RyaW5nPjxhbnk+bWVkaWFUeXBlKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZWRpYSB0eXBlIG11c3QgYmUgJ3N0cmluZycgb3IgJ01lZGlhVHlwZSdcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGlzQmFzZTY0KCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5faXNCYXNlNjQ7XG4gICAgfVxuXG4gICAgZ2V0IGRhdGEoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgfVxuXG4gICAgc2V0QmFzZTY0RW5jb2RlZERhdGEoYmFzZTY0RW5jb2RlZERhdGE6c3RyaW5nKTp2b2lkIHtcbiAgICAgIHRoaXMuX2lzQmFzZTY0ID0gdHJ1ZTtcbiAgICAgIHRoaXMuX2RhdGEgPSBiYXNlNjRFbmNvZGVkRGF0YTtcbiAgICB9XG5cbiAgICBzZXRVUkxFbmNvZGVkRGF0YSh1cmxFbmNvZGVkRGF0YTpzdHJpbmcpOnZvaWQge1xuICAgICAgdGhpcy5faXNCYXNlNjQgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2RhdGEgPSB1cmxFbmNvZGVkRGF0YTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihkYXRhOmFueSwgb3B0aW9ucz86YW55KSB7XG4gICAgICAvLyBTZXQgZGVmYXVsdCBvcHRpb25zXG4gICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICBtZWRpYVR5cGU6IG51bGwsXG4gICAgICAgICAgZW5jb2Rpbmc6IFwiYXV0b1wiXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmKCFvcHRpb25zLmVuY29kaW5nKSB7XG4gICAgICAgIG9wdGlvbnMuZW5jb2RpbmcgPSBcImF1dG9cIjtcbiAgICAgIH1cblxuICAgICAgLy8gVmFsaWRhdGUgZW5jb2RpbmdcbiAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nICE9PSBcImF1dG9cIiAmJiBvcHRpb25zLmVuY29kaW5nICE9PSBcInVybFwiICYmIG9wdGlvbnMuZW5jb2RpbmcgIT09IFwiYmFzZTY0XCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBlbmNvZGluZyAobXVzdCBiZSAnYXV0bycsICd1cmwnLCBvciAnYmFzZTY0Jyk6IFwiICsgb3B0aW9ucy5lbmNvZGluZyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNhdmUgbWVkaWEgdHlwZVxuICAgICAgdmFyIG1lZGlhVHlwZTphbnkgPSBvcHRpb25zLm1lZGlhVHlwZTtcbiAgICAgIGlmICh0eXBlb2YgbWVkaWFUeXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIG1lZGlhVHlwZSA9IG5ldyBNZWRpYVR5cGUobWVkaWFUeXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21lZGlhVHlwZSA9IG1lZGlhVHlwZTtcblxuICAgICAgLy8gU2F2ZSBkYXRhIGFuZCByZXR1cm4gaWYgbm9uZVxuICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgIHRoaXMuX2lzQmFzZTY0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2RhdGEgPSBkYXRhO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnNlIGRhdGFcbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIgfHwgb3B0aW9ucy5lbmNvZGluZyA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICB0aGlzLnNldEJhc2U2NEVuY29kZWREYXRhKEFycmF5QnVmZmVyQ29udmVydGVyLnRvQmFzZTY0KGRhdGEpKTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcInVybFwiKSB7XG4gICAgICAgICAgdGhpcy5zZXRVUkxFbmNvZGVkRGF0YShlbmNvZGVVUklDb21wb25lbnQoQXJyYXlCdWZmZXJDb252ZXJ0ZXIudG9CaW5hcnlTdHJpbmcoZGF0YSkpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAvLyBFbnN1cmUgdGhpcyBpcyBhIGRhdGEgVVJJXG4gICAgICAgIHZhciBzdGFydHNXaXRoRGF0YSA9IGRhdGEuc2xpY2UoMCwgXCJkYXRhOlwiLmxlbmd0aCkgPT09IFwiZGF0YTpcIjtcbiAgICAgICAgaWYgKCFzdGFydHNXaXRoRGF0YSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgJ2RhdGEnIFVSSSBzdHJpbmdzIGFyZSBzdXBwb3J0ZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaW5kIHRoZSBjb21tYSB0aGF0IHNlcGFyYXRlcyB0aGUgcHJlZml4IGZyb20gdGhlIGRhdGFcbiAgICAgICAgdmFyIGNvbW1hSW5kZXggPSBkYXRhLmluZGV4T2YoXCIsXCIpO1xuICAgICAgICBpZiAoY29tbWFJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIGNvbW1hIGluIFNRTEJsb2IgVVJMXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IHByZWZpeCBhbmQgZGF0YVxuICAgICAgICB2YXIgcHJlZml4ID0gZGF0YS5zbGljZSgwLCBjb21tYUluZGV4KTtcbiAgICAgICAgdmFyIGVuY29kZWREYXRhID0gZGF0YS5zbGljZShjb21tYUluZGV4ICsgMSk7XG5cbiAgICAgICAgLy8gR2V0IGlzIGJhc2U2NFxuICAgICAgICB2YXIgcHJlZml4UGFydHMgPSBwcmVmaXguc3BsaXQoJzsnKTtcbiAgICAgICAgdmFyIGlzQmFzZTY0ID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcHJlZml4UGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICB2YXIgcHJlZml4UGFydCA9IHByZWZpeFBhcnRzW2ldLnRyaW0oKTtcbiAgICAgICAgICBpZiAocHJlZml4UGFydCA9PT0gXCJiYXNlNjRcIikge1xuICAgICAgICAgICAgaXNCYXNlNjQgPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IG1lZGlhIHR5cGVcbiAgICAgICAgbWVkaWFUeXBlID0gcHJlZml4LnNsaWNlKFwiZGF0YTpcIi5sZW5ndGgsIGNvbW1hSW5kZXgpO1xuICAgICAgICBtZWRpYVR5cGUgPSBtZWRpYVR5cGUubGVuZ3RoID09PSAwID8gbnVsbCA6IG1lZGlhVHlwZTtcbiAgICAgICAgdGhpcy5fbWVkaWFUeXBlID0gdGhpcy5fbWVkaWFUeXBlIHx8IG5ldyBNZWRpYVR5cGUobWVkaWFUeXBlKTtcblxuICAgICAgICAvLyBDb252ZXJ0IGVuY29kZWQgZGF0YSBhcyBuZWVkZWRcbiAgICAgICAgaWYgKG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYXV0b1wiKSB7XG4gICAgICAgICAgLy8gQXV0byBlbmNvZGluZyBzYXZlcyB0aGUgZGF0YSBVUkkgYXMgaXNcbiAgICAgICAgICB0aGlzLl9pc0Jhc2U2NCA9IGlzQmFzZTY0O1xuICAgICAgICAgIHRoaXMuX2RhdGEgPSBlbmNvZGVkRGF0YTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcImJhc2U2NFwiKSB7XG4gICAgICAgICAgLy8gQ29udmVydCB0byBiYXNlNjRcbiAgICAgICAgICB0aGlzLl9pc0Jhc2U2NCA9IHRydWU7XG4gICAgICAgICAgaWYgKGlzQmFzZTY0KSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhID0gZW5jb2RlZERhdGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgPSB3aW5kb3cuYnRvYSh1bmVzY2FwZShlbmNvZGVkRGF0YSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcInVybFwiKSB7XG4gICAgICAgICAgLy8gQ29udmVydCB0byBVUkwgZW5jb2RpbmdcbiAgICAgICAgICB0aGlzLl9pc0Jhc2U2NCA9IGZhbHNlO1xuICAgICAgICAgIGlmICghaXNCYXNlNjQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgPSBlbmNvZGVkRGF0YTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZGF0YSA9IGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cuYXRvYihlbmNvZGVkRGF0YSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5zdXBwb3J0ZWQgb2JqZWN0IHR5cGUgKG11c3QgYmUgQXJyYXlCdWZmZXIgb3Igc3RyaW5nKTogXCIgKyB0eXBlb2YgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIFwiZGF0YTpcIlxuICAgICAgICArICh0aGlzLl9tZWRpYVR5cGUgPyB0aGlzLl9tZWRpYVR5cGUudG9TdHJpbmcoKSA6IFwiXCIpXG4gICAgICAgICsgKHRoaXMuX2lzQmFzZTY0ID8gXCI7YmFzZTY0XCIgOiBcIlwiKSArIFwiLFwiXG4gICAgICAgICsgKHRoaXMuX2RhdGEgPyB0aGlzLl9kYXRhIDogXCJcIik7XG4gICAgfVxuXG4gICAgdG9KU09OKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgdmFsdWVPZigpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHRvQXJyYXlCdWZmZXIoKTpBcnJheUJ1ZmZlciB7XG4gICAgICBpZiAoIXRoaXMuX2RhdGEpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5faXNCYXNlNjQpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5QnVmZmVyQ29udmVydGVyLmZyb21CYXNlNjQodGhpcy5fZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gQXJyYXlCdWZmZXJDb252ZXJ0ZXIuZnJvbUJpbmFyeVN0cmluZyh1bmVzY2FwZSh0aGlzLl9kYXRhKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdG9CYXNlNjQoKTpzdHJpbmcge1xuICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2lzQmFzZTY0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5idG9hKHVuZXNjYXBlKHRoaXMuX2RhdGEpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b0JpbmFyeVN0cmluZygpOnN0cmluZyB7XG4gICAgICBpZiAoIXRoaXMuX2RhdGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5faXNCYXNlNjQpIHtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5hdG9iKHRoaXMuX2RhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZXNjYXBlKHRoaXMuX2RhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRvVW5pY29kZVN0cmluZygpOnN0cmluZyB7XG4gICAgICBpZiAoIXRoaXMuX2RhdGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5faXNCYXNlNjQpIHtcbiAgICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChlc2NhcGUod2luZG93LmF0b2IodGhpcy5fZGF0YSkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQodGhpcy5fZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUZyb21CYXNlNjQoYmFzZTY0OnN0cmluZywgb3B0aW9ucz86YW55KTpEYXRhVVJMIHtcbiAgICAgIHJldHVybiBuZXcgRGF0YVVSTChcImRhdGE6O2Jhc2U2NCxcIiArIGJhc2U2NCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUZyb21CaW5hcnlTdHJpbmcoYmluYXJ5OnN0cmluZywgb3B0aW9ucz86YW55KTpEYXRhVVJMIHtcbiAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgIGVuY29kaW5nOiBcImF1dG9cIlxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIgfHwgb3B0aW9ucy5lbmNvZGluZyA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRhVVJMKFwiZGF0YTo7YmFzZTY0LFwiICsgd2luZG93LmJ0b2EoYmluYXJ5KSwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZW5jb2RpbmcgPT09IFwidXJsXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRhVVJMKFwiZGF0YTosXCIgKyBlbmNvZGVVUklDb21wb25lbnQoYmluYXJ5KSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUZyb21Vbmljb2RlU3RyaW5nKHRleHQ6c3RyaW5nLCBvcHRpb25zPzphbnkpOkRhdGFVUkwge1xuICAgICAgcmV0dXJuIG5ldyBEYXRhVVJMKFwiZGF0YTosXCIgKyBlbmNvZGVVUklDb21wb25lbnQodGV4dCksIG9wdGlvbnMpO1xuICAgIH1cbiAgfVxufVxuIiwiLyoqXG4gKiBtZWRpYS10eXBlXG4gKiBAYXV0aG9yIExvdmVsbCBGdWxsZXIgKG9yaWdpbmFsIEpTKVxuICogQGF1dGhvciBBYXJvbiBPbmVhbCAoVHlwZVNjcmlwdClcbiAqXG4gKiBUaGlzIGNvZGUgaXMgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlIFZlcnNpb24gMi4wLCB0aGUgdGVybXMgb2ZcbiAqIHdoaWNoIG1heSBiZSBmb3VuZCBhdCBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjAuaHRtbFxuICovXG5cbm1vZHVsZSBTcGljeVBpeGVsLkNvcmUge1xuICB2YXIgbWVkaWFUeXBlTWF0Y2hlciA9IC9eKGFwcGxpY2F0aW9ufGF1ZGlvfGltYWdlfG1lc3NhZ2V8bW9kZWx8bXVsdGlwYXJ0fHRleHR8dmlkZW8pXFwvKFthLXpBLVowLTkhIyQlXiZcXCpfXFwtXFwre31cXHwnLmB+XXsxLDEyN30pKDsuKik/JC87XG4gIHZhciBwYXJhbWV0ZXJTcGxpdHRlciA9IC87KD89KD86W15cXFwiXSpcXFwiW15cXFwiXSpcXFwiKSooPyFbXlxcXCJdKlxcXCIpKS87XG5cbiAgZXhwb3J0IGNsYXNzIE1lZGlhVHlwZSB7XG4gICAgcHJpdmF0ZSBfdHlwZTpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc3VidHlwZTpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyczphbnk7XG4gICAgcHJpdmF0ZSBfc3VmZml4OnN0cmluZztcbiAgICBwcml2YXRlIF9zdWJ0eXBlRmFjZXRzOnN0cmluZ1tdO1xuXG4gICAgY29uc3RydWN0b3IobWVkaWFUeXBlPzpzdHJpbmcpIHtcbiAgICAgIHRoaXMuX3R5cGUgPSBudWxsO1xuICAgICAgdGhpcy5zZXRTdWJ0eXBlQW5kU3VmZml4KG51bGwpO1xuICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IHt9O1xuXG4gICAgICBpZiAobWVkaWFUeXBlKSB7XG4gICAgICAgIHZhciBtYXRjaCA9IG1lZGlhVHlwZS5tYXRjaChtZWRpYVR5cGVNYXRjaGVyKTtcbiAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgdGhpcy5fdHlwZSA9IG1hdGNoWzFdO1xuICAgICAgICAgIHRoaXMuc2V0U3VidHlwZUFuZFN1ZmZpeChtYXRjaFsyXSk7XG4gICAgICAgICAgaWYgKG1hdGNoWzNdKSB7XG4gICAgICAgICAgICBtYXRjaFszXS5zdWJzdHIoMSkuc3BsaXQocGFyYW1ldGVyU3BsaXR0ZXIpLmZvckVhY2goKHBhcmFtZXRlcikgPT4ge1xuICAgICAgICAgICAgICB2YXIga2V5QW5kVmFsdWUgPSBwYXJhbWV0ZXIuc3BsaXQoJz0nLCAyKTtcbiAgICAgICAgICAgICAgaWYgKGtleUFuZFZhbHVlLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNba2V5QW5kVmFsdWVbMF0udG9Mb3dlckNhc2UoKS50cmltKCldID0gdGhpcy51bndyYXBRdW90ZXMoa2V5QW5kVmFsdWVbMV0udHJpbSgpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHR5cGUoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gICAgfVxuXG4gICAgc2V0IHR5cGUodHlwZTpzdHJpbmcpIHtcbiAgICAgIHRoaXMuX3R5cGUgPSB0eXBlO1xuICAgIH1cblxuICAgIGdldCBzdWJ0eXBlKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdWJ0eXBlO1xuICAgIH1cblxuICAgIHNldCBzdWJ0eXBlKHN1YnR5cGU6c3RyaW5nKSB7XG4gICAgICB0aGlzLnNldFN1YnR5cGVBbmRTdWZmaXgoc3VidHlwZSk7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtZXRlcnMoKTphbnkge1xuICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtZXRlcnM7XG4gICAgfVxuXG4gICAgc2V0IHBhcmFtZXRlcnMocGFyYW1ldGVyczphbnkpIHtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzO1xuICAgIH1cblxuICAgIGdldCBpc1ZhbGlkKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5fdHlwZSAhPT0gbnVsbCAmJiB0aGlzLl9zdWJ0eXBlICE9PSBudWxsICYmIHRoaXMuX3N1YnR5cGUgIT09IFwiZXhhbXBsZVwiO1xuICAgIH1cblxuICAgIGdldCBoYXNTdWZmaXgoKTpib29sZWFuIHtcbiAgICAgIHJldHVybiAhIXRoaXMuX3N1ZmZpeDtcbiAgICB9XG5cbiAgICBnZXQgaXNWZW5kb3IoKTpib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLmZpcnN0U3VidHlwZUZhY2V0RXF1YWxzKFwidm5kXCIpO1xuICAgIH1cblxuICAgIGdldCBpc1BlcnNvbmFsKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5maXJzdFN1YnR5cGVGYWNldEVxdWFscyhcInByc1wiKTtcbiAgICB9XG5cbiAgICBnZXQgaXNFeHBlcmltZW50YWwoKTpib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLmZpcnN0U3VidHlwZUZhY2V0RXF1YWxzKFwieFwiKSB8fCB0aGlzLl9zdWJ0eXBlLnN1YnN0cmluZygwLCAyKS50b0xvd2VyQ2FzZSgpID09PSBcIngtXCI7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKTpzdHJpbmcge1xuICAgICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSB7XG4gICAgICAgIHN0ciA9IHN0ciArIHRoaXMuX3R5cGUgKyBcIi9cIiArIHRoaXMuX3N1YnR5cGU7XG4gICAgICAgIGlmICh0aGlzLmhhc1N1ZmZpeCkge1xuICAgICAgICAgIHN0ciA9IHN0ciArIFwiK1wiICsgdGhpcy5fc3VmZml4O1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJhbWV0ZXJLZXlzID0gT2JqZWN0LmtleXModGhpcy5fcGFyYW1ldGVycyk7XG4gICAgICAgIGlmIChwYXJhbWV0ZXJLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB2YXIgcGFyYW1ldGVyczpzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICBwYXJhbWV0ZXJLZXlzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhLmxvY2FsZUNvbXBhcmUoYik7XG4gICAgICAgICAgfSkuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKGVsZW1lbnQgKyBcIj1cIiArIHRoaXMud3JhcFF1b3Rlcyh0aGF0Ll9wYXJhbWV0ZXJzW2VsZW1lbnRdKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc3RyID0gc3RyICsgXCI7XCIgKyBwYXJhbWV0ZXJzLmpvaW4oXCI7XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIHRvSlNPTigpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHZhbHVlT2YoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFN1YnR5cGVBbmRTdWZmaXgoc3VidHlwZTpzdHJpbmcpOnZvaWQge1xuICAgICAgdGhpcy5fc3VidHlwZSA9IHN1YnR5cGU7XG4gICAgICB0aGlzLl9zdWJ0eXBlRmFjZXRzID0gW107XG4gICAgICB0aGlzLl9zdWZmaXggPSBudWxsO1xuICAgICAgaWYgKHN1YnR5cGUpIHtcbiAgICAgICAgaWYgKHN1YnR5cGUuaW5kZXhPZihcIitcIikgPiAtMSAmJiBzdWJ0eXBlLnN1YnN0cigtMSkgIT09IFwiK1wiKSB7XG4gICAgICAgICAgdmFyIGZpeGVzID0gc3VidHlwZS5zcGxpdChcIitcIiwgMik7XG4gICAgICAgICAgdGhpcy5fc3VidHlwZSA9IGZpeGVzWzBdO1xuICAgICAgICAgIHRoaXMuX3N1YnR5cGVGYWNldHMgPSBmaXhlc1swXS5zcGxpdChcIi5cIik7XG4gICAgICAgICAgdGhpcy5fc3VmZml4ID0gZml4ZXNbMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fc3VidHlwZUZhY2V0cyA9IHN1YnR5cGUuc3BsaXQoXCIuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaXJzdFN1YnR5cGVGYWNldEVxdWFscyhzdHI6c3RyaW5nKTpib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdWJ0eXBlRmFjZXRzLmxlbmd0aCA+IDAgJiYgdGhpcy5fc3VidHlwZUZhY2V0c1swXSA9PT0gc3RyO1xuICAgIH1cblxuICAgIHByaXZhdGUgd3JhcFF1b3RlcyhzdHI6c3RyaW5nKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIChzdHIuaW5kZXhPZihcIjtcIikgPiAtMSkgPyAnXCInICsgc3RyICsgJ1wiJyA6IHN0cjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVud3JhcFF1b3RlcyhzdHI6c3RyaW5nKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIChzdHIuc3Vic3RyKDAsIDEpID09PSAnXCInICYmIHN0ci5zdWJzdHIoLTEpID09PSAnXCInKSA/IHN0ci5zdWJzdHIoMSwgc3RyLmxlbmd0aCAtIDIpIDogc3RyO1xuICAgIH1cbiAgfVxufVxuIiwibW9kdWxlIFNwaWN5UGl4ZWwuQ29yZSB7XG4gICAgZXhwb3J0IGNsYXNzIEltcG9ydHMge1xuICAgIH1cbn1cblxuZGVjbGFyZSB2YXIgbW9kdWxlOmFueTtcbmRlY2xhcmUgdmFyIGV4cG9ydHM6YW55O1xuZGVjbGFyZSB2YXIgZGVmaW5lOmFueTtcbmRlY2xhcmUgdmFyIHJlcXVpcmU6YW55O1xuXG4oZnVuY3Rpb24gKHJvb3Q6YW55LCBmYWN0b3J5OmFueSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1EIGFub255bW91cyBtb2R1bGVcbiAgICAgICAgZGVmaW5lKFtdLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBDb21tb25KUyBhbm9ueW1vdXMgbW9kdWxlXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEJyb3dzZXIgZ2xvYmFsc1xuICAgICAgICByb290LlNwaWN5UGl4ZWwgPSByb290LlNwaWN5UGl4ZWwgfHwge307XG4gICAgICAgIHJvb3QuU3BpY3lQaXhlbC5Db3JlID0gZmFjdG9yeSgpO1xuICAgIH1cbn0pKHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gU3BpY3lQaXhlbC5Db3JlO1xufSk7Il0sInNvdXJjZVJvb3QiOiIuLyJ9