const socket = io();
let myTurn = false;

function join() {
  const name = document.getElementById("name").value;
  socket.emit("joinGame", name);
}

function roll() {
  socket.emit("rollDice");
}

socket.on("updatePlayers", players => {
  const div = document.getElementById("players");
  div.innerHTML = "";

  players.forEach((p, i) => {
    div.innerHTML += `
      <p>
        ${i === 0 ? "👉 " : ""}${p.name}
        | 💰 ${p.money}
        | 📍 ${p.position}
      </p>
    `;
  });
});

socket.on("askBuy", index => {
  if (confirm("এই জমিটা কিনবে?")) {
    socket.emit("buyProperty", index);
  }
});
