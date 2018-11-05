// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const gulp = require('gulp');
const zip = require('gulp-zip');
const del = require('del');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const paths = {
  static: ['static/*'],
  tango: [,
    'third_party/tango-icon-theme-0.8.90/22x22/actions/list-remove.png',
    'third_party/tango-icon-theme-0.8.90/22x22/apps/preferences-system-windows.png'
  ]
};

gulp.task('clean', function () {
  return del(['dist/**', '!dist']);
});

gulp.task('typescript', function () {
  return tsProject.src()
      .pipe(tsProject())
      .js
      .pipe(gulp.dest('dist/tabs-by-window'));
});

gulp.task('static', function () {
  return gulp.src(paths.static)
      .pipe(gulp.dest('dist/tabs-by-window'));
});

gulp.task('icons', function () {
  return gulp.src(paths.tango)
    .pipe(gulp.dest('dist/tabs-by-window'));
});

gulp.task('default', ['typescript', 'static', 'icons'], function () {
  return gulp.src('dist/tabs-by-window/*')
      .pipe(zip('tabs-by-window.zip'))
      .pipe(gulp.dest('dist'));
});
