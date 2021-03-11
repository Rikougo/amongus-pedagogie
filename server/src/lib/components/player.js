const {TasksData, TasksList} = require('../types');

/**
 * @typedef {Player} Player
 */
class Player {
  static Role = {CREWMATE: 'crewmate', IMPOSTOR: 'impostor'}

  constructor(id, name, color) {
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

    /**
     * @type {string}
     */
    this.color = color;
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

module.exports = Player;