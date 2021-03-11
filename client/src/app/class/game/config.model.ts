export class Config {
    static MINIMUM_PLAYER = 4;
    static MAXIMUM_PLAYERS = 10;

    maxRoomPlayers: number;
    impostorsAmount: number;
    taskType: string;

    meetingCodesRequired: number;
    meetingTime: number;
    ejectingTime: number;

    sMinimumPlayers: number;
    sMaximumPlayers: number;
    sTasksTypes: string[];
    sMeetingTimeRange: {min: number, max: number};
    sCodeRequiredRange: {min: number, max: number};
}
