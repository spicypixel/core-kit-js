/**
 * media-type
 * @author Lovell Fuller (original JS)
 * @author Aaron Oneal (TypeScript)
 *
 * This code is distributed under the Apache License Version 2.0, the terms of
 * which may be found at http://www.apache.org/licenses/LICENSE-2.0.html
 */

module SpicyPixel.Core {
  var mediaTypeMatcher = /^(application|audio|image|message|model|multipart|text|video)\/([a-zA-Z0-9!#$%^&\*_\-\+{}\|'.`~]{1,127})(;.*)?$/;
  var parameterSplitter = /;(?=(?:[^\"]*\"[^\"]*\")*(?![^\"]*\"))/;

  export class MediaType {
    private _type:string;
    private _subtype:string;
    private _parameters:any;
    private _suffix:string;
    private _subtypeFacets:string[];

    constructor(mediaType?:string) {
      this._type = null;
      this.setSubtypeAndSuffix(null);
      this._parameters = {};

      if (mediaType) {
        var match = mediaType.match(mediaTypeMatcher);
        if (match) {
          this._type = match[1];
          this.setSubtypeAndSuffix(match[2]);
          if (match[3]) {
            match[3].substr(1).split(parameterSplitter).forEach((parameter) => {
              var keyAndValue = parameter.split('=', 2);
              if (keyAndValue.length === 2) {
                this._parameters[keyAndValue[0].toLowerCase().trim()] = this.unwrapQuotes(keyAndValue[1].trim());
              }
            });
          }
        }
      }
    }

    get type():string {
      return this._type;
    }

    set type(type:string) {
      this._type = type;
    }

    get subtype():string {
      return this._subtype;
    }

    set subtype(subtype:string) {
      this.setSubtypeAndSuffix(subtype);
    }

    get parameters():any {
      return this._parameters;
    }

    set parameters(parameters:any) {
      this._parameters = parameters;
    }

    get isValid():boolean {
      return this._type !== null && this._subtype !== null && this._subtype !== "example";
    }

    get hasSuffix():boolean {
      return !!this._suffix;
    }

    get isVendor():boolean {
      return this.firstSubtypeFacetEquals("vnd");
    }

    get isPersonal():boolean {
      return this.firstSubtypeFacetEquals("prs");
    }

    get isExperimental():boolean {
      return this.firstSubtypeFacetEquals("x") || this._subtype.substring(0, 2).toLowerCase() === "x-";
    }

    toString():string {
      var str = "";
      if (this.isValid) {
        str = str + this._type + "/" + this._subtype;
        if (this.hasSuffix) {
          str = str + "+" + this._suffix;
        }
        var parameterKeys = Object.keys(this._parameters);
        if (parameterKeys.length > 0) {
          var parameters:string[] = [];
          var that = this;
          parameterKeys.sort((a, b) => {
            return a.localeCompare(b);
          }).forEach((element) => {
            parameters.push(element + "=" + this.wrapQuotes(that._parameters[element]));
          });
          str = str + ";" + parameters.join(";");
        }
      }
      return str;
    }

    toJSON():string {
      return this.toString();
    }

    valueOf():string {
      return this.toString();
    }

    private setSubtypeAndSuffix(subtype:string):void {
      this._subtype = subtype;
      this._subtypeFacets = [];
      this._suffix = null;
      if (subtype) {
        if (subtype.indexOf("+") > -1 && subtype.substr(-1) !== "+") {
          var fixes = subtype.split("+", 2);
          this._subtype = fixes[0];
          this._subtypeFacets = fixes[0].split(".");
          this._suffix = fixes[1];
        } else {
          this._subtypeFacets = subtype.split(".");
        }
      }
    }

    private firstSubtypeFacetEquals(str:string):boolean {
      return this._subtypeFacets.length > 0 && this._subtypeFacets[0] === str;
    }

    private wrapQuotes(str:string):string {
      return (str.indexOf(";") > -1) ? '"' + str + '"' : str;
    }

    private unwrapQuotes(str:string):string {
      return (str.substr(0, 1) === '"' && str.substr(-1) === '"') ? str.substr(1, str.length - 2) : str;
    }
  }
}
