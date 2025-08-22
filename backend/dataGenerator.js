// dataGenerator.js — simulator + derived features + alerts
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
function randn(){
  let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

const REGIONS = [
  { name:"North America", lat:40, lon:-100 },
  { name:"Europe/N. Atlantic", lat:52, lon:5 },
  { name:"South America", lat:-15, lon:-60 },
  { name:"Africa", lat:10, lon:20 },
  { name:"South Asia", lat:20, lon:78 },
  { name:"East Asia", lat:30, lon:110 },
  { name:"Australia", lat:-25, lon:134 },
  { name:"Pacific", lat:12, lon:-160 },
  { name:"Polar (Auroral Zone)", lat:66, lon:30 }
];

function nextImpactRegion(intensity, prob){
  const polarBias = intensity > 6 ? 0.25 : 0.1;
  if(Math.random() < polarBias + prob * 0.3) return REGIONS[8];
  return REGIONS[Math.floor(Math.random()*8)];
}

function nextEclipseInfo(now = new Date()){
  const days = 30 + Math.floor(Math.random()*150);
  const d = new Date(now.getTime() + days*86400000);
  const types = ["Total","Annular","Partial","Hybrid"];
  const vis = ["Africa","Americas","Europe","Asia","Oceania","Polar regions","Global (partial)"];
  return { date:d.toISOString(), type:types[Math.floor(Math.random()*types.length)], visibility:vis[Math.floor(Math.random()*vis.length)] };
}

function generateSample(){
  const t = Date.now();
  const wind = clamp(400 + 35*Math.sin(t/900000) + randn()*25, 250, 900);
  const flux = clamp(6 + 1.2*Math.cos(t/1100000) + randn()*0.8, 2, 120);
  const mag  = clamp(3 + 0.5*Math.sin(t/1300000) + randn()*0.6, 1, 30);
  const density = clamp(8 + randn()*3, 1, 45);

  const intensity = clamp(
    0.25*((wind-250)/650*10) + 0.45*(flux/120*10) + 0.30*(mag/30*10) + randn()*0.6,
    0, 10
  );

  const directionFactor = 0.5 + Math.abs(Math.sin(t/700000))*0.5;
  const hitProbability = clamp((intensity/10)*0.75*directionFactor + Math.random()*0.1, 0, 1);
  const closeToEarthMkm = clamp(60 - (intensity*3) - (hitProbability*20) + Math.random()*6, 5, 60);

  const start = new Date(t + (30 + (1-hitProbability)*60)*60000);
  const end   = new Date(start.getTime() + (120 + (1-hitProbability)*180)*60000);

  const impact = nextImpactRegion(intensity, hitProbability);
  const eclipse = nextEclipseInfo(new Date(t));

  const alerts = [];
  if (wind > 700) alerts.push({ timestamp:t, metric:"Wind Speed", value:+wind.toFixed(1), severity:"HIGH", note:"Strong solar wind" });
  else if (wind > 550) alerts.push({ timestamp:t, metric:"Wind Speed", value:+wind.toFixed(1), severity:"MEDIUM", note:"Elevated solar wind" });

  if (flux > 90) alerts.push({ timestamp:t, metric:"Particle Flux", value:+flux.toFixed(1), severity:"HIGH", note:"Particle flux spike" });
  else if (flux > 60) alerts.push({ timestamp:t, metric:"Particle Flux", value:+flux.toFixed(1), severity:"MEDIUM", note:"Particle flux elevated" });

  if (intensity > 8) alerts.push({ timestamp:t, metric:"CME Intensity", value:+intensity.toFixed(2), severity:"HIGH", note:"Severe CME intensity" });
  else if (intensity > 6.5) alerts.push({ timestamp:t, metric:"CME Intensity", value:+intensity.toFixed(2), severity:"MEDIUM", note:"High CME intensity" });

  if (hitProbability > 0.8) alerts.push({ timestamp:t, metric:"Impact Probability", value:Math.round(hitProbability*100)+"%", severity:"HIGH", note:"High probability of Earth impact" });
  else if (hitProbability > 0.6) alerts.push({ timestamp:t, metric:"Impact Probability", value:Math.round(hitProbability*100)+"%", severity:"MEDIUM", note:"Moderate probability of impact" });

  return {
    type:"sample",
    sample:{
      timestamp:new Date(t).toISOString(),
      wind:+wind.toFixed(1),
      flux:+flux.toFixed(1),
      mag:+mag.toFixed(1),
      density:+density.toFixed(1),
      intensity:+intensity.toFixed(2),
      hitProbability:+hitProbability.toFixed(3),
      closeToEarthMkm:+closeToEarthMkm.toFixed(1),
      expectedImpact:{ lat:impact.lat, lon:impact.lon, region:impact.name },
      impactWindow:{ start:start.toISOString(), end:end.toISOString() },
      solarEclipse:eclipse
    },
    alerts
  };
}

module.exports = { generateSample };
