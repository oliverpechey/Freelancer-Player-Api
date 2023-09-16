// Imports
import express from 'express';
import dotenv from 'dotenv';
import playerParser from 'freelancer-save-parser';
import fs from 'fs';

// Inits
dotenv.config();
const router = express.Router();
const app = express();
let players = {};
let flHookJson = '';

// /all GET request
router.get('/all/:sort?/:direction?', (req, res) => {
    // Check to see if the sort parameter has been added and that the field exists
    if(req.params.sort && players.entries().next().value[1][req.params.sort] != undefined) {
        let sortedArray = [];
        if(req.params.direction === 'asc') {
            sortedArray = Array.from(players).sort((a, b) => a[1][req.params.sort] - b[1][req.params.sort]);
        }
        else {
            sortedArray = Array.from(players).sort((a, b) => b[1][req.params.sort] - a[1][req.params.sort]);
        }
        
        players = new Map(sortedArray);
    }
    res.json(Object.fromEntries(players));
});

// /player GET request
router.get('/player/:player', (req, res) => {
    res.json(players.get(req.params.player));
});

// /load GET request
router.get('/load', (req, res) => {
    res.json({load: flHookJson.serverload});
});

// /online GET request
router.get('/online', (req, res) => {
    res.json(flHookJson.players);
});

// Uses the freelancer-save-parser module to parse the player files
const parsePlayers = () => {
    let unfiledPlayers = new playerParser.Parser()
        .ParsePlayerFiles(process.env.SAVEPATH)
        .SortPlayerFiles('LastSeen','Desc')
        .players;
    players = new Map(unfiledPlayers.map(element => [element.name, element]));
}

// Parses the stats.json file exported by the FLHook plugin
const parseFLHookJson = () => {
    let rawdata = fs.readFileSync(process.env.FLHOOK_STATS_FILE).toString().replace(/\\/g, "\\\\");
    flHookJson = JSON.parse(rawdata);
}

app.use('/', router);
app.listen(process.env.PORT);

parsePlayers();
parseFLHookJson();

setInterval(parsePlayers, process.env.PLAYER_FILE_INTERVAL * 1000);
setInterval(parseFLHookJson, process.env.STATS_FILE_INTERVAL * 1000);