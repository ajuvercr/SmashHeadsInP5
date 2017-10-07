const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  node: { fs: "empty" },
  module: {
    loaders: [
      {
          test: /\.(jpe?g|png|gif|svg)$/i,
          loaders: [
              'file-loader?name=images/[name].[ext]'        ]
      },
      {
          test: /\.(html|css)$/i,
          loaders: [
              'file-loader?name=[name].[ext]'        ]
      }
    ]
  }
};
