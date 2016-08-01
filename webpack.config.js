var webpack = require('webpack');

module.exports = {
  entry : {
    demo         : './src/demo.js',
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
