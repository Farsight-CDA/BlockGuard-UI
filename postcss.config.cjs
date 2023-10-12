const postcss = require('postcss');
const fs = require('fs');
const path = require('path');

const cssFilePath = path.join(__dirname, 'app.css'); // Use relative path to app.css
const cssContent = fs.readFileSync(cssFilePath, 'utf8');

const output = postcss()
	.use(require('postcss-aspect-ratio-polyfill'))
	.process(cssContent).css;
