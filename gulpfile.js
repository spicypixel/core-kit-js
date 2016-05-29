// See: http://www.smashingmagazine.com/2014/06/11/building-with-gulp/

// Configure in WebStorm an output filter: $FILE_PATH$[ \t]*[:;,\[\(\{<]$LINE$(?:[:;,\.]$COLUMN$)?.*

"use strict";

// Gulp basics
let gulp = require("gulp");
let gutil = require("gulp-util");
let gulpif = require("gulp-if");

// Streams and process
let eventStream = require("event-stream");
let argv = require("yargs").argv;
let sourcemaps = require("gulp-sourcemaps");
let fs = require("fs-extra");

// Tools
let ts = require("gulp-typescript");
let tslint = require("gulp-tslint");
let mocha = require("gulp-mocha");

// Command line option:
//  --fatal=[warning|error|off]
let fatalLevel = require("yargs").argv.fatal;

let ERROR_LEVELS = ["error", "warning"];

function isFatal(level) {
  return ERROR_LEVELS.indexOf(level) <= ERROR_LEVELS.indexOf(fatalLevel || "error");
}

function handleError(level, error) {
  // gutil.log(error.message);
  if (isFatal(level)) {
    process.exit(1);
  }
  else {
    gutil.log(error.message);
  }
}

function onError(error) { handleError.call(this, "error", error);}
function onWarning(error) { handleError.call(this, "warning", error);}

gulp.on("error", function(err) {
  console.log(err);
  process.exit(-1);
});

// Compile TypeScript
gulp.task("tsc", function() {
  let tsProject = ts.createProject("tsconfig.json");

  let lintResult = gulp.src("./src/**/*.ts")
    .pipe(tslint())
    .pipe(tslint.report("verbose"));

  let tscResult = tsProject.src()
    .pipe(gulpif(!argv.release, sourcemaps.init({loadMaps: true}))) // This means sourcemaps will be generated
    .pipe(ts(tsProject))
    .on("error", onError);

  let dtsResult = tscResult.dts
    .pipe(gulp.dest("./"))
    .on("error", onError);
    
  let jsResult = tscResult.js
    .pipe(gulpif(!argv.release, sourcemaps.write("./", {includeContent: true, sourceRoot: "src/lib/"}))) // source files under this root
    .pipe(gulp.dest("./"))
    .on("error", onError);
  
  return eventStream.merge(lintResult, jsResult, dtsResult);
});

// Build
gulp.task("build", ["tsc"], function() {
});

// Install
gulp.task("install", ["build"], function() {
});

gulp.task("default", ["test"], function() {
});

gulp.task("test", ["build"], function() {
  return gulp.src("./test/**/*.js", {read: false})
		.pipe(mocha());
});

gulp.task("clean", function() {
  fs.remove("lib");
  fs.remove("test");
});