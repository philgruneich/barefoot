'use strict';

let autoprefixer = require('autoprefixer')
  , browserSync = require('browser-sync')
  , cssnano = require('cssnano')
  , gulp = require('gulp')
  , babel = require('gulp-babel')
  , eslint = require('gulp-eslint')
  , nodemon = require('gulp-nodemon')
  , notify = require('gulp-notify')
  , postcss = require('gulp-postcss')
  , rename = require('gulp-rename')
  , sass = require('gulp-sass')
  , uglify = require('gulp-uglify')
;

const PROCESSORS = [
  autoprefixer({browser: ['last 3 versions']}),
  cssnano({autoprefixer: false})  
];

const BROWSER_SYNC_RELOAD_DELAY = 500;

gulp.task('bs-reload', () => {
  browserSync.reload();
});

gulp.task('sass', () => {
  return gulp.src('src/sass/**/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(postcss(PROCESSORS))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Sass compiled to CSS'
    }))
  ;
});

gulp.task('js', () => {
  return gulp.src('src/js/**/*.js')
    //.pipe(eslint())
    //.pipe(eslint.formatEach())
    .pipe(babel({
      "presets": ["es2015"]
    }))
    .pipe(gulp.dest('dist/js'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist/js'))
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Javascript compiled successfully.'
    }))
  ;
});

gulp.task('nodemon', (callback) => {
  let called = false;
  return nodemon({
    script: 'index.js'
  , watch: ['index.js']
  , env: { 'NODE_ENV': 'development' }
  }).on('start', function() {
    if (!called) callback();
    called = true;
  }).on('restart', function() {
    setTimeout(function() {
      browserSync.reload({stream: false});
    }, BROWSER_SYNC_RELOAD_DELAY);
  });
});

gulp.task('browser-sync', ['nodemon'], () => {
  browserSync.init({
    proxy: 'http://localhost:5000',
    port: 4000,
    injectChanges: true,
    open: true
  });
});

gulp.task('default', ['browser-sync'], () => {
  gulp.watch('src/**/*.js', ['js']);
  gulp.watch('src/**/*.scss', ['sass']);
  gulp.watch('public/**/*.html', ['bs-reload']);
});
