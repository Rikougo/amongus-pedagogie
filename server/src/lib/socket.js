/**
 * @author Sakeiru 
 */
const { Socket } = require("socket.io");

const { Task } = require("./types");
const { Game, Player } = require("./game");

class SocketHandler {
    static ServerEvents = {
        JOIN_ROOM: "joinRoom",
        START_GAME: "startGame",
        TASK_CODE: "taskCode",
        DISCONNECT: "disconnect",
        MEETING: "meetingButton"
    }

    static ClientEvents = {
        ERROR: "error",
        UPDATE_PLAYERS: "updatePlayers",
        SUCCESS_JOIN: "successJoin",
        FEED_TASK: "feedTask",
        SUCCESS_TASK: "successTask",
        FAILED_TASK: "failedTask",
        KILLED: "killed",
        START_MEETING: "startMeeting",
        PLAYER_VOTED: "playerVoted",
        EJECTING: "ejecting",
        END_MEETING: "endMeeting",
        GAME_START: "gameStart"
    }

    constructor(app) {
        /**
         * @type {import('./application')}
         */
        this.app = app;
    }

    /**
     * 
     * @param {Socket} socket 
     */
    handler(socket) {
       socket.on(SocketHandler.ServerEvents.JOIN_ROOM,  (payload) => this.joinRoom(socket, payload));
       socket.on(SocketHandler.ServerEvents.START_GAME, (payload) => this.startGame(socket, payload));
       socket.on(SocketHandler.ServerEvents.TASK_CODE,  (payload) => this.taskCode(socket, payload));
       socket.on(SocketHandler.ServerEvents.MEETING,    (payload) => this.meetingButton(socket, payload));
       socket.on(SocketHandler.ServerEvents.DISCONNECT, (payload) => this.disconnect(socket, payload));
    }

    /**
     * When client socket emit that it joins a room it will test if the asked room exist
     * if it exists it will attempt to join it.
     * 
     * ! Joining a room can fail, it will then emit an error signal with the error message
     * @param {Socket} socket 
     * @param {{roomID: string, name: string | undefined}} payload 
     */
    joinRoom(socket, payload = undefined) {
        
        let { roomId, name } = payload;
        this.app.logger.info(`${socket.id} has joined the room ${roomId}`);

        if (!roomId) {
            socket.emit(
                SocketHandler.ClientEvents.ERROR, 
                { 
                    errType: "wrongRoomIdError",
                    message: "Please specify a correct room id."
                });
            return;
        }

        let room = this.app.rooms[roomId];

        if (!room) {
            socket.emit(SocketHandler.ClientEvents.ERROR, "Connecting to inexistant room.");
            return;
        }

        try {
            room.join(socket.id, name || "Bob");
            this.app.playersRoom[socket.id] = roomId;
        } catch (err) {
            socket.emit(SocketHandler.ClientEvents.ERROR, err.message);
            return;
        }

        socket.join(roomId);

        let playersList = room.playersList();

        socket.emit(SocketHandler.ClientEvents.SUCCESS_JOIN, {
            gamestate: room.state,
            players: playersList,
            player: {id: socket.id, name: name, admin: room.admin === socket.id},
            config: room.config
        });

        socket.to(roomId).emit(SocketHandler.ClientEvents.UPDATE_PLAYERS, {
            players: playersList
        });
    }

    /**
     * @param {Socket} socket 
     * @param {{tasksType: string}} payload
     */
    startGame(socket, payload = undefined) {
        const roomID = this.app.playersRoom[socket.id];
        const room = this.app.rooms[roomID];

        const { tasksType } = payload;

        if (room.admin !== socket.id) {
            socket.emit(SocketHandler.ClientEvents.ERROR, "You're not the room's admin, you can't start the game !");
            return;
        }

        try {
            room.startGame(tasksType);

            // signal to each player individually with role
            room.players.forEach((player, socketID) => {
                /**
                 * @type {Object.<string, {content?: string | undefined, completed: boolean}>}
                 */
                const tasks = {};

                Object.entries(player.tasks).forEach(([key, value]) => tasks[key] = value);

                this.app.io.of("/").sockets.get(socketID).emit(SocketHandler.ClientEvents.GAME_START, {
                    gamestate: room.state,
                    role: player.role,
                    tasks: tasks,
                    config: room.config
                });
            });
        } catch (err) {
            socket.emit("error", err.message);
            return;
        }
    }

    /**
     * @param {Socket} socket 
     * @param {{taskID: string, code: string}} payload 
     */
    taskCode(socket, payload = undefined) {
        // this.app.logger.debug("Code received.");

        const roomID = this.app.playersRoom[socket.id];
        const room = this.app.rooms[roomID];
        const player = room.players.get(socket.id);

        const { taskID, code } = payload;
        const task = player.tasks[taskID];

        if (!task) {
            socket.emit(
                SocketHandler.ClientEvents.ERROR, 
                {
                    errType: "unkownTaskError",
                    message: "Sending code to a non-existing task."
                }
            );
            return;
        }

        this.app.io.to(roomID).emit(
            SocketHandler.ClientEvents.FEED_TASK, 
            {
                player: {
                    name: player.name, 
                    id: player.id
                },
                at: new Date()
            }
        );

        if (player.role === Player.Role.CREWMATE) {
            if (code === task.code) {
                task.completed = true;

                socket.emit(SocketHandler.ClientEvents.SUCCESS_TASK, {taskID: taskID});
            } else {
                socket.emit(SocketHandler.ClientEvents.FAILED_TASK, {taskID: taskID});
            }
        } else {
            if (code === task.code) {
                const target = room.players.get(taskID);
                
                if (!target) {
                    this.app.logger.error(`Player not found in impostor task id. ${taskID}`);
                    return;
                }

                target.alive = false;

                this.app.io.of("/").sockets.get(target.id).emit(SocketHandler.ClientEvents.KILLED, {killer: {name: player.name, id: player.id}});

                socket.emit(SocketHandler.ClientEvents.SUCCESS_TASK, {taskID: taskID});
            } else {
                socket.emit(SocketHandler.ClientEvents.FAILED_TASK, {taskID: taskID});
            }
        }

        this._step(roomID, room);
    }

    /**
     * start meeting phase and add a timeout on a callback to end meeting phase based on
     * the room's meeting time. End of meeting will result on ejecting phase for 5 seconds
     * @param {Socket} socket 
     * @param {undefined} payload 
     */
    meetingButton(socket, payload = undefined) {
        const roomID = this.app.playersRoom[socket.id];
        const room = this.app.rooms[roomID];

        room.startMeeting();

        this.app.io.to(roomID).emit(SocketHandler.ClientEvents.START_MEETING, {gamestate: room.state, players: room.playersList()});
        
        setTimeout(() => {
            const votes = room.endMeeting();

            this.app.io.to(roomID).emit(SocketHandler.ClientEvents.EJECTING, {gamestate: Game.States.EJECTING, votes: votes});

            setTimeout(() => {
                this.app.io.to(roomID).emit(SocketHandler.ClientEvents.END_MEETING, {gamestate: room.state});
            }, room.config.ejectingTime * 1000);
        }, room.config.meetingTime * 1000 );
    }

    /**
     * @param {Socket} socket 
     * @param {{target: string}} payload 
     */
    voteFor(socket, payload) {
        const roomID = this.app.playersRoom[socket.id];
        const room = this.app.rooms[roomID];
        const player = room.players.get(socket.id);

        try {
            room.vote(socket.id, payload.target);

            this.app.io.to(roomID).emit(SocketHandler.ClientEvents.PLAYER_VOTED, {target: { name: player.name, id: player.id }});
        } catch (e) {
            socket.emit(SocketHandler.ClientEvents.ERROR, {errType: e.name, message: e.message});
        }
    }

    /**
     * @param {Socket} socket 
     * @param {undefined} payload 
     */
    disconnect(socket, payload = undefined) {
        const roomID = this.app.playersRoom[socket.id];

        if (!roomID) {
            socket.emit(SocketHandler.ClientEvents.ERROR, {errType: "UnknownClientError", message: "Unknown client disconnecting."});
            return;
        }

        const room = this.app.rooms[roomID];

        if (!room) {
            this.app.logger.warn("Trying to remove from a non-existing room.");
            return;
        }

        room.leave(socket.id);

        if (room.empty) { 
            room.reset() 
        } else {
            socket.to(roomID).emit(SocketHandler.ClientEvents.UPDATE_PLAYERS, {
                players: room.playersList()
            });
        }

        this._step(roomID, room);
    }

    /**
     * This method is called (and MUST BE CALLED) in each method that may change the win state of the game such as
     * receiving task code or getting a player disconnected.
     * @param {string} roomID 
     * @param {Game} room 
     */
    _step(roomID, room) {
        const winState = room.checkWinState();

        if (winState !== Game.Win.NONE) {
            this.app.io.to(roomID).emit(SocketHandler.ClientEvents.FEED_TASK, {
                impostors: room.impostors, 
                crewmates: room.crewmates, 
                winnerTeam: winState
            });
        }
    }
}

module.exports = {
    SocketHandler: SocketHandler
}