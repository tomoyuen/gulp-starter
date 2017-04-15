var gulp = require('gulp'),
    util = require('gulp-util'),
    clean = require('gulp-clean'),
    browserSync = require('browser-sync'),
    eslint = require('gulp-eslint'),
    styleLint = require('stylelint'),
    // stylefmt = require('stylefmt'),
    reporter = require('postcss-reporter'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    notify = require('gulp-notify'),
    fileinclude = require('gulp-file-include'),
    rename = require('gulp-rename'),
    imagemin = require('gulp-imagemin'),
    uglify = require('gulp-uglify'),
    cssnano = require('gulp-cssnano'),
    postcss = require('gulp-postcss'),
    salad = require('postcss-salad'),
    px2rem = require('postcss-pxtorem'),
    cssSprite = require('postcss-easysprites'),
    svgSymbols = require('gulp-svg-symbols'),
    assets = require('postcss-assets'),
    // sorting = require('postcss-sorting'),
    webp = require('gulp-webp'),
    gzip = require('gulp-gzip'),
    sourcemaps = require('gulp-sourcemaps'),
    webserver = require('gulp-webserver'),
    plumber = require('gulp-plumber');

gulp.task('html', function() {
  return gulp.src('./src/*.html')
    .pipe(plumber())
    .pipe(fileinclude({
      prefix: '@@',
      basepath: 'src/public',
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('style', ['lint-css'], function() {
  var processors = [
    salad({
      browser: ['ie > 8', 'last 2 version'],
      features: {
        'bem': false,
        'inlineSvg': {
          'path': 'src/assets/svgs',
          'removeFill': true,
        },
      },
    }),
    assets({
      loadPaths: ['src/assets'],
    }),
    px2rem({
      rootValue: 20,
      unitPrecision: 5,
      propWhiteList: ['font', 'font-size', 'line-height', 'letter-spacing', 'width', 'height', 'margin', 'padding'],
      selectorBlackList: [/^html$/],
      replace: false,
      mediaQuery: false,
      minPixelValue: 0,
    }),
    cssSprite({
      imagePath: './src/assets/imgs/slice',
      spritePath: './src/assets/imgs',
    }),
  ];

  return gulp.src('src/css/main.css')
    .pipe(plumber())
    .pipe(!util.env.production ? sourcemaps.init() : util.noop())
    .pipe(postcss(processors))
    .pipe(!util.env.production ? sourcemaps.write('.') : util.noop())
    .pipe(gulp.dest('./dist/css'))
    .pipe(util.env.production ? cssnano() : util.noop())
    .pipe(util.env.production ? rename({ suffix: '.min' }) : util.noop())
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('webp', function() {
  return gulp.src('src/assets/imgs/*')
    .pipe(webp())
    .pipe(gulp.dest('./dist/assets/imgs'));
});

/* 代码校验 */
gulp.task('lint', function() {
  return gulp.src('src/js/*.js')
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});
gulp.task('lint-css', function() {
  var processors = [
    styleLint,
    reporter({
      clearMessages: true,
    }),
  ];
  return gulp.src('src/css/*css')
    .pipe(plumber())
    .pipe(postcss(processors));
});

gulp.task('assets', ['style'], function() {
  return gulp.src('src/assets/**/*.?(js|eot|svg|ttf|woff|woff2)')
    .pipe(gulp.dest('./dist/assets'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('script', ['lint'], function() {
  return browserify({
    entries: ['src/js/main.js'],
    debug: true,
  }).transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(plumber())
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(!util.env.production ? sourcemaps.init({loadMaps: true}) : util.noop())
    .pipe(!util.env.production ? sourcemaps.write('.') : util.noop())
    .pipe(gulp.dest('dist/js'))
    .pipe(util.env.production ? uglify() : util.noop())
    .pipe(util.env.production ? rename({ suffix: '.min' }) : util.noop())
    .pipe(gulp.dest('dist/js'))
    .pipe(notify({ message: 'script task complete' }));
});

gulp.task('imagemin', ['style'], function() {
  return gulp.src('src/assets/imgs/*')
    .pipe(util.env.production ? imagemin({ progressive: true }) : util.noop())
    .pipe(gulp.dest('dist/assets/imgs'));
});

gulp.task('svgSprites', function() {
  return gulp.src('./src/assets/svgs/*.svg')
    .pipe(svgSymbols())
    .pipe(gulp.dest('./src/assets'));
});

gulp.task('gzip', function() {
  return gulp.src('./dist/**/*.{html, xml, json, css, js}')
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'));
});

/* gulp server */
gulp.task('webserver', ['html', 'style', 'script'], function() {
  return gulp.src('dist')
    .pipe(webserver({
      livereload: true,
      open: false,
      port: process.env.PORT || 8080,
    }));
});

gulp.task('clean', function() {
  return gulp.src('dist', {read: false})
    .pipe(clean());
});

gulp.task('watch', ['webserver'], function() {
  gulp.watch(['src/*.html', 'src/**/*.html'], ['html']);
  gulp.watch('src/css/*.css', ['lint-css', 'style']);
  gulp.watch('src/assets/imgs/*.{png,jpg,gif,svg}', ['imagemin']);
  gulp.watch('src/js/*.js', ['lint', 'script']);
});

gulp.task('default', ['html', 'assets', 'style', 'imagemin', 'script']);
