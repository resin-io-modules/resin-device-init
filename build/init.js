// Generated by CoffeeScript 1.12.7

/*
Copyright 2016 Balena

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

/**
 * @module init
 */
var Promise, _, network, operations, resinSemver, utils;

_ = require('lodash');

Promise = require('bluebird');

operations = require('resin-device-operations');

resinSemver = require('resin-semver');

utils = require('./utils');

network = require('./network');

exports.getImageManifest = utils.getImageManifest;

exports.getImageOsVersion = utils.getImageOsVersion;


/**
 * @summary Configure an image with an application
 * @function
 * @public
 *
 * @description
 * This function injects `config.json` and network settings into the image.
 *
 * @param {String} image - path to image
 * @param {Object} manifest - device type manifest
 * @param {Object} config - a fully populated config object
 * @param {Object} [options] - configuration options
 *
 * @returns {Promise<EventEmitter>} configuration event emitter
 *
 * @example
 * init.configure('my/rpi.img', manifest, config).then (configuration) ->
 *
 * 	configuration.on('stdout', process.stdout.write)
 * 	configuration.on('stderr', process.stderr.write)
 *
 * 	configuration.on 'state', (state) ->
 * 		console.log(state.operation.command)
 * 		console.log(state.percentage)
 *
 * 	configuration.on 'error', (error) ->
 * 		throw error
 *
 * 	configuration.on 'end', ->
 * 		console.log('Configuration finished')
 */

exports.configure = function(image, manifest, config, options) {
  if (options == null) {
    options = {};
  }
  return Promise["try"](function() {
    var ref, ref1;
    if (((ref = manifest.yocto) != null ? ref.image : void 0) === 'resin-image' && _.includes(['resinos-img', 'resin-sdcard'], (ref1 = manifest.yocto) != null ? ref1.fstype : void 0)) {
      return utils.getImageOsVersion(image, manifest);
    }
  }).then(function(osVersion) {
    var configPathDefinition, configuration, majorVersion;
    configuration = manifest.configuration;
    majorVersion = resinSemver.major(osVersion);
    configPathDefinition = utils.convertFilePathDefinition(configuration.config);
    return utils.writeConfigJSON(image, config, configPathDefinition).then(function() {
      if ((majorVersion == null) || majorVersion === 2) {
        return network.configureOS2Network(image, manifest, options);
      }
    }).then(function() {
      if ((majorVersion == null) || majorVersion === 1) {
        return network.configureOS1Network(image, manifest, options);
      }
    }).then(function() {
      return operations.execute(image, configuration.operations, options);
    });
  });
};


/**
 * @summary Initialize an image
 * @function
 * @public
 *
 * @param {String} image - path to image
 * @param {Object} manifest - device type manifest
 * @param {Object} options - configuration options
 *
 * @returns {Promise<EventEmitter>} initialization event emitter
 *
 * @example
 * init.initialize('my/rpi.img', manifest, network: 'ethernet').then (configuration) ->
 *
 * 	configuration.on('stdout', process.stdout.write)
 * 	configuration.on('stderr', process.stderr.write)
 *
 * 	configuration.on 'state', (state) ->
 * 		console.log(state.operation.command)
 * 		console.log(state.percentage)
 *
 * 	configuration.on 'burn', (state) ->
 * 		console.log(state)
 *
 * 	configuration.on 'error', (error) ->
 * 		throw error
 *
 * 	configuration.on 'end', ->
 * 		console.log('Configuration finished')
 */

exports.initialize = function(image, manifest, options) {
  return operations.execute(image, manifest.initialization.operations, options);
};
