var path = require('path');

module.exports = {
  entry: './public/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/scripts')
  },
  resolve: {
      extensions: ['.js']
  },
  module: {
      loaders: [
          {
              test: /\.js?$/,
              loader: 'babel-loader',
              exclude: /node_modules/,
              query: {
                  cacheDirectory: true,
                  presets: ['react', 'es2015']
              }
          }
      ]
  }
};