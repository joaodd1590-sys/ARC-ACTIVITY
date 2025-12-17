import fs from "fs";

console.log("ARC indexer started");

// fake leaderboard (por enquanto)
const leaderboard = [
  {
    rank: 1,
    address: "0x1234567890abcdef",
    txCount: 42,
    score: 120
  },
  {
    rank: 2,
    address: "0xabcdef1234567890",
    txCount: 31,
    score: 95
  }
];

// cria a pasta data se não existir
fs.mkdirSync("data", { recursive: true });

// grava o arquivo
fs.writeFileSync(
  "data/leaderboard.json",
  JSON.stringify(leaderboard, null, 2)
);

console.log("Leaderboard generated successfully");
