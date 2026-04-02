const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'index.js', // this is the standard accepted convention, even for ESM packages
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'module', // Output as ES Module
    },
    clean: true,
  },
  experiments: {
    outputModule: true, // Required for ESM output
  },
  // No 'module.rules' needed for pure JS/ESM
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VERSION': JSON.stringify(pkg.version),
    }),
  ],
  target: 'node',
};