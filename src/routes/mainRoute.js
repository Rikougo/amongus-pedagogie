const express = require("express");

let router = express.Router();

router.get("/", (req, res) => {
    res.render("home");
});

router.get("/:id", (req, res) => {
    res.render("room", {
        tiutle: req.params.id,
        roomID: req.params.id,
        name: req.query.name
    });
});

module.exports = router;