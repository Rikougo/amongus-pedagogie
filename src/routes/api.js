const express = require("express");

let router = express.Router();

router.get("/createRoom", (req, res) => {
    res.status(200)
    res.send("FG4E5D");
    res.end();
});

module.exports = router;