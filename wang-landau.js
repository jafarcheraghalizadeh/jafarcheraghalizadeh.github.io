
(()=>{
const root=document.getElementById('wl-sim');
const N=8, V=N*N, spins=new Int8Array(V).fill(1);
const logG=new Float64Array(V+1), hist=new Float64Array(V+1);
// E = -2V + 4k. Energies one step from either extreme are impossible.
const bins=Array.from({length:V+1},(_,k)=>k).filter(k=>k!==1&&k!==V-1);
let energy=-2*V, logF=1, attempts=0, stage=1, running=false, done=false;
const visits=new Float64Array(V+1), absM=new Float64Array(V+1), m2=new Float64Array(V+1), m4=new Float64Array(V+1);
let samples=0, productionAttempts=0;
// After convergence, freeze logG and measure conditional magnetization moments.
function production(count){
 for(let t=0;t<count;t++){
  const i=Math.floor(Math.random()*V),x=i%N,y=Math.floor(i/N);
  const delta=2*spins[i]*(at(x-1,y)+at(x+1,y)+at(x,y-1)+at(x,y+1));
  const old=(energy+2*V)/4,next=(energy+delta+2*V)/4;
  if(Math.log(Math.random())<Math.min(0,logG[old]-logG[next])){spins[i]*=-1;energy+=delta;}
  productionAttempts++;
  // Allow burn-in, then sample once per sweep; correlations still remain.
  if(productionAttempts>1000*V&&productionAttempts%V===0){
   const k=(energy+2*V)/4,M=spins.reduce((a,b)=>a+b,0);
   visits[k]++;absM[k]+=Math.abs(M);m2[k]+=M*M;m4[k]+=M**4;samples++;
  }
 }
}
function thermodynamics(T){
 const a=bins.map(k=>logG[k]-(-2*V+4*k)/T),peak=Math.max(...a);
 const weights=a.map(v=>Math.exp(v-peak)),Z=weights.reduce((a,b)=>a+b,0);
 let U=0,E2=0,A=0,B=0,D=0;
 // Never fill missing conditional moments with zeros or renormalize their weights.
 const covered=bins.every(k=>visits[k]>0);
 bins.forEach((k,i)=>{
  const p=weights[i]/Z,E=-2*V+4*k;U+=p*E;E2+=p*E*E;
  if(covered){A+=p*absM[k]/visits[k];B+=p*m2[k]/visits[k];D+=p*m4[k]/visits[k];}
 });
 // Normalize g by the exactly two ground states for absolute F and S.
 const logZ=peak+Math.log(Z)+Math.log(2)-logG[0];
 return {u:U/V,c:Math.max(0,E2-U*U)/(V*T*T),f:-T*logZ/V,s:(logZ+U/T)/V,
  m:covered?A/V:null,chi:covered?B/(V*T):null,binder:covered&&B>0?1-D/(3*B*B):null};
}
const observableSpecs=[
 ['u','Energy per spin','E / N (J)'],['c','Heat capacity per spin','CV / N (kB)'],
 ['f','Free energy per spin','F / N (J)'],['s','Entropy per spin','S / N (kB)'],
 ['m','Mean absolute magnetization','⟨|M|⟩ / N'],['chi','Susceptibility per spin','χ (1 / J)'],
 ['binder','Binder cumulant','U4']
];
function thermoPlots(T,current){
 const selected=new Set(Array.from(root.querySelectorAll('#wl-choices input:checked'),el=>el.value));
 const temperatures=Array.from({length:91},(_,i)=>0.5+i*0.05);
 const curve=temperatures.map(t=>({t,...thermodynamics(t)}));
 const container=root.querySelector('#wl-thermo-plots');
 const available=root.clientWidth, width=available>700?(available-24)/2:available;
 const w=Math.max(280,width),h=240,l=72,r=18,top=14,bottom=48;
 const pw=w-l-r,ph=h-top-bottom,x=t=>l+(t-0.5)/4.5*pw;
 container.innerHTML=observableSpecs.filter(([key])=>selected.has(key)).map(([key,label,unit])=>{
  const values=curve.map(d=>d[key]);
  if(values.some(v=>v===null))return `<div class="wl-thermo-panel"><h3>${label}</h3><p class="note">Awaiting magnetic measurements at all accessible energies.</p></div>`;
  const lo=Math.min(...values),hi=Math.max(...values),pad=Math.max((hi-lo)*0.08,1e-6);
  const min=lo-pad,max=hi+pad,y=v=>top+(max-v)/(max-min)*ph;
  const fmt=v=>Math.abs(v)>=1000||Math.abs(v)>0&&Math.abs(v)<0.001?v.toExponential(1):Number(v.toPrecision(3)).toString();
  let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label} versus temperature"><title>${label} versus reduced temperature; selected value ${current[key].toFixed(4)}</title><rect x="${l}" y="${top}" width="${pw}" height="${ph}" fill="none" stroke="var(--line)"/>`;
  for(let i=0;i<4;i++){
   const v=min+(max-min)*i/3;
   svg+=`<text x="${l-7}" y="${y(v)+4}" text-anchor="end">${fmt(v)}</text>`;
  }
  for(const t of [0.5,2,3.5,5])svg+=`<text x="${x(t)}" y="${top+ph+20}" text-anchor="${t===0.5?'start':t===5?'end':'middle'}">${t}</text>`;
  const path=curve.map((d,i)=>`${i?'L':'M'}${x(d.t).toFixed(2)},${y(d[key]).toFixed(2)}`).join(' ');
  svg+=`<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="M${x(T)},${top}V${top+ph}" stroke="#b98b50" stroke-width="1" stroke-dasharray="4 3"/><circle cx="${x(T)}" cy="${y(current[key])}" r="4" fill="#b98b50"><title>T = ${T.toFixed(2)}, value = ${current[key].toFixed(4)}</title></circle><text x="${l+pw/2}" y="${h-5}" text-anchor="middle">Temperature kBT / J</text><text transform="translate(15,${top+ph/2}) rotate(-90)" text-anchor="middle">${unit}</text></svg>`;
  return `<div class="wl-thermo-panel"><h3>${label}</h3>${svg}<p class="note">At T = ${T.toFixed(2)}: ${current[key].toFixed(4)}</p></div>`;
 }).join('')||'<p class="note">Select an observable to display its temperature curve.</p>';
}
function observables(){
 const T=Number(root.querySelector('#wl-temp').value),o=thermodynamics(T);
 root.querySelector('#wl-temp-value').textContent=T.toFixed(2);
 thermoPlots(T,o);
 const rows=[['Energy per spin',o.u,'J'],['Heat capacity per spin cV = CV / N',o.c,'kB'],['Free energy per spin',o.f,'J'],['Entropy per spin',o.s,'kB'],['Mean |M| / N',o.m,''],['Susceptibility per spin',o.chi,'1 / J'],['Binder cumulant',o.binder,'']];
 root.querySelector('#wl-observables').innerHTML='<table class="table table-sm"><thead><tr><th>Observable</th><th class="text-end">Value</th><th>Units</th></tr></thead><tbody>'+rows.map(([name,v,unit])=>`<tr><td>${name}</td><td class="text-end tabular-nums">${v===null?'Awaiting measurements':v.toFixed(4)}</td><td>${unit}</td></tr>`).join('')+'</tbody></table>';
 root.querySelector('#wl-measure').textContent=done?`Frozen-DOS measurements: ${samples.toLocaleString()} samples; ${bins.filter(k=>visits[k]>0).length}/${bins.length} energies covered. Correlated samples; no error bars.`:'Provisional estimates: density of states is still adapting. Magnetic measurements begin after convergence.';
}
const at=(x,y)=>spins[((y+N)%N)*N+(x+N)%N];
function advance(count){
 for(let t=0;t<count&&!done;t++){
  const i=Math.floor(Math.random()*V),x=i%N,y=Math.floor(i/N);
  const delta=2*spins[i]*(at(x-1,y)+at(x+1,y)+at(x,y-1)+at(x,y+1));
  const old=(energy+2*V)/4, next=(energy+delta+2*V)/4;
  if(Math.log(Math.random())<Math.min(0,logG[old]-logG[next])){
   spins[i]*=-1;energy+=delta;
  }
  const k=(energy+2*V)/4;
  logG[k]+=logF;hist[k]++;attempts++;
  if(attempts%10000===0){
   const mean=bins.reduce((s,b)=>s+hist[b],0)/bins.length;
   if(mean>0&&bins.every(b=>hist[b]>=0.8*mean)){
    logF/=2;hist.fill(0);stage++;
    // Subtract a common offset; acceptance ratios are unchanged.
    const offset=Math.min(...bins.map(b=>logG[b]));
    for(const b of bins)logG[b]-=offset;
    if(logF<1e-6){done=true;}
   }
  }
 }
}
const canvas=root.querySelector('#wl-spins'),ctx=canvas.getContext('2d');
function color(name){return getComputedStyle(root).getPropertyValue(name).trim();}
function plot(title,values,yLabel){
 const width=Math.max(300,root.clientWidth),height=190,left=70,right=18,top=28,bottom=45;
 const pw=width-left-right,ph=height-top-bottom;
 const ymax=Math.max(1,...values),bar=pw/(V+1);
 let svg=`<svg class="wl-plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}"><text x="${left}" y="17">${title}</text><rect data-chart-frame x="${left}" y="${top}" width="${pw}" height="${ph}" fill="none" stroke="var(--border)"/>`;
 for(let j=0;j<bins.length;j++){
  const k=bins[j],h=values[j]/ymax*ph;
  svg+=`<rect x="${left+k*bar+bar*.1}" y="${top+ph-h}" width="${bar*.8}" height="${h}" fill="var(--viz-series-1)"><title>E=${-2*V+4*k}: ${values[j].toFixed(2)}</title></rect>`;
 }
 for(const k of [0,V/2,V])svg+=`<text x="${left+(k+.5)*bar}" y="${top+ph+18}" text-anchor="middle">${-2*V+4*k}</text>`;
 svg+=`<text x="${left-6}" y="${top+ph}" text-anchor="end">0</text><text x="${left-6}" y="${top+10}" text-anchor="end">${ymax.toPrecision(3)}</text><text class="axis-title" data-axis="x" x="${left+pw/2}" y="${height-5}" text-anchor="middle">Energy E / J</text><text class="axis-title" data-axis="y" transform="translate(15,${top+ph/2}) rotate(-90)" text-anchor="middle">${yLabel}</text></svg>`;
 return svg;
}
function draw(){
 ctx.fillStyle='#edf3f0';ctx.fillRect(0,0,320,320);
 for(let i=0;i<V;i++){
  const x=(i%N)*40+3,y=Math.floor(i/N)*40+3;
  ctx.fillStyle=spins[i]===1?color('--viz-series-1'):'#e6b46a';
  ctx.fillRect(x,y,34,34);
  ctx.fillStyle=spins[i]===1?color('--foreground'):color('--muted-foreground');
  ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(spins[i]===1?'+':'−',x+17,y+23);
 }
 const mean=bins.reduce((s,b)=>s+hist[b],0)/bins.length;
 const flat=mean?Math.min(...bins.map(b=>hist[b]))/mean:0;
 root.querySelector('#wl-status').textContent=`E = ${energy} J · ${attempts.toLocaleString()} flips · stage ${stage} · ln f = ${logF.toPrecision(3)} · flatness ${(flat*100).toFixed(0)}% / 80%${done?' · Measuring magnetization':''}`;
 const offset=Math.min(...bins.map(b=>logG[b]));
 root.querySelector('#wl-plots').innerHTML=plot('Current-stage energy histogram',bins.map(b=>hist[b]),'Visits')+plot('Estimated log density of states',bins.map(b=>logG[b]-offset),'ln g(E) + C');
 root.querySelector('#wl-run').textContent=running?'Pause':'Start';
 root.querySelector('#wl-step').disabled=running;
 observables();
}
let lastDraw=0;
function loop(timestamp){
 if(!root.isConnected)return;
 if(running&&document.visibilityState!=='hidden'){
  const count=Number(root.querySelector('#wl-speed').value);
  if(done)production(count);else advance(count);
  if(timestamp-lastDraw>150){draw();lastDraw=timestamp;}
 }
 requestAnimationFrame(loop);
}
root.querySelector('#wl-run').onclick=()=>{running=!running;draw();};
root.querySelector('#wl-step').onclick=()=>{if(done)production(1000);else advance(1000);draw();};
root.querySelector('#wl-temp').oninput=observables;
root.querySelectorAll('#wl-choices input').forEach(input=>input.onchange=observables);

new ResizeObserver(()=>draw()).observe(root);
draw();requestAnimationFrame(loop);
})();
