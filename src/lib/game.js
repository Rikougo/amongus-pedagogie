// STATE OF THE GAME
const WAITING = "WAITING";
const PLAYING = "PLAYING";
const MEETING = "MEETING";
const ENDED   = "ENDING";

// MAX PLAYER LIMIT (to change)
const LIMIT = 6;
const MINIMUM = 4;

class Game {
    
    /**
     * 
     * @param {string} roomID 
     * @param {Map} tasksData 
     */
    constructor(roomID, tasksData) {
        this.id = roomID;
        this.tasksData = tasksData;

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

        console.log(crewmates, impostors);

        let repartition = generateRandomRoleSet(crewmates, impostors);
        let playersArray = Array.from(this.players.values());

        let impostorsTasks = {};

        // distribute crewmate roles
        while (crewmates > 0) {
            let rndIndex = Math.floor(Math.random() * playersArray.length);
            console.log(rndIndex);
            let player = playersArray[rndIndex];
            playersArray.splice(rndIndex, 1);

            console.log(playersArray);
            // console.log(this.tasksData["test"]["crewmates"]);

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
     */
    isEmpty() {
        return this.players.size === 0;
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
    assignRole(role, tasks) {
        this.role = role;

        this.tasks = tasks;
    }
}

/**
 * ! TOCHANGE
 * @param {number} crewmates 
 * @param {number} impostors 
 * 
 * @return {Array} shuffled array of roles 
 */
function generateRandomRoleSet(crewmates, impostors) {
    let result = [];

    while(crewmates > 0 || impostors > 0) {
        if (crewmates > 0 && impostors > 0) {
            if (Math.floor(Math.random() * 100) > 70) {
                result.push("impostor");
                impostors--;
            } else {
                result.push("crewmate");
                crewmates--;
            }
        } else if (crewmates > 0) {
            result.push("crewmate");
            crewmates--;
        } else {
            result.push("impostor");
            impostors--;
        }
    }

    return result;
}

module.exports = {
    player: (name) => new Player(name),
    game: (id, tasksData) => new Game(id, tasksData),
    WAITING: WAITING,
    PLAYING: PLAYING,
    MEETING: MEETING,
    ENDED: ENDED,
    LIMIT: LIMIT
}