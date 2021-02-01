const Application = require("../lib/application");
const { Game } = require("../lib/game");
const type = require("../lib/types");

/**
 * 
 * @param {number} length 
 * @return {string}
 */
function _makeid(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    let result = '';
    let charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * @param {Application} app
 * @param {*} rooms 
 * @param {type.TasksData} tasksData 
 */
function _generateRandomRoom(app, rooms, tasksData) {
    /**
     * @type {string}
     */
    let id;
    
    do {
        id = _makeid(5);
    } while(rooms[id]);

    rooms[id] = new Game(
        app,
        id,
        tasksData
    );

    return id;
}

module.exports = {
    /**
     * 
     * @param {string} path 
     * @param {Application} app 
     * @param {*} express 
     */
    apply: function(path, app, express) {
        express.get(path+"/createRoom", (req, res) => {
            app.logger.debug("Creating room.");

            let id = _generateRandomRoom(app, app.rooms, Application.loadTasks());

            res.set({
                'Access-Control-Allow-Origin': 'http://localhost:4200'
            });

            res.send({roomId: id});

            res.end();
        });
    }
};

module.exports = function (app) {
    return function (fastify, opts, done) {
        fastify.get('/createRoom', (request, reply) => {
            request.log.info("Creating room.");

            let id = _generateRandomRoom(app, app.rooms, Application.loadTasks());

            reply.send({ roomId: id });
        });

        done();
    };
}