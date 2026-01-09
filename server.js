// ===== BASIC SETUP =====
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// ===== STATIC FILE =====
app.use(express.static("public"));

// ===== GAME DATA =====
let players = [];
let turn = 0;

const board = [
  { name: "GO – যশোর শহর", type: "go" },
  { name: "ঝিকরগাছা", price: 60, rent: 10 },
  { name: "কেশবপুর", price: 60, rent: 10 },
  { name: "আয়কর", type: "tax", amount: 200 },
  { name: "মনিরামপুর", price: 100, rent: 20 },
  { name: "জেলখানা", type: "jail" },
  { name: "চাঁচড়া", price: 120, rent: 25 },
  { name: "খাজুরা", price: 140, rent: 30 },
  { name: "চান্স", type: "chance" },
  { name: "বেনাপোল", price: 200, rent: 40 }
];

// ===== SOCKET LOGIC =====
io.on("connection", socket => {
  console.log("একজন প্লেয়ার যুক্ত হয়েছে");

  socket.on("joinGame", name => {
    players.push({
      id: socket.id,
      name,
      money: 1500,
      position: 0,
      properties: []
    });

    io.emit("updatePlayers", players);
  });

  socket.on("rollDice", () => {
    const player = players[turn];
    if (!player || player.id !== socket.id) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    player.position = (player.position + dice) % board.length;

    if (player.position === 0) {
      player.money += 200;
    }

    const cell = board[player.position];

    // TAX
    if (cell.type === "tax") {
      player.money -= cell.amount;
    }

    // PROPERTY
    if (cell.price) {
      if (!cell.owner) {
        socket.emit("askBuy", board.indexOf(cell));
      } else if (cell.owner !== player.id) {
        player.money -= cell.rent;
        const owner = players.find(p => p.id === cell.owner);
        if (owner) owner.money += cell.rent;
      }
    }

    turn = (turn + 1) % players.length;
    io.emit("updatePlayers", players);
  });

  socket.on("buyProperty", index => {
    const cell = board[index];
    const player = players.find(p => p.id === socket.id);

    if (!cell || !player) return;

    if (!cell.owner && player.money >= cell.price) {
      player.money -= cell.price;
      cell.owner = player.id;
      player.properties.push(cell.name);
    }

    io.emit("updatePlayers", players);
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    if (turn >= players.length) turn = 0;
    io.emit("updatePlayers", players);
  });
});

// ===== SERVER START =====
http.listen(3000, () => {
  console.log("Server চলছে port 3000 এ");
});
