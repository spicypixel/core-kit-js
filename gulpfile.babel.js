"use strict";

import gulp from "gulp";
import gutil from "gulp-util";
import mocha from "gulp-mocha";
import del from "del";
import { TypeScriptBuilder } from "@spicypixel-private/build-kit-js";

// Handle errors
gulp.on("error", function (err) {
  console.log(err);
  process.exit(-1);
});

function clean() {
  return del(["lib", "test", "test-output"]);
}

async function build() {
  await clean();
  await TypeScriptBuilder.compileAsync();
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