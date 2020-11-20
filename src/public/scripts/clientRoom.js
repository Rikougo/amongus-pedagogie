$(document).ready(() => {
    const socket = io();

    /**
     * Player is here a list of object with :
     *   - {string} name
     *   - {boolean} admin
     * 
     * It updates left players list and set start button disabled or enabled
     */
    function updatePlayersList(players) {
        $("#players").empty();

        players.forEach((value) => {
            let playerDiv = $("<div class='player'></div>");

            if (value.admin) $(playerDiv).append("<img src='/svg/shield.svg' height='20px' width='20px' />");
            let name = $(`<div class='name'>${value.name}</div>`);
            $(playerDiv).append(name);
            
            // if player is the client
            if (value.id === socket.id) {
                name.addClass("self");
                $("#startGame").attr("disabled", !value.admin); // configure start button
            }

            $(playerDiv).appendTo('#players');
        });
    }

    /**
     * 
     * @param {string} gamestate 
     */
    function changeState(gamestate) {
        $("#state").html(gamestate);
    }

    /**
     * 
     * @param {array} tasks array of task that has the code of the taks and other infos
     */
    function updatePlayerTasks(tasks) {
        
    }

    socket.on("connect", () => {
        socket.emit("joinRoom", {roomID: roomID, name: name});
    });

    socket.on("successJoin", (payload) => {
        changeState(payload.gamestate);

        updatePlayersList(payload.players);
    })

    socket.on("updatePlayers", (payload) => {
        updatePlayersList(payload.players);
    });

    socket.on("gameStart", (payload) => {
        changeState(payload.gamestate);
        console.log(payload.tasks);
    });

    $("#startGame").click(() => {
        socket.emit("startGame");
    });

    socket.on("error", (err) => {
        console.error(err);
    });
});