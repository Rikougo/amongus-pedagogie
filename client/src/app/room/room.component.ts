import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Player } from '../class/game/player.model';

import { RoomService } from './room.service';
import { Subscription } from 'rxjs';
import { Task } from '../class/game/task.model';
import { PartialPlayer } from '../class/game/partialplayer.model';
import { ErrorBase } from '../class/errorbase.model';
import { Config } from '../class/game/config.model';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {
    roomId: string;
    name: string;
    config: Config;

    gameState: string = "CONNECTING";
    self: Player | undefined;
    playersList : Player[] = [];

    tasks: {[name: string] : Task} = {};
    tasksInput: Map<string, string> = new Map();
    codesFeed: {player: PartialPlayer, at: Date}[] = [];

    errorsFeed: ErrorBase[] = [];

    private subscriptions : Subscription[] = [];
    
    meetingRemaining : number;
    private _meetingStart: number | undefined;
    private _meetingTimer : NodeJS.Timeout;

    constructor(
        private router: ActivatedRoute,
        private roomService: RoomService
    )
    {
        this.roomId = this.router.snapshot.paramMap.get("roomId") ?? "";
        this.name = this.router.snapshot.paramMap.get("name") ?? "WhyDontYouHaveAName";
    }

    /**
     * Manage all subscriptions to room service observables and then join room
     */
    ngOnInit(): void {
        this.roomService.connect();

        this.subscriptions = [
            this.roomService.config.subscribe((config) => {
                this.config = config;
            }),
            this.roomService.gameState.subscribe((gamestate) => {
                this.gameState = gamestate;

                if (this.gameState === 'MEETING') {
                    this._meetingStart = Date.now();
                    this._meetingTimer = setInterval(
                        () => this.meetingRemaining = this._meetingRemaining(),
                        500
                    );
                } else {
                    this._meetingStart = undefined;
                    clearInterval(this._meetingTimer);
                }
            }),
            this.roomService.self.subscribe((player) => {
                if (!this.self) this.self = new Player();

                Object.assign(this.self, player);
            }),
            this.roomService.players.subscribe((players) => {
                this.playersList = players;
            }),
            this.roomService.codesFeed.subscribe((task) => {
                this.codesFeed.push(task);
            }),
            this.roomService.tasks.subscribe((tasks) => {
                this.tasks = tasks;
            }),
            this.roomService.updateTasks.subscribe((update) => {
                if (update.success)
                    this.tasks[update.taskId].completed = true;
                else
                    this.tasks[update.taskId].failed = true;
            }),
            this.roomService.error.subscribe((err: ErrorBase) => {
                this.errorsFeed.push(err);
                console.log(err);
            })
        ]

        this.roomService.joinRoom(this.roomId, this.name);
    }

    startGame() : void {
        this.roomService.startGame(this.config.taskType);
    }

    /**
     * Send code to room service and then clear input.
     * @param taskId 
     */
    sendCode(taskId: string) : void {
        if (this.tasksInput.get(taskId)) {
            this.roomService.sendTaskCode(taskId, this.tasksInput.get(taskId)!)
    
            this.tasksInput.set(taskId, "");
        }
    }

    /**
     * 
     */
    updateConfig() {
        console.log(this.config);
        this.roomService.sendNewConfig(this.config);
    }

    pressBuzz() : void {
        this.roomService.sendBuzz();
    }

    /**
     * Take care of clearing all subscriptions and closing socket connection
     */
    ngOnDestroy() : void {
        this.subscriptions.forEach(v => v.unsubscribe());
        this.roomService.reset();
    }

    get enoughPlayers() : boolean { return this.playersList.length >= Config.MINIMUM_PLAYER; }

    get canStart() : boolean { return (this.self?.admin!) && this.enoughPlayers; }

    get canBuzz() : boolean { return this.config! && this.codesFeed.length < this.config.meetingCodesRequired || this.gameState !== 'PLAYING' }

    _meetingRemaining() : number { return this._meetingStart ? Math.ceil(((this._meetingStart + this.config.meetingTime * 1000) - Date.now()) / 1000) : 0}
}
