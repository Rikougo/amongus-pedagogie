// STATE OF THE GAME
const WAITING = 0;
const PLAYING = 1;
const MEETING = 2;
const ENDED   = 3;

// MAX PLAYER LIMIT (to change)
const LIMIT = 6;

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
        
        this.players[playerSocketId] = new Player(playerSocketId, name);

        this.process();
    }

    /**
     * Delete the player object by socket id and then process the game
     * @param {string} playerSocketId 
     */
    leave(playerSocketId) {
        this.players.delete(playerSocketId);

        this.process();
    }

    startGame() {
        this.state = PLAYING;
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
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.playedCodes = [];
    }
}

module.exports = {
    player: (name) => new Player(name),
    game: () => new Game(),
    WAITING: WAITING,
    PLAYING: PLAYING,
    MEETING: MEETING,
    ENDED: ENDED,
    LIMIT: LIMIT
}