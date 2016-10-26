var gulp = require('gulp'),
    sass = require('gulp-sass'),
    postcss = require('gulp-postcss'),
    scss = require('postcss-scss'),
    reporter    = require('postcss-reporter'),
    autoprefixer = require('autoprefixer'),
    bemLinter = require('postcss-bem-linter'),
    cssnano = require('cssnano'),
    gulpStylelint = require('gulp-stylelint'),
    stylelint   = require('stylelint'),
    nunjucksRender = require('gulp-nunjucks-render'),
    browserSync = require('browser-sync').create(),
    data = require('gulp-data'),
    fs = require('fs'),
    path = require('path'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify'),
    spritesmith = require('gulp.spritesmith');

gulp.task('nunjucks', function() {
  // Gets .html files in the app folder that don't start with underscore
  return gulp.src('./app/**/!(_)*.html')
  // Adding data to Nunjucks
  .pipe(data(function(file) {
    return JSON.parse(fs.readFileSync(file.path + '.json'));
  }))
  // Renders template with nunjucks
  .pipe(nunjucksRender({
    path: './app/_components'
  }))
  // output files in dist folder
  .pipe(gulp.dest('./dist'))
  .pipe(browserSync.stream());
});

gulp.task('lint-scss', function() {
  return gulp.src([
    './app/_assets/scss/*.scss',
    './app/_components/**/*.scss'
  ])
  .pipe(gulpStylelint({
    syntax: 'scss',
    reporters: [{
      formatter: 'string',
      console: true
    }]
  }));
});

gulp.task('sass', ['lint-scss'], function () {
  return gulp.src('./app/_assets/scss/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(postcss([
    bemLinter('suit'),
    autoprefixer({browsers: [
      'last 2 version',
      '> 1%',
      'ie 9'
    ]}),
    cssnano()
  ]))
  .pipe(gulp.dest('./dist/_assets/css'))
  .pipe(browserSync.stream());
});

gulp.task('images', function() {
  return gulp.src([
    './app/_assets/img/**/*.{jpg,png,svg}',
    '!**/sprite/**'
  ])
  .pipe(gulp.dest('./dist/_assets/img'))
  .pipe(browserSync.stream());
});

gulp.task('fonts', function() {
  return gulp.src(['./app/_assets/fonts/*.{woff,woff2}'])
  .pipe(gulp.dest('./dist/_assets/fonts'))
  .pipe(browserSync.stream());
});

gulp.task('video', function() {
  return gulp.src(['./app/_assets/video/*.{mp4,webm}'])
  .pipe(gulp.dest('./dist/_assets/video'))
  .pipe(browserSync.stream());
});

gulp.task('sprite', function () {
  var spriteData = gulp.src('./app/_assets/img/design/sprite/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: '_sprite.scss',
    imgPath: '../img/design/sprite.png'
  }));
  return spriteData.pipe(gulp.dest('./app/_assets/img/design'));
});

gulp.task('browserify', function() {
  return browserify('./app/_assets/js/main.js', {debug: true})
  // return browserify('./app/_assets/js/main.js')
  .transform('babelify', {presets: ['es2015']})
  .bundle()
  //Pass desired output filename to vinyl-source-stream
  .pipe(source('bundle.js'))
  // Start piping stream to tasks!
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest('./dist/_assets/js'))
  .pipe(browserSync.stream());
});

gulp.task('misc', function() {
  var miscFiles = ([
      './app/.htaccess',
      './app/favicon.ico'
    ]
  );
  return gulp.src(miscFiles)
  .pipe(gulp.dest('./dist'));
});

gulp.task('serve', [
  'nunjucks',
  'sass',
  'images',
  'video',
  'fonts',
  'browserify',
  'misc'
], function() {

  browserSync.init({
    server: './dist'
  });

  gulp.watch([
    './app/**/*.html',
    './app/**/*.html.json'
  ], ['nunjucks']);

  gulp.watch([
    './app/_assets/scss/*.scss',
    './app/_components/**/*.scss'
  ], ['sass']);

  gulp.watch([
    './app/_assets/img/**/*.*'
  ], ['images']);

  gulp.watch([
    './app/_assets/video/**/*.*'
  ], ['video']);

  gulp.watch([
    './app/_assets/fonts/*.*'
  ], ['fonts']);

  gulp.watch([
    './app/_assets/js/*.js',
    './app/_components/**/*.js'
  ], ['browserify']);
});

gulp.task('default', ['serve']);
