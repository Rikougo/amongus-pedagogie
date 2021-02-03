import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Player } from '../class/player.model';

import { switchMap } from 'rxjs/operators';
import { RoomService } from './room.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {

    self: Player | undefined;
    playersList : Player[] = [];

    gameState: string = "CONNECTING";
    tasks: {[name: string] : { content : string | undefined, completed: boolean, failed: boolean}} = {};
    tasksInput: Map<string, string> = new Map();

    codesFeed: {player: string, at: Date}[] = [];
    minCode : number = 5;

    roomId: string;
    name: string;
    infoFeed: {at: Date, msg: string, level: string}[] = [];

    private subscriptions : Subscription[] = [];

    constructor(
        private router: ActivatedRoute,
        private roomService: RoomService
    )
    {
        this.roomId = this.router.snapshot.paramMap.get("roomId") ?? "";
        this.name = this.router.snapshot.paramMap.get("name") ?? "";
    }

    /**
     * Manage all subscriptions to room service observables and then join room
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.roomService.getGameState().subscribe((gamestate) => {
                console.log(`New state ${gamestate}`);
                this.gameState = gamestate;
            })
        );

        this.subscriptions.push(
            this.roomService.getSelf().subscribe((player) => {
                if (!this.self) this.self = new Player();

                Object.assign(this.self, player);
            })
        );

        this.subscriptions.push(
            this.roomService.getPlayers().subscribe((players) => {
                this.playersList = players;
            })
        );

        this.subscriptions.push(
            this.roomService.getCodesFeed().subscribe((task) => {
                this.codesFeed.push(task);
            })
        );

        this.subscriptions.push(
            this.roomService.getTasks().subscribe((tasks) => {
                this.tasks = tasks;
            })
        );

        this.subscriptions.push(
            this.roomService.updateTasks().subscribe((update) => {
                if (update.success)
                    this.tasks[update.taskId].completed = true;
                else
                    this.tasks[update.taskId].failed = true;
            })
        );

        this.subscriptions.push(
            this.roomService.getError().subscribe((errorMsg: string) => {
                this.infoFeed.push({at: new Date(), msg: errorMsg, level: "error"});
            })
        );

        this.roomService.joinRoom(this.roomId, this.name);
    }

    startGame() : void {
        this.roomService.startGame();
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
}
