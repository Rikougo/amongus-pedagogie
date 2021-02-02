/**
 * @author Sakeiru
 */
const Application = require("./src/lib/application");
const app = new Application();
const fastify = require("fastify")({ logger: true });

const FRONT_ENDPOINT = process.env.CLIENT_ORIGIN || "http://localhost:4200";
const PORT = process.env.PORT || 3000;

fastify.register(require("fastify-cors"), {origin: FRONT_ENDPOINT});
fastify.register(require('./src/routes/api')(app), { prefix: "/api"});

const start = (async () => {
    try {
        await fastify.listen(3000);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
})();

const io = require("socket.io")(fastify.server, {
    cors: {
      origin: FRONT_ENDPOINT,
      methods: ["GET", "POST"],
      credentials: true
    }
});
app.io = io;

io.on("connection", (socket) => {
    console.log("yo");

    app.socketHandler.handler(socket);
});
