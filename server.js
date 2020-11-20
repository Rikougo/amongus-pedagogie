const fs = require("fs");
const express = require("express");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const game = require("./src/lib/game");

function updateTasksData() {
    const TASKS_FILE = "./src/cache/tasks.json";

    return JSON.parse(fs.readFileSync(TASKS_FILE));
}

// EXPRESS STUFF

app.set("view engine", "pug")
app.set("views", __dirname + "/src/views/");

app.use("/", express.static( __dirname +  "/src/public/"));
app.use("/", require("./src/routes/mainRoute"));
app.use("/api", require("./src/routes/api"));

// SOCKET STUFF
// game server logic here

const playersRoom = new Map();
const rooms = new Map();

let tasksData = updateTasksData();

io.on("connection", (socket) => {
    /**
     * When client socket emit that it joins a room it will test if the asked room exist, two cases :
     *  - it doesn't exist and then it will create one
     *  - it exists and then it will attempt to join it
     * 
     * ! Care joining a room can fail, it will then emit an error signal with the error message 
     */
    socket.on("joinRoom", (payload) => {
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
        } else { // create room if doesn't exist
            room = game.game(roomID, tasksData);
            rooms.set(roomID, room);
            playersRoom.set(socket.id, roomID);
            
            room.join(socket.id, name);
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

    });

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
            room.players.forEach((v, k) => {
                console.log(v);

                io.of("/").sockets.get(k).emit("gameStart", {
                    gamestate: room.state,
                    role: v.role,
                    tasks: v.tasks
                })
            });
        } catch (err) {
            socket.emit("error", err.message);
            return;
        }
    });

    socket.on("crewmateTask", (payload) => {
        let roomID = playersRoom.get(socket.id);
        let room = rooms.get(roomID);

        if (room.players.get(socket.id).role !== "crewmate") {
            socket.emit("error", "You're not a crewmate, sir. Tryin' to cheat ?");
        }
    });

    socket.on("impostorTask", (payload) => {
        let roomID = playersRoom.get(socket.id);
        let room = rooms.get(roomID);

        if (room.players.get(socket.id).role !== "impostor") {
            socket.emit("error", "You're not an impostor, sir. Tryin' to cheat ?");
        }
    });

    socket.on("disconnect", () => {
        let roomID = playersRoom.get(socket.id);

        // leave room
        if (rooms.has(roomID)) {
            let room = rooms.get(roomID);

            room.leave(socket.id);

            if (room.isEmpty()) {
                room.reset();
            } else {
                socket.to(roomID).emit("updatePlayers", {
                    players: room.playersList()
                });
            }
        } else { // strange behavior here should not be able for a player to not have a room attached to
            console.warn("Trying to remove from a non-existing room.");
        }
    });
});

http.listen(3000, () => {
    console.log("listening on *:3000");
});