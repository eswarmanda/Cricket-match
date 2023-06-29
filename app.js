const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started in port:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
  }
};

initializeDatabaseAndServer();

const convertAllPlayersSnakeCaseToCamelcase = (db) => {
  return {
    playerId: db.player_id,
    playerName: db.player_name,
  };
};
//get all players
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getAllPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertAllPlayersSnakeCaseToCamelcase(eachPlayer)
    )
  );
});

//get player by id
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = '${playerId}';`;
  const player = await db.get(getPlayerQuery);
  response.send(convertAllPlayersSnakeCaseToCamelcase(player));
});
// update playerName by id
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
  UPDATE 
    player_details 
  SET 
    player_name = '${playerName}'
  WHERE 
    player_id = '${playerId}';`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
const convertAllMatchesSnakeCaseToCamelcase = (db) => {
  return {
    matchId: db.match_id,
    match: db.match,
    year: db.year,
  };
};
// get matchDetails by id
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `SELECT * FROM match_details WHERE match_id = '${matchId}';`;
  const match = await db.get(getMatchesQuery);
  response.send(convertAllMatchesSnakeCaseToCamelcase(match));
});

// get matchDetails by player_id
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
  SELECT 
   *
  FROM 
    player_match_score NATURAL JOIN match_details 
  WHERE  
    player_id = ${playerId};`;

  const getMatchesResponse = await db.all(getMatchesQuery);
  response.send(getMatchesResponse.map((eachItem)=> convertAllMatchesSnakeCaseToCamelcase(eachItem) ));
  console.log(getMatchesResponse);
});

// get playerDetails by match_id
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName
    FROM 
       player_match_score NATURAL JOIN player_details
    WHERE 
        match_id = ${matchId};`;
  const dbResponse = await db.all(getPlayersQuery);
  console.log(dbResponse);
  response.send(dbResponse);
});

// player scores by id
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
       player_details INNER JOIN player_match_score ON 
       player_details.player_id = player_match_score.player_id
    WHERE 
    player_details.player_id = '${playerId}';`;
  const scores = await db.get(getPlayerScoresQuery);
  console.log(scores);
  response.send(scores);
});
module.exports = app;
