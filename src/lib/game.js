const Application = require("./application");
const { TasksData, Task, TasksList } = require("./types");

/**
 * @typedef {Game} Game
 */
class Game {
    static States = {
        WAITING: "WAITING",
        PLAYING: "PLAYING",
        MEETING: "MEETING",
        ENDING:  "ENDING"
    };

    static LIMIT = 6;
    static MINIMUM = 4;
    
    /**
     * @param {Application} app
     * @param {string} roomID 
     * @param {TasksData} tasksData 
     */
    constructor(app, roomID, tasksData) {
        /**
         * @type {Application}
         */
        this.app = app;

        /**
         * @type {string}
         */
        this.id = roomID;

        /**
         * @type {type.TasksData}
         */
        this.tasksData = tasksData;

        /**
         * @type {Map<string, Player>}
         */
        this.players = new Map();

        this.state = Game.States.WAITING;

        this.log("Created room.");
    }

    /**
     * Add a player to the game, players are pointed by their socket id and then process the game
     * @param {string} playerSocketId 
     * @param {string} name 
     */
    join(playerSocketId, name) {
        if (this.state !== Game.States.WAITING)
            throw new Error(`Joining non-waiting room ${this.id}`);

        if (this.players.length === Game.LIMIT) 
            throw new Error(`Full room error at room ${this.id}`);
        
        this.players.set(playerSocketId, new Player(playerSocketId, name));

        this.log(`Player ${name} [${playerSocketId}] joined the room`);

        if (this.players.size === 1) this.admin = playerSocketId;
    }

    /**
     * Delete the player object by socket id and then process the game
     * @param {string} playerSocketId 
     */
    leave(playerSocketId) {
        let name = this.players.get(playerSocketId).name;

        this.players.delete(playerSocketId);

        // deleguate admin role
        if (this.admin === playerSocketId && this.players.size >= 1) {
            this.log("Changed admin");
            this.admin = this.players.keys().next().value;
        }

        if (this.state !== Game.States.WAITING && this.state !== Game.States.ENDING) {
            this.checkWinState();
        }

        this.log(`Player ${name} [${playerSocketId}] left the room`);
    }

    /**
     * @return {{id: string, name: string, admin: boolean}[]}
     */
    playersList() {
        let list = [];

        this.players.forEach(player => list.push({
            id: player.id,
            name: player.name,
            admin: player.id === this.admin
        }));

        return list;
    }

    /**
     * 
     * @param {string} tasksType 
     */
    startGame(tasksType) {
        if (this.players.size < Game.MINIMUM) {
            throw new Error(`Can't start game with less than ${Game.MINIMUM} players.`);
        }

        const tasksData = this.tasksData[tasksType];

        if (!tasksData) throw new Error(`Unknown task category ${tasksType}.`);

        /**
         * GIVE ROLES 
         * for now impostors/crewmate repartition is fixed
         * 1 impostors per 4 players
        */ 
        let impostors = Math.floor(this.players.size / 4);
        let crewmates = this.players.size - impostors;
        
        const playersArray = Array.from(this.players.values());

        const impostorsTasks = {};

        // distribute crewmate roles
        while (crewmates > 0) {
            let rndIndex = Math.floor(Math.random() * playersArray.length);
            let player = playersArray[rndIndex];
            playersArray.splice(rndIndex, 1);

            let pTasks = {};
            Object.entries(tasksData.crewmates).forEach(([key, value]) => pTasks[key] = {...value, completed: false});

            player.assignRole(Player.Role.CREWMATE, pTasks);

            impostorsTasks[player.id] = {...tasksData.impostors[crewmates], completed: false};
            crewmates--;
        }

        // give impostor roles to other players with impostors tasks
        playersArray.forEach(v => v.assignRole(Player.Role.IMPOSTOR, impostorsTasks));

        // CHANGE STATE
        this.state = Game.States.PLAYING;
    }

    /**
     * 
     * @param {string} playerSocketId 
     */
    kill(playerSocketId) {
        if (!this.players.has(playerSocketId)) {
            throw new Error("Unknown player.");
        }
        
        this.players.get(playerSocketId).alive = false;

        this.checkWinState();
    }

    /**
     * 
     */
    checkWinState() {
        let crewmatesAlive, impostorsAlive = (0, 0);

        this.players.forEach((player) => player.role === Player.Role.CREWMATE ? crewmatesAlive++ : impostorsAlive++);

        if (impostorsAlive >= crewmatesAlive) {
            this.log("Impostors win.");
        } else if (crewmatesAlive === 0) {
            this.log("Crewmate win");
        }
    }

    /**
     * @return {boolean} Says if game has no player inside
     * @readonly
     */
    get empty() {
        return this.players.size === 0;
    }

    /**
     * Dev purpose to help track what's going on
     * @param {string} message 
     */
    log(message) {
        this.app.logger.info(`[${this.id} ROOM] ${message}`);
    }

    /**
     * 
     */
    reset() {
        this.players = new Map();

        this.state = Game.WAITING;
    }
}

/**
 * @typedef {Player} Player
 */
class Player {
    static Role = {
        CREWMATE: "crewmate",
        IMPOSTOR: "impostor"
    }

    constructor(id, name) {
        /**
         * @type {string}
         */
        this.id = id;

        /**
         * @type {string}
         */
        this.name = name;

        /**
         * @type {string[]}
         */
        this.playedCodes = [];

        /**
         * @type {TasksList}
         */
        this.tasks;

        /**
         * @type {boolean}
         */
        this.alive = true;
    }

    /**
     * give a role for the player
     * @param {number} role 0 for crewmate, 1 for impostor
     * @param {TasksList} tasks
     */
    assignRole(role, tasks) {
        this.role = role;

        this.tasks = tasks;
    }
}

module.exports = {
    Game: Game,
    Player: Player
};