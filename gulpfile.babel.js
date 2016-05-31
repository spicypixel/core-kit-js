"use strict";

// Tools
import gulp from "gulp";
import gutil from "gulp-util";
import ts from "gulp-typescript";
import tslint from "gulp-tslint";
import mocha from "gulp-mocha";

// Streams and process
import eventStream from "event-stream";
import sourcemaps from "gulp-sourcemaps";
import fs from "fs-extra";
import del from "del";

// Handle errors
gulp.on("error", function (err) {
  console.log(err);
  process.exit(-1);
});

function compileTypescript () {
  return new Promise((resolve, reject) => {
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

    // Copy extra ambient declarations
    let dtsCopy = gulp.src("./src/**/*.d.ts", { base: "./src" })
      .pipe(gulp.dest("./"));

    eventStream.merge(lint, js, dts, dtsCopy)
      .once("end", resolve)
      .once("error", reject);
  });
}

function clean() {
  return del(["lib", "test", "test-output"]);
}

async function build() {
  await clean();
  await compileTypescript();
}

async function test() {
  await build();
  return new Promise((resolve, reject) => {
    return gulp.src("./test/**/*.js", { read: false })
      .pipe(mocha())
      .once("end", resolve)
      .once("error", reject);
  });
}

// Tasks
gulp.task("default", () => test());
gulp.task("test", () => test());
gulp.task("build", () => build());
gulp.task("clean", () => clean());