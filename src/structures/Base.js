const EventEmitter = require("events").EventEmitter;
const mongoose = require("mongoose");
const Error = require("./Error");

class Base extends EventEmitter {

    /**
     * @param {string} mongodbURL
     * @param {object} connectionOptions 
     */
    constructor(mongodbURL, connectionOptions={}) {
        super();
        if (!mongodbURL || !mongodbURL.startsWith("mongodb")) throw new Error("No mongodb url was provided!");
        if (typeof mongodbURL !== "string") throw new Error(`Expected a string for mongodbURL, received ${typeof mongodbURL}`);
        if (connectionOptions && typeof connectionOptions !== "object") throw new Error(`Expected Object for connectionOptions, received ${typeof connectionOptions}`);

        /**
         * @type {string}
         */
        Object.defineProperty(this, "dbURL", {
            value: mongodbURL
        });

        /**
         * @type {ConnectionOptions}
         */
        this.options = connectionOptions;

        this._create();

        mongoose.connection.on("error", (e) => {
            this.emit("error", e);
        });
        mongoose.connection.on("open", () => {
            /**
             * @type {Date}
             */
            this.readyAt = new Date();
            this.emit("ready");
        });
    }

    /**
     * @ignore
     */
    _create(url) {
        if (this.state === "CONNECTED" || this.state === "CONNECTING") return;
        this.emit("debug", "Creating database connection...");

        if (url && typeof url === "string") {
            this.dbURL = url;
        };
        if (!this.dbURL || typeof this.dbURL !== "string") throw new Error("Database url was not provided!", "MongoError");
        delete this.options["useUnique"];
        mongoose.connect(this.dbURL, {
            ...this.options,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
    }

    /**
     * @ignore
     */
    _destroyDatabase() {
        mongoose.disconnect();
        this.readyAt = undefined;
        this.dbURL = null;
        this.emit("debug", "Database disconnected!");
    }

    /**
     * @type {MongooseConnection}
     */
    get connection() {
        return mongoose.connection;
    }
    
    /**
     * @type {string}
     */
    get url() {
        return this.dbURL;
    }

    /**
     * @type {"DISCONNECTED"|"CONNECTED"|"CONNECTING"|"DISCONNECTING"}
     */
    get state() {
        switch(mongoose.connection.readyState) {
            case 0:
                return "DISCONNECTED";
            case 1:
                return "CONNECTED";
            case 2:
                return "CONNECTING";
            case 3:
                return "DISCONNECTING";
        }
    }
}

/**
 * @event Base#ready
 */

/**
 * @event Base#error
 * @param {Error} Error
 */

 /**
  * @event Base#debug
  * @param {string} Message
  */

module.exports = Base;