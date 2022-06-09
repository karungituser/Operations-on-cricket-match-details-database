const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbPlayerObjectIntoResponseObject = (dbDatabase) => {
  return {
    playerId: dbDatabase.player_id,
    playerName: dbDatabase.player_name,
  };
};

const convertDbMatchObjectIntoResponseObject = (dbDatabase) => {
  return {
    matchId: dbDatabase.match_id,
    match: dbDatabase.match,
    year: dbDatabase.year,
  };
};

const convertDbPlayerMatchObjectIntoResponseObject = (dbDatabase) => {
  return {
    playerMatchId: dbDatabase.player_match_id,
    playerId: dbDatabase.player_id,
    matchId: dbDatabase.match_id,
    score: dbDatabase.score,
    fours: dbDatabase.fours,
    sixes: dbDatabase.sixes,
  };
};

//GET API1

app.get("/players/", async (request, response) => {
  const getPlayersList = `SELECT * FROM player_details;`;
  const playerList = await db.all(getPlayersList);
  response.send(
    playerList.map((eachPlayer) =>
      convertDbPlayerObjectIntoResponseObject(eachPlayer)
    )
  );
});

//GET API2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetails = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const playerDetails = await db.get(getPlayerDetails);
  response.send(convertDbPlayerObjectIntoResponseObject(playerDetails));
});

//PUT API3

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerDetails = `UPDATE player_details SET player_name='${playerName}' WHERE player_id=${playerId};`;
  await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});

//GET API4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `SELECT * FROM match_details WHERE match_id =${matchId};`;
  const matchDetails = await db.get(getMatchDetails);
  response.send(convertDbMatchObjectIntoResponseObject(matchDetails));
});

//GET API5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerAllMatches = `SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_id=${playerId};`;
  const playerAllMatches = await db.all(getPlayerAllMatches);
  response.send(
    playerAllMatches.map((eachMatch) =>
      convertDbMatchObjectIntoResponseObject(eachMatch)
    )
  );
});

//GET API6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayers = `SELECT * FROM player_details NATURAL JOIN player_match_score WHERE match_id=${matchId};`;
  const matchPlayers = await db.all(getMatchPlayers);
  response.send(
    matchPlayers.map((eachPlayers) =>
      convertDbPlayerObjectIntoResponseObject(eachPlayers)
    )
  );
});

//GET API7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScores = `SELECT player_id AS playerId,player_name AS playerName,SUM(score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details WHERE player_id =${playerId};`;
  const playerScores = await db.get(getPlayerScores);
  response.send(playerScores);
});

module.exports = app;
