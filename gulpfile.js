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

const ERROR_LEVELS = ["error", "warning"];

function isFatal(level) {
  return ERROR_LEVELS.indexOf(level) <= ERROR_LEVELS.indexOf(fatalLevel || "error");
}

function handleError(level, error) {
  if (isFatal(level)) {
    process.exit(1);
  }
  else {
    gutil.log(error.message);
  }
}

function onError(error) {
  handleError.call(this, "error", error);
}

function onWarning(error) {
  handleError.call(this, "warning", error);
}

gulp.on("error", function(err) {
  console.log(err);
  process.exit(-1);
});

// Compile TypeScript
gulp.task("tsc", function() {
  let project = ts.createProject("tsconfig.json");

  let lint = gulp.src("./src/**/*.ts")
    .pipe(tslint())
    .pipe(tslint.report("verbose"));

  let tsc = project.src()
    .pipe(gulpif(!argv.release, sourcemaps.init({loadMaps: true}))) // This means sourcemaps will be generated
    .pipe(ts(project))
    .on("error", onError);

  let js = tsc.js
    .pipe(gulpif(!argv.release, sourcemaps.write("./", {includeContent: true, sourceRoot: "src/lib/"}))) // source files under this root
    .pipe(gulp.dest("./"))
    .on("error", onError);

  let dts = tsc.dts
    .pipe(gulp.dest("./"))
    .on("error", onError);

  return eventStream.merge(lint, js, dts);
});

gulp.task("build", ["clean", "tsc"]);

gulp.task("default", ["test"]);

gulp.task("test", ["build"], function() {
  return gulp.src("./test/**/*.js", {read: false})
		.pipe(mocha());
});

gulp.task("clean", function() {
  fs.removeSync("lib");
  fs.removeSync("test");
  if (fs.existsSync("index.js"))
    fs.unlinkSync("index.js");
  if (fs.existsSync("index.d.ts"))
    fs.unlinkSync("index.d.ts");
  if (fs.existsSync("index.js.map"))
    fs.unlinkSync("index.js.map");
});