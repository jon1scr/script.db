const fs = require("fs");

/**
 * @type {{asyncWrite: boolean, syncOnWrite: boolean, jsonSpaces: number}}
 */

const defaultOptions = {
  asyncWrite: false,
  syncOnWrite: true,
  jsonSpaces: 4
};

/**
 * @param {string} fileContent
 * @returns {boolean}
 */
let validateJSON = function(fileContent) {
  try {
    JSON.parse(fileContent);
  } catch (e) {
    throw new Error('Given filePath is not empty and its content is not valid JSON.');
  }
  return true;
};

/**
 * @param {string} filePath 
 * @param {object} [options]
 * @param {boolean} [options.asyncWrite]
 * @param {boolean} [options.syncOnWrite]
 * @param {boolean} [options.syncOnWrite]
 * @param {number} [options.jsonSpaces]
 * @constructor
 */
function JSONdb(filePath, options) {
  if (!filePath || !filePath.length) {
    throw new Error('Missing file path argument.');
  } else {
    this.filePath = filePath;
  }

  if (options) {
    for (let key in defaultOptions) {
      if (!options.hasOwnProperty(key)) options[key] = defaultOptions[key];
    }
    this.options = options;
  } else {
    this.options = defaultOptions;
  }

  this.storage = {};

  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return;
    } else if (err.code === 'EACCES') {
      throw new Error(`Cannot access path "${filePath}".`);
    } else {
      throw new Error(`Error while checking for existence of path "${filePath}": ${err}`);
    }
  }
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    throw new Error(`Cannot read & write on path "${filePath}". Check permissions!`);
  }
  if (stats.size > 0) {
    let data;
    try {
      data = fs.readFileSync(filePath);
    } catch (err) {
      throw err; 
    }
    if (validateJSON(data)) this.storage = JSON.parse(data);
  }
}

/**
 * @param {string} key
 * @param {object} value
 */
JSONdb.prototype.set = function(key, value) {
  this.storage[key] = value;
  if (this.options && this.options.syncOnWrite) this.sync();
};

/**
 * @param {string} key 
 * @returns {object|undefined} 
 */
JSONdb.prototype.get = function(key) {
  return this.storage.hasOwnProperty(key) ? this.storage[key] : undefined;
};

/**
 * @param {string} key 
 * @returns {boolean} 
 */
JSONdb.prototype.has = function(key) {
  return this.storage.hasOwnProperty(key);
};

/**
 * @param {string} key
 * @returns {boolean|undefined}
 */
JSONdb.prototype.delete = function(key) {
  let retVal = this.storage.hasOwnProperty(key) ? delete this.storage[key] : undefined;
  if (this.options && this.options.syncOnWrite) this.sync();
  return retVal;
};

/**
 * @returns {object}
 */
JSONdb.prototype.deleteAll = function() {
  for (var key in this.storage) {
    this.delete(key);
  }
  return this;
};

JSONdb.prototype.sync = function() {
  if (this.options && this.options.asyncWrite) {
    fs.writeFile(this.filePath, JSON.stringify(this.storage, null, this.options.jsonSpaces), (err) => {
      if (err) throw err;
    });
  } else {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.storage, null, this.options.jsonSpaces));
    } catch (err) {
      if (err.code === 'EACCES') {
        throw new Error(`Cannot access path "${this.filePath}".`);
      } else {
        throw new Error(`Error while writing to path "${this.filePath}": ${err}`);
      }
    }
  }
};

/**
 * @param {object} storage
 * @returns {object}
 */
JSONdb.prototype.JSON = function(storage) {
  if (storage) {
    try {
      JSON.parse(JSON.stringify(storage));
      this.storage = storage;
    } catch (err) {
      throw new Error('Given parameter is not a valid JSON object.');
    }
  }
  return JSON.parse(JSON.stringify(this.storage));
};

module.exports = JSONdb;
