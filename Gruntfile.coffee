module.exports = (grunt) ->

  path = require('path');

  grunt.initConfig {
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      demo: {
        files: [{
            expand: true, flatten: true
            src: ['build/*.js']
            dest: 'demo/'
        }]
      }
    }

    # All typescript compiles to build.
    typescript: {
      all: {
        src: ['src/**/*.ts']
        dest: 'build/',
        options: { basePath: 'src' }
      }
    }

    # TODO: make tests
    jasmine: {
      src: [
      ],
      options : { specs : 'spec/**/*_spec.js' }
    }

    env: {
      jasmine_node: {
        # Will be available to tests as process.env['CHROME_EXTENSION_PATH'].
        CHROME_EXTENSION_PATH: path.resolve('chrome')
      }
    }

    jasmine_node: {
      projectRoot: 'spec/selenium'
    }

    clean: [
      'build/**',
      'chrome/js/**'
    ]
  }

  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-contrib-jasmine'
  grunt.loadNpmTasks 'grunt-typescript'
  grunt.loadNpmTasks 'grunt-jasmine-node'
  grunt.loadNpmTasks 'grunt-env'

  grunt.registerTask 'build', [
    'typescript:all',
  ]

  # This is the target run by Travis. Targets in here should run locally
  # and on Travis/Sauce Labs.
  grunt.registerTask 'test', [
    'chrome',
    'jasmine'
  ]

  grunt.registerTask 'default', [
    'build'
  ]

  grunt.registerTask 'demo', [
    'build',
    'copy:demo'
  ]
