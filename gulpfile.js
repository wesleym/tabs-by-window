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

const { series, parallel, src, dest } = require('gulp');
const zip = require('gulp-zip');
const del = require('del');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');
const paths = {
  static: ['static/*'],
  tango: [
    'third_party/tango-icon-theme-0.8.90/22x22/actions/list-remove.png',
    'third_party/tango-icon-theme-0.8.90/22x22/apps/preferences-system-windows.png'
  ]
};

function clean() {
  return del(['dist/**', '!dist']);
}

function typescript() {
  return tsProject.src()
      .pipe(tsProject())
      .js
      .pipe(dest('dist/tabs-by-window'));
}

function staticTask() {
  return src(paths.static)
      .pipe(dest('dist/tabs-by-window'));
}

function icons() {
  return src(paths.tango)
    .pipe(dest('dist/tabs-by-window'));
}

function defaultTask() {
  return src('dist/tabs-by-window/*')
      .pipe(zip('tabs-by-window.zip'))
      .pipe(dest('dist'));
}

exports.default = series(parallel(typescript, staticTask, icons), defaultTask)
