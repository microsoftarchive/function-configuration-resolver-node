//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

const objectPath = require('object-path');

// Walk an entire configuration object; any function will be executed
// and passed its own parent in that execution. This will have all sorts
// of side effects if run on any sort of real objects. This then
// removes the function from the object.

function identifyPaths(node, prefix) {
  prefix = prefix !== undefined ? prefix + '.' : '';
  const paths = {};
  for (const property in Object.getOwnPropertyNames(node)) {
    const value = node[property];
    if (typeof value === 'object') {
      Object.assign(paths, identifyPaths(value, prefix + property));
      continue;
    }
    if (typeof value !== 'function') {
      continue;
    }
    paths[prefix + property] = [node, value];
  }
  return paths;
}

function createClient(options) {
  options = options || {};
  const deleteAfterExecution = options.delete || true;
  return {
    resolveFunctions: (object, callback) => {
      let paths = null;
      try {
        paths = identifyPaths(object);
      } catch(parseError) {
        return callback(parseError);
      }
      const names = Object.getOwnPropertyNames(paths);
      for (let i = 0; i < names.length; i++) {
        const pair = names[i];
        const node = pair[0];
        const func = pair[1];

        try {
          func(node);
          objectPath.del(object, path);
        } catch (executionError) {
          objectPath.set(object, path, executionError);
        }
      }
    },
  };
}

module.exports = createClient;

