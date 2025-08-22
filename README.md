# 🌌 CME Monitor Dashboard — FlareWatch

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Frontend](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-blue)
![WebSocket](https://img.shields.io/badge/Realtime-WebSocket-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A **full-stack real-time dashboard** for monitoring simulated **Coronal Mass Ejection (CME)** & solar activity with **impact assessment**.

## ✨ Key Features
- Live telemetry: **wind, particle flux, magnetic field, plasma density**
- Derived indicators:
  - **Intensity** (0–10)
  - **Probability of hitting Earth**
  - **Closest approach to Earth** (million km)
  - **Expected impact location** (lat/lon + region label)
  - **Impact window** (start/end)
  - **Next solar eclipse** (date/type/visibility)
- Alerts with **HIGH / MEDIUM / LOW** severity
- Multi-line **overview & detail charts** (Chart.js)
- Responsive UI, dark/light theme, simulator fallback

## 📂 Structure
cme-monitor/
├── backend/
│ ├── server.js
│ ├── dataGenerator.js
│ ├── package.json
│ ├── .env
│ └── Dockerfile
└── frontend/
├── index.html
├── style.css
└── app.realtime.js

bash
Copy code

## ⚙️ Backend
```bash
cd backend
npm install
npm start
REST: http://localhost:4000/api/info

WebSocket: ws://localhost:4000/ws

.env

ini
Copy code
PORT=4000
WS_PATH=/ws
SIM_INTERVAL=2000
BULK_ON_CONNECT=60
🎨 Frontend
Open frontend/index.html (or serve with any static server).
In the header, set the WS URL (default ws://localhost:4000/ws) and click Connect; or use Start Live Simulation.

🔄 Message Formats
json
Copy code
{ "type":"bulk", "samples":[...], "alerts":[...] }

{ "type":"sample", "sample":{
  "timestamp":"ISO",
  "wind":400.1, "flux":7.2, "mag":3.4, "density":8.0,
  "intensity":6.42,
  "hitProbability":0.73,
  "closeToEarthMkm":22.5,
  "expectedImpact":{"lat":20,"lon":78,"region":"South Asia"},
  "impactWindow":{"start":"ISO","end":"ISO"},
  "solarEclipse":{"date":"ISO","type":"Total","visibility":"Americas"}
}, "alerts":[
  {"timestamp": "...", "metric":"Wind Speed", "value":700, "severity":"HIGH", "note":"Strong solar wind"}
]}
Note: All values are simulated for demo purposes.

🐳 Docker (backend)
bash
Copy code
cd backend
docker build -t cme-backend .
docker run -p 4000:4000 cme-backend
📌 Roadmap
Database persistence (Mongo/Postgres)

Historical query APIs

Real feed adapters (e.g., NOAA/SOHO/DSCOVR) with rate limiting

Deployment with Nginx + HTTPS
