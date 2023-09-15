// Imports
import express from 'express';
import dotenv from 'dotenv';
import playerParser from 'freelancer-save-parser';

// Inits
dotenv.config();
const router = express.Router();
const app = express();
let players = {};

// /all GET request
router.get('/all', (req, res) => {
    let response = Object.fromEntries(players);
    res.json(response);
});

// /player GET request
router.get('/player/:player', (req, res) => {
    res.json(players.get(req.params.player));
});

// Uses the freeelancer-save-parser module to parse the player files
const parsePlayers = () => {
    let unfiledPlayers = new playerParser.Parser()
        .ParsePlayerFiles(process.env.SAVEPATH)
        .SortPlayerFiles('LastSeen','Desc')
        .players;
    players = new Map(unfiledPlayers.map(element => [element.name, element]));
}

app.use('/', router);
app.listen(3000);
parsePlayers();
setInterval(parsePlayers, process.env.INTERVAL * 1000);