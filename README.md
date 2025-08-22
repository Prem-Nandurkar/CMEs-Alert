# ☀️ CMEs Alert

Realtime **Coronal Mass Ejection (CME) & Solar Flare Monitoring Dashboard** powered by Node.js backend + WebSocket streaming + responsive frontend with charts, alerts, and live simulation.

---

## 📂 Project Structure
cme_detector/
├── frontend/ # UI layer
│ ├── index.html # main page
│ ├── style.css # styles & theme
│ ├── app.realtime.js # realtime client logic
│ └── assets/ # icons, images, logos
│
├── backend/ # server + simulator
│ ├── server.js # main WebSocket/REST server
│ ├── dataGenerator.js # simulation + alert logic
│ ├── package.json # npm dependencies
│ ├── .env # config (port, host, etc.)
│ └── Dockerfile # optional container build
│
├── README.md # documentation
└── cme_detector.zip # packaged build

markdown
Copy code

---

## ✨ Key Features

### 🔭 Realtime Solar Metrics
- **Solar Wind Speed** (km/s)  
- **Particle Flux** (/cm²·s)  
- **Magnetic Field Strength** (nT)  
- **Solar Intensity Index** (custom simulated metric)  
- **Probability of Earth Impact** (%)  
- **Closest Approach to Earth** (AU)  
- **Estimated Impact Location** (lat/lon simulation)  
- **Solar Eclipse Detection** (rare events, simulated)

### 📊 Dashboard
- Live updating KPIs (latest metrics)
- Charts for Wind, Flux, Magnetic Field
- Overview multi-line chart (Wind + Flux + Mag)
- Alerts timeline with severity filters (High/Medium/Low)
- Smooth animations (anime.js + Chart.js)
- Dark/Light theme toggle

### 🚨 Alerts Engine
- Alerts triggered on thresholds:
  - High Wind Speed  
  - Strong Magnetic Field  
  - High Flux Density  
  - Eclipse proximity  
  - Probability of Earth Impact > threshold
- Alerts capped at **300 max** for performance
- Auto-pruned list with severity colors

### 🔗 Backend
- Node.js + Express + WebSocket
- Endpoints:
  - `/ws` → realtime metrics & alerts stream
  - `/api/info` → server health
- Simulation mode if no upstream data
- Auto reconnect & exponential backoff for clients
- Docker-ready deployment

### 📱 Mobile Friendly
- Responsive grid layout
- Charts scale up/down
- Larger buttons for touch
- Can run locally with **LAN access** (`http://<PC-IP>:8080`)

---

## ⚙️ Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/cme_detector.git
cd cme_detector
2. Backend Setup
bash
Copy code
cd backend
npm install
cp .env.example .env
# Edit .env if needed
npm start
Default .env:

env
Copy code
PORT=4000
HOST=0.0.0.0
3. Frontend Setup
You can serve the frontend with any static server:

bash
Copy code
cd frontend
npx serve .
Now open http://localhost:3000

4. Connect Frontend to Backend
Enter ws://localhost:4000/ws in the WebSocket URL input

Click Connect

Or click Start Live Simulation for demo data

📱 Accessing on Mobile
Make sure PC & phone are on the same WiFi

Find your PC’s IP:

bash
Copy code
ipconfig   # Windows
ifconfig   # Mac/Linux
Example: 192.168.1.42

Run frontend:

bash
Copy code
npx serve . --port 8080
On phone → open browser:

cpp
Copy code
http://192.168.1.42:8080
Enter backend URL:

arduino
Copy code
ws://192.168.1.42:4000/ws
🐳 Docker Deployment
Build backend container:

bash
Copy code
cd backend
docker build -t cme-detector-backend .
docker run -d -p 4000:4000 cme-detector-backend
For frontend, deploy to Netlify, Vercel, or Nginx.

📡 API / WebSocket Protocol
Incoming Messages
json
Copy code
{ "type": "sample", "sample": { "timestamp": "...", "wind": 420, "flux": 88, "mag": 7.2 } }
{ "type": "alert", "alert": { "timestamp": "...", "metric": "wind", "value": 950, "severity": "HIGH", "note": "Strong CME" } }
{ "type": "bulk", "samples": [...], "alerts": [...] }
Extended Fields
json
Copy code
{
  "intensity": 0.82,
  "probability": 67,
  "closest_approach": 0.14,
  "impact_location": "23.5N, 78.9E",
  "eclipse": false
}
🚀 Roadmap
✅ Basic CME/Flare monitoring

✅ Alerts + filtering

✅ Extended solar parameters

🔲 Hook with NASA/ISRO API

🔲 Persist alerts in DB

🔲 Push notifications (mobile)

🔲 AI anomaly detection

👨‍💻 Contributing
PRs welcome! Please open an issue first for major changes.

📜 License
MIT © 2025 – Aditya FlareWatch Project

yaml
Copy code

---

Would you like me to **regenerate the full zip (`cme_detector.zip`) with the new
