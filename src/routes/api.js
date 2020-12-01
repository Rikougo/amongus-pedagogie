const url = require("url");

const game = require("../lib/game");

function _makeid(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    let result = '';
    let charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function _generateRandomRoom(rooms, tasksData) {
    let id;
    
    do {
        id = _makeid(5);
    } while(rooms.has(id));

    rooms.set(id, game.game(
        id,
        tasksData
    ));

    return id;
}

module.exports = {
    apply: function(path, app) {
        console.log(path+"/createRoom");

        /**
         * ! TOCHANGE
         * Still WIP the pathname given must be determined 
         * by current active rooms and create a new one
         */
        app.get(path+"/createRoom", (req, res) => {
            let id = _generateRandomRoom(app.rooms, app.tasksData)

            res.redirect(url.format({   
                pathname: `/${id}`,
                query: {
                    name: req.query.name
                }
            }));

            res.end();
        });
    }
};