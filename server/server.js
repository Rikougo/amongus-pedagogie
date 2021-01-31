/**
 * @author Sakeiru
 */
const Application = require("./src/lib/application");

const app = new Application();

const { static } = require("express")
const express = require("express")();
const http = require("http").createServer(express);

const PORT = process.env.PORT || 3000;

express.set("view engine", "pug");
express.set("views", __dirname + "/src/views/");

express.use("/", static( __dirname +  "/src/public/"));

// require("./src/routes/mainRoute").apply("", app, express);
require("./src/routes/api").apply("/api", app, express);

http.listen(PORT, () => {
    app.logger.info(`listening on *:${PORT}`);
});

const io = require("socket.io")(http, {
    cors: {
      origin: "http://localhost:4200",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
app.io = io;

io.on("connection", (socket) => {
    app.socketHandler.handler(socket);
});