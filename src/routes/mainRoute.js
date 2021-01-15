const express = require("express");

module.exports = {
    apply: function (path, app) {
        app.get(path+"/", (req, res) => {
            res.render("home");
        });
        
        app.get(path+"/rooms/:id", (req, res) => {
            if (!app.rooms.has(req.params.id)) {
                app.logger.debug("Trying to access to a non-existing room, redirecting ", `[${req.params.id}]`);
                res.redirect("/");
                return;
            }

            res.render("room", {
                tiutle: req.params.id,
                roomID: req.params.id,
                name: req.query.name
            });
        });
    }
};