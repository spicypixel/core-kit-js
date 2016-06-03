"use strict";

import gulp from "gulp";
import gutil from "gulp-util";
import mocha from "gulp-mocha";
import del from "del";
import { TypeScriptBuilder } from "@spicypixel-private/build-kit-js";

function clean() {
  return del(["lib", "test", "test-output"]);
}

async function build() {
  await TypeScriptBuilder.compileAsync();
}

async function rebuild() {
  await clean();
  await build();
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
gulp.task("clean", () => clean());
gulp.task("build", () => build());
gulp.task("rebuild", () => rebuild());
gulp.task("test", () => test());