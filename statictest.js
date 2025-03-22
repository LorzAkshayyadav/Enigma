import { WebSocketServer } from "ws";
import express from "express";
import { createServer } from "http";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let instruments = {};
for (let i = 1; i <= 17; i++) {
  instruments[i] = {
    id: i,
    name: `Instrument ${i}`,
    status: "Active",
    readData: {
      "Actual Position": 100 + i,
      "Actual Velocity": 50 + i,
      "Status Word": 75 + i,
      "Actual Torque": 30 + i,
    },
    writeData: {
      "Target Position": 150 + i,
      "Target Velocity": 60 + i,
      "Control Word": 80 + i,
      "Target Torque": 40 + i,
    },
  };
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.send(JSON.stringify({ type: "initialData", instruments }));

  ws.on("message", (message) => {
    console.log("Dataiscoming")
    try {
      const data = JSON.parse(message);
      if (data.type === "updateWriteData") {
        const { instrumentId, key, value } = data;
        instruments[instrumentId].readData[key] = value;
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: "update", instruments }));
          }
        });
      }
    } catch (err) {
      console.error("Invalid message format", err);
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
});


const PORT = 5002;  
server.listen(PORT, () => console.log(`WebSocket server running on port ${PORT}`));

