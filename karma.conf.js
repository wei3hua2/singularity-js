// Karma configuration
// Generated on Mon Feb 11 2019 13:53:32 GMT+0800 (Singapore Standard Time)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],
    // list of files / patterns to load in the browser
    files: [
      {pattern: 'test/browser/**.js', watched: false}
    ],
    // list of files / patterns to exclude
    exclude: [
    ],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/browser/**.js': ['webpack']
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    logLevel: config.LOG_INFO,
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    singleRun: false,
    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    webpack: {
      // module: {
      //     loaders: [
      //         { test: /\.js/, exclude: /node_modules/, loader: 'babel-loader' }
      //     ]
      // },
      // watch: true
    },
    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      stats: 'errors-only'
    }

  })
}
