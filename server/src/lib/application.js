const fs = require("fs");
const { createSimpleLogger, Logger } = require("simple-node-logger");

const { Socket } = require("socket.io");
const { SocketHandler } = require("./socket");
const { Game } = require ("./game");
const { TasksData } = require("./types");

class Application {
    static TASKS_PATH = "./src/cache/tasks.json"

    constructor() {
        /**
         * @type {Object.<string, string>} <socketID, roomID>
         */
        this.playersRoom = {};

        /**
         * @type {Object.<string, Game>} <roomID, Game>
         */
        this.rooms = {}

        /**
         * @type {import("./types").TasksData}
         */
        this.tasksData = Application.loadTasks();

        /**
         * @type {Logger}
         */
        this.logger = createSimpleLogger();
        this.logger.setLevel("all");

        /**
         * @type {SocketHandler}
         */
        this.socketHandler = new SocketHandler(this);

        /**
         * @type {any}
         */
        this.io;
    }

    /**
     * @return {TasksData}
     */
    static loadTasks() {
        return JSON.parse(fs.readFileSync(Application.TASKS_PATH));
    }
}

module.exports = Application