(()=>{
const root=document.getElementById('bfm-sim'),q=s=>root.querySelector(s),el=p=>q('[data-p="'+p+'"]');
const allowed=new Set([4,5,8,9,10,13]),vectors=[];for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++)if(allowed.has(x*x+y*y))vectors.push([x,y]);
let chain=[],state=42,running=false,sweeps=0,accept=0,attempt=0,samples=0,sumC=0,sumRg=0,sumH=0;
const rnd=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
const params=()=>({eps:+el('eps').value,temp:+el('temp').value,burn:Math.max(0,+el('burn').value||0)});
function clear(){sweeps=accept=attempt=samples=sumC=sumRg=sumH=0;}
function overlap(p,i,arr=chain){return arr.some((v,j)=>j!==i&&Math.abs(v.x-p.x)<2&&Math.abs(v.y-p.y)<2);}

function orient(a,b,c){return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function onSegment(a,b,p){return orient(a,b,p)===0&&p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y);}
function intersects(a,b,c,d){const u=orient(a,b,c),v=orient(a,b,d),w=orient(c,d,a),z=orient(c,d,b);return (u*v<0&&w*z<0)||onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b);}
function growthCrosses(p){const a=chain[chain.length-1];for(let j=0;j<chain.length-2;j++)if(intersects(a,p,chain[j],chain[j+1]))return true;return false;}
function inTriangle(p,a,b,c){if(orient(a,b,c)===0)return onSegment(a,b,p)||onSegment(b,c,p)||onSegment(c,a,p);const u=orient(a,b,p),v=orient(b,c,p),w=orient(c,a,p);return (u>=0&&v>=0&&w>=0)||(u<=0&&v<=0&&w<=0);}
function moveCrosses(i,p){const old=chain[i];for(const k of [i-1,i+1]){if(k<0||k>=chain.length)continue;const fixed=chain[k];for(let j=0;j<chain.length-1;j++){if(j===i||j+1===i||j===k||j+1===k)continue;const a=chain[j],b=chain[j+1];if(intersects(fixed,p,a,b)||intersects(old,p,a,b)||inTriangle(a,fixed,old,p)||inTriangle(b,fixed,old,p))return true;}}return false;}
function init(){let n=Math.max(8,Math.min(128,Math.round(+el('n').value||48)));el('n').value=n;state=(+el('seed').value||42)>>>0;clear();
for(let trial=0;trial<30;trial++){chain=[{x:0,y:0}];for(let i=1;i<n;i++){let choices=vectors.map(([x,y])=>({x:chain[i-1].x+x,y:chain[i-1].y+y})).filter(p=>p.y>=0&&!overlap(p,-1)&&!growthCrosses(p));if(!choices.length)break;chain.push(choices[Math.floor(rnd()*choices.length)]);}if(chain.length===n)break;}
if(chain.length!==n){chain=Array.from({length:n},(_,i)=>({x:2*(i%2),y:2*i}));}draw();}
function stats(){const n=chain.length,mx=chain.reduce((s,p)=>s+p.x,0)/n,my=chain.reduce((s,p)=>s+p.y+1,0)/n;return {c:chain.filter(p=>p.y===0).length,rg:Math.sqrt(chain.reduce((s,p)=>s+(p.x-mx)**2+(p.y+1-my)**2,0)/n),h:my};}
function sweep(count){const p=params(),n=chain.length;for(let s=0;s<count;s++){for(let a=0;a<n;a++){attempt++;const i=Math.floor(rnd()*n);if(i===0&&el('tether').checked)continue;const old=chain[i],dir=Math.floor(rnd()*4),v={x:old.x+(dir===0?1:dir===1?-1:0),y:old.y+(dir===2?1:dir===3?-1:0)};
if(v.y<0||overlap(v,i))continue;let valid=true;for(const j of [i-1,i+1])if(j>=0&&j<n&&!allowed.has((v.x-chain[j].x)**2+(v.y-chain[j].y)**2))valid=false;if(!valid||moveCrosses(i,v))continue;
const de=-p.eps*((v.y===0?1:0)-(old.y===0?1:0));if(de<=0||rnd()<Math.exp(-de/p.temp)){chain[i]=v;accept++;}}
sweeps++;if(sweeps>p.burn){const t=stats();samples++;sumC+=t.c;sumRg+=t.rg;sumH+=t.h;}}
draw();}
function draw(){const svg=q('[data-scene]'),w=Math.max(280,svg.getBoundingClientRect().width),h=330,t=stats(),p=params();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
let xmin=Math.min(...chain.map(p=>p.x))-5,xmax=Math.max(...chain.map(p=>p.x))+7,ymax=Math.max(18,...chain.map(p=>p.y+5));const scale=Math.min((w-36)/(xmax-xmin),(h-50)/ymax),left=(w-(xmax-xmin)*scale)/2,X=x=>left+(x-xmin)*scale,Y=y=>h-32-y*scale;let markup='<title>Single-chain bond fluctuation simulation</title>';
if(scale>=5){for(let x=Math.ceil(xmin);x<=xmax;x++)markup+=`<path d="M${X(x)} ${Y(0)}V${Y(ymax)}" stroke="var(--border)" opacity=".35"/>`;for(let y=0;y<=ymax;y++)markup+=`<path d="M${X(xmin)} ${Y(y)}H${X(xmax)}" stroke="var(--border)" opacity=".35"/>`;}
markup+=`<path d="M${X(xmin)} ${Y(0)}H${X(xmax)}" stroke="var(--foreground)" stroke-width="2"/><text x="${X(xmin)}" y="${h-10}">Substrate · y = 0</text><text x="${w-12}" y="18" text-anchor="end">${(10/scale).toFixed(1)} lattice units / 10 px</text>`;
markup+=`<polyline points="${chain.map(p=>X(p.x+1)+','+Y(p.y+1)).join(' ')}" fill="none" stroke="var(--viz-series-1)" stroke-width="2"/>`;
chain.forEach((p,i)=>{markup+=`<rect x="${X(p.x)}" y="${Y(p.y+2)}" width="${2*scale}" height="${2*scale}" fill="var(--viz-series-1)" opacity=".65"/>`;if(p.y===0)markup+=`<circle cx="${X(p.x+1)}" cy="${Y(p.y+1)}" r="${Math.max(1.8,scale*.35)}" fill="var(--foreground)"/>`;if(i===0&&el('tether').checked)markup+=`<path d="M${X(p.x+1)} ${Y(p.y+2.5)}L${X(p.x+2.5)} ${Y(p.y+1)}L${X(p.x+1)} ${Y(p.y-.5)}L${X(p.x-.5)} ${Y(p.y+1)}Z" fill="none" stroke="var(--foreground)"/>`;});svg.innerHTML=markup;
q('[data-r="ratio"]').textContent='ε / kᵦT = '+(p.eps/p.temp).toFixed(2);q('[data-r="now"]').textContent=`Sweep ${sweeps.toLocaleString()} · Contacts ${t.c}/${chain.length} · Energy ${(-p.eps*t.c).toFixed(1)} E₀ · Rg ${t.rg.toFixed(2)} a · Acceptance ${attempt?(100*accept/attempt).toFixed(1):'0'}%`;
q('[data-r="avg"]').textContent=samples?`Sample means (${samples.toLocaleString()} sweeps): contact fraction ${(sumC/samples/chain.length).toFixed(3)} · Rg ${(sumRg/samples).toFixed(2)} a · center height ${(sumH/samples).toFixed(2)} a`:`Sampling starts after ${p.burn.toLocaleString()} sweeps.`;
}
q('[data-action="run"]').onclick=()=>{running=!running;q('[data-action="run"]').textContent=running?'Pause':'Run';};q('[data-action="step"]').onclick=()=>sweep(100);q('[data-action="restart"]').onclick=init;
for(const key of ['eps','temp'])el(key).oninput=()=>{q('[data-v="'+key+'"]').textContent=(+el(key).value).toFixed(1);clear();draw();};for(const key of ['n','seed','tether'])el(key).onchange=init;el('burn').onchange=()=>{clear();draw();};new ResizeObserver(draw).observe(q('[data-scene]'));init();setInterval(()=>{if(running)sweep(Math.max(1,Math.min(100,+el('speed').value||20)));},100);
})();
