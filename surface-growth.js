"use strict";
(() => {
const get = id => document.getElementById(id);
const canvas = get('growth-canvas'), ctx = canvas.getContext('2d');
let size, heights, layers, events, history, running = false, last = 0, carry = 0;
function pause(message = 'Paused') { running = false; carry = 0; get('growth-toggle').textContent = 'Start'; get('growth-status').textContent = message; }
function neighbors(i) {
 return [(i + 1) % size, (i + size - 1) % size];
}
function measure() {
 const mean = heights.reduce((a,b) => a+b,0) / heights.length;
 const width = Math.sqrt(heights.reduce((a,b) => a+(b-mean)**2,0) / heights.length);
 return {t: layers, mean, width};
}
function layer() {
 if (layers >= 1000) return;
 const model = get('growth-model').value;
 for (let k=0;k<heights.length;k++) {
  let i = Math.floor(Math.random()*heights.length);
  if (model === 'relaxation') {
   const candidates = [i,...neighbors(i)];
   const low = Math.min(...candidates.map(j => heights[j]));
   const ties = candidates.filter(j => heights[j] === low);
   i = ties[Math.floor(Math.random()*ties.length)]; heights[i]++;
  } else if (model === 'ballistic') heights[i] = Math.max(heights[i]+1,...neighbors(i).map(j=>heights[j]));
  else heights[i]++;
 }
 events += heights.length; layers++; history.push(measure());
 if (layers >= 1000) pause('1,000 layers reached. Reset to start again.');
}
function plot(id, field, label) {
 const xmax = Math.max(10,layers), ymax = Math.max(1,...history.map(p=>p[field]))*1.1;
 const X = t=>80+680*t/xmax, Y = v=>290-260*v/ymax;
 let svg = '<rect width="800" height="360" fill="white"/>';
 for(let k=0;k<=5;k++) {
  const x=80+680*k/5,y=290-260*k/5;
  svg += `<path d="M${x} 30V290M80 ${y}H760" stroke="#e5ebe8" fill="none"/><text x="${x}" y="315" text-anchor="middle">${(xmax*k/5).toFixed(0)}</text><text x="68" y="${y+5}" text-anchor="end">${(ymax*k/5).toFixed(1)}</text>`;
 }
 svg += '<path d="M80 30V290H760" stroke="#53676a" fill="none"/>';
 svg += `<polyline points="${history.map(p=>X(p.t)+','+Y(p[field])).join(' ')}" stroke="#236253" stroke-width="2.5" fill="none"/><text x="420" y="348" text-anchor="middle">Deposited layers t (events / L)</text><text transform="translate(20,160) rotate(-90)" text-anchor="middle">${label} (height units)</text>`;
 if (!layers) svg += '<text x="420" y="150" text-anchor="middle">Run the simulation to collect measurements.</text>';
 get(id).innerHTML=svg;
}
function draw() {
 const low = Math.min(...heights), high = Math.max(...heights), cell=540/size;
 const ymax=Math.max(10,high*1.1), Y=h=>550-480*h/ymax;
 ctx.fillStyle='#f7f8fa';ctx.fillRect(0,0,640,640);
 ctx.font='16px system-ui';ctx.fillStyle='#53676a';
 for(let k=0;k<=4;k++) {
  const h=ymax*k/4,y=Y(h);ctx.strokeStyle='#dce4e2';ctx.beginPath();ctx.moveTo(65,y);ctx.lineTo(605,y);ctx.stroke();ctx.fillText(h.toFixed(1),8,y+5);
 }
 ctx.fillStyle='#236253';
 for(let i=0;i<size;i++)ctx.fillRect(65+i*cell,Y(heights[i]),Math.max(1,cell-1),550-Y(heights[i]));
 ctx.strokeStyle='#192d30';ctx.beginPath();ctx.moveTo(65,70);ctx.lineTo(65,550);ctx.lineTo(605,550);ctx.stroke();
 ctx.fillStyle='#53676a';ctx.fillText('0',65,580);ctx.fillText(String(size-1),580,580);ctx.fillText('Site x',300,615);ctx.fillText('Height h(x)',65,40);
 const m=history[history.length-1];
 get('growth-time').textContent=layers; get('growth-events').textContent=events.toLocaleString();
 get('growth-mean').textContent=m.mean.toFixed(3); get('growth-width').textContent=m.width.toFixed(3); get('growth-max').textContent=high;
 get('height-scale').textContent=`Height range: ${low}–${high} units · ${size} sites`;
 canvas.setAttribute('aria-label',`Surface height profile at ${layers} deposited layers. Height range ${low} to ${high}, roughness ${m.width.toFixed(3)}.`);
 plot('mean-plot','mean','Mean height ⟨h⟩'); plot('width-plot','width','Roughness W');
}
function reset() { pause(); size=Number(get('growth-size').value); heights=new Float64Array(size); layers=events=0; history=[measure()]; draw(); }
get('growth-toggle').addEventListener('click',()=>{if(running)pause();else if(layers<1000){running=true;get('growth-toggle').textContent='Pause';get('growth-status').textContent='Running';}});
get('growth-step').addEventListener('click',()=>{pause();layer();draw();});
get('growth-reset').addEventListener('click',reset);
for (const id of ['growth-model','growth-size']) get(id).addEventListener('change',reset);
get('growth-speed').addEventListener('input',e=>{get('growth-speed-value').textContent=e.target.value;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function frame(now) {
 const dt=last ? Math.min((now-last)/1000,.1) : 0;last=now;
 if(running){carry+=dt*Number(get('growth-speed').value);let changed=false;while(carry>=1&&running){carry--;layer();changed=true;}if(changed)draw();}
 requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
})();
