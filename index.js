// Imports
import express from 'express';
import dotenv from 'dotenv';
import playerParser from 'freelancer-save-parser';
import fs from 'fs';
import { rateLimit } from 'express-rate-limit'

// Inits
dotenv.config();
const router = express.Router();
const app = express();
let players = {};
let playerArray = [];
let flHookJson = '';
let lastSort = '';
let lastDirection = '';

// API Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
app.use(limiter);

// /all GET request
router.get('/all/:sort?/:direction?', (req, res) => {
    // Check to see if the array is empty
    if (playerArray.length === 0) {
        res.status(400).send('No players found');
        return;
    }

    // Check to see if the sort parameter has been added or whether its the same as last time
    if (!req.params.sort || (req.params.sort === lastSort && req.params.direction === lastDirection)) {
        res.json(playerArray);
        return;
    }
    // Check that the field exists
    if (playerArray[0][req.params.sort] != undefined) {
        if (req.params.direction === 'asc') {
            playerArray = playerArray.sort((a, b) => a[req.params.sort] - b[req.params.sort]);
        }
        else {
            playerArray = playerArray.sort((a, b) => b[req.params.sort] - a[req.params.sort]);
        }
        // Set the last sort params
        lastDirection = req.params.direction;
        lastSort = req.params.sort;
    }
    else {
        res.status(400).send('Invalid sort parameter');
        return;
    }

    res.json(playerArray);
});

// /search GET request
router.get('/search/:search', (req, res) => {
    let results = [];
    players.forEach(player => {
        for(let key in player) {
            if (player[key]?.toString().toLowerCase().includes(req.params.search.toLowerCase())) {
                results.push(player);
                break;
            }
        }
    });
    res.json(results);
});

// /player GET request
router.get('/player/:player', (req, res) => {
    res.json(players.get(req.params.player.toLowerCase()));
});

// /load GET request
router.get('/load', (req, res) => {
    res.json({ load: flHookJson.serverload });
});

// /online GET request
router.get('/online', (req, res) => {
    res.json(flHookJson.players);
});

// Uses the freelancer-save-parser module to parse the player files
const parsePlayers = () => {
    let unfiledPlayers = new playerParser.Parser(process.env.INSTALLPATH, process.env.SAVEPATH)
        .sort('LastSeen', 'Desc')
        .players;
    // Set last sort/direction
    lastSort = 'LastSeen';
    lastDirection = 'desc';
    // Filter out blank names and no ship
    playerArray = unfiledPlayers.filter(element => element.name && element.ship);
    // Convert to map for easy retrieval on search
    players = new Map(playerArray.map(element => [element.name.toLowerCase(), element]));
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