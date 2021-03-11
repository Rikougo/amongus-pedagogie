/**
 * @typedef {Config} Config
 */
class Config {
  static MINIMUM_PLAYER = 4;
  static MAXIMUM_PLAYERS = 10;

  static MEETING_TIME_RANGE = {min: 15, max: 150};

  static REQUIRED_CODE_RANGE = {min: 5, max: 15};

  /**
   * @type {number}
   */
  maxRoomPlayers;

  /**
   * @type {number}
   */
  impostorsAmount;

  /**
   * @type {string} task type see tasks json
   */
  taskType;


  /**
   * @type {number} unit
   */
  meetingCodesRequired;

  /**
   * @type {number} seconds
   */
  meetingTime;

  /**
   * @type {number} seconds
   */
  ejectingTime;

  /**
   *
   * @param {string[]} tasksTypes
   */
  constructor(tasksTypes) {
    /**
     * server static informations
     */
    this.sMinimumPlayers = Config.MINIMUM_PLAYER;
    this.sMaximumPlayers = Config.MAXIMUM_PLAYERS;
    this.sTasksTypes = tasksTypes;
    this.sMeetingTimeRange = Config.MEETING_TIME_RANGE;
    this.sCodeRequiredRange = Config.REQUIRED_CODE_RANGE;

    /**
     * contextual configuration
     */
    this.impostorsAmount = 1;
    this.maxRoomPlayers = Config.MAXIMUM_PLAYERS;
    this.taskType = this.sTasksTypes[0];
    this.meetingCodesRequired = 5;
    this.meetingTime = 5;
    this.ejectingTime = 2;
  }
}

module.exports = Config;