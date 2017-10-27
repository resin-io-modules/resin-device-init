// Generated by CoffeeScript 1.12.7

/*
Copyright 2017 Resin.io

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
 * @module network
 */
var CONNECTIONS_FOLDER, DEFAULT_CONNECTION_FILE, _, fileNotFoundError, getConfigPathDefinition, getOS1ConfigurationSchema, getOS1EthernetConfiguration, getOS1WifiConfigurationSchema, getOS2WifiConfigurationSchema, imagefs, path, prepareImageOS1NetworkConfig, prepareImageOS2WifiConfig, reconfix, utils;

_ = require('lodash');

path = require('path');

utils = require('./utils');

imagefs = require('resin-image-fs');

reconfix = require('reconfix');

CONNECTIONS_FOLDER = '/system-connections';

getConfigPathDefinition = function(manifest, configPath, useNewImageFsFormat) {
  var configPathDefinition;
  if (useNewImageFsFormat == null) {
    useNewImageFsFormat = true;
  }
  if (useNewImageFsFormat) {
    configPathDefinition = utils.convertFilePathDefinition(manifest.configuration.config);
  } else {
    configPathDefinition = _.clone(manifest.configuration.config);
  }
  configPathDefinition.path = configPath;
  return configPathDefinition;
};

fileNotFoundError = function(e) {
  return e.code === 'ENOENT';
};


/**
 * @summary Configure network on an ResinOS 1.x image
 * @function
 * @public
 *
 * @description
 * This function injects network settings into the device.
 *
 * @param {String} image - path to image
 * @param {Object} config - a fully populated config object
 * @param {Object} [answers] - configuration options
 *
 * @returns {Promise<void>}
 */

exports.configureOS1Network = function(image, manifest, answers) {
  return prepareImageOS1NetworkConfig(image, manifest).then(function() {
    var schema;
    schema = getOS1ConfigurationSchema(manifest, answers);
    if (manifest.configuration.config.image) {
      image = path.join(image, manifest.configuration.config.image);
    }
    return reconfix.writeConfiguration(schema, answers, image);
  });
};


/**
 * @summary Configure network on an ResinOS 2.x image
 * @function
 * @public
 *
 * @description
 * This function injects network settings into the device.
 *
 * @param {String} image - path to image
 * @param {Object} config - a fully populated config object
 * @param {Object} [answers] - configuration options
 *
 * @returns {Promise<void>}
 */

exports.configureOS2Network = function(image, manifest, answers) {
  if (answers.network !== 'wifi') {
    return;
  }
  return prepareImageOS2WifiConfig(image, manifest).then(function() {
    var schema;
    schema = getOS2WifiConfigurationSchema(manifest, answers);
    if (manifest.configuration.config.image) {
      image = path.join(image, manifest.configuration.config.image);
    }
    return reconfix.writeConfiguration(schema, answers, image);
  });
};

prepareImageOS1NetworkConfig = function(target, manifest) {
  var configFilePath;
  configFilePath = utils.definitionForImage(target, utils.convertFilePathDefinition(manifest.configuration.config));
  return imagefs.readFile(configFilePath).then(JSON.parse).then(function(contents) {
    var base;
    if (contents.files == null) {
      contents.files = {};
    }
    if ((base = contents.files)['network/network.config'] == null) {
      base['network/network.config'] = '';
    }
    return imagefs.writeFile(configFilePath, JSON.stringify(contents));
  })["catch"](fileNotFoundError, function() {
    return imagefs.writeFile(configFilePath, JSON.stringify({
      files: {
        'network/network.config': ''
      }
    }));
  });
};


/**
 * @summary Prepare the image to ensure the wifi reconfix schema is applyable
 * @function
 * @private
 *
 * @description
 * Ensure the image has a resin-wifi file ready to configure, based
 * on the existing resin-sample.ignore or resin-sample files, if present.
 *
 * @param {String} target - path to the target image
 * @param {Object} manifest - the device type manifest for the image
 *
 * @returns {Promise<void>}
 */

prepareImageOS2WifiConfig = function(target, manifest) {

  /*
  	 * We need to ensure a template network settings file exists at resin-wifi. To do that:
  	 * * if the `resin-wifi` file exists (previously configured image or downloaded from the UI) we're all good
  	 * * if the `resin-sample` exists, it's copied to resin-sample.ignore
  	 * * if the `resin-sample.ignore` exists, it's copied to `resin-wifi`
  	 * * otherwise, the new file is created from a hardcoded template
   */
  var connectionsFolderDefinition;
  connectionsFolderDefinition = utils.definitionForImage(target, getConfigPathDefinition(manifest, CONNECTIONS_FOLDER));
  return imagefs.listDirectory(connectionsFolderDefinition).then(function(files) {
    if (_.includes(files, 'resin-wifi')) {
      return;
    }
    if (_.includes(files, 'resin-sample.ignore')) {
      return imagefs.copy(utils.definitionForImage(target, getConfigPathDefinition(manifest, CONNECTIONS_FOLDER + "/resin-sample.ignore")), utils.definitionForImage(target, getConfigPathDefinition(manifest, CONNECTIONS_FOLDER + "/resin-wifi")));
    }
    if (_.includes(files, 'resin-sample')) {
      return imagefs.copy(utils.definitionForImage(target, getConfigPathDefinition(manifest, CONNECTIONS_FOLDER + "/resin-sample")), utils.definitionForImage(target, getConfigPathDefinition(manifest, CONNECTIONS_FOLDER + "/resin-wifi")));
    }
    return imagefs.writeFile(utils.definitionForImage(target, getConfigPathDefinition(manifest, CONNECTIONS_FOLDER + "/resin-wifi")), DEFAULT_CONNECTION_FILE);
  });
};

DEFAULT_CONNECTION_FILE = '[connection]\nid=resin-wifi\ntype=wifi\n\n[wifi]\nhidden=true\nmode=infrastructure\nssid=My_Wifi_Ssid\n\n[wifi-security]\nauth-alg=open\nkey-mgmt=wpa-psk\npsk=super_secret_wifi_password\n\n[ipv4]\nmethod=auto\n\n[ipv6]\naddr-gen-mode=stable-privacy\nmethod=auto';

getOS1ConfigurationSchema = function(manifest, answers) {
  if (answers.network === 'wifi') {
    return getOS1WifiConfigurationSchema(manifest);
  } else {
    return getOS1EthernetConfiguration(manifest);
  }
};

getOS1EthernetConfiguration = function(manifest) {
  return {
    mapper: [
      {
        domain: [['config_json', 'files']],
        template: {
          'files': {}
        }
      }, {
        domain: [['network_config', 'service_home_ethernet']],
        template: {
          'service_home_ethernet': {
            'Type': 'ethernet',
            'Nameservers': '8.8.8.8,8.8.4.4'
          }
        }
      }
    ],
    files: {
      config_json: {
        type: 'json',
        location: getConfigPathDefinition(manifest, '/config.json', false)
      },
      network_config: {
        type: 'ini',
        location: {
          parent: 'config_json',
          property: ['files', 'network/network.config']
        }
      }
    }
  };
};

getOS1WifiConfigurationSchema = function(manifest) {
  return {
    mapper: [
      {
        domain: [['config_json', 'wifiSsid'], ['config_json', 'wifiKey']],
        template: {
          'wifiSsid': '{{wifiSsid}}',
          'wifiKey': '{{wifiKey}}'
        }
      }, {
        domain: [['network_config', 'service_home_ethernet'], ['network_config', 'service_home_wifi']],
        template: {
          'service_home_ethernet': {
            'Type': 'ethernet',
            'Nameservers': '8.8.8.8,8.8.4.4'
          },
          'service_home_wifi': {
            'Hidden': true,
            'Type': 'wifi',
            'Name': '{{wifiSsid}}',
            'Passphrase': '{{wifiKey}}',
            'Nameservers': '8.8.8.8,8.8.4.4'
          }
        }
      }
    ],
    files: {
      config_json: {
        type: 'json',
        location: getConfigPathDefinition(manifest, '/config.json', false)
      },
      network_config: {
        type: 'ini',
        location: {
          parent: 'config_json',
          property: ['files', 'network/network.config']
        }
      }
    }
  };
};

getOS2WifiConfigurationSchema = function(manifest) {
  return {
    mapper: [
      {
        domain: [['system_connections', 'resin-wifi', 'wifi'], ['system_connections', 'resin-wifi', 'wifi-security']],
        template: {
          'wifi': {
            'ssid': '{{wifiSsid}}'
          },
          'wifi-security': {
            'psk': '{{wifiKey}}'
          }
        }
      }
    ],
    files: {
      system_connections: {
        fileset: true,
        type: 'ini',
        location: getConfigPathDefinition(manifest, CONNECTIONS_FOLDER, false)
      }
    }
  };
};
