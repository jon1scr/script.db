const Base = require("./Base");
const Schema = require("./Schema");
const Error = require("./Error");
const fs = require("fs");
const Util = require("./Util");

class Database extends Base {

    /**
     * @param {string} mongodbURL
     * @param {string} name 
     * @param {object} connectionOptions
     * @example
     */
    constructor(mongodbURL, name, connectionOptions={}) {
        super(mongodbURL || process.env.MONGODB_URL, connectionOptions);

        /**
         * @type {MongooseDocument}
         */
        this.schema = Schema(name);
    }

    /**
     * @param {string} key
     * @param {any} value
     * @example
     * @returns {Promise<any>}
     */
    async set(key, value) {
        if (!Util.isKey(key)) throw new Error("Invalid key specified!", "KeyError");
        if (!Util.isValue(value)) throw new Error("Invalid value specified!", "ValueError");
        const parsed = Util.parseKey(key);
        let raw = await this.schema.findOne({
            ID: parsed.key
        });
        if (!raw) {
            let data = new this.schema({
                ID: parsed.key,
                data: parsed.target ? Util.setData(key, {}, value) : value
            });
            await data.save()
                .catch(e => {
                    return this.emit("error", e);
                });
            return data.data;
        } else {
            raw.data = parsed.target ? Util.setData(key, Object.assign({}, raw.data), value) : value;
            await raw.save()
                .catch(e => {
                    return this.emit("error", e);
                });
            return raw.data;
        }
    }

    /**
     * @param {string} key
     * @example
     * @returns {Promise<boolean>}
     */
    async delete(key) {
        if (!Util.isKey(key)) throw new Error("Invalid key specified!", "KeyError");
        const parsed = Util.parseKey(key);
        const raw = await this.schema.findOne({ ID: parsed.key });
        if (!raw) return false;
        if (parsed.target) {
            let data = Util.unsetData(key, Object.assign({}, raw.data));
            if (data === raw.data) return false;
            raw.data = data;
            raw.save().catch(e => this.emit("error", e));
            return true;
        } else {
            await this.schema.findOneAndDelete({ ID: parsed.key })
                .catch(e => {
                    return this.emit("error", e);
                });
            return true;
        }
    }

    /**
     * @param {string} key
     * @example
     * @returns {Promise<boolean>}
     */
    async exists(key) {
        if (!Util.isKey(key)) throw new Error("Invalid key specified!", "KeyError");
        const parsed = Util.parseKey(key);

        let get = await this.schema.findOne({ ID: parsed.key })
            .catch(e => {
                return this.emit("error", e);
            });
        if (!get) return null;
        let item;
        if (parsed.target) item = Util.getData(key, Object.assign({}, get.data));
        else item = get.data;
        return item === undefined ? false : true;
    }

    /**
     * @param {string} key
     * @example
     * @returns {Promise<boolean>}
     */
    async has(key) {
        return await this.exists(key);
    }

    /**
     * @param {string} key
     * @example
     * @returns {Promise<any>}
     */
    async get(key) {
        if (!Util.isKey(key)) throw new Error("Invalid key specified!", "KeyError");
        const parsed = Util.parseKey(key);

        let get = await this.schema.findOne({ ID: parsed.key })
            .catch(e => {
                return this.emit("error", e);
            });
        if (!get) return null;
        let item;
        if (parsed.target) item = Util.getData(key, Object.assign({}, get.data));
        else item = get.data;
        return item !== undefined ? item : null;
    }

    /**
     * @param {string} key
     * @example
     * @returns {Promise<any>}
     */
    async fetch(key) {
        return this.get(key);
    }

    /**
     * @typedef {object} Data
     * @property {string} ID 
     * @property {any} data 
     */

    /**
     * @param {number} limit
     * @example
     * @returns {Promise<Data[]>}
     * @example
     */
    async all(limit = 0) {
        if (typeof limit !== "number" || limit < 1) limit = 0;
        let data = await this.schema.find().catch(e => {});
        if (!!limit) data = data.slice(0, limit);

        return data.map(m => ({
            ID: m.ID,
            data: m.data
        }));
    }

    /**
     * @param {number} limit
     * @returns {Promise<Data[]>}
     * @example
     */
    async fetchAll(limit) {
        return await this.all(limit);
    }

    /**
     * @example
     * @returns {Promise<boolean>}
     */
    async deleteAll() {
        this.emit("debug", "Deleting everything from the database...");
        await this.schema.deleteMany().catch(e => {});
        return true;
    }

    /**
     * @param {string} key
     * @param {string} operator
     * @param {number} value 
     * @example
     * @returns {Promise<any>}
     */
    async math(key, operator, value) {
        if (!Util.isKey(key)) throw new Error("Invalid key specified!", "KeyError");
        if (!operator) throw new Error("No operator provided!");
        if (!Util.isValue(value)) throw new Error("Invalid value specified!", "ValueError");

        switch(operator) {
            case "add":
            case "+":
                let add = await this.get(key);
                if (!add) {
                    return this.set(key, value);
                } else {
                    if (typeof add !== "number") throw new Error(`Expected existing data to be a number, received ${typeof add}!`);
                    return this.set(key, add + value);
                }

            case "subtract":
            case "sub":
            case "-":
                let less = await this.get(key);
                if (!less) {
                    return this.set(key, 0 - value);
                } else {
                    if (typeof less !== "number") throw new Error(`Expected existing data to be a number, received ${typeof less}!`);
                    return this.set(key, less - value);
                }

            case "multiply":
            case "mul":
            case "*":
                let mul = await this.get(key);
                if (!mul) {
                    return this.set(key, 0 * value);
                } else {
                    if (typeof mul !== "number") throw new Error(`Expected existing data to be a number, received ${typeof mul}!`);
                    return this.set(key, mul * value);
                }

            case "divide":
            case "div":
            case "/":
                let div = await this.get(key);
                if (!div) {
                    return this.set(key, 0 / value);
                } else {
                    if (typeof div !== "number") throw new Error(`Expected existing data to be a number, received ${typeof div}!`);
                    return this.set(key, div / value);
                }

            case "mod":
            case "%":
                let mod = await this.get(key);
                if (!mod) {
                    return this.set(key, 0 % value);
                } else {
                    if (typeof mod !== "number") throw new Error(`Expected existing data to be a number, received ${typeof mod}!`);
                    return this.set(key, mod % value);
                }

            default:
                throw new Error("Unknown operator");
        }
    }

    /**
     * @param {string} key
     * @param {number} value
     * @example
     * @returns {Promise<any>}
     */
    async add(key, value) {
        return await this.math(key, "+", value);
    }

    /**
     * @param {string} key
     * @param {number} value
     * @example
     * @returns {Promise<any>}
     */
    async subtract(key, value) {
        return await this.math(key, "-", value);
    }

    /**
     * @type {number}
     * @example
     */
    get uptime() {
        if (!this.readyAt) return 0;
        const timestamp = this.readyAt.getTime();
        return Date.now() - timestamp;
    }

    /**
     * @param {string} fileName
     * @param {string} path
     * @returns {Promise<string>}
     * @example
     */
    export(fileName="database", path="./") {
        return new Promise((resolve, reject) => {
            this.emit("debug", `Exporting database entries to ${path || ""}${fileName}`);
            this.all().then((data) => {
                const strData = JSON.stringify(data);
                if (fileName) {
                    fs.writeFileSync(`${path || ""}${fileName}`, strData);
                    this.emit("debug", `Exported all data!`);
                    return resolve(`${path || ""}${fileName}`);
                }
                return resolve(strData);
            }).catch(reject);
        });
    }

    /**
     * @param {Array} data
     * @param {object} ops 
     * @param {boolean} [ops.validate=false] 
     * @param {boolean} [ops.unique=false]
     * @example
     * @returns {Promise<boolean>}
     */
    import(data=[], ops = { unique: false, validate: false }) {
        return new Promise(async (resolve, reject) => {
            if (!Array.isArray(data)) return reject(new Error(`Data type must be Array, received ${typeof data}!`, "DataTypeError"));
            if (data.length < 1) return resolve(false);
            if (!ops.unique) {
                this.schema.insertMany(data, { ordered: !ops.validate }, (error) => {
                    if (error) return reject(new Error(`${error}`, "DataImportError"));
                    return resolve(true);
                });
            } else {
                data.forEach((x, i) => {
                    if (!ops.validate && (!x.ID || !x.data)) return;
                    else if (!!ops.validate && (!x.ID || !x.data)) return reject(new Error(`Data is missing ${!x.ID ? "ID" : "data"} path!`, "DataImportError"));
                    setTimeout(() => {
                        this.set(x.ID, x.data);
                    }, 150 * (i + 1));
                });
                return resolve(true);
            }
        });
    }

    /**
     * @example
     * @returns {void}
     */
    disconnect() {
        this.emit("debug", "'database.disconnect()' was called, destroying the process...");
        return this._destroyDatabase();
    }

    /**
     * @param {string} url
     * @returns {void}
     */
    connect(url) {
        return this._create(url);
    }

    /**
     * @type {string}
     * @readonly
     */
    get name() {
        return this.schema.modelName;
    }

    /**
     * @ignore
     * @private
     * @returns {Promise<number>}
     */
    async _read() {
        let start = Date.now();
        await this.get("LQ==");
        return Date.now() - start;
    }

    /**
     * @ignore
     * @private
     * @returns {Promise<number>}
     */
    async _write() {
        let start = Date.now();
        await this.set("LQ==", Buffer.from(start.toString()).toString("base64"));
        return Date.now() - start;
    }

    /**
     * @typedef {object} DatabaseLatency
     * @property {number} read
     * @property {number} write
     * @property {number} average
     */

    /**
     * @example
     * @returns {Promise<DatabaseLatency>}
     */
    async fetchLatency() {
        let read = await this._read();
        let write = await this._write();
        let average = (read + write) / 2;
        this.delete("LQ==").catch(e => {});
        return { read, write, average };
    }

    /**
     * @example
     * @returns {Promise<DatabaseLatency>}
     */
    async ping() {
        return await this.fetchLatency();
    }

    /**
     * @param {string} key
     * @param {object} ops
     * @example
     * @returns {Promise<Data[]>}
     */
    async startsWith(key, ops) {
        if (!key || typeof key !== "string") throw new Error(`Expected key to be a string, received ${typeof key}`);
        let all = await this.all(ops && ops.limit);
        return Util.sort(key, all, ops);
    }

    /**
     * @param {string} key 
     * @example
     * @returns {Promise<"string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array">}
     */
    async type(key) {
        if (!Util.isKey(key)) throw new Error("Invalid Key!", "KeyError");
        let fetched = await this.get(key);
        if (Array.isArray(fetched)) return "array";
        return typeof fetched;
    }

    /**
     * @example
     * @returns {Promise<string[]>}
     */
    async keyArray() {
        const data = await this.all();
        return data.map(m => m.ID);
    }

    /**
     * @example
     * @returns {Promise<any[]>}
     */
    async valueArray() {
        const data = await this.all();
        return data.map(m => m.data);
    }

    /**
     * @param {string} key
     * @param {any|any[]} value
     * @example
     * @returns {Promise<any>}
     */
    async push(key, value) {
        const data = await this.get(key);
        if (data == null) {
            if (!Array.isArray(value)) return await this.set(key, [value]);
            return await this.set(key, value);
        }
        if (!Array.isArray(data)) throw new Error(`Expected target type to be Array, received ${typeof data}!`);
        if (Array.isArray(value)) return await this.set(key, data.concat(value));
        data.push(value);
        return await this.set(key, data);
    }

    /**
     * @param {string} key 
     * @param {any|any[]} value
     * @param {boolean} [multiple=true]
     * @returns {Promise<any>}
     */
    async pull(key, value, multiple = true) {
        let data = await this.get(key);
        if (data === null) return false;
        if (!Array.isArray(data)) throw new Error(`Expected target type to be Array, received ${typeof data}!`);
        if (Array.isArray(value)) {
            data = data.filter(i => !value.includes(i));
            return await this.set(key, data);
        } else {
            if (!!multiple) {
                data = data.filter(i => i !== value);
                return await this.set(key, data);
            } else {
                const hasItem = data.some(x => x === value);
                if (!hasItem) return false;
                const index = data.findIndex(x => x === value);
                data = data.splice(index, 1);
                return await this.set(key, data);
            }
        }
    }

    /**
     * @returns {Promise<number>}
     */
    async entries() {
        return await this.schema.estimatedDocumentCount();
    }

    /**
     * @param {object} params
     * @returns {Promise<MongooseDocument>}
     */
    async raw(params) {
        return await this.schema.find(params); 
    }

    /**
     * @param {number} n
     * @returns {Promise<any[]>}
     */
    async random(n = 1) {
        if (typeof n !== "number" || n < 1) n = 1;
        const data = await this.all();
        if (n > data.length) throw new Error("Random value length may not exceed total length.", "RangeError");
        const shuffled = data.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
    }

    /**
     * @param {string} name
     * @returns {Database}
     */
    createModel(name) {
        if (!name || typeof name !== "string") throw new Error("Invalid model name");
        const CustomModel = new Database(this.dbURL, name, this.options);
        return CustomModel;
    }

    /**
     * @param {any} quickdb
     * @returns {Promise<any[]>}
     */
    async exportToQuickDB(quickdb) {
        if (!quickdb) throw new Error("Quick.db instance was not provided!");
        const data = await this.all();
        data.forEach(item => {
            quickdb.set(item.ID, item.data);
        });
        return quickdb.all();
    }

    /**
     * @type {Util}
     */
    get utils() {
        return Util;
    }

    /**
     * @param {string} name
     * @returns {MongooseDocument}
     */
    updateModel(name) {
        this.schema = Schema(name);
        return this.schema;
    }

    /**
     * @returns {string}
     */
    toString() {
        return `QuickMongo<{${this.schema.modelName}}>`;
    }

    /**
     * @param {string} code
     * @example
     * @returns {any}
     */
    _eval(code) {
        return eval(code);
    }

}

module.exports = Database;