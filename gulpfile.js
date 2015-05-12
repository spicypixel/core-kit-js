// See: http://www.smashingmagazine.com/2014/06/11/building-with-gulp/

// Configure in WebStorm an output filter: $FILE_PATH$[ \t]*[:;,\[\(\{<]$LINE$(?:[:;,\.]$COLUMN$)?.*

"use strict";

// Module
var moduleName = 'spicypixel-core';

// Gulp basics
var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var gulpIgnore = require('gulp-ignore');

// Streams and process
var eventStream = require('event-stream');
var argv = require('yargs').argv;

var sourcemaps = require('gulp-sourcemaps');

// Tools
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');

// Command line option:
//  --fatal=[warning|error|off]
var fatalLevel = require('yargs').argv.fatal;

var ERROR_LEVELS = ['error', 'warning'];

function isFatal(level) {
  return ERROR_LEVELS.indexOf(level) <= ERROR_LEVELS.indexOf(fatalLevel || 'error');
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

function onError(error) { handleError.call(this, 'error', error);}
function onWarning(error) { handleError.call(this, 'warning', error);}

gulp.on('error', function(err) {
  console.log(err);
  process.exit(-1);
});

var tsProject = ts.createProject({
  declarationFiles: true,
  noExternalResolve: true,
  noImplicitAny: true,
  sortOutput: true, // for concat
  removeComments: false,
  module: 'commonjs',
  target: 'ES5'
});

gulp.task('compile-type-script', function() {
  // Transcompile all TypeScript files to JavaScript
  var tscResult = gulp.src(['src/**/**.ts', 'typings/**/**.ts'])
    .pipe(gulpif(!argv.release, sourcemaps.init({loadMaps: true}))) // This means sourcemaps will be generated
    .pipe(ts(tsProject))
    .on('error', onError);

  var dtsResult = tscResult.dts
    .pipe(concat(moduleName + '.d.ts'))
    .pipe(gulpIgnore('*.map'))
    .pipe(gulp.dest('./'));

  var jsResult = tscResult.js
    .pipe(concat(moduleName + '.js'))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-path-reporter'))
    .pipe(jshint.reporter('fail'))
    .on('error', onError)
    .pipe(gulpif(!argv.release, sourcemaps.write({includeContent: true, sourceRoot: 'src/'}))) // source files under this root
    .pipe(gulp.dest('./'));

  return eventStream.merge(jsResult, dtsResult);
});

gulp.task('uglify', ['compile-type-script'], function() {
  return gulp.src(['./' + moduleName + '.js'])
    .pipe(gulpif(!argv.release, sourcemaps.init({loadMaps: true})))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpif(!argv.release, sourcemaps.write('./', {includeContent: true, sourceRoot: './'}))) // source files prefixed with src already so root must be ./
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['uglify'], function() {
});
