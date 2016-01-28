var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    nunjucksRender = require('gulp-nunjucks-render'),
    browserSync = require('browser-sync').create(),
    data = require('gulp-data'),
    path = require('path'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream');

gulp.task('nunjucks', function() {
  // Registers components folder
  nunjucksRender.nunjucks.configure(['./app/_components'], {watch: false});
  // Gets .html files in the app folder that don't start with underscore
  return gulp.src('./app/**/!(_)*.html')
  // Adding data to Nunjucks
  .pipe(data(function(file) {
    // return require('./app/' + path.basename(file.path, path.extname(file.path)) + '.json');
    return require(file.path + '.json');
  }))
  // Renders template with nunjucks
  .pipe(nunjucksRender())
  // output files in dist folder
  .pipe(gulp.dest('./dist'))
  .pipe(browserSync.stream());
});

gulp.task('sass', function() {
  return gulp.src('./app/_assets/scss/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(autoprefixer({
    browsers: ['last 2 version', "> 1%", 'ie 8', 'ie 9'],
    cascade: false
  }))
  .pipe(gulp.dest('./dist/_assets/css'))
  .pipe(browserSync.stream());
});

gulp.task('browserify', function() {
  return browserify('./app/_assets/js/main.js')
  .bundle()
  //Pass desired output filename to vinyl-source-stream
  .pipe(source('bundle.js'))
  // Start piping stream to tasks!
  .pipe(gulp.dest('./dist/_assets/js'));
});

gulp.task('serve', ['nunjucks', 'sass', 'browserify'], function() {
  browserSync.init({
    server: './dist'
  });

  gulp.watch(['./app/**/*.html', './app/**/*.json'], ['nunjucks']);
  gulp.watch('./app/_assets/scss/**/*.scss', ['sass']);
  gulp.watch('./app/_assets/js/*.js', ['browserify']);
});

gulp.task('default', ['serve']);
