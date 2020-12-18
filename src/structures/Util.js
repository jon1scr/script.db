const _ = require("lodash");
const Error = require("./Error");

class Util {

    constructor() {
        throw new Error(`Class ${this.constructor.name} may not be instantiated!`);
    }

    /**
     * @param {any} str
     * @returns {boolean}
     */
    static isKey(str) {
        return typeof str === "string";
    }

    /**
     * @param {any} data
     * @returns {boolean}
     */
    static isValue(data) {
        if (data === Infinity || data === -Infinity) return false;
        if (typeof data === "undefined") return false;
        return true;
    }

    /**
     * @typedef {object} KEY
     * @property {string | undefined} key
     * @property {string | undefined} target 
     */

    /**
     * @param {string} key
     * @example
     * @returns {KEY}
     */
    static parseKey(key) {
        if (!key || typeof key !== "string") return { key: undefined, target: undefined };
        if (key.includes(".")) {
            let spl = key.split(".");
            let parsed = spl.shift();
            let target = spl.join(".");
            return { key: parsed, target };
        }
        return { key, target: undefined };
    }

    /**
     * @param {string} key 
     * @param {Array} data 
     * @param {object} ops 
     * @example 
     * @returns {any[]}
     */
    static sort(key, data, ops) {
        if (!key || !data || !Array.isArray(data)) return [];
        let arb = data.filter(i => i.ID.startsWith(key));
        if (ops && ops.sort && typeof ops.sort === 'string') {
            if (ops.sort.startsWith('.')) ops.sort = ops.sort.slice(1);
            ops.sort = ops.sort.split('.');
            arb = _.sortBy(arb, ops.sort).reverse();
        }
        return arb;
    }

    /**
     * @param {string} key 
     * @param {any} data 
     * @param {any} value 
     * @example 
     * @returns {any}
     */
    static setData(key, data, value) {
        let parsed = this.parseKey(key);
        if (typeof data === "object" && parsed.target) {
            return _.set(data, parsed.target, value);
        } else if (parsed.target) throw new Error("Cannot target non-object.", "TargetError");
        return data;
    }

    /**
     * @param {string} key 
     * @param {any} data
     * @param {any} value 
     * @example
     * @returns {any}
     */
    static unsetData(key, data) {
        let parsed = this.parseKey(key);
        let item = data;
        if (typeof data === "object" && parsed.target) {
            _.unset(item, parsed.target);
        } else if (parsed.target) throw new Error("Cannot target non-object.", "TargetError");
        return item;
    }

    /**
     * @param {string} key
     * @param {any} data
     * @example
     * @returns {any}
     */
    static getData(key, data) {
        let parsed = this.parseKey(key);
        if (parsed.target) data = _.get(data, parsed.target);
        return data;
    }
}

module.exports = Util;