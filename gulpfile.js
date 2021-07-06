let fileswatch   = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

const { src, dest, parallel, series, watch } = require('gulp')
const browserSync  	 = require('browser-sync').create()
const bssi         	 = require('browsersync-ssi')
const ssi          	 = require('ssi')
const webpack      	 = require('webpack-stream')
const sass         	 = require('gulp-sass')(require('sass'))
const sassglob     	 = require('gulp-sass-glob')
const cleancss     	 = require('gulp-clean-css')
const autoprefixer 	 = require('gulp-autoprefixer')
const rename       	 = require('gulp-rename')
const imagemin     	 = require('gulp-imagemin')
const newer        	 = require('gulp-newer')
const rsync        	 = require('gulp-rsync')
const del          	 = require('del')
const nunjucksRender = require('gulp-nunjucks-render')
const data           = require('gulp-data')
const sourcemaps     = require('gulp-sourcemaps');


function browsersync() {
	browserSync.init({
		server: {
			baseDir: 'src/'
		},
		ghostMode: { clicks: false },
		notify: false,
		online: true,
		open: false
		// tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
	})
}

function scripts() {
	return src(['src/utils/main.js'])
		.pipe(webpack({
			devtool: 'inline-source-map',
			mode: 'production',
			performance: { hints: false },
			module: {
				rules: [
					{
						test: /\.(js)$/,
						exclude: /(node_modules)/,
						loader: 'babel-loader',
						query: {
							presets: ['@babel/env'],
							plugins: ['babel-plugin-root-import']
						}
					}
				]
			}
		})).on('error', function handleError() {
			this.emit('end')
		})
		.pipe(rename('main.min.js'))
		.pipe(dest('src/js'))
		.pipe(browserSync.stream())
}

function styles() {
	return src('src/utils/main.scss')
    .pipe(sourcemaps.init())
		.pipe(sassglob())
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(cleancss({ level: { 1: { specialComments: 0 } }, /* format: 'beautify' */ }))
    .pipe(sourcemaps.write())
		.pipe(rename('main.min.css'))
		.pipe(dest('src/css'))
		.pipe(browserSync.stream())
}

function images() {
	return src(['src/assets/images/**'])
		.pipe(imagemin())
		.pipe(dest('dist/assets/images/'))
}

function build() {
	return src([
		'{src/js,src/css,src/assets}/**/*',
		'src/*.html',
		'!src/pages/**/*',
		'!src/partials/**/*',
		'!src/assets/images/**',
	], { base: 'src/' })
	.pipe(dest('dist'))
}

function cleandist() {
	return del('dist/**/*', { force: true })
}

function deploy() {
	return src('dist/')
		.pipe(rsync({
			root: 'dist/',
			hostname: 'username@yousite.com',
			destination: 'yousite/public_html/',
			// clean: true, // Mirror copy with file deletion
			include: [/* '*.htaccess' */], // Included files to deploy,
			exclude: [ '**/Thumbs.db', '**/*.DS_Store' ],
			recursive: true,
			archive: true,
			silent: false,
			compress: true
		}))
}

function nunjucks () {
    return src('src/pages/**/*.+(html|njk)')
        .pipe(nunjucksRender({
            path: ['src/partials']
        }))
        .pipe(dest('src'));
}

function startwatch() {
	watch(['src/partials/**/*.scss', 'src/pages/**/*.scss'], { usePolling: true }, styles)
	watch(['src/partials/**/*.js', 'src/pages/**/*.js', 'src/utils/main.js'], { usePolling: true }, scripts)
	watch('src/images/src/**/*.{jpg,jpeg,png,webp,svg,gif}', { usePolling: true }, images)
	watch(['src/partials/**/*.html', 'src/pages/**/*.html'], { usePolling: true }, nunjucks)
	watch(`src/**/*.{${fileswatch}}`, { usePolling: true }).on('change', browserSync.reload)
}

exports.scripts = scripts
exports.styles  = styles
exports.images  = images
exports.nunjucks = nunjucks
exports.deploy  = deploy
exports.assets  = series(scripts, styles)
exports.build   = series(cleandist, scripts, styles, nunjucks, build, images)
exports.default = series(scripts, styles, nunjucks, parallel(browsersync, startwatch))
