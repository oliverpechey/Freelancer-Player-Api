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

// Uses the freelancer-save-parser module to parse the player files
const parsePlayers = () => {
    let unfiledPlayers = new playerParser.Parser()
        .ParsePlayerFiles(process.env.SAVEPATH)
        .SortPlayerFiles('LastSeen','Desc')
        .players;
    players = new Map(unfiledPlayers.map(element => [element.name, element]));
}

app.use('/', router);
app.listen(process.env.PORT);
parsePlayers();
setInterval(parsePlayers, process.env.PLAYER_FILE_INTERVAL * 1000);