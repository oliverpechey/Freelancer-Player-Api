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
let flHookJson = '';

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
    // Convert the map to an array
    let playerArray = Array.from(players, ([, player]) => player);
    // Check to see if the array is empty
    if (playerArray.length === 0) {
        res.status(500).send('No players found');
        return;
    }
    // Check to see if the sort parameter has been added
    if (!req.params.sort) {
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
    }
    else {
        res.status(400).send('Invalid sort parameter');
        return;
    }

    // Filter out players without a ship
    playerArray.filter(player => player.ship);
    
    res.json(playerArray);
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
    players = new Map(unfiledPlayers.filter(element => element.name).map(element => [element.name.toLowerCase(), element]));
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