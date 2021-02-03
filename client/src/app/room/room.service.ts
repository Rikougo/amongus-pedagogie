import { Injectable } from '@angular/core';
import { io, Socket } from "socket.io-client";
import { Observable } from 'rxjs';
import { Player } from '../class/player.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

    socket: Socket;

    constructor() {
        this.socket = io(environment.API_ENDPOINT, {});
    }

    joinRoom(roomdId: string, name: string) {
        this.socket.emit("joinRoom", {roomId: roomdId, name: name});
    }

    getGameState() : Observable<string> {
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

    getSelf() : Observable<any> {
        return new Observable((observer) => {
            this.socket.on("successJoin", (payload: {player: {name: string, id: string, admin: boolean}}) => {
                observer.next({...payload.player, alive: true});
            });

            this.socket.on("killed", (payload: {killer: string}) => {
                observer.next({alive: false});
            });
        });
    }

    getTasks() : Observable<{[name: string] : { content : string | undefined, completed: boolean, failed: false}}> {
        return new Observable((observer) => {
            this.socket.on("gameStart", (payload: { tasks : {[name: string] : { content : string | undefined, completed: boolean}}}) => {
                let res : any = {};

                Object.entries(payload.tasks).forEach(([key, value]) => {res[key] = {...value, failed: false}});

                observer.next(res as {[name: string] : { content : string | undefined, completed: boolean, failed: false}});
            });
        });
    }

    updateTasks() : Observable<{taskId: string, success: boolean}> {
        return new Observable((observer) => {
            this.socket.on("successTask", (payload: {taskID: string}) => {
                observer.next({taskId: payload.taskID, success: true});
            });

            this.socket.on("failedTask", (payload: {taskID: string}) => {
                observer.next({taskId: payload.taskID, success: false});
            });
        });
    }

    getPlayers() : Observable<Player[]> {
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

    getCodesFeed() : Observable<{player: string, at: Date}> {
        return new Observable((observer) => {
            this.socket.on("feedTask", (payload: {playerName: string, at: Date}) => { observer.next({player: payload.playerName, at: payload.at}) });
        });
    }

    getError() : Observable<string> {
        return new Observable((observer) => {
            this.socket.on("error", (payload: string) => {
                observer.next(payload)
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
