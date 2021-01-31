/**
 * @type {string | undefined} the role of the player, should be undefined until games start
 */
let role;

$(document).ready(() => {
    const socket = io();

    /**
     * It updates left players list and set start button disabled or enabled
     * 
     * @param {{name: string, admin: boolean}[]} players
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
                $("#startGame").attr("disabled", !value.admin || players.length < 4); // configure start button
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
     * @param {Object.<string, {content?: string | undefined}>} tasks array of task that has the code of the taks and other infos
     */
    function updatePlayerTasks(tasks) {
        const tasksElem = $("#tasks");

        for(let key in tasks) {
            if (!key) continue;
            const value = tasks[key];

            const item = $(`<li class='task-${key}'><h2 class='taskTitle'>${key}</h2></li>`);

            if (value?.content) {
                let content = $(`<p>${value.content}</p>`);
                $(content).appendTo($(item))
            }

            const form = $(`<form><input class='taskInput' type='text' name='task' required ${value.completed ? "disabled" : ""}></input><input class='taskButton' type='submit'></input></form`);

            $(form).submit((e) => {
                e.preventDefault();

                let form = $(e.target);
                let value = $(form).find("input[type='text']").val();
                
                console.log(`Send ${value} to ${key}`);

                socket.emit("taskCode", {
                    taskID: key,
                    code: value
                });
            });

            $(form).appendTo($(item));

            $(item).appendTo($(tasksElem))
        }
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

    /**
     * @param {{gamestate: string, tasks: Object.<string, {content?: string | undefined}>, role: string}} payload 
     */
    let gamestartHandler = (payload) => {
        updatePlayerTasks(payload.tasks)

        $("#game").toggle();
        $("#lobby").toggle();
        changeState(payload.gamestate);
    };
    socket.on("gameStart", gamestartHandler);

    $("#startGame").click(() => {
        socket.emit("startGame", {tasksType: "test"});
    });

    socket.on("feedTask", (payload) => {
        let codeMessage = $(`<p class='codeMessage'>[${Date.now().toString()}]${payload.playerName || "Unknown"} has entered a code.</p>`);

        codeMessage.appendTo($("#codesFeed"));
    });
    
    socket.on("successTask", (payload) => {
        let taskElem = $(`.task-${payload.taskID}`);

        taskElem.find(".taskTitle").css("color", "green");
        taskElem.find(".taskInput").prop("disabled", true);
        taskElem.find(".taskInput").css("background", "white");
        taskElem.find(".taskButton").prop("disabled", true);
    });

    socket.on("failedTask", (payload) => {
        let taskElem = $(`.task-${payload.taskID}`);

        taskElem.find(".taskInput").css("background", "#f55d42");
    });

    socket.on("killed", (payload) => {
        console.log(`Killed by ${payload.killed}`);

        $(".main-board").css("background", "#f55d42");
    });

    socket.on("error", (err) => {
        console.error(err);
    });
});