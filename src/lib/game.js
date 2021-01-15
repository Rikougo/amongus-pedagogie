const type = require("./types");

// STATE OF THE GAME
const WAITING = "WAITING";
const PLAYING = "PLAYING";
const MEETING = "MEETING";
const ENDED   = "ENDING";

// MAX PLAYER LIMIT (to change)
const LIMIT = 6;
const MINIMUM = 4;

/**
 * @typedef {Game} Game
 */
class Game {
    
    /**
     * @param {string} roomID 
     * @param {type.TasksData} tasksData 
     */
    constructor(roomID, tasksData) {
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


        this.state = WAITING;
    }

    /**
     * Add a player to the game, players are pointed by their socket id and then process the game
     * @param {string} playerSocketId 
     * @param {string} name 
     */
    join(playerSocketId, name) {
        if (this.state !== WAITING)
            throw Error(`Joining non-waiting room ${this.id}`);

        if (this.players.length === LIMIT) 
            throw Error(`Full room error at room ${this.id}`);
        
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
        if (!this.players.has(this.admin) && this.players.size >= 1) {
            this.log("Changed admin");
            this.admin = this.players.keys().next().value;
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

    startGame() {
        if (this.players.size < MINIMUM) {
            throw Error(`Can't start game with less than ${MINIMUM} players.`);
        }

        // GIVE ROLES
        // for now impostors/crewmate repartition is fixed
        // 1 impostors per 4 players
        let impostors = Math.floor(this.players.size / 4);
        let crewmates = this.players.size - impostors;
        
        let playersArray = Array.from(this.players.values());

        let impostorsTasks = {};

        // distribute crewmate roles
        while (crewmates > 0) {
            let rndIndex = Math.floor(Math.random() * playersArray.length);
            let player = playersArray[rndIndex];
            playersArray.splice(rndIndex, 1);

            player.assignRole("crewmate", this.tasksData["test"]["crewmates"]);

            impostorsTasks[player.id] = this.tasksData["test"]["impostors"][crewmates];

            crewmates--;
        }

        // give impostor roles to other players with impostors tasks
        playersArray.forEach(v => v.assignRole("impostor", impostorsTasks));

        // CHANGE STATE
        this.state = PLAYING;
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
        console.log(`[${this.id} ROOM] ${message}`);
    }

    /**
     * !TODO
     */
    reset() {
        this.players = new Map();

        this.state = WAITING;
    }
}

/**
 * @typedef {Player} Player
 */
class Player {
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
         * @type {type.Task[]}
         */
        this.tasks;
    }

    /**
     * give a role for the player
     * @param {number} role 0 for crewmate, 1 for impostor
     * @param {} tasks
     */
    assignRole(role, tasks) {
        this.role = role;

        this.tasks = tasks;
    }
}

module.exports = {
    // player: (name) => new Player(name),
    // game: (id, tasksData) => new Game(id, tasksData),
    Game: Game,
    Player: Player,
    WAITING: WAITING,
    PLAYING: PLAYING,
    MEETING: MEETING,
    ENDED: ENDED,
    LIMIT: LIMIT
}