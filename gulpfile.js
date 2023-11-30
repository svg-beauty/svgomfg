const fs = require('node:fs/promises')
const path = require('node:path')
const process = require('node:process')
const sirv = require('sirv-cli')
const { version: SVGO_VERSION } = require('svgo/package.json')
const sass = require('sass')
const CleanCSS = require('clean-css')
const vinylMap = require('vinyl-map')
const gulp = require('gulp')
const gulpif = require('gulp-if')
const gulpSass = require('gulp-sass')(sass)
const gulpNunjucks = require('gulp-nunjucks')
const gulpHtmlmin = require('gulp-htmlmin')
const rollup = require('rollup')
const { nodeResolve: rollupResolve } = require('@rollup/plugin-node-resolve')
const rollupCommon = require('@rollup/plugin-commonjs')
const rollupReplace = require('@rollup/plugin-replace')
const { terser: rollupTerser } = require('rollup-plugin-terser')
const fsExtra = require('fs-extra')

const IS_DEV_TASK = process.argv.includes('dev') || process.argv.includes('--dev')

const buildConfig = {
  cleancss: {
    level: {
      1: {
        specialComments: 0,
      },
      2: {
        all: false,
        mergeMedia: true,
        removeDuplicateMediaBlocks: true,
        removeEmpty: true,
      },
    },
    sourceMap: true,
    sourceMapInlineSources: true,
  },
  htmlmin: {
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: false,
    collapseWhitespace: true,
    decodeEntities: true,
    minifyCSS: false,
    minifyJS: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortAttributes: true,
    sortClassName: true,
  },
  sass: {
    outputStyle: IS_DEV_TASK ? 'expanded' : 'compressed',
  },
  terser: {
    mangle: true,
    compress: {
      passes: 2,
    },
    format: {
      comments: false,
    },
  },
}

const readJSON = async (filePath) => {
  const content = await fs.readFile(filePath, 'utf8')
  return JSON.parse(content)
}

const minifyCss = vinylMap((buffer) => {
  return new CleanCSS(buildConfig.cleancss).minify(buffer.toString()).styles
})

function copy() {
  return gulp
    .src([
      'src/{imgs,test-svgs,fonts}/**',
      // Exclude the test-svgs files except for `car-lite.svg`
      // which is used in the demo
      '!src/test-svgs/!(car-lite.svg)',
      '!src/imgs/icon.png',
      '!src/imgs/maskable copy.svg',
      '!src/imgs/maskable copy 2.svg',
      '!src/imgs/og-image.svg',
      'src/imgs/icon-192.png',
      'src/imgs/icon-512.png',
      'src/imgs/og-image.png',
      'src/apple-touch-icon.png',
      'src/favicon.ico',
      'src/favicon.svg',
      'src/manifest.webmanifest',
      'src/robots.txt',
      'src/*.json',
    ])
    .pipe(gulp.dest('build'))
}

function css() {
  return gulp
    .src('src/css/*.scss', { sourcemaps: true })
    .pipe(gulpSass.sync(buildConfig.sass).on('error', gulpSass.logError))
    .pipe(gulpif(!IS_DEV_TASK, minifyCss))
    .pipe(gulp.dest('build/', { sourcemaps: '.' }))
}

async function html() {
  const [config, changelog, headCSS] = await Promise.all([
    readJSON(path.join(__dirname, 'src', 'config.json')),
    readJSON(path.join(__dirname, 'src', 'changelog.json')),
    fs.readFile(path.join(__dirname, 'build', 'head.css'), 'utf8'),
  ])

  return gulp
    .src('src/*.html')
    .pipe(
      gulpNunjucks.compile({
        plugins: config.plugins,
        headCSS,
        SVGOMFG_VERSION: changelog[0].version,
        SVGO_VERSION,
        liveBaseUrl: 'https://omfg.svg.beauty',
        title: "SVGOMFG‼️ SVGO's Missing and Future-proof GUI",
        description: 'Easy & Visual 🎛️ Compression of SVG Images ⚡ Ready to install for Offline Usage 🔌',
        appleTouchIconPath: '/apple-touch-icon.png',
        faviconPath: '/favicon.svg',
        ogImagePath: '/imgs/og-image.png',
      })
    )
    .pipe(gulpif(!IS_DEV_TASK, gulpHtmlmin(buildConfig.htmlmin)))
    .pipe(gulp.dest('build'))
}

const rollupCaches = new Map()

async function js(entry, outputPath) {
  const name = path.basename(path.dirname(entry))
  const changelog = await readJSON(path.join(__dirname, 'src', 'changelog.json'))
  const bundle = await rollup.rollup({
    cache: rollupCaches.get(entry),
    input: `src/${entry}`,
    plugins: [
      rollupReplace({
        preventAssignment: true,
        SVGOMFG_VERSION: JSON.stringify(changelog[0].version),
      }),
      rollupResolve({ browser: true }),
      rollupCommon({ include: /node_modules/ }),
      // Don't use terser on development
      IS_DEV_TASK
        ? ''
        : rollupTerser(
            name === 'page'
              ? {
                  ...buildConfig.terser,
                  mangle: {
                    properties: {
                      regex: /^_/,
                    },
                  },
                }
              : buildConfig.terser
          ),
    ],
  })

  rollupCaches.set(entry, bundle.cache)

  await bundle.write({
    sourcemap: true,
    format: 'iife',
    generatedCode: 'es2015',
    file: `build/${outputPath}/${name}.js`,
  })
}

function clean() {
  return fsExtra.remove('build')
}

const allJs = gulp.parallel(
  js.bind(null, 'js/prism-worker/index.js', 'js/'),
  js.bind(null, 'js/gzip-worker/index.js', 'js/'),
  js.bind(null, 'js/svgo-worker/index.js', 'js/'),
  js.bind(null, 'js/sw/index.js', ''),
  js.bind(null, 'js/page/index.js', 'js/')
)

const mainBuild = gulp.parallel(gulp.series(css, html), allJs, copy)

function watch() {
  gulp.watch(['src/css/**/*.scss'], gulp.series(css, html))
  gulp.watch(['src/js/**/*.js'], allJs)
  gulp.watch(['src/**/*.{html,svg,woff2}', 'src/*.json'], gulp.parallel(html, copy, allJs))
}

function serve() {
  sirv('build', {
    host: 'localhost',
    port: 8888,
    dev: true,
    clear: false,
  })
}

exports.clean = clean
exports.allJs = allJs
exports.css = css
exports.html = html
exports.copy = copy
exports.build = mainBuild

exports['clean-build'] = gulp.series(clean, mainBuild)

exports.dev = gulp.series(clean, mainBuild, gulp.parallel(watch, serve))
