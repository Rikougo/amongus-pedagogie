const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const game = require("./src/lib/game");

app.set("view engine", "pug")
app.set("views", __dirname + "/src/views/");

app.use("/", express.static( __dirname +  "/src/public/"));
app.use("/", require("./src/routes/mainRoute"));
app.use("/api", require("./src/routes/api"));

rooms = new Map();

io.on("connection", (socket) => {
    console.log(`user connected (${socket.id})`);

    socket.on("joinRoom", (payload) => {
        console.log(payload);

        let roomID = payload.roomID
        let name = payload.name || "Bob";

        if (rooms.has(roomID)) {
            try {
                rooms.get(roomID).join(socket.id, name);
                console.log(`Joined room ${roomID}`);
            } catch (err) {
                socket.emit("error", err.message);
            }
        } else {
            console.log(`Created and joined room ${roomID}`);
            let room = game.game();
            rooms[roomID] = room;

            room.join(socket.id, name);
        }
        socket.join(roomID);
    });

    socket.on("message", (payload) => {
        console.log(payload);

        socket.to(payload.roomID).emit("message", payload.message);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

http.listen(3000, () => {
    console.log("listening on *:3000");
});