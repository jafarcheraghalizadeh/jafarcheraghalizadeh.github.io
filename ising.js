"use strict";
const size = 64;
const spins = new Int8Array(size * size);
let temperature = 2.27, running = false, sweeps = 0, lastFrame = 0;
const canvas = document.getElementById('lattice');
const ctx = canvas.getContext('2d');
const get = id => document.getElementById(id);
let energyHistory = [], energyOrigin = 0, energyStride = 1, temperatureChanges = [];
function neighbors(i) {
  const x = i % size, y = Math.floor(i / size);
  return spins[y * size + (x + 1) % size] + spins[y * size + (x + size - 1) % size]
    + spins[((y + 1) % size) * size + x] + spins[((y + size - 1) % size) * size + x];
}
function sweep() {
  for (let n = 0; n < spins.length; n++) {
    const i = Math.floor(Math.random() * spins.length);
    const deltaE = 2 * spins[i] * neighbors(i);
    if (deltaE <= 0 || Math.random() < Math.exp(-deltaE / temperature)) spins[i] *= -1;
  }
  sweeps++;
}
function render() {
  let magnetization = 0, energy = 0;
  const cell = canvas.width / size;
  for (let i = 0; i < spins.length; i++) {
    const x = i % size, y = Math.floor(i / size);
    magnetization += spins[i];
    energy -= spins[i] * (spins[y * size + (x + 1) % size] + spins[((y + 1) % size) * size + x]);
    ctx.fillStyle = spins[i] === 1 ? '#236253' : '#e6b46a';
    ctx.fillRect(x * cell, y * cell, cell, cell);
  }
  get('magnetization').textContent = (magnetization / spins.length).toFixed(3);
  get('energy').textContent = (energy / spins.length).toFixed(3);
  get('sweeps').textContent = sweeps;
  recordEnergy(energy / spins.length);
}

function recordEnergy(value) {
  const n = sweeps - energyOrigin;
  if (!energyHistory.length || n % energyStride === 0) {
    if (energyHistory.length && energyHistory[energyHistory.length - 1].n === n) energyHistory[energyHistory.length - 1].value = value;
    else energyHistory.push({n, value});
  }
  if (energyHistory.length > 4000) { energyStride *= 2; energyHistory = energyHistory.filter(p => p.n % energyStride === 0); }
  drawEnergy({n, value});
}
function drawEnergy(latest) {
  const left=80,right=750,top=30,bottom=335,maxN=Math.max(20,latest.n);
  const energyMax=Math.max(.1, Math.ceil(Math.max(latest.value,...energyHistory.map(p=>p.value))*10)/10+.05);
  const X=n=>left+n/maxN*(right-left),Y=e=>bottom-(e+2)/(energyMax+2)*(bottom-top);
  let marks='<rect width="800" height="410" fill="#fff"/>';
  for(let e=-2;e<=energyMax;e+=.5){const yy=Y(e);marks+='<path d="M'+left+' '+yy+'H'+right+'" stroke="#e5ebe8"/><text x="'+(left-12)+'" y="'+(yy+5)+'" text-anchor="end">'+e.toFixed(1)+'</text>';}
  for(let k=0;k<=4;k++){const n=Math.round(maxN*k/4),xx=X(n);marks+='<path d="M'+xx+' '+top+'V'+bottom+'" stroke="#e5ebe8"/><text x="'+xx+'" y="'+(bottom+24)+'" text-anchor="middle">'+n+'</text>';}
  marks+='<path d="M'+left+' '+top+'V'+bottom+'H'+right+'" fill="none" stroke="#53676a"/>';
  for (const change of temperatureChanges) {
    const xx=X(change.n);
    marks+='<path d="M'+xx+' '+top+'V'+bottom+'" stroke="#b98b50" stroke-dasharray="4 4" opacity=".65"><title>Temperature changed to '+change.temperature.toFixed(2)+' at sweep '+change.n+'</title></path>';
  }
  const points=energyHistory.slice();if(points[points.length-1]?.n!==latest.n)points.push(latest);
  marks+='<path d="'+points.map((p,i)=>(i?'L':'M')+X(p.n)+' '+Y(p.value)).join(' ')+'" fill="none" stroke="#236253" stroke-width="2"/>';
  marks+='<circle cx="'+X(latest.n)+'" cy="'+Y(latest.value)+'" r="4" fill="#d4a458"/>';
  marks+='<text x="415" y="393" text-anchor="middle">Monte Carlo sweeps since reset</text><text transform="translate(23,180) rotate(-90)" text-anchor="middle">Energy per spin E / (NJ)</text>';
  get('energy-plot').innerHTML=marks;
  get('energy-plot-note').textContent='T = '+temperature.toFixed(2)+' · '+latest.n+' sweeps · current E/(NJ) = '+latest.value.toFixed(3)+(energyStride>1?' · older samples shown every '+energyStride+' sweeps':' · one sample per sweep');
}

function reset(mode = 'random') {
  for (let i = 0; i < spins.length; i++) spins[i] = mode === 'ordered' ? 1 : Math.random() < .5 ? -1 : 1;
  sweeps = 0;
  energyOrigin = 0; energyHistory = []; energyStride = 1; temperatureChanges = [];
  render();
}
function setTemperature(value) {
  const nextTemperature = Number(value);
  const changed = nextTemperature !== temperature;
  temperature = nextTemperature;
  get('temperature').value = temperature;
  get('temperature-value').textContent = temperature.toFixed(2);
  if (changed) { temperatureChanges.push({n: sweeps - energyOrigin, temperature}); render(); }
}
get('temperature').addEventListener('input', event => setTemperature(event.target.value));
get('toggle').addEventListener('click', () => {
  running = !running;
  get('toggle').textContent = running ? 'Pause' : 'Start';
  get('status').textContent = running ? 'Running' : 'Paused';
});
get('step').addEventListener('click', () => { sweep(); render(); });
get('reset').addEventListener('click', () => reset());
get('ordered').addEventListener('click', () => reset('ordered'));
document.querySelectorAll('[data-temperature]').forEach(button => button.addEventListener('click', () => setTemperature(button.dataset.temperature)));
function frame(now) {
  if (running && now - lastFrame >= 50) {
    sweep(); render(); lastFrame = now;
  }
  requestAnimationFrame(frame);
}
setTemperature(temperature); reset(); requestAnimationFrame(frame);
