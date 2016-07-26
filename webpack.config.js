var webpack = require('webpack');

module.exports = {
  entry : {
    demo         : './demo.js',
    bouncycastle :'./bouncycastle.js'
  },
  devtool : 'source-map',
  output  : { filename: './build/[name].js' },
  module  : {
    loaders: [
      { test: /\.js$/, loader: 'buble' }
    ]
  }
};
