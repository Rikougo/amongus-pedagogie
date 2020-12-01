const express = require("express");

module.exports = {
    apply: function (path, app) {
        app.get(path+"/", (req, res) => {
            res.render("home");
        });
        
        app.get(path+"/:id", (req, res) => {
            res.render("room", {
                tiutle: req.params.id,
                roomID: req.params.id,
                name: req.query.name
            });
        });   
    }
};