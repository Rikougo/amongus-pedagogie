const url = require("url");

const game = require("../lib/game");
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
 * 
 * @param {*} rooms 
 * @param {type.TasksData} tasksData 
 */
function _generateRandomRoom(rooms, tasksData) {
    /**
     * @type {string}
     */
    let id;
    
    do {
        id = _makeid(5);
    } while(rooms.has(id));

    rooms.set(id, new game.Game(
        id,
        tasksData
    ));

    return id;
}

module.exports = {
    apply: function(path, app) {
        app.get(path+"/createRoom", (req, res) => {
            let id = _generateRandomRoom(app.rooms, app.tasksData);

            app.logger.debug("Creating ", id, " room");

            res.redirect(url.format({   
                pathname: `/rooms/${id}`,
                query: {
                    name: req.query.name
                }
            }));

            res.end();
        });
    }
};