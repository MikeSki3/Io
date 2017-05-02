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
          },
          { 
              test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
              loader: "url-loader?limit=10000&mimetype=application/font-woff" },
          { 
              test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
              loader: "file-loader" }
      ]
  }
};