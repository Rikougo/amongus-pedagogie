$(document).ready(() => {
    const socket = io();

    socket.on("connect", () => {
        socket.emit("joinRoom", {roomID: roomID});
    });

    /**
     * 
     */
    socket.on("successJoin", (payload) => {
        $("#state").html(payload.gamestate);
    })

    /**
     * Player is here a list of object with :
     *   - {string} name
     *   - {boolean} admin
     * 
     * It updates left players list and set start button disabled or enabled
     */
    socket.on("updatePlayers", (players) => {
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
    });

    socket.on("gameStart", (payload) => {
        console.log("yo");
        $("#state").html(payload.gamestate);
    });

    $("#startGame").click(() => {
        socket.emit("startGame");
    });

    socket.on("error", (err) => {
        console.error(err);
    });
});