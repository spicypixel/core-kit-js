// See: http://www.smashingmagazine.com/2014/06/11/building-with-gulp/

// Configure in WebStorm an output filter: $FILE_PATH$[ \t]*[:;,\[\(\{<]$LINE$(?:[:;,\.]$COLUMN$)?.*

"use strict";

// Gulp basics
var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');

// Streams and process
var eventStream = require('event-stream');
var argv = require('yargs').argv;

var sourcemaps = require('gulp-sourcemaps');

// Tools
var ts = require('gulp-typescript');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

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

// Compile TypeScript
gulp.task('tsc', function() {
  var tsProject = ts.createProject('./src/lib/tsconfig.json');

  // Transcompile all TypeScript files to JavaScript
  var tscResult = tsProject.src()
    .pipe(gulpif(!argv.release, sourcemaps.init({loadMaps: true}))) // This means sourcemaps will be generated
    .pipe(ts(tsProject))
    .on('error', onError);

  var dtsResult = tscResult.dts
    .pipe(gulp.dest('./lib'))
    .on('error', onError);
    
  var jsResult = tscResult.js
    // .pipe(jshint())
    .pipe(jshint.reporter('jshint-path-reporter'))
    .pipe(jshint.reporter('fail'))
    .on('error', onError)
    .pipe(gulpif(!argv.release, sourcemaps.write({includeContent: true, sourceRoot: 'src/lib/'}))) // source files under this root
    .pipe(gulp.dest('./lib'));
  
  return eventStream.merge(jsResult, dtsResult);
});

// Build
gulp.task('build', ['tsc'], function() {
});

// Install
gulp.task('install', ['build'], function() {
});

gulp.task('default', ['test'], function() {
});

gulp.task('test', ['build-test'], function() {
  return gulp.src('./test/**/*.js', {read: false})
		.pipe(mocha());
});

// Compile TypeScript
gulp.task('build-test', ['build'], function() {
  var tsTestProject = ts.createProject('./src/test/tsconfig.json');

  // Transcompile all TypeScript files to JavaScript
  var tscResult = tsTestProject.src()
    .pipe(gulpif(!argv.release, sourcemaps.init({loadMaps: true}))) // This means sourcemaps will be generated
    .pipe(ts(tsTestProject))
    .on('error', onError);

  var jsResult = tscResult.js
    // .pipe(jshint())
    .pipe(jshint.reporter('jshint-path-reporter'))
    .pipe(jshint.reporter('fail'))
    .on('error', onError)
    .pipe(gulpif(!argv.release, sourcemaps.write({includeContent: true, sourceRoot: 'src/test/'}))) // source files under this root
    .pipe(gulp.dest('./'));
  
  return jsResult;
});