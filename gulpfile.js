const gulp = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const scss = require('postcss-scss');
const reporter = require('postcss-reporter');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const gulpStylelint = require('gulp-stylelint');
const stylelint = require('stylelint');
const nunjucksRender = require('gulp-nunjucks-render');
const browserSync = require('browser-sync').create();
const data = require('gulp-data');
const path = require('path');
const browserify = require('browserify');
const babelify = require('babelify');
const eslint = require('gulp-eslint');
const fs = require('fs');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const uglify = require('gulp-uglify');
const modernizr = require('gulp-modernizr');

// Nunjuck templating, for static site generation
gulp.task('nunjucks', () => {
  // Gets .html files in the app folder that don't start with underscore
  gulp.src('./app/**/!(_)*.html')
  // Adding data to Nunjucks
  .pipe(data(file => JSON.parse(fs.readFileSync(`${file.path}.json`))))
  // Renders template with nunjucks
  .pipe(nunjucksRender({
    path: './app/_components',
  }))
  // output files in dist folder
  .pipe(gulp.dest('./dist'))
  .pipe(browserSync.stream());
});

// Lint scss
gulp.task('lint-scss', () => {
  gulp.src([
    './app/_assets/scss/*.scss',
    './app/_components/**/*.scss',
  ])
  .pipe(gulpStylelint({
    syntax: 'scss',
    reporters: [{
      formatter: 'string',
      console: true,
    }],
  }));
});

// Compile scss
gulp.task('sass', ['lint-scss'], () => {
  gulp.src('./app/_assets/scss/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss([
    autoprefixer({ browsers: [
      'last 2 version',
      '> 1%',
      'ie 9',
    ] }),
    cssnano(),
  ]))
  .pipe(gulp.dest('./dist/_assets/css'))
  .pipe(browserSync.stream());
});

// Transfer images from app to dist
gulp.task('images', () => {
  gulp.src([
    './app/_assets/img/**/*.{jpg,png,svg}',
  ])
  .pipe(gulp.dest('./dist/_assets/img'))
  .pipe(browserSync.stream());
});

// Transfer fonts from app to dist
gulp.task('fonts', () => {
  gulp.src(['./app/_assets/fonts/*.{woff,woff2}'])
  .pipe(gulp.dest('./dist/_assets/fonts'))
  .pipe(browserSync.stream());
});

// Transfer video from app to dist
gulp.task('video', () => {
  gulp.src(['./app/_assets/video/*.{mp4,webm}'])
  .pipe(gulp.dest('./dist/_assets/video'))
  .pipe(browserSync.stream());
});

// Lint JS
gulp.task('lint-js', () => {
  gulp.src([
    './_assets/js/*.js',
    './_assets/_components/**/*.js',
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});

// Modernizr
gulp.task('modernizr', () => {
  gulp.src([
    './app/_assets/scss/*.scss',
    './app/_components/**/*.scss',
    './app/_assets/js/*.js',
    './app/_assets/_components/**/*.js',
  ])
  .pipe(modernizr('modernizr.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('./dist/_assets/js'));
});

// Browserify
gulp.task('browserify', ['lint-js', 'modernizr'], () => {
  browserify({ debug: true })
  // return browserify('./app/_assets/js/main.js')
  .transform('babelify')
  .require('./app/_assets/js/main.js', { entry: true })
  .bundle()
  .on('error', (err) => { console.log(`Error: ${err.message}`); })
  .pipe(source('main.min.js'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest('./dist/_assets/js'))
  .pipe(browserSync.stream());
});

// Move misc files from app to dist
gulp.task('misc', () => {
  const miscFiles = ([
    './app/.htaccess',
    './app/favicon.ico',
  ]);
  gulp.src(miscFiles)
  .pipe(gulp.dest('./dist'));
});

// Serve and watch folders
gulp.task('serve', [
  'nunjucks',
  'sass',
  'images',
  'video',
  'fonts',
  'browserify',
  'misc',
], () => {
  browserSync.init({
    server: './dist',
  });

  gulp.watch([
    './app/**/*.html',
    './app/**/*.html.json',
  ], ['nunjucks']);

  gulp.watch([
    './app/_assets/scss/*.scss',
    './app/_components/**/*.scss',
  ], ['sass']);

  gulp.watch([
    './app/_assets/img/**/*.*',
  ], ['images']);

  gulp.watch([
    './app/_assets/video/**/*.*',
  ], ['video']);

  gulp.watch([
    './app/_assets/fonts/*.*',
  ], ['fonts']);

  gulp.watch([
    './app/_assets/js/*.js',
    './app/_components/**/*.js',
  ], ['browserify']);
});

gulp.task('default', ['serve']);
