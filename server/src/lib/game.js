const Application = require("./application");
const { TasksData, Task, TasksList } = require("./types");

/**
 * @typedef {Game} Game
 */
class Game {
    static States = {
        WAITING:  "WAITING",
        PLAYING:  "PLAYING",
        MEETING:  "MEETING",
        EJECTING: "EJECTING",
        ENDING:   "ENDING"
    };

    static Win = {
        NONE: "None",
        IMPOSTORS: "IMPOSTORS",
        CREWMATES: "CREWMATES"
    }

    static LIMIT = 6;
    static MINIMUM = 4;

    meetingTime = 5;
    
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

        /**
         * @type {Map<string, Player>}
         */
        this._leftPlayers = new Map(); // unused for now, idea for reconnect attempt

        /**
         * @type {string} Game.States
         */
        this.state = Game.States.WAITING;

        /**
         * @type {Object.<string, string[]>} map of targeted players and whos has voted for them
         */
        this._votes = undefined;

        /**
         * @type {string[]} list of player that already has voted during the current meeting
         */
        this._hasVoted = [];

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

        this.log(`Player ${name} [${playerSocketId}] left the room`);
    }

    /**
     * @param {boolean} [watchAlive] if true will return alive flag
     * @return {{id: string, name: string, admin: boolean, alive: boolean | undefined}[]}
     */
    playersList(watchAlive) {
        let list = [];

        this.players.forEach(player => list.push({
            id: player.id,
            name: player.name,
            admin: player.id === this.admin,
            alive: watchAlive ? player.alive : undefined
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

        console.log("startGame");

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
     * @param {string} playerSocketId 
     */
    kill(playerSocketId) {
        if (!this.players.has(playerSocketId))
            throw new Error("Unknown player.");
        
        this.players.get(playerSocketId).alive = false;
    }

    startMeeting() {
        if (this.state === Game.States.MEETING) return;

        this.state = Game.States.MEETING;
        this._votes = {"skip": []};
        this._hasVoted = [];

        this.players.forEach((v) => this._votes[v.id] = []);
    }

    /**
     * 
     * @param {string} source source player id
     * @param {string} target target player id
     */
    voteFor(source, target) {
        if (this.state !== Game.States.MEETING || this._hasVoted.include(source)) return;

        this._hasVoted.push(source);

        if (this._votes[target])
            this._votes[target].push(source);
        else
            throw new UnknownTargetError(target, source);
    }

    endMeeting() {
        if (this.state !== Game.States.MEETING) return;

        const votes = this._votes;

        this.state = Game.States.PLAYING;
        this._votes = undefined;
        this._hasVoted = undefined;

        return votes;
    }

    /**
     * Either impostors, crewmates or none have won.
     * @return {string} see @Game.Win
     */
    checkWinState() {
        let crewmatesAlive, impostorsAlive = (0, 0);

        let tasksCompleted = true;

        this.players.forEach((player) => {
            if (player.role === Player.Role.CREWMATE) {
                crewmatesAlive++;

                Object.entries(player.tasks).forEach(([_, value]) => { if (!value.completed) tasksCompleted = false; });
            } else {
                impostorsAlive++;
            }
        });

        if (impostorsAlive >= crewmatesAlive) {
            this.log("Impostors win.");
            return Game.Win.IMPOSTORS;
        } else if (impostorsAlive === 0 || tasksCompleted) {
            this.log("Crewmate win");
            return Game.Win.CREWMATES;
        }

        return Game.Win.NONE;
    }

    /**
     * @return {boolean} Says if game has no player inside
     * @readonly
     */
    get empty() {
        return this.players.size === 0;
    }

    /**
     * @return {Player[]} List of impostors players
     * @readonly
     */
    get impostors() {
        const result = [];

        this.players.forEach(value => { if (value.role === Player.Role.IMPOSTOR) result.push({name: value.name})});

        return result;
    }

    /**
     * @return {Player[]} List of crewmates players
     * @readonly
     */
    get crewmates() {
        const result = [];

        this.players.forEach(value => { if (value.role === Player.Role.CREWMATE) result.push({name: value.name})});

        return result;
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
        this.players.clear();
        this._leftPlayers.clear();

        this.state = Game.States.WAITING;
    }
}

class UnknownTargetError extends Error {
    /**
     * @param {string} target 
     * @param {string} source
     */
    constructor(target, source) {
        super(`Uknown target ${target} from ${source}`);
        this.name = "UnkownTargetError";
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