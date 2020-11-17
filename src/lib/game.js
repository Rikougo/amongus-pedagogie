// STATE OF THE GAME
const WAITING = 0;
const PLAYING = 1;
const MEETING = 2;
const ENDED   = 3;

// MAX PLAYER LIMIT (to change)
const LIMIT = 6;
const MINIMUM = 4;

class Game {
    constructor(roomID) {
        this.id = roomID;

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

        this.process();
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

        this.process();
    }

    playersList() {
        let list = [];

        this.players.forEach(player => list.push({
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

        // CHANGE STATE
        this.state = PLAYING;

        // UPDATE GAME
        this.process();
    }

    /**
     * @return {boolean} Says if game has no player inside
     */
    isEmpty(){
        return this.players.size === 0;
    }

    /**
     * Most of the work is done here, each modification method
     * must call process to commit all the changes it implies
     * (e.g a player leave ? must see if it has enough players left)
     */
    process() {
        if (this.state === WAITING) {

        }
    }

    /**
     * Dev purpose to help track what's going on
     * @param {string} message 
     */
    log(message) {
        console.log(`[${this.id} ROOM] ${message}`);
    }

    reset() {

    }
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.playedCodes = [];
    }

    /**
     * give a role for the player
     * @param {number} role 0 for crewmate, 1 for impostor
     */
    assignRole(role) {
        this.role = role;
    }
}

module.exports = {
    player: (name) => new Player(name),
    game: (id) => new Game(id),
    WAITING: WAITING,
    PLAYING: PLAYING,
    MEETING: MEETING,
    ENDED: ENDED,
    LIMIT: LIMIT
}