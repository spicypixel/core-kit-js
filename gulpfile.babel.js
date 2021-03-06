"use strict";

import gulp from "gulp";
import del from "del";
import { TypeScriptBuilder, MochaRunner } from "@spicypixel/build-kit-js";

async function clean() {
  await del(["lib", "test", "test-output"]);
}

async function build() {
  await TypeScriptBuilder.buildAsync();
}

async function rebuild() {
  await clean();
  await build();
}

async function test() {
  await rebuild();
  await MochaRunner.runAsync();
}

// Tasks
gulp.task("default", () => test());
gulp.task("clean", () => clean());
gulp.task("build", () => build());
gulp.task("rebuild", () => rebuild());
gulp.task("test", () => test());