require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const { generateSample } = require("./dataGenerator");

const PORT = process.env.PORT || 4000;
const WS_PATH = process.env.WS_PATH || "/ws";
const SIM_INTERVAL = Number(process.env.SIM_INTERVAL || 2000);
const BULK_ON_CONNECT = Number(process.env.BULK_ON_CONNECT || 60);

const app = express();
app.use(cors());
app.use(express.json());

// ring buffer for initial history
const ring = [];
const MAX_RING = 600;

app.get("/api/info", (_req, res) => {
  res.json({
    service: "CME Monitor Backend",
    websocket: `ws://localhost:${PORT}${WS_PATH}`,
    update_interval_ms: SIM_INTERVAL,
    bulk_on_connect: BULK_ON_CONNECT
  });
});

const server = app.listen(PORT, () => console.log(`HTTP http://localhost:${PORT}`));

const wss = new WebSocketServer({ server, path: WS_PATH });

wss.on("connection", (ws) => {
  // bulk snapshot
  if (ring.length) {
    const bulk = ring.slice(-BULK_ON_CONNECT);
    ws.send(JSON.stringify({
      type: "bulk",
      samples: bulk.map(b => b.sample),
      alerts: bulk.flatMap(b => b.alerts || [])
    }));
  }

  const iv = setInterval(() => {
    const msg = generateSample();
    ring.push(msg); if (ring.length > MAX_RING) ring.shift();
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }, SIM_INTERVAL);

  ws.on("close", () => clearInterval(iv));
});

