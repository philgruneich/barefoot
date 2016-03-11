'use strict';

let autoprefixer = require('autoprefixer')
  , babelify = require('babelify')
  , browserify = require('browserify')
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
  , gutil = require('gulp-util')
  , source = require('vinyl-source-stream')
  , watchify = require('watchify')
;

const PROCESSORS = [
  autoprefixer({browser: ['last 3 versions']}),
  cssnano({autoprefixer: false})  
];

const BROWSER_SYNC_RELOAD_DELAY = 500;

const PATHS = {
    ALL: ['src/js/*.js', 'src/js/**/*.js', 'src/sass/*.scss', 'src/sass/**/*.js'],
    JS: ['src/js/*.js', 'src/js/**/*.js'],
    SASS: ['src/sass/*.scss', 'src/sass/**/*.scss'],
    OUT_JS: 'barefoot.js',
    OUT_SASS: 'barefoot.scss',
    DEST_JS: 'dist/js',
    DEST_SASS: 'dist/css',
    DEST: 'dist',
    ENTRY_POINT: __dirname + '/src/js/barefoot.js'
};

gulp.task('bs-reload', () => {
  browserSync.reload();
});

gulp.task('sass', () => {
  return gulp.src(PATHS.SASS)
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(postcss(PROCESSORS))
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(PATHS.DEST_SASS))
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Sass compiled to CSS'
    }))
  ;
});

gulp.task('eslint', () => {
  return gulp.src(PATHS.JS)
    .pipe(eslint())
    .pipe(eslint.formatEach()).on('error', function(err) { console.log('err'); this.emit('end'); } )
  ;
});

gulp.task('js', ['eslint'], () => {
  return gulp.src(PATHS.JS)
    //.pipe(eslint())
    //.pipe(eslint.formatEach()).on('error', function(err) { console.log('Lint'); } )
    // I think Browserify should come here with a babelify transformation and replace the babel() below
    .pipe(babel())
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

gulp.task('watchify', ['nodemon'], () => {
  let watcher = watchify(browserify({
    entries: PATHS.ENTRY_POINT,
    transform: [babelify],
    debug: true,
    cache: {},
    packageCache: {}
  }));

  watcher.on('update', function() {
    watcher.bundle()
      .on('error', gutil.log)
      .pipe(source(PATHS.OUT_JS))
      .pipe(gulp.dest(PATHS.DEST_JS))
      .pipe(browserSync.reload({stream: true}))
    ;

    console.log('Updated');
  }).bundle()
    .pipe(source(PATHS.OUT_JS))
    .pipe(gulp.dest(PATHS.DEST_JS))
});

gulp.task('browser-sync', ['watchify'], () => {
  browserSync.init({
    proxy: 'http://localhost:5000',
    port: 4000,
    injectChanges: true,
    open: false
  });
});

gulp.task('default', ['browser-sync'], () => {
  gulp.watch('src/**/*.js', ['js']);
  gulp.watch('src/**/*.scss', ['sass']);
  gulp.watch('test/**/*.html', ['bs-reload']);
});
