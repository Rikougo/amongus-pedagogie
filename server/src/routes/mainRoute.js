const express = require("express");
const Application = require("../lib/application");

module.exports = {
    /**
     * 
     * @param {string} path 
     * @param {Application} app 
     * @param {*} express 
     */
    apply: function (path, app, express) {
        express.get(path+"/", (req, res) => {
            res.render("home", {
                page: "Home"
            });
        });
        
        express.get(path+"/rooms/:id", (req, res) => {
            if (!app.rooms[req.params.id]) {
                app.logger.debug("Trying to access to a non-existing room, redirecting ", `[${req.params.id}]`);
                res.redirect("/");
                return;
            }

            res.render("room", {
                title: req.params.id,
                roomID: req.params.id,
                name: req.query.name,
                page: id
            });
        });
    }
};