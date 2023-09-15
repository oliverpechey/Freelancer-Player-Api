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
    res.json(players);
});


// Uses the freeelancer-save-parser module to parse the player files
const parsePlayers = () => {
    players = playerParser.Parser()
        .ParsePlayerFiles(process.env.SAVEPATH)
        .SortPlayerFiles('LastSeen','Desc')
        .players;
}

app.use('/', router);
app.listen(3000);

setInterval(parsePlayers, process.env.INTERVAL * 1000);