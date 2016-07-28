var gulp = require('gulp'),
  clean = require('gulp-clean'),
  vueify = require('gulp-vueify'),
  imagemin = require('gulp-imagemin'),
  sourcemaps = require('gulp-sourcemaps'),
  browserSync = require('browser-sync'),
  babel = require('gulp-babel'),
  eslint = require('gulp-eslint'),
  browserify = require('browserify'),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer')
  notify = require('gulp-notify');

var livereload = require('gulp-livereload'),
  webserver = require('gulp-webserver');

gulp.task('html', function () {
  return gulp.src('./src/*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('css', function () {
  var postcss = require('gulp-postcss');

    return gulp.src('src/css/index.css')
      .pipe(sourcemaps.init())
      .pipe(postcss([require('postcss-salad')({
        browser: ['ie > 8', 'last 2 version'],
        features: {
          "bem": false,
          "inlineSvg": {
            "path": "src/svgs",
          },
        },
      })]))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('./dist/css'));
});

gulp.task('lint', function () {
  return gulp.src('src/js/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('assets', function (){
    gulp.src('src/assets/**/*.?(png|jpg|gif|js|eot|svg|ttf|woff|woff2)')
        .pipe(gulp.dest('./dist/assets'))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('browserify', function() {
  browserify({
    entries: ['./src/js/main.js'],
    debug: true,
  })
    .transform("babelify", {presets: ["es2015"]})
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest('./dist/js'))
    .pipe(notify({ message: 'browserify task complete' }));
});

gulp.task('vueify', function () {
  return gulp.src('./src/components/**.*.vue')
    .pipe(vueify())
    .pipe(gulp.dest('./dist/components'));
});

gulp.task('images', function () {
  return gulp.src('src/images/*.{png,jpg,gif,svg}')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
    }));
});

gulp.task('webserver', function () {
  gulp.src('./')
    .pipe(webserver({
      livereload: true,
      open: true,
    }));
});

gulp.task('clean', function () {
  return gulp.src(['dist/css/maps', 'dist/js/maps'], {read: false})
    .pipe(clean());
});

gulp.task('watch', function () {
  gulp.watch('src/*.html', ['html']);
  gulp.watch('src/components/*.vue', ['vueify']);
  gulp.watch('src/css/*.css', ['css']);
  gulp.watch('src/images/*.{png,jpg,gif,svg}', ['images']);
  gulp.watch('src/js/*.js', ['lint', 'script']);
});

gulp.task('default', ['lint', 'assets', 'browserify', 'webserver', 'watch']);
