// app.realtime.js — increased chart spacing via Chart.js layout & padding

function fmtPct(p){ if(p==null) return "— %"; return Math.round(p*100) + " %"; }
function fmtMkm(v){ return (v!=null ? v : "—") + " M km"; }
function fmtIntensity(v){ return (v!=null ? v.toFixed(2) : "—") + " / 10"; }
function fmtWindow(w){ if(!w) return "—"; return new Date(w.start).toLocaleTimeString() + " – " + new Date(w.end).toLocaleTimeString(); }

let socket=null, simTimer=null, connected=false;
const samples=[], alerts=[];
let windChart, fluxChart, magChart, overviewChart, intensityChart;

function setConnStatus(mode){
  const el=document.getElementById('connStatus');
  if(!el) return;
  el.classList.remove('ok','sim','err');
  if(mode==='ok'){ el.classList.add('ok'); el.title='WebSocket connected'; }
  else if(mode==='sim'){ el.classList.add('sim'); el.title='Simulation running'; }
  else { el.classList.add('err'); el.title='Disconnected'; }
}

function updateKPIs(s){
  if(!s) return;
  document.getElementById('k_wind').innerText = `${s.wind} km/s`;
  document.getElementById('k_flux').innerText = `${s.flux} /cm²·s`;
  document.getElementById('k_mag').innerText  = `${s.mag} nT`;
  document.getElementById('k_intensity').innerText = fmtIntensity(s.intensity);
  document.getElementById('k_prob').innerText = fmtPct(s.hitProbability);
  document.getElementById('k_close').innerText = fmtMkm(s.closeToEarthMkm);
  document.getElementById('k_region').innerText = s.expectedImpact ? `${s.expectedImpact.region} (${s.expectedImpact.lat.toFixed(0)}, ${s.expectedImpact.lon.toFixed(0)})` : '—';
  document.getElementById('k_window').innerText = fmtWindow(s.impactWindow);
  document.getElementById('k_eclipse').innerText = s.solarEclipse ? `${new Date(s.solarEclipse.date).toLocaleDateString()} • ${s.solarEclipse.type} • ${s.solarEclipse.visibility}` : '—';
}

function prependAlert(a){
  const container=document.getElementById('alertsList');
  const node=document.createElement('div');
  node.className='alert-item '+a.severity;
  node.innerHTML = `
    <div>
      <div style="font-weight:700">${a.metric}</div>
      <div class="meta">${new Date(a.timestamp).toLocaleString()}</div>
      <div class="meta" style="margin-top:6px">${a.note || ''}</div>
    </div>
    <div style="text-align:right">
      <div style="font-weight:800">${a.value}</div>
      <div class="meta">${a.severity}</div>
    </div>`;
  container.prepend(node);
  if(window.anime) anime({targets: node, translateY:[-12,0], opacity:[0,1], duration:650, easing:'easeOutExpo'});
}

function renderAlertsList(filter={HIGH:true,MEDIUM:true,LOW:true}){
  const container=document.getElementById('alertsList'); container.innerHTML='';
  const shown=alerts.filter(a=>filter[a.severity]);
  if(!shown.length){ const el=document.createElement('div'); el.className='card'; el.textContent='No alerts in recent samples.'; container.appendChild(el); return; }
  shown.slice().reverse().forEach(a=>prependAlert(a));
}

/* Shared chart spacing options */
const baseChartOptions = {
  responsive:true,
  maintainAspectRatio:false,
  layout:{ padding:{ top:14, right:18, bottom:20, left:12 } },    // EXTRA INNER PADDING
  interaction:{ mode:'index', intersect:false },
  plugins:{
    legend:{ display:true, labels:{ boxWidth:12, boxHeight:12, padding:18 } }, // MORE LEGEND PADDING
    tooltip:{ padding:12 }
  },
  scales:{
    x:{ display:false, ticks:{ padding:10 }, grid:{ drawTicks:false } },
    y:{ ticks:{ padding:10 }, grid:{ drawTicks:false } }
  }
};

function makeCharts(initial){
  const labels = initial.map(s=>new Date(s.timestamp).toLocaleTimeString());

  const ovCtx=document.getElementById('overviewChart').getContext('2d');
  overviewChart=new Chart(ovCtx,{
    type:'line',
    data:{
      labels,
      datasets:[
        { label:'Wind (km/s)', data: initial.map(s=>s.wind), yAxisID:'y1', tension:0.3, fill:true, borderWidth:2 },
        { label:'Intensity (0–10)', data: initial.map(s=>s.intensity), yAxisID:'y2', tension:0.3, fill:true, borderWidth:2 }
      ]
    },
    options:{
      ...baseChartOptions,
      plugins:{ ...baseChartOptions.plugins, legend:{ ...baseChartOptions.plugins.legend, position:'top' } },
      scales:{
        ...baseChartOptions.scales,
        y1:{ type:'linear', position:'left' },
        y2:{ type:'linear', position:'right', min:0, max:10, grid:{ drawOnChartArea:false }, ticks:{ padding:12 } }
      }
    }
  });

  function smallLine(ctxId, label, data, yOpts={}){
    return new Chart(document.getElementById(ctxId).getContext('2d'),{
      type:'line',
      data:{ labels, datasets:[{ label, data, tension:0.3, borderWidth:2 }] },
      options:{
        ...baseChartOptions,
        plugins:{ ...baseChartOptions.plugins, legend:{ display:false } },
        scales:{ x: baseChartOptions.scales.x, y: { ...baseChartOptions.scales.y, ...yOpts } }
      }
    });
  }

  windChart = smallLine('windChart','Wind', initial.map(s=>s.wind));
  fluxChart = smallLine('fluxChart','Flux', initial.map(s=>s.flux));
  magChart  = smallLine('magChart','Mag',  initial.map(s=>s.mag));
  intensityChart = new Chart(document.getElementById('intensityChart').getContext('2d'),{
    type:'line',
    data:{ labels, datasets:[
      { label:'Intensity (×10)', data: initial.map(s=>s.intensity*10), tension:0.3, borderWidth:2 },
      { label:'Hit Probability (%)', data: initial.map(s=>Math.round(s.hitProbability*100)), tension:0.3, borderWidth:2 }
    ]},
    options:{
      ...baseChartOptions,
      plugins:{ ...baseChartOptions.plugins, legend:{ ...baseChartOptions.plugins.legend, display:true, position:'top' } },
      scales:{ x: baseChartOptions.scales.x, y:{ min:0, max:100, ticks:{ padding:12 }, grid:{ drawTicks:false } } }
    }
  });
}

function pushToCharts(s){
  const label=new Date(s.timestamp).toLocaleTimeString();

  function push(chart, val){
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(val);
    if(chart.data.labels.length>200){ chart.data.labels.shift(); chart.data.datasets[0].data.shift(); }
    chart.update('none');
  }

  push(windChart, s.wind);
  push(fluxChart, s.flux);
  push(magChart,  s.mag);

  overviewChart.data.labels.push(label);
  overviewChart.data.datasets[0].data.push(s.wind);
  overviewChart.data.datasets[1].data.push(s.intensity);
  if(overviewChart.data.labels.length>200){
    overviewChart.data.labels.shift();
    overviewChart.data.datasets[0].data.shift();
    overviewChart.data.datasets[1].data.shift();
  }
  overviewChart.update('none');

  intensityChart.data.labels.push(label);
  intensityChart.data.datasets[0].data.push(s.intensity*10);
  intensityChart.data.datasets[1].data.push(Math.round(s.hitProbability*100));
  if(intensityChart.data.labels.length>200){
    intensityChart.data.labels.shift();
    intensityChart.data.datasets[0].data.shift();
    intensityChart.data.datasets[1].data.shift();
  }
  intensityChart.update('none');
}

/* WebSocket */
function connectWS(url){
  if(socket){ socket.close(); socket=null; }
  try{ socket=new WebSocket(url); }catch(e){ alert('Invalid WebSocket URL'); return; }

  socket.onopen = () => { connected=true; setConnStatus('ok'); if(simTimer){ clearInterval(simTimer); simTimer=null; document.getElementById('btn-simulate').innerText='Start Live Simulation'; } };
  socket.onclose = () => { connected=false; setConnStatus('err'); };
  socket.onerror = () => { connected=false; setConnStatus('err'); };

  socket.onmessage = (evt)=>{
    let msg; try{ msg=JSON.parse(evt.data); }catch{ return; }
    if(msg.type==='bulk'){
      samples.push(...msg.samples);
      alerts.push(...(msg.alerts||[]));
      if(!overviewChart) makeCharts(samples.slice(-60));
      renderAlertsList();
      updateKPIs(samples[samples.length-1]);
    }else if(msg.type==='sample'){
      const s=msg.sample;
      samples.push(s); if(samples.length>600) samples.shift();
      (msg.alerts||[]).forEach(a=>{ alerts.push(a); prependAlert(a); });
      updateKPIs(s); pushToCharts(s);
    }
  };
}

/* Simulator for offline demo */
function rnd(min,max,dec=1){ const v=Math.random()*(max-min)+min; return Math.round(v*Math.pow(10,dec))/Math.pow(10,dec); }
function generateSim(){
  const t=new Date().toISOString();
  const intensity=rnd(2,9,2), hitProbability=rnd(0.2,0.95,3), closeToEarthMkm=rnd(8,52,1);
  const regions=["North America","Europe/N. Atlantic","South America","Africa","South Asia","East Asia","Australia","Pacific","Polar (Auroral Zone)"];
  const region=regions[Math.floor(Math.random()*regions.length)];
  return {
    timestamp:t, wind:rnd(280,880,1), flux:rnd(2,110,1), mag:rnd(1,28,1), density:rnd(2,40,1),
    intensity, hitProbability, closeToEarthMkm,
    expectedImpact:{ lat:rnd(-70,70,0), lon:rnd(-170,170,0), region },
    impactWindow:{ start:new Date(Date.now()+60*60000).toISOString(), end:new Date(Date.now()+4*3600*1000).toISOString() },
    solarEclipse:{ date:new Date(Date.now()+Math.random()*150*86400000).toISOString(), type:["Total","Annular","Partial","Hybrid"][Math.floor(Math.random()*4)], visibility:region }
  };
}

function toggleSimulator(){
  if(simTimer){ clearInterval(simTimer); simTimer=null; document.getElementById('btn-simulate').innerText='Start Live Simulation'; if(!connected) setConnStatus('err'); return; }
  document.getElementById('btn-simulate').innerText='Stop Simulation';
  setConnStatus('sim');
  if(!overviewChart){
    const seed=[]; for(let i=0;i<50;i++){ const s=generateSim(); seed.push(s); samples.push(s); }
    makeCharts(seed); updateKPIs(seed[seed.length-1]);
  }
  simTimer=setInterval(()=>{
    const s=generateSim();
    samples.push(s); if(samples.length>600) samples.shift();
    pushToCharts(s); updateKPIs(s);
    if(s.intensity>8.5) prependAlert({ timestamp:s.timestamp, metric:'CME Intensity', value:s.intensity.toFixed(2), severity:'HIGH', note:'Severe CME intensity (sim)' });
    else if(s.hitProbability>0.8) prependAlert({ timestamp:s.timestamp, metric:'Impact Probability', value:Math.round(s.hitProbability*100)+'%', severity:'MEDIUM', note:'Likely impact (sim)' });
  }, 1600);
}

/* UI */
function setupControls(){
  document.getElementById('btn-simulate').addEventListener('click', toggleSimulator);
  document.getElementById('connectBtn').addEventListener('click', ()=>{ const url=document.getElementById('wsUrl').value.trim() || 'ws://localhost:4000/ws'; connectWS(url); });
  document.getElementById('themeToggle').addEventListener('click', ()=>{ document.body.classList.toggle('light'); document.getElementById('themeToggle').innerText = document.body.classList.contains('light') ? '🌞' : '🌙'; });
  document.getElementById('downloadSample').addEventListener('click', ()=>{
    const payload={generated:new Date().toISOString(),samples,alerts};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download='flarewatch-samples.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
  ['filter-high','filter-medium','filter-low'].forEach(id=>{
    const el=document.getElementById(id);
    el && el.addEventListener('change', ()=>{
      renderAlertsList({ HIGH:document.getElementById('filter-high').checked, MEDIUM:document.getElementById('filter-medium').checked, LOW:document.getElementById('filter-low').checked });
    });
  });
}

window.addEventListener('load', ()=>{
  if(window.particlesJS) particlesJS('particles-js',{particles:{number:{value:40},size:{value:2},move:{speed:0.8}},interactivity:{events:{onhover:{enable:true,mode:'repulse'}}}});
  setupControls();
  setConnStatus('err');
});
