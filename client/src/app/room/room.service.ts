import { Injectable } from '@angular/core';
import { io, Socket } from "socket.io-client";
import { Observable } from 'rxjs';
import { Player } from '../class/game/player.model';
import { environment } from 'src/environments/environment';
import { Task } from '../class/game/task.model';
import { PartialPlayer } from '../class/game/partialplayer.model';
import { ErrorBase } from '../class/errorbase.model';
import { Config } from '../class/game/config.model';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

    socket: Socket;

    constructor() { }

    connect() {
        this.socket = io(environment.API_ENDPOINT, {});
    }

    joinRoom(roomdId: string, name: string) {
        this.socket.emit("joinRoom", {roomId: roomdId, name: name});
    }

    get config() : Observable<Config> {
        return new Observable((observer) => {
            this.socket.on("successJoin", (payload: {config: Config}) => {
                observer.next(payload.config);
            });
        });
    }

    get gameState() : Observable<string> {
        return new Observable((observer) => {
            const callback = (payload: {gamestate: string}) => {
                observer.next(payload.gamestate);
            }

            this.socket.on("successJoin", callback);
            this.socket.on("gameStart", callback);
            this.socket.on("startMeeting", callback);
            this.socket.on("ejecting", callback);
            this.socket.on("endMeeting", callback);
        });
    }

    get self() : Observable<Player | {alive: boolean}> {
        return new Observable((observer) => {
            this.socket.on("successJoin", (payload: {player: {name: string, id: string, admin: boolean}}) => {
                observer.next({...payload.player, alive: true});
            });

            this.socket.on("killed", (payload: {killer: string}) => {
                observer.next({alive: false});
            });
        });
    }

    get tasks() : Observable<{[name: string] : Task}> {
        return new Observable((observer) => {
            this.socket.on("gameStart", (payload: { tasks : {[name: string] : { content?: string, completed: boolean}}}) => {
                let res : any = {};

                Object.entries(payload.tasks).forEach(([key, value]) => {res[key] = {...value, failed: false}});

                observer.next(res as {[name: string] : { target?: {name: string, id: string}, content?: string, completed: boolean, failed: false}});
            });
        });
    }

    get updateTasks() : Observable<{taskId: string, success: boolean}> {
        return new Observable((observer) => {
            this.socket.on("successTask", (payload: {taskID: string}) => {
                observer.next({taskId: payload.taskID, success: true});
            });

            this.socket.on("failedTask", (payload: {taskID: string}) => {
                observer.next({taskId: payload.taskID, success: false});
            });
        });
    }

    get players() : Observable<Player[]> {
        // return this.socket.fromEvent<{players: Player[]}>("updatePlayers");
        return new Observable((observer) => {
            const callback = (payload: {players: Player[]}) => {
                let players : Player[] = [];
    
                payload.players.forEach((player) => {
                    if (player.alive !== undefined)
                        players.push(player);
                    else
                        players.push({...player, alive: true});
                });
    
                observer.next(players);
            }

            this.socket.on("updatePlayers", callback);
            this.socket.on("successJoin", callback);
            this.socket.on("startMeeting", callback);
        })
    }

    get codesFeed() : Observable<{player: PartialPlayer, at: Date}> {
        return new Observable((observer) => {
            this.socket.on("feedTask", (payload: {player: {name: string, id: string}, at: Date}) => { observer.next({player: payload.player, at: payload.at}) });
        });
    }

    get error() : Observable<ErrorBase> {
        return new Observable((observer) => {
            this.socket.on("error", (payload: {errType: string, message: string}) => {
                observer.next(payload);
            });
        });
    }

    startGame() {
        this.socket.emit("startGame", {tasksType: "test"});
    }

    sendTaskCode(taskId: string, code: string) {
        this.socket.emit("taskCode", {taskID: taskId, code: code});
    }

    sendBuzz() {
        this.socket.emit("meetingButton");
    }

    reset() {
        this.socket.disconnect();
    }
}
