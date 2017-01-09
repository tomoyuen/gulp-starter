var gulp = require('gulp'),
    clean = require('gulp-clean'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    babel = require('gulp-babel'),
    eslint = require('gulp-eslint'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    notify = require('gulp-notify'),
    imagemin = require('gulp-imagemin'),
    uglify = require('gulp-uglify'),
    cssnano = require('gulp-cssnano'),
    postcss = require('gulp-postcss'),
    webserver = require('gulp-webserver'),
    rename = require('gulp-rename'),
    salad = require('postcss-salad'),
    px2rem = require('postcss-pxtorem'),
    fileinclude = require('gulp-file-include');

gulp.task('html', function () {
  return gulp.src('./src/*.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: 'src/public',
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('style', function () {
  var processors = [
    salad({
      browser: ['ie > 8', 'last 2 version'],
      features: {
        'bem': false,
        'inlineSvg': {
          'path': 'src/svgs',
        },
      },
    }),
    px2rem({
      rootValue: 20,
      unitPrecision: 5,
      propWhiteList: ['font', 'font-size', 'line-height', 'letter-spacing', 'width', 'height', 'margin', 'padding'],
      selectorBlackList: [/^body$/],
      replace: false,
      mediaQuery: false,
      minPixelValue: 0,
    }),
  ];

  return gulp.src('src/css/main.css')
    .pipe(sourcemaps.init())
    .pipe(postcss(processors))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'));
});

/* eslint代码校验 */
gulp.task('lint', function () {
  return gulp.src('src/js/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('assets', function () {
  gulp.src('src/assets/**/*.?(png|jpg|gif|js|eot|svg|ttf|woff|woff2)')
    .pipe(gulp.dest('./dist/assets'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('browserify', function() {
  browserify({
    entries: ['./src/js/main.js'],
    debug: true,
  }).transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(notify({ message: 'browserify task complete' }));
});

/* 压缩 js文件 */
gulp.task('minifyJS', function() {
  gulp.src('dist/js/*.js')
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('dist/js'));
});
/* 压缩 css 文件 */
gulp.task('minifyCSS', function() {
  gulp.src('dist/css/*.css')
    .pipe(sourcemaps.init())
    .pipe(cssnano())
    .pipe(sourcemaps.write('.'))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest('dist/css'));
});
/* 压缩图片 */
gulp.task('images', function () {
  return gulp.src('src/images/*.{png,jpg,gif,svg}')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
    }));
});

gulp.task('webserver', function () {
  gulp.src('./dist')
    .pipe(webserver({
      livereload: true,
      open: false,
    }));
});

gulp.task('clean', function () {
  return gulp.src(['dist/css/maps', 'dist/js/maps'], {read: false})
    .pipe(clean());
});

gulp.task('watch', function () {
  gulp.watch(['src/*.html', 'src/**/*.html'], ['html']);
  gulp.watch('src/css/*.css', ['style']);
  gulp.watch('src/images/*.{png,jpg,gif,svg}', ['images']);
  gulp.watch('src/js/*.js', ['lint', 'script']);
});

gulp.task('default', ['lint', 'assets', 'browserify', 'webserver', 'watch']);
