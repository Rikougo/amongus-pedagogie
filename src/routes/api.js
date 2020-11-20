const express = require("express");
const url = require("url");

let router = express.Router();

/**
 * ! TOCHANGE
 * Still WIP the pathname given must be determined 
 * by current active rooms and create a new one
 */
router.get("/createRoom", (req, res) => {
    res.redirect(url.format({
        pathname: "/FG4E5D",
        query: {
            name: req.query.name
        }
    }));

    res.end();
});

module.exports = router;