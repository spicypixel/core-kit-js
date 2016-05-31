"use strict";

// Tools
let gulp = require("gulp");
let gutil = require("gulp-util");
let ts = require("gulp-typescript");
let tslint = require("gulp-tslint");
let mocha = require("gulp-mocha");

// Streams and process
let eventStream = require("event-stream");
let sourcemaps = require("gulp-sourcemaps");
let fs = require("fs-extra");

// Handle errors
gulp.on("error", function (err) {
  console.log(err);
  process.exit(-1);
});

// Compile TypeScript
gulp.task("tsc", function () {
  let project = ts.createProject("tsconfig.json");

  let lint = gulp.src("./src/**/*.ts")
    .pipe(tslint())
    .pipe(tslint.report("verbose"));

  let tsc = project.src()
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(ts(project));

  let js = tsc.js
    .pipe(sourcemaps.write("./", { includeContent: false, sourceRoot: "../src" }))
    .pipe(gulp.dest("./"));

  let dts = tsc.dts
    .pipe(gulp.dest("./"));

  return eventStream.merge(lint, js, dts);
});

gulp.task("build", ["clean", "tsc"], function() {
  // Copy extra ambient declarations
  let dtsCopy = gulp.src("./src/**/*.d.ts", { base: "./src" })
    .pipe(gulp.dest("./"));
});

gulp.task("default", ["test"]);

gulp.task("test", ["build"], function () {
  return gulp.src("./test/**/*.js", { read: false })
    .pipe(mocha());
});

gulp.task("clean", function () {
  fs.removeSync("lib");
  fs.removeSync("test");
});