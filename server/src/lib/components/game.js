const Application = require('../application');
const Config = require('./config');
const Player = require('./player');
const {UnknownTargetError} = require('./errors');
const {TasksData, TasksList} = require('../types');

/**
 * @typedef {Game} Game
 */
class Game {
  static States = {
    WAITING: 'WAITING',
    PLAYING: 'PLAYING',
    MEETING: 'MEETING',
    EJECTING: 'EJECTING',
    ENDING: 'ENDING'
  };

  static Win = {NONE: 'None', IMPOSTORS: 'IMPOSTORS', CREWMATES: 'CREWMATES'};

  /**
   * @enum
   */
  static Colors = {
    'Cyan': '#00FFFF',
    'Blue': '#0000FF',
    'Red': '#FF0000',
    'LightGreen': '#90EE90',
    'Green': '#7CFC00',
    'Brown': '#A52A2A',
    'Pink': '#FF1493',
    'Purple': '#9400D3',
    'Gold': '#FFD700',
    'Orange': '#FFA500',
    'White': '#FFF5EE'
  };

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
     * @type {Config}
     */
    this.config = new Config(Object.keys(tasksData));

    /**
     * @type {Map<string, Player>}
     */
    this.players = new Map();

    /**
     * @type {Map<string, Player>}
     */
    this._leftPlayers =
        new Map();  // unused for now, idea for reconnect attempt

    /**
     * @type {string} Game.States
     */
    this.state = Game.States.WAITING;

    /**
     * @type {Object.<string, string[]>} map of targeted players and whos has
     *     voted for them
     */
    this._votes = undefined;

    /**
     * @type {string[]} list of player that already has voted during the current
     *     meeting
     */
    this._hasVoted = [];

    this.log('Created room.');
  }

  /**
   * Add a player to the game, players are pointed by their socket id and then
   * process the game
   * @param {string} playerSocketId
   * @param {string} name
   */
  join(playerSocketId, name) {
    if (this.state !== Game.States.WAITING)
      throw new Error(`Joining non-waiting room ${this.id}`);

    if (this.players.length === this.config.maxRoomPlayers)
      throw new Error(`Full room error at room ${this.id}`);

    this.players.set(
        playerSocketId,
        new Player(playerSocketId, name, this.availableColors[0]));

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
      this.log('Changed admin');
      this.admin = this.players.keys().next().value;
    }

    this.log(`Player ${name} [${playerSocketId}] left the room`);
  }

  /**
   * @param {boolean} [watchAlive] if true will return alive flag
   * @return {{id: string, name: string, admin: boolean, alive: boolean |
   *     undefined, color: string}[]}
   */
  playersList(watchAlive) {
    const list = [];

    this.players.forEach(player => list.push({
      id: player.id,
      name: player.name,
      admin: player.id === this.admin,
      alive: watchAlive ? player.alive : undefined,
      color: player.color
    }));

    return list;
  }

  /**
   * @param {string} tasksType
   */
  startGame(tasksType) {
    if (this.players.size < Config.MINIMUM_PLAYER) {
      throw new Error(
          `Can't start game with less than ${Config.MINIMUM_PLAYER} players.`);
    }

    console.log('startGame');

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
      Object.entries(tasksData.crewmates)
          .forEach(
              ([key, value]) => pTasks[key] = {...value, completed: false});

      player.assignRole(Player.Role.CREWMATE, pTasks);

      impostorsTasks[player.id] = {
        ...tasksData.impostors[crewmates],
        target: {name: player.name, id: player.id},
        completed: false
      };
      crewmates--;
    }

    // give impostor roles to other players with impostors tasks
    playersArray.forEach(
        v => v.assignRole(Player.Role.IMPOSTOR, impostorsTasks));

    // CHANGE STATE
    this.state = Game.States.PLAYING;
  }

  /**
   * @param {string} playerSocketId
   */
  kill(playerSocketId) {
    if (!this.players.has(playerSocketId)) throw new Error('Unknown player.');

    this.players.get(playerSocketId).alive = false;
  }

  /**
   * change game state and init all meeting's related vars
   */
  startMeeting() {
    if (this.state === Game.States.MEETING) return;

    this.state = Game.States.MEETING;
    this._votes = {'skip': []};
    this._hasVoted = [];

    this.players.forEach((v) => this._votes[v.id] = []);
  }

  /**
   * add a vote for the target (by the source)
   * if source has already voted it'll just ignore the call
   * @param {string} source source player id
   * @param {string} target target player id
   * @throws {UnknownTargetError} if the target can't be found
   */
  voteFor(source, target) {
    if (this.state !== Game.States.MEETING || this._hasVoted.include(source))
      return;

    this._hasVoted.push(source);

    if (this._votes[target])
      this._votes[target].push(source);
    else
      throw new UnknownTargetError(target, source);
  }

  /**
   * reset all meeting related var and return the result of votes
   */
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

        Object.values(player.tasks).forEach((value) => {
          if (!value.completed) tasksCompleted = false;
        });
      } else {
        impostorsAlive++;
      }
    });

    if (impostorsAlive >= crewmatesAlive) {
      this.log('Impostors win.');
      return Game.Win.IMPOSTORS;
    } else if (impostorsAlive === 0 || tasksCompleted) {
      this.log('Crewmate win');
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

    this.players.forEach(value => {
      if (value.role === Player.Role.IMPOSTOR) result.push({name: value.name})
    });

    return result;
  }

  /**
   * @return {Player[]} List of crewmates players
   * @readonly
   */
  get crewmates() {
    const result = [];

    this.players.forEach(value => {
      if (value.role === Player.Role.CREWMATE) result.push({name: value.name})
    });

    return result;
  }

  get availableColors() {
    const result = Object.values(Game.Colors);

    this.players.forEach((p) => {result.splice(result.indexOf(p.color), 1)});

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
   * Clear all vars that change game's data, the room will still be usable
   */
  reset() {
    this.players.clear();
    this._leftPlayers.clear();

    this.state = Game.States.WAITING;
  }
};

module.exports = Game;