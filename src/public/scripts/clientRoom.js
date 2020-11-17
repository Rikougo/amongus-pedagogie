$(document).ready(() => {
    const socket = io();

    socket.on("connect", () => {
        socket.emit("joinRoom", {roomID: roomID});
    });

    socket.on("message", (message) => {
        $("#messageList").append(`<p>${message}</p>`);
    });

    $("#sendMessage").on("click", () => {
        if ($("#message").length > 0) {
            $("#messageList").append(`<p>${$("#message").val()}</p>`)

            socket.emit("message", {
                roomID: roomID,
                message: $("#message").val()
            });

            $("#message").val("");
        }
    });
});