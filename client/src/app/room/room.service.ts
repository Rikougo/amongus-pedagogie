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
        this.socket = io(environment.SOCKET_ENDPOINT, {});
    }

    joinRoom(roomdId: string, name: string) {
        this.socket.emit("joinRoom", {roomId: roomdId, name: name});
    }

    getGameState() : Observable<string> {
        return new Observable((observer) => {
            this.socket.on("successJoin", (payload: {gamestate: string}) => {
                observer.next(payload.gamestate);
            });

            this.socket.on("gameStart", (payload: {gamestate: string}) => {
                observer.next(payload.gamestate);
            });
        });
    }

    getSelf() : Observable<any> {
        return new Observable((observer) => {
            this.socket.on("successJoin", (payload: {player: {name: string, id: string}}) => {
                observer.next(payload.player);
            });
        });
    }

    getTasks() : Observable<{[name: string] : { content : string | undefined, completed: boolean}}> {
        return new Observable((observer) => {
            this.socket.on("gameStart", (payload: { tasks : {[name: string] : { content : string | undefined, completed: boolean}}}) => {
                observer.next(payload.tasks);
            });
        });
    }

    getPlayers() : Observable<Player[]> {
        // return this.socket.fromEvent<{players: Player[]}>("updatePlayers");
        return new Observable((observer) => {
            this.socket.on("updatePlayers", (payload: {players: Player[]}) => {
                let players : Player[] = [];

                payload.players.forEach((player) => {
                    if (player.alive !== undefined)
                        players.push(player);
                    else
                        players.push({...player, alive: true});
                });

                observer.next(players);
            });

            this.socket.on("successJoin", (payload: {players: Player[]}) => {
                let players : Player[] = [];

                payload.players.forEach((player) => {
                    if (player.alive !== undefined)
                        players.push(player);
                    else
                        players.push({...player, alive: true});
                });

                observer.next(players);
            });
        })
    }

    getCodesFeed() : Observable<{player: string, at: Date}> {
        return new Observable((observer) => {
            this.socket.on("feedTask", (payload: {player: string, at: Date}) => { observer.next(payload) });
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
}
