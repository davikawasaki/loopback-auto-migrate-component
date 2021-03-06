(function() {
  var Promise, appRoot, debug, isFunction, isString, isSyncModel, isUndefined, loadModelsFrom, modelNames, models, path;

  Promise = require("bluebird");

  path = require('path');

  isFunction = require('util-ex/lib/is/type/function');

  isUndefined = require('util-ex/lib/is/type/undefined');

  isString = require('util-ex/lib/is/type/string');

  debug = require('debug')('loopback:component:autoMigrate:autoUpdate');

  appRoot = require('app-root-path');

  models = require(appRoot + '/server/model-config.json');

  modelNames = require('./model-names');

  loadModelsFrom = require('./load-models-from');

  isSyncModel = function(ds, model) {
    return new Promise(function(resolve, reject) {
      ds.setMaxListeners(0);
      if (ds.connected) {
        return ds.isActual(model, function(err, actual) {
          if (err) {
            return reject(err);
          } else {
            return resolve(actual);
          }
        });
      } else {
        return ds.once('connected', function() {
          return ds.isActual(model, function(err, actual) {
            if (err) {
              return reject(err);
            } else {
              return resolve(actual);
            }
          });
        });
      }
    });
  };

  module.exports = function(app, options) {
    var vModelNames, vModels;
    vModels = [];
    vModelNames = (options && options.models) || modelNames;
    if (isString(vModelNames)) {
      vModelNames = loadModelsFrom(app, vModelNames);
    }
    return Promise.filter(vModelNames, function(model, index) {
      var ds;
      ds = app.dataSources[models[model].dataSource];
      return isSyncModel(ds, model).then(function(actual) {
        return !actual;
      });
    }).map(function(model, index) {
      var ds;
      ds = app.dataSources[models[model].dataSource];
      return ds.autoupdate(model);
    }).each(function(item, index) {
      if (!item) {
        item = vModelNames[index];
      }
      debug('Model ' + item + ' autoupdated');
      return vModels.push(app.models[item]);
    }).then(function(results) {
      debug('total ' + results.length + ' models updated.');
      return vModels;
    });
  };

}).call(this);

//# sourceMappingURL=auto-update.js.map
