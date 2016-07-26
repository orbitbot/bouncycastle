var webpack = require('webpack');

module.exports = {
  entry   : './bouncycastle.js',
  devtool : 'source-map',
  output  : { filename: './build/bouncycastle.js' },
  module  : {
    loaders: [
      { test: /\.js$/, loader: 'buble' }
    ]
  }
};
