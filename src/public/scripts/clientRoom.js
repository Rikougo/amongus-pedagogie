$(document).ready(() => {
    const socket = io();

    socket.on("connect", () => {
        socket.emit("joinRoom", {roomID: roomID});
    });

    socket.on("updatePlayers", (players) => {
        $("#players").empty();

        players.forEach((value) => {
            let playerDiv = $("<div class='player'></div>");

            if (value.admin) $(playerDiv).append("<img src='/svg/shield.svg' height='20px' width='20px' />");
            $(playerDiv).append(`<div class='name'>${value.name}</div>`);

            $(playerDiv).appendTo('#players');
        });
    });
});