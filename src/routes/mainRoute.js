const express = require("express");

let router = express.Router();

router.get("/", (req, res) => {
    res.render("home");
});

router.get("/:id", (req, res) => {
    res.render("room", {roomID: req.params.id});
});

module.exports = router;