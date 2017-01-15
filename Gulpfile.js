var gulp = require('gulp'),
    util = require('gulp-util'),
    clean = require('gulp-clean'),
    browserSync = require('browser-sync'),
    eslint = require('gulp-eslint'),
    styleLint = require('stylelint'),
    stylefmt = require('stylefmt'),
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
    assets = require('postcss-assets'),
    sorting = require('postcss-sorting'),
    webp = require('gulp-webp'),
    gzip = require('gulp-gzip'),
    sourcemaps = require('gulp-sourcemaps'),
    webserver = require('gulp-webserver');

gulp.task('html', function() {
  return gulp.src('./src/*.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: 'src/public',
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('style', function() {
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
    .pipe(!util.env.production ? sourcemaps.init() : util.noop())
    .pipe(postcss(processors))
    .pipe(!util.env.production ? sourcemaps.write('.') : util.noop())
    .pipe(util.env.production ? cssnano() : util.noop())
    .pipe(util.env.production ? rename({ suffix: '.min' }) : util.noop())
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('webp', function() {
  return gulp.src('src/assets/imgs/*')
    .pipe(webp())
    .pipe(gulp.dest('./dist/assets/imgs'));
})

/* 代码校验 */
gulp.task('lint', function() {
  return gulp.src('src/js/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});
gulp.task('lint-css', function() {
  var processors = [
    sorting({
      order: [
        'custom-properties',
        'dollar-variables',
        'declarations',
        'at-rules',
        {
          type: 'at-rule',
          name: 'include',
        },
        {
          type: 'at-rule',
          name: 'include',
          parameter: 'icon',
        },
        'rules',
      ],
      'properties-order': [
        {
          emptyLineBefore: true,
          properties: [
            'position',
            'top',
            'right',
            'bottom',
            'left',
            'z-index',
          ],
        },
        {
          emptyLineBefore: false,
          properties: [
            'display',
            'visibility',
            'flex',
            'flex-grow',
            'flex-shrink',
            'flex-basis',
            'flex-direction',
            'flex-flow',
            'flex-wrap',
            'align-content',
            'align-items',
            'align-self',
            'justify-content',
            'order',
            'float',
            'clear',
            'overflow',
            'overflow-x',
            'overflow-y',
            '-webkit-overflow-scrolling',
          ],
        },
        {
          emptyLineBefore: false,
          properties: [
            'clip',
            'box-sizing',
            'margin',
            'margin-top',
            'margin-right',
            'margin-bottom',
            'margin-left',
            'padding',
            'padding-top',
            'padding-right',
            'padding-bottom',
            'padding-left',
            'min-width',
            'min-height',
            'max-width',
            'max-height',
            'width',
            'height',
            'outline',
            'outline-width',
            'outline-style',
            'outline-color',
            'outline-offset',
            'border',
            'border-spacing',
            'border-collapse',
            'border-width',
            'border-style',
            'border-color',
            'border-top',
            'border-top-width',
            'border-top-style',
            'border-top-color',
            'border-right',
            'border-right-width',
            'border-right-style',
            'border-right-color',
            'border-bottom',
            'border-bottom-width',
            'border-bottom-style',
            'border-bottom-color',
            'border-left',
            'border-left-width',
            'border-left-style',
            'border-left-color',
            'border-radius',
            'border-top-left-radius',
            'border-top-right-radius',
            'border-bottom-right-radius',
            'border-bottom-left-radius',
            'border-image',
            'border-image-source',
            'border-image-slice',
            'border-image-width',
            'border-image-outset',
            'border-image-repeat',
            'border-top-image',
            'border-right-image',
            'border-bottom-image',
            'border-left-image',
            'border-corner-image',
            'border-top-left-image',
            'border-top-right-image',
            'border-bottom-right-image',
            'border-bottom-left-image',
          ],
        },
      ],
      'unspecified-properties-position': 'bottom',
    }),
    stylefmt,
    styleLint,
    reporter({
      clearMessages: true,
    }),
  ];
  return gulp.src('src/css/*css')
    .pipe(postcss(processors))
    .pipe(gulp.dest('src/css'));
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
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(!util.env.production ? sourcemaps.init({loadMaps: true}) : util.noop())
    .pipe(!util.env.production ? sourcemaps.write('.') : util.noop())
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

gulp.task('gzip', function() {
  return gulp.src('./dist/**/*.{html, xml, json, css, js}')
    .pipe(gzip())
    .pipe(gulp.dest('./dist/'));
});

/* gulp server */
gulp.task('webserver', function() {
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
  gulp.watch('src/css/*.css', ['style']);
  gulp.watch('src/assets/imgs/*.{png,jpg,gif,svg}', ['imagemin']);
  gulp.watch('src/js/*.js', ['lint', 'script']);
});

gulp.task('default', ['html', 'assets', 'style', 'imagemin', 'lint', 'script']);
