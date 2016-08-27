var webpack = require('webpack');

module.exports = {
  entry : {
    bouncycastle : './src/bouncycastle.js'
  },
  devtool : 'source-map',
  output  : { filename: './demo/[name].js' },
  module  : {
    loaders: [
      { test: /\.js$/, loader: 'buble' }
    ]
  }
};
