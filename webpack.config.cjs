//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const extensionConfig = (env, argv) => ({
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: argv.mode ?? 'development',

  entry: { // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    'extension': './src/extension.ts',
    'webview': './src/webview/index.tsx',
  },
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js', '.tsx', 'jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
});

module.exports = extensionConfig;
