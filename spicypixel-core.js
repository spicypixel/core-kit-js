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
        }());
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
                return "data:" +
                    (this._mediaType ? this._mediaType.toString() : "") +
                    (this._isBase64 ? ";base64" : "") + "," +
                    (this._data ? this._data : "");
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
        }());
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
        }());
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
        }());
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkFycmF5QnVmZmVyQ29udmVydGVyLnRzIiwiRGF0YVVSTC50cyIsIk1lZGlhVHlwZS50cyIsIlVuaXZlcnNhbE1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFVBQVUsQ0FxR2hCO0FBckdELFdBQU8sVUFBVTtJQUFDLElBQUEsSUFBSSxDQXFHckI7SUFyR2lCLFdBQUEsSUFBSSxFQUFDLENBQUM7UUFDdEIsSUFBSSxLQUFLLEdBQUcsa0VBQWtFLENBQUM7UUFFL0U7WUFFRTtnQkFDRSxNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7WUFDMUUsQ0FBQztZQUVEOzs7Ozs7OztlQVFHO1lBQ0ksNkJBQVEsR0FBZixVQUFnQixXQUF1QjtnQkFDckMsdUJBQXVCO2dCQUN2QixJQUFJLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDdkIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUVoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUMvQixNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzdELE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFD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eEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEdBQUcsT0FBTyxFQUFFLENBQUM7SUFDbkMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtJQUNQLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6InNwaWN5cGl4ZWwtY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZSBTcGljeVBpeGVsLkNvcmUge1xuICB2YXIgY2hhcnMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIjtcblxuICBleHBvcnQgY2xhc3MgQXJyYXlCdWZmZXJDb252ZXJ0ZXJcbiAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGlzIGNsYXNzIGlzIHN0YXRpYyBhbmQgbm90IG1lYW50IHRvIGJlIGNvbnN0cnVjdGVkJyk7XG4gICAgfVxuXG4gICAgLypcbiAgICAgKiBCYXNlNjQgY29udmVyc2lvbiBmcm9tOlxuICAgICAqXG4gICAgICogYmFzZTY0LWFycmF5YnVmZmVyXG4gICAgICogaHR0cHM6Ly9naXRodWIuY29tL25pa2xhc3ZoL2Jhc2U2NC1hcnJheWJ1ZmZlclxuICAgICAqXG4gICAgICogQ29weXJpZ2h0IChjKSAyMDEyIE5pa2xhcyB2b24gSGVydHplblxuICAgICAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbiAgICAgKi9cbiAgICBzdGF0aWMgdG9CYXNlNjQoYXJyYXlCdWZmZXI6QXJyYXlCdWZmZXIpOnN0cmluZyB7XG4gICAgICAvLyBqc2hpbnQgYml0d2lzZTpmYWxzZVxuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlCdWZmZXIpO1xuICAgICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aDtcbiAgICAgIHZhciBiYXNlNjQgPSBcIlwiO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSs9Mykge1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaV0gPj4gMl07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2ldICYgMykgPDwgNCkgfCAoYnl0ZXNbaSArIDFdID4+IDQpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaSArIDFdICYgMTUpIDw8IDIpIHwgKGJ5dGVzW2kgKyAyXSA+PiA2KV07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpICsgMl0gJiA2M107XG4gICAgICB9XG5cbiAgICAgIGlmICgobGVuICUgMykgPT09IDIpIHtcbiAgICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMSkgKyBcIj1cIjtcbiAgICAgIH0gZWxzZSBpZiAobGVuICUgMyA9PT0gMSkge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAyKSArIFwiPT1cIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJhc2U2NDtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOnRydWVcbiAgICB9XG5cbiAgICBzdGF0aWMgZnJvbUJhc2U2NChiYXNlNjQ6c3RyaW5nKTpBcnJheUJ1ZmZlciB7XG4gICAgICAvLyBqc2hpbnQgYml0d2lzZTpmYWxzZVxuICAgICAgdmFyIGJ1ZmZlckxlbmd0aCA9IGJhc2U2NC5sZW5ndGggKiAwLjc1O1xuICAgICAgdmFyIGxlbiA9IGJhc2U2NC5sZW5ndGg7XG4gICAgICB2YXIgcCA9IDA7XG4gICAgICB2YXIgZW5jb2RlZDE6bnVtYmVyLCBlbmNvZGVkMjpudW1iZXIsIGVuY29kZWQzOm51bWJlciwgZW5jb2RlZDQ6bnVtYmVyO1xuXG4gICAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAxXSA9PT0gXCI9XCIpIHtcbiAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDJdID09PSBcIj1cIikge1xuICAgICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBhcnJheWJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihidWZmZXJMZW5ndGgpLFxuICAgICAgICBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrPTQpIHtcbiAgICAgICAgZW5jb2RlZDEgPSBjaGFycy5pbmRleE9mKGJhc2U2NFtpXSk7XG4gICAgICAgIGVuY29kZWQyID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSsxXSk7XG4gICAgICAgIGVuY29kZWQzID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSsyXSk7XG4gICAgICAgIGVuY29kZWQ0ID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaSszXSk7XG5cbiAgICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMSA8PCAyKSB8IChlbmNvZGVkMiA+PiA0KTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDIgJiAxNSkgPDwgNCkgfCAoZW5jb2RlZDMgPj4gMik7XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQzICYgMykgPDwgNikgfCAoZW5jb2RlZDQgJiA2Myk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheWJ1ZmZlcjtcbiAgICAgIC8vIGpzaGludCBiaXR3aXNlOnRydWVcbiAgICB9XG5cbiAgICBzdGF0aWMgdG9CaW5hcnlTdHJpbmcoYXJyYXlCdWZmZXI6QXJyYXlCdWZmZXIpOnN0cmluZyB7XG4gICAgICB2YXIgYmluYXJ5ID0gXCJcIjtcbiAgICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5QnVmZmVyKTtcbiAgICAgIHZhciBsZW5ndGggPSBieXRlcy5ieXRlTGVuZ3RoO1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgd2hpbGUgKGkgPCBsZW5ndGgpIHtcbiAgICAgICAgYmluYXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICAgICAgICArK2k7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmluYXJ5O1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tQmluYXJ5U3RyaW5nKGJpbmFyeTpzdHJpbmcpOkFycmF5QnVmZmVyIHtcbiAgICAgIHZhciBsZW5ndGggPSBiaW5hcnkubGVuZ3RoO1xuICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAgICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgbGVuZ3RoKSB7XG4gICAgICAgIHZhciBjb2RlID0gYmluYXJ5LmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmIChjb2RlID4gMjU1KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYSBtdWx0aWJ5dGUgY2hhcmFjdGVyIHdhcyBlbmNvdW50ZXJlZCBpbiB0aGUgcHJvdmlkZWQgc3RyaW5nIHdoaWNoIGluZGljYXRlcyBpdCB3YXMgbm90IGVuY29kZWQgYXMgYSBiaW5hcnkgc3RyaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGJ5dGVzW2ldID0gY29kZTtcbiAgICAgICAgKytpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJ5dGVzLmJ1ZmZlcjtcbiAgICB9XG4gIH1cbn1cbiIsIi8vIFRPRE86IE9wdGltaXplIHVzaW5nIGRlZmVycmVkIHBhcnNpbmcuXG4vLyBJZiBhIGRhdGEgVVJMIHN0cmluZyBpcyBwYXNzZWQgaW4gYW5kIHRoZSBvbmx5IG9wZXJhdGlvbiBjYWxsZWQgaXNcbi8vIHRvU3RyaW5nKCkgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIHBhcnNlIGFuZCBpbmNyZWFzZVxuLy8gbWVtb3J5IGNvbnN1bXB0aW9uLiBUaGlzIHdvdWxkIGNvbXBsaWNhdGUgdGhlIGNvZGUgdGhvdWdoXG4vLyBzbyBvbmx5IGltcGxlbWVudCBpZiBuZWVkZWQuXG5cbmRlY2xhcmUgdmFyIGVzY2FwZTooczpzdHJpbmcpID0+IHN0cmluZztcbmRlY2xhcmUgdmFyIHVuZXNjYXBlOihzOnN0cmluZykgPT4gc3RyaW5nO1xuXG5tb2R1bGUgU3BpY3lQaXhlbC5Db3JlIHtcbiAgLy8gZGF0YTpbPE1JTUUtdHlwZT5dWztjaGFyc2V0PTxlbmNvZGluZz5dWztiYXNlNjRdLDxkYXRhPlxuXG4gIC8vIGRhdGF1cmwgICAgOj0gXCJkYXRhOlwiIFsgbWVkaWF0eXBlIF0gWyBcIjtiYXNlNjRcIiBdIFwiLFwiIGRhdGFcbiAgLy8gbWVkaWF0eXBlICA6PSBbIHR5cGUgXCIvXCIgc3VidHlwZSBdICooIFwiO1wiIHBhcmFtZXRlciApXG4gIC8vIGRhdGEgICAgICAgOj0gKnVybGNoYXJcbiAgLy8gcGFyYW1ldGVyICA6PSBhdHRyaWJ1dGUgXCI9XCIgdmFsdWVcbiAgZXhwb3J0IGNsYXNzIERhdGFVUkwge1xuICAgIHByaXZhdGUgX21lZGlhVHlwZTpNZWRpYVR5cGU7XG4gICAgcHJpdmF0ZSBfaXNCYXNlNjQ6Ym9vbGVhbjtcbiAgICBwcml2YXRlIF9kYXRhOnN0cmluZztcblxuICAgIGdldCBtZWRpYVR5cGUoKTpNZWRpYVR5cGUge1xuICAgICAgcmV0dXJuIHRoaXMuX21lZGlhVHlwZTtcbiAgICB9XG5cbiAgICBzZXQgbWVkaWFUeXBlKG1lZGlhVHlwZTpNZWRpYVR5cGUpIHtcbiAgICAgIGlmKG1lZGlhVHlwZSBpbnN0YW5jZW9mIE1lZGlhVHlwZSkge1xuICAgICAgICB0aGlzLl9tZWRpYVR5cGUgPSBtZWRpYVR5cGU7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2YgbWVkaWFUeXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRoaXMuX21lZGlhVHlwZSA9IG5ldyBNZWRpYVR5cGUoPHN0cmluZz48YW55Pm1lZGlhVHlwZSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWVkaWEgdHlwZSBtdXN0IGJlICdzdHJpbmcnIG9yICdNZWRpYVR5cGUnXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGdldCBpc0Jhc2U2NCgpOmJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRoaXMuX2lzQmFzZTY0O1xuICAgIH1cblxuICAgIGdldCBkYXRhKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgIH1cblxuICAgIHNldEJhc2U2NEVuY29kZWREYXRhKGJhc2U2NEVuY29kZWREYXRhOnN0cmluZyk6dm9pZCB7XG4gICAgICB0aGlzLl9pc0Jhc2U2NCA9IHRydWU7XG4gICAgICB0aGlzLl9kYXRhID0gYmFzZTY0RW5jb2RlZERhdGE7XG4gICAgfVxuXG4gICAgc2V0VVJMRW5jb2RlZERhdGEodXJsRW5jb2RlZERhdGE6c3RyaW5nKTp2b2lkIHtcbiAgICAgIHRoaXMuX2lzQmFzZTY0ID0gZmFsc2U7XG4gICAgICB0aGlzLl9kYXRhID0gdXJsRW5jb2RlZERhdGE7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoZGF0YTphbnksIG9wdGlvbnM/OmFueSkge1xuICAgICAgLy8gU2V0IGRlZmF1bHQgb3B0aW9uc1xuICAgICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgbWVkaWFUeXBlOiBudWxsLFxuICAgICAgICAgIGVuY29kaW5nOiBcImF1dG9cIlxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZighb3B0aW9ucy5lbmNvZGluZykge1xuICAgICAgICBvcHRpb25zLmVuY29kaW5nID0gXCJhdXRvXCI7XG4gICAgICB9XG5cbiAgICAgIC8vIFZhbGlkYXRlIGVuY29kaW5nXG4gICAgICBpZiAob3B0aW9ucy5lbmNvZGluZyAhPT0gXCJhdXRvXCIgJiYgb3B0aW9ucy5lbmNvZGluZyAhPT0gXCJ1cmxcIiAmJiBvcHRpb25zLmVuY29kaW5nICE9PSBcImJhc2U2NFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gZW5jb2RpbmcgKG11c3QgYmUgJ2F1dG8nLCAndXJsJywgb3IgJ2Jhc2U2NCcpOiBcIiArIG9wdGlvbnMuZW5jb2RpbmcpO1xuICAgICAgfVxuXG4gICAgICAvLyBTYXZlIG1lZGlhIHR5cGVcbiAgICAgIHZhciBtZWRpYVR5cGU6YW55ID0gb3B0aW9ucy5tZWRpYVR5cGU7XG4gICAgICBpZiAodHlwZW9mIG1lZGlhVHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBtZWRpYVR5cGUgPSBuZXcgTWVkaWFUeXBlKG1lZGlhVHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLl9tZWRpYVR5cGUgPSBtZWRpYVR5cGU7XG5cbiAgICAgIC8vIFNhdmUgZGF0YSBhbmQgcmV0dXJuIGlmIG5vbmVcbiAgICAgIGlmICghZGF0YSkge1xuICAgICAgICB0aGlzLl9pc0Jhc2U2NCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9kYXRhID0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBQYXJzZSBkYXRhXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcImJhc2U2NFwiIHx8IG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYXV0b1wiKSB7XG4gICAgICAgICAgdGhpcy5zZXRCYXNlNjRFbmNvZGVkRGF0YShBcnJheUJ1ZmZlckNvbnZlcnRlci50b0Jhc2U2NChkYXRhKSk7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJ1cmxcIikge1xuICAgICAgICAgIHRoaXMuc2V0VVJMRW5jb2RlZERhdGEoZW5jb2RlVVJJQ29tcG9uZW50KEFycmF5QnVmZmVyQ29udmVydGVyLnRvQmluYXJ5U3RyaW5nKGRhdGEpKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgLy8gRW5zdXJlIHRoaXMgaXMgYSBkYXRhIFVSSVxuICAgICAgICB2YXIgc3RhcnRzV2l0aERhdGEgPSBkYXRhLnNsaWNlKDAsIFwiZGF0YTpcIi5sZW5ndGgpID09PSBcImRhdGE6XCI7XG4gICAgICAgIGlmICghc3RhcnRzV2l0aERhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5ICdkYXRhJyBVUkkgc3RyaW5ncyBhcmUgc3VwcG9ydGVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmluZCB0aGUgY29tbWEgdGhhdCBzZXBhcmF0ZXMgdGhlIHByZWZpeCBmcm9tIHRoZSBkYXRhXG4gICAgICAgIHZhciBjb21tYUluZGV4ID0gZGF0YS5pbmRleE9mKFwiLFwiKTtcbiAgICAgICAgaWYgKGNvbW1hSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBjb21tYSBpbiBTUUxCbG9iIFVSTFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBwcmVmaXggYW5kIGRhdGFcbiAgICAgICAgdmFyIHByZWZpeCA9IGRhdGEuc2xpY2UoMCwgY29tbWFJbmRleCk7XG4gICAgICAgIHZhciBlbmNvZGVkRGF0YSA9IGRhdGEuc2xpY2UoY29tbWFJbmRleCArIDEpO1xuXG4gICAgICAgIC8vIEdldCBpcyBiYXNlNjRcbiAgICAgICAgdmFyIHByZWZpeFBhcnRzID0gcHJlZml4LnNwbGl0KCc7Jyk7XG4gICAgICAgIHZhciBpc0Jhc2U2NCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHByZWZpeFBhcnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgdmFyIHByZWZpeFBhcnQgPSBwcmVmaXhQYXJ0c1tpXS50cmltKCk7XG4gICAgICAgICAgaWYgKHByZWZpeFBhcnQgPT09IFwiYmFzZTY0XCIpIHtcbiAgICAgICAgICAgIGlzQmFzZTY0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBtZWRpYSB0eXBlXG4gICAgICAgIG1lZGlhVHlwZSA9IHByZWZpeC5zbGljZShcImRhdGE6XCIubGVuZ3RoLCBjb21tYUluZGV4KTtcbiAgICAgICAgbWVkaWFUeXBlID0gbWVkaWFUeXBlLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBtZWRpYVR5cGU7XG4gICAgICAgIHRoaXMuX21lZGlhVHlwZSA9IHRoaXMuX21lZGlhVHlwZSB8fCBuZXcgTWVkaWFUeXBlKG1lZGlhVHlwZSk7XG5cbiAgICAgICAgLy8gQ29udmVydCBlbmNvZGVkIGRhdGEgYXMgbmVlZGVkXG4gICAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcImF1dG9cIikge1xuICAgICAgICAgIC8vIEF1dG8gZW5jb2Rpbmcgc2F2ZXMgdGhlIGRhdGEgVVJJIGFzIGlzXG4gICAgICAgICAgdGhpcy5faXNCYXNlNjQgPSBpc0Jhc2U2NDtcbiAgICAgICAgICB0aGlzLl9kYXRhID0gZW5jb2RlZERhdGE7XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJiYXNlNjRcIikge1xuICAgICAgICAgIC8vIENvbnZlcnQgdG8gYmFzZTY0XG4gICAgICAgICAgdGhpcy5faXNCYXNlNjQgPSB0cnVlO1xuICAgICAgICAgIGlmIChpc0Jhc2U2NCkge1xuICAgICAgICAgICAgdGhpcy5fZGF0YSA9IGVuY29kZWREYXRhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhID0gd2luZG93LmJ0b2EodW5lc2NhcGUoZW5jb2RlZERhdGEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5lbmNvZGluZyA9PT0gXCJ1cmxcIikge1xuICAgICAgICAgIC8vIENvbnZlcnQgdG8gVVJMIGVuY29kaW5nXG4gICAgICAgICAgdGhpcy5faXNCYXNlNjQgPSBmYWxzZTtcbiAgICAgICAgICBpZiAoIWlzQmFzZTY0KSB7XG4gICAgICAgICAgICB0aGlzLl9kYXRhID0gZW5jb2RlZERhdGE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGEgPSBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmF0b2IoZW5jb2RlZERhdGEpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuc3VwcG9ydGVkIG9iamVjdCB0eXBlIChtdXN0IGJlIEFycmF5QnVmZmVyIG9yIHN0cmluZyk6IFwiICsgdHlwZW9mIGRhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiBcImRhdGE6XCIgK1xuICAgICAgICAodGhpcy5fbWVkaWFUeXBlID8gdGhpcy5fbWVkaWFUeXBlLnRvU3RyaW5nKCkgOiBcIlwiKSArXG4gICAgICAgICh0aGlzLl9pc0Jhc2U2NCA/IFwiO2Jhc2U2NFwiIDogXCJcIikgKyBcIixcIiArXG4gICAgICAgICh0aGlzLl9kYXRhID8gdGhpcy5fZGF0YSA6IFwiXCIpO1xuICAgIH1cblxuICAgIHRvSlNPTigpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICAgIH1cblxuICAgIHZhbHVlT2YoKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICB0b0FycmF5QnVmZmVyKCk6QXJyYXlCdWZmZXIge1xuICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2lzQmFzZTY0KSB7XG4gICAgICAgIHJldHVybiBBcnJheUJ1ZmZlckNvbnZlcnRlci5mcm9tQmFzZTY0KHRoaXMuX2RhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEFycmF5QnVmZmVyQ29udmVydGVyLmZyb21CaW5hcnlTdHJpbmcodW5lc2NhcGUodGhpcy5fZGF0YSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRvQmFzZTY0KCk6c3RyaW5nIHtcbiAgICAgIGlmICghdGhpcy5fZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9pc0Jhc2U2NCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuYnRvYSh1bmVzY2FwZSh0aGlzLl9kYXRhKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdG9CaW5hcnlTdHJpbmcoKTpzdHJpbmcge1xuICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2lzQmFzZTY0KSB7XG4gICAgICAgIHJldHVybiB3aW5kb3cuYXRvYih0aGlzLl9kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1bmVzY2FwZSh0aGlzLl9kYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0b1VuaWNvZGVTdHJpbmcoKTpzdHJpbmcge1xuICAgICAgaWYgKCF0aGlzLl9kYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2lzQmFzZTY0KSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKHdpbmRvdy5hdG9iKHRoaXMuX2RhdGEpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMuX2RhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tQmFzZTY0KGJhc2U2NDpzdHJpbmcsIG9wdGlvbnM/OmFueSk6RGF0YVVSTCB7XG4gICAgICByZXR1cm4gbmV3IERhdGFVUkwoXCJkYXRhOjtiYXNlNjQsXCIgKyBiYXNlNjQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tQmluYXJ5U3RyaW5nKGJpbmFyeTpzdHJpbmcsIG9wdGlvbnM/OmFueSk6RGF0YVVSTCB7XG4gICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICBlbmNvZGluZzogXCJhdXRvXCJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcImJhc2U2NFwiIHx8IG9wdGlvbnMuZW5jb2RpbmcgPT09IFwiYXV0b1wiKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YVVSTChcImRhdGE6O2Jhc2U2NCxcIiArIHdpbmRvdy5idG9hKGJpbmFyeSksIG9wdGlvbnMpO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb25zLmVuY29kaW5nID09PSBcInVybFwiKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGF0YVVSTChcImRhdGE6LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGJpbmFyeSksIG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tVW5pY29kZVN0cmluZyh0ZXh0OnN0cmluZywgb3B0aW9ucz86YW55KTpEYXRhVVJMIHtcbiAgICAgIHJldHVybiBuZXcgRGF0YVVSTChcImRhdGE6LFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRleHQpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cbn1cbiIsIi8qKlxuICogbWVkaWEtdHlwZVxuICogQGF1dGhvciBMb3ZlbGwgRnVsbGVyIChvcmlnaW5hbCBKUylcbiAqIEBhdXRob3IgQWFyb24gT25lYWwgKFR5cGVTY3JpcHQpXG4gKlxuICogVGhpcyBjb2RlIGlzIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSBWZXJzaW9uIDIuMCwgdGhlIHRlcm1zIG9mXG4gKiB3aGljaCBtYXkgYmUgZm91bmQgYXQgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wLmh0bWxcbiAqL1xuXG5tb2R1bGUgU3BpY3lQaXhlbC5Db3JlIHtcbiAgdmFyIG1lZGlhVHlwZU1hdGNoZXIgPSAvXihhcHBsaWNhdGlvbnxhdWRpb3xpbWFnZXxtZXNzYWdlfG1vZGVsfG11bHRpcGFydHx0ZXh0fHZpZGVvKVxcLyhbYS16QS1aMC05ISMkJV4mXFwqX1xcLVxcK3t9XFx8Jy5gfl17MSwxMjd9KSg7LiopPyQvO1xuICB2YXIgcGFyYW1ldGVyU3BsaXR0ZXIgPSAvOyg/PSg/OlteXFxcIl0qXFxcIlteXFxcIl0qXFxcIikqKD8hW15cXFwiXSpcXFwiKSkvO1xuXG4gIGV4cG9ydCBjbGFzcyBNZWRpYVR5cGUge1xuICAgIHByaXZhdGUgX3R5cGU6c3RyaW5nO1xuICAgIHByaXZhdGUgX3N1YnR5cGU6c3RyaW5nO1xuICAgIHByaXZhdGUgX3BhcmFtZXRlcnM6YW55O1xuICAgIHByaXZhdGUgX3N1ZmZpeDpzdHJpbmc7XG4gICAgcHJpdmF0ZSBfc3VidHlwZUZhY2V0czpzdHJpbmdbXTtcblxuICAgIGNvbnN0cnVjdG9yKG1lZGlhVHlwZT86c3RyaW5nKSB7XG4gICAgICB0aGlzLl90eXBlID0gbnVsbDtcbiAgICAgIHRoaXMuc2V0U3VidHlwZUFuZFN1ZmZpeChudWxsKTtcbiAgICAgIHRoaXMuX3BhcmFtZXRlcnMgPSB7fTtcblxuICAgICAgaWYgKG1lZGlhVHlwZSkge1xuICAgICAgICB2YXIgbWF0Y2ggPSBtZWRpYVR5cGUubWF0Y2gobWVkaWFUeXBlTWF0Y2hlcik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgIHRoaXMuX3R5cGUgPSBtYXRjaFsxXTtcbiAgICAgICAgICB0aGlzLnNldFN1YnR5cGVBbmRTdWZmaXgobWF0Y2hbMl0pO1xuICAgICAgICAgIGlmIChtYXRjaFszXSkge1xuICAgICAgICAgICAgbWF0Y2hbM10uc3Vic3RyKDEpLnNwbGl0KHBhcmFtZXRlclNwbGl0dGVyKS5mb3JFYWNoKChwYXJhbWV0ZXIpID0+IHtcbiAgICAgICAgICAgICAgdmFyIGtleUFuZFZhbHVlID0gcGFyYW1ldGVyLnNwbGl0KCc9JywgMik7XG4gICAgICAgICAgICAgIGlmIChrZXlBbmRWYWx1ZS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzW2tleUFuZFZhbHVlWzBdLnRvTG93ZXJDYXNlKCkudHJpbSgpXSA9IHRoaXMudW53cmFwUXVvdGVzKGtleUFuZFZhbHVlWzFdLnRyaW0oKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGdldCB0eXBlKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLl90eXBlO1xuICAgIH1cblxuICAgIHNldCB0eXBlKHR5cGU6c3RyaW5nKSB7XG4gICAgICB0aGlzLl90eXBlID0gdHlwZTtcbiAgICB9XG5cbiAgICBnZXQgc3VidHlwZSgpOnN0cmluZyB7XG4gICAgICByZXR1cm4gdGhpcy5fc3VidHlwZTtcbiAgICB9XG5cbiAgICBzZXQgc3VidHlwZShzdWJ0eXBlOnN0cmluZykge1xuICAgICAgdGhpcy5zZXRTdWJ0eXBlQW5kU3VmZml4KHN1YnR5cGUpO1xuICAgIH1cblxuICAgIGdldCBwYXJhbWV0ZXJzKCk6YW55IHtcbiAgICAgIHJldHVybiB0aGlzLl9wYXJhbWV0ZXJzO1xuICAgIH1cblxuICAgIHNldCBwYXJhbWV0ZXJzKHBhcmFtZXRlcnM6YW55KSB7XG4gICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gcGFyYW1ldGVycztcbiAgICB9XG5cbiAgICBnZXQgaXNWYWxpZCgpOmJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRoaXMuX3R5cGUgIT09IG51bGwgJiYgdGhpcy5fc3VidHlwZSAhPT0gbnVsbCAmJiB0aGlzLl9zdWJ0eXBlICE9PSBcImV4YW1wbGVcIjtcbiAgICB9XG5cbiAgICBnZXQgaGFzU3VmZml4KCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gISF0aGlzLl9zdWZmaXg7XG4gICAgfVxuXG4gICAgZ2V0IGlzVmVuZG9yKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5maXJzdFN1YnR5cGVGYWNldEVxdWFscyhcInZuZFwiKTtcbiAgICB9XG5cbiAgICBnZXQgaXNQZXJzb25hbCgpOmJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRoaXMuZmlyc3RTdWJ0eXBlRmFjZXRFcXVhbHMoXCJwcnNcIik7XG4gICAgfVxuXG4gICAgZ2V0IGlzRXhwZXJpbWVudGFsKCk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5maXJzdFN1YnR5cGVGYWNldEVxdWFscyhcInhcIikgfHwgdGhpcy5fc3VidHlwZS5zdWJzdHJpbmcoMCwgMikudG9Mb3dlckNhc2UoKSA9PT0gXCJ4LVwiO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCk6c3RyaW5nIHtcbiAgICAgIHZhciBzdHIgPSBcIlwiO1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkge1xuICAgICAgICBzdHIgPSBzdHIgKyB0aGlzLl90eXBlICsgXCIvXCIgKyB0aGlzLl9zdWJ0eXBlO1xuICAgICAgICBpZiAodGhpcy5oYXNTdWZmaXgpIHtcbiAgICAgICAgICBzdHIgPSBzdHIgKyBcIitcIiArIHRoaXMuX3N1ZmZpeDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyYW1ldGVyS2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuX3BhcmFtZXRlcnMpO1xuICAgICAgICBpZiAocGFyYW1ldGVyS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdmFyIHBhcmFtZXRlcnM6c3RyaW5nW10gPSBbXTtcbiAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgcGFyYW1ldGVyS2V5cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYS5sb2NhbGVDb21wYXJlKGIpO1xuICAgICAgICAgIH0pLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaChlbGVtZW50ICsgXCI9XCIgKyB0aGlzLndyYXBRdW90ZXModGhhdC5fcGFyYW1ldGVyc1tlbGVtZW50XSkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHN0ciA9IHN0ciArIFwiO1wiICsgcGFyYW1ldGVycy5qb2luKFwiO1wiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG5cbiAgICB0b0pTT04oKTpzdHJpbmcge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9XG5cbiAgICB2YWx1ZU9mKCk6c3RyaW5nIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRTdWJ0eXBlQW5kU3VmZml4KHN1YnR5cGU6c3RyaW5nKTp2b2lkIHtcbiAgICAgIHRoaXMuX3N1YnR5cGUgPSBzdWJ0eXBlO1xuICAgICAgdGhpcy5fc3VidHlwZUZhY2V0cyA9IFtdO1xuICAgICAgdGhpcy5fc3VmZml4ID0gbnVsbDtcbiAgICAgIGlmIChzdWJ0eXBlKSB7XG4gICAgICAgIGlmIChzdWJ0eXBlLmluZGV4T2YoXCIrXCIpID4gLTEgJiYgc3VidHlwZS5zdWJzdHIoLTEpICE9PSBcIitcIikge1xuICAgICAgICAgIHZhciBmaXhlcyA9IHN1YnR5cGUuc3BsaXQoXCIrXCIsIDIpO1xuICAgICAgICAgIHRoaXMuX3N1YnR5cGUgPSBmaXhlc1swXTtcbiAgICAgICAgICB0aGlzLl9zdWJ0eXBlRmFjZXRzID0gZml4ZXNbMF0uc3BsaXQoXCIuXCIpO1xuICAgICAgICAgIHRoaXMuX3N1ZmZpeCA9IGZpeGVzWzFdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3N1YnR5cGVGYWNldHMgPSBzdWJ0eXBlLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZmlyc3RTdWJ0eXBlRmFjZXRFcXVhbHMoc3RyOnN0cmluZyk6Ym9vbGVhbiB7XG4gICAgICByZXR1cm4gdGhpcy5fc3VidHlwZUZhY2V0cy5sZW5ndGggPiAwICYmIHRoaXMuX3N1YnR5cGVGYWNldHNbMF0gPT09IHN0cjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHdyYXBRdW90ZXMoc3RyOnN0cmluZyk6c3RyaW5nIHtcbiAgICAgIHJldHVybiAoc3RyLmluZGV4T2YoXCI7XCIpID4gLTEpID8gJ1wiJyArIHN0ciArICdcIicgOiBzdHI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1bndyYXBRdW90ZXMoc3RyOnN0cmluZyk6c3RyaW5nIHtcbiAgICAgIHJldHVybiAoc3RyLnN1YnN0cigwLCAxKSA9PT0gJ1wiJyAmJiBzdHIuc3Vic3RyKC0xKSA9PT0gJ1wiJykgPyBzdHIuc3Vic3RyKDEsIHN0ci5sZW5ndGggLSAyKSA6IHN0cjtcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZSBTcGljeVBpeGVsLkNvcmUge1xuICBleHBvcnQgY2xhc3MgSW1wb3J0cyB7XG4gIH1cbn1cblxuZGVjbGFyZSB2YXIgbW9kdWxlOmFueTtcbmRlY2xhcmUgdmFyIGV4cG9ydHM6YW55O1xuZGVjbGFyZSB2YXIgZGVmaW5lOmFueTtcbmRlY2xhcmUgdmFyIHJlcXVpcmU6YW55O1xuXG4oZnVuY3Rpb24gKHJvb3Q6YW55LCBmYWN0b3J5OmFueSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EIGFub255bW91cyBtb2R1bGVcbiAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIC8vIENvbW1vbkpTIGFub255bW91cyBtb2R1bGVcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBCcm93c2VyIGdsb2JhbHNcbiAgICByb290LlNwaWN5UGl4ZWwgPSByb290LlNwaWN5UGl4ZWwgfHwge307XG4gICAgcm9vdC5TcGljeVBpeGVsLkNvcmUgPSBmYWN0b3J5KCk7XG4gIH1cbn0pKHRoaXMsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFNwaWN5UGl4ZWwuQ29yZTtcbn0pOyJdLCJzb3VyY2VSb290Ijoic3JjLyJ9
