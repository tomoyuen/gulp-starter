const { src, dest, series, parallel, watch } = require('gulp'),
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
    cssnext = require('postcss-preset-env'),
    px2rem = require('postcss-pxtorem'),
    cssSprite = require('postcss-easysprites'),
    svgSymbols = require('gulp-svg-symbols'),
    gulpassets = require('postcss-assets'),
    // sorting = require('postcss-sorting'),
    towebp = require('gulp-webp'),
    togzip = require('gulp-gzip'),
    sourcemaps = require('gulp-sourcemaps'),
    webserver = require('gulp-webserver'),
    plumber = require('gulp-plumber'),
    each = require('postcss-each');

function html() {
  return src('./src/*.html')
    .pipe(plumber())
    .pipe(fileinclude({
      prefix: '@@',
      basepath: 'src/public',
    }))
    .pipe(dest('./dist'));
}

function style() {
  var processors = [
    cssnext({
      browser: ['ie > 8', 'last 2 version'],
      features: {
        'bem': false,
        'inlineSvg': {
          'path': 'src/assets/svgs',
          'removeFill': true,
        },
      },
    }),
    each(),
    gulpassets({
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

  return src('src/css/main.css')
    .pipe(plumber())
    .pipe(!util.env.production ? sourcemaps.init() : util.noop())
    .pipe(postcss(processors))
    .pipe(!util.env.production ? sourcemaps.write('.') : util.noop())
    .pipe(dest('./dist/css'))
    .pipe(util.env.production ? cssnano() : util.noop())
    .pipe(util.env.production ? rename({ suffix: '.min' }) : util.noop())
    .pipe(dest('./dist/css'));
}

function webp() {
  return src('src/assets/imgs/*')
    .pipe(towebp())
    .pipe(dest('./dist/assets/imgs'));
}

/* 代码校验 */
function lint() {
  return src('src/js/*.js')
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

function lintCss() {
  var processors = [
    styleLint,
    reporter({
      clearMessages: true,
    }),
  ];

  return src('src/css/*css')
    .pipe(plumber())
    .pipe(postcss(processors));
}

function assets() {
  return src('src/assets/**/*.?(js|eot|svg|ttf|woff|woff2)')
    .pipe(dest('./dist/assets'))
    .pipe(browserSync.reload({stream: true}));
}

function script() {
  return browserify({
    entries: ['src/js/main.js'],
    debug: true,
  }).transform('babelify')
    .bundle()
    .pipe(plumber())
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(!util.env.production ? sourcemaps.init({loadMaps: true}) : util.noop())
    .pipe(!util.env.production ? sourcemaps.write('.') : util.noop())
    .pipe(dest('dist/js'))
    .pipe(util.env.production ? uglify() : util.noop())
    .pipe(util.env.production ? rename({ suffix: '.min' }) : util.noop())
    .pipe(dest('dist/js'))
    .pipe(notify({ message: 'script task complete' }));
}

function imageMin() {
  return src('src/assets/imgs/*')
    .pipe(util.env.production ? imagemin([], {}) : util.noop())
    .pipe(dest('dist/assets/imgs'));
}

function svgSprites() {
  return src('./src/assets/svgs/*.svg')
    .pipe(svgSymbols())
    .pipe(dest('./src/assets'));
}

function gzip() {
  return src('./dist/**/*.{html, xml, json, css, js}')
    .pipe(togzip())
    .pipe(dest('./dist/'));
}

/* gulp server */
function webServer() {
  src('dist')
    .pipe(webserver({
      livereload: true,
      open: false,
      port: process.env.PORT || 8080,
    }));
}

function cleanDist() {
  return src('dist', {read: false})
    .pipe(clean());
}

function watchMode() {
  watch(['src/*.html', 'src/**/*.html'], html);
  watch('src/css/*.css', series(lintCss, style));
  watch('src/assets/imgs/*.{png,jpg,gif,svg}', imagemin);
  watch('src/js/*.js', series(lint, script));
}

exports.webp = webp;
exports.gzip = gzip;
exports.clean = cleanDist;
exports.svgSprites = svgSprites;
exports.assets = series(style, assets);
exports.script = series(lint, script);
exports.style = series(lintCss, style);
exports.imageMin = series(style, imageMin);
exports.watch = series(
  parallel(html, style, script),
  webServer,
  watchMode
);
exports.default = parallel(html, assets, style, imagemin, script);
