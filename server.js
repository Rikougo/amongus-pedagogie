/**
 * @author Sakeiru
 */

const fs = require("fs");
const express = require("express");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const types = require("./src/lib/types");
const { Socket } = require("socket.io");

app.logger = require("simple-node-logger").createSimpleLogger();
app.logger.setLevel('all');

/**
 * @return {types.TasksData}
 */
function updateTasksData() {
    const TASKS_FILE = "./src/cache/tasks.json";

    return JSON.parse(fs.readFileSync(TASKS_FILE));
}

/**
 * @type {Map<string, string} <socketID, roomID>
 */
const playersRoom = new Map();

/**
 * @type {Map<string, import('./src/lib/game.js').Game>}
 */
const rooms = new Map();

let tasksData = updateTasksData();

// bind game data to app
app.rooms = rooms;
app.playersRoom = playersRoom;
app.tasksData = tasksData;

// EXPRESS STUFF

app.set("view engine", "pug")
app.set("views", __dirname + "/src/views/");

app.use("/", express.static( __dirname +  "/src/public/"));

require("./src/routes/mainRoute").apply("", app);
require("./src/routes/api").apply("/api", app);

/**
 * @param {Socket} socket
 */
const socketHandler = (socket) => {
    /**
     * When client socket emit that it joins a room it will test if the asked room exist, two cases :
     *  - it doesn't exist and then it will create one
     *  - it exists and then it will attempt to join it
     * 
     * ! Care joining a room can fail, it will then emit an error signal with the error message
     * @param {{roomID: string, name: string | undefined}} payload
     */
    const joinRoomHandler = (payload) => {
        let roomID = payload.roomID;
        let name = payload.name || "Bob";

        let room;

        // room exists
        if (rooms.has(roomID)) {
            try {
                room = rooms.get(roomID);

                room.join(socket.id, name);
                playersRoom.set(socket.id, roomID);
            } catch (err) {
                socket.emit("error", err.message);

                return;
            }
        } else {
            socket.emit("error", {
                message: "Connecting to inexistant room."
            });

            return;
        }

        socket.join(roomID);
        
        let playersList = room.playersList();

        socket.emit("successJoin", {
            gamestate: room.state,
            players: playersList
        });

        socket.to(roomID).emit("updatePlayers", {
            players: playersList
        });

    };
    socket.on("joinRoom", joinRoomHandler);

    socket.on("startGame", () => {
        let roomID = playersRoom.get(socket.id);
        let room = rooms.get(roomID);

        if (room.admin !== socket.id) {
            socket.emit("error", "You're not the room's admin, you can't start the game !");
            return;
        }

        try {
            room.startGame();

            // signal to each player individually with role
            room.players.forEach((player, socketID) => {
                /**
                 * @type {Object.<string, {content?: string | undefined}>}
                 */
                let tasks = {};

                for (let k in player.tasks) {
                    let v = player.tasks[k];

                    tasks[k] = {content: v.content}
                }

                io.of("/").sockets.get(socketID).emit("gameStart", {
                    gamestate: room.state,
                    role: player.role,
                    tasks: tasks
                });
            });
        } catch (err) {
            socket.emit("error", err.message);
            return;
        }
    });

    /**
     * 
     * @param {{taskID: string, code: string}} payload 
     */
    const taskHandler = (payload) => {
        let roomID = playersRoom.get(socket.id);
        let room = rooms.get(roomID);
        let player = room.players.get(socket.id);

        if (!(payload.taskID in player.tasks)) {
            socket.emit("error", "Sending code to a non-existant task... strange ?");
            return;
        }
    };
    socket.on("task", taskHandler);

    socket.on("disconnect", () => {
        let roomID = playersRoom.get(socket.id);

        // leave room
        if (rooms.has(roomID)) {
            let room = rooms.get(roomID);

            room.leave(socket.id);

            if (room.empty) {
                room.reset();
            } else {
                socket.to(roomID).emit("updatePlayers", {
                    players: room.playersList()
                });
            }
        } else { // strange behavior here should not be able for a player to not have a room attached to
            app.logger.warn("Trying to remove from a non-existing room.");
        }
    });
};

io.on("connection", socketHandler);

http.listen(3000, () => {
    app.logger.info("listening on *:3000");
});