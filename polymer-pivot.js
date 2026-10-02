"use strict";
(() => {
const get=id=>document.getElementById(id),canvas=get("chain-canvas"),ctx=canvas.getContext("2d");
const transforms=[(x,y)=>[-y,x],(x,y)=>[-x,-y],(x,y)=>[y,-x],(x,y)=>[-x,y],(x,y)=>[x,-y],(x,y)=>[y,x],(x,y)=>[-y,-x]];
let N=64,chain=[],sweeps=0,attempts=0,accepted=0,running=false,timer=null,samples=[];
function attempt(k=Math.floor(Math.random()*N), transform=transforms[Math.floor(Math.random()*7)]){
 attempts++;const [px,py]=chain[k],next=chain.slice(0,k+1),occupied=new Set(next.map(p=>p.join(",")));
 for(let i=k+1;i<=N;i++){const [a,b]=transform(chain[i][0]-px,chain[i][1]-py),p=[px+a,py+b],key=p.join(",");if(occupied.has(key))return false;occupied.add(key);next.push(p);}
 chain=next;accepted++;return true;
}
function sweep(){for(let i=0;i<N;i++)attempt();sweeps++;if(sweeps>20){samples.push(chain[N].slice());if(samples.length>1200)samples.shift();}render();}
function stop(){running=false;clearInterval(timer);get("chain-toggle").textContent="Start";get("chain-status").textContent="Paused";}
function start(){running=true;get("chain-toggle").textContent="Pause";get("chain-status").textContent="Running";clearInterval(timer);timer=setInterval(sweep,Number(get("sweep-time").value));}
function reset(){stop();N=Number(get("chain-length").value);chain=Array.from({length:N+1},(_,i)=>[i,0]);sweeps=attempts=accepted=0;samples=[];render();}
function estimate(){
 const n=samples.length;if(!n)return {plateau:0,points:[]};
 let sx=0,sy=0,sr=0;for(const [x,y] of samples){sx+=x;sy+=y;sr+=x*x+y*y;}
 const plateau=Math.max(0,2*(sr/n-(sx/n)**2-(sy/n)**2));
 const points=[];for(let lag=0;lag<=Math.min(128,Math.floor(n/3));lag++){let sum=0;for(let i=0;i<n-lag;i++){const dx=samples[i+lag][0]-samples[i][0],dy=samples[i+lag][1]-samples[i][1];sum+=dx*dx+dy*dy;}points.push({lag,value:sum/(n-lag)});}
 return {plateau,points};
}
function render(){
 ctx.clearRect(0,0,640,480);ctx.fillStyle="#f7f8fa";ctx.fillRect(0,0,640,480);
 const xs=chain.map(p=>p[0]),ys=chain.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(560/Math.max(12,maxX-minX),400/Math.max(12,maxY-minY)),X=x=>320+(x-(minX+maxX)/2)*scale,Y=y=>240-(y-(minY+maxY)/2)*scale;
 ctx.strokeStyle="#236253";ctx.lineWidth=2;ctx.beginPath();chain.forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));ctx.stroke();
 for(let i=0;i<chain.length;i++){ctx.fillStyle=i===0?"#d4a458":i===N?"#ce7958":"#236253";ctx.beginPath();ctx.arc(X(chain[i][0]),Y(chain[i][1]),i===0||i===N?5:2,0,Math.PI*2);ctx.fill();}
 get("chain-sweeps").textContent=sweeps;get("chain-acceptance").textContent=attempts?(100*accepted/attempts).toFixed(1)+"%":"—";
 get("chain-r2").textContent=chain[N][0]**2+chain[N][1]**2;
 get("chain-samples").textContent=samples.length;get("chain-burn").textContent=sweeps<=20?"Warm-up: "+sweeps+" / 20 sweeps":"Collecting endpoint samples";
 const {points,plateau}=estimate();const l=80,r=750,t=30,b=330,maxLag=Math.max(10,points.at(-1)?.lag||0),maxYPlot=Math.max(1,plateau*1.2,...points.map(p=>p.value*1.1)),cx=v=>l+v/maxLag*(r-l),cy=v=>b-v/maxYPlot*(b-t);
 let svg='<rect width="800" height="410" fill="white"/>';
 for(let k=0;k<=4;k++){const yy=cy(maxYPlot*k/4),xx=cx(maxLag*k/4);svg+='<path d="M'+l+' '+yy+'H'+r+'M'+xx+' '+t+'V'+b+'" stroke="#e5ebe8"/><text x="'+(l-10)+'" y="'+(yy+5)+'" text-anchor="end">'+Math.round(maxYPlot*k/4)+'</text><text x="'+xx+'" y="355" text-anchor="middle">'+Math.round(maxLag*k/4)+'</text>';}
 svg+='<path d="M'+l+' '+t+'V'+b+'H'+r+'" stroke="#53676a" fill="none"/>';
 if(points.length>1){svg+='<path d="'+points.map((p,i)=>(i?"L":"M")+cx(p.lag)+" "+cy(p.value)).join(" ")+'" fill="none" stroke="#236253" stroke-width="2.5"/><path d="M'+l+' '+cy(plateau)+'H'+r+'" stroke="#b98b50" stroke-width="2" stroke-dasharray="6 5"/>';}
 else svg+='<text x="410" y="170" text-anchor="middle">Collect samples after warm-up to see the MSD.</text>';
 svg+='<text x="415" y="395" text-anchor="middle">Lag Δs (Monte Carlo sweeps)</text><text transform="translate(22,185) rotate(-90)" text-anchor="middle">Endpoint MSD (bond length²)</text>';
 get("chain-msd").innerHTML=svg;get("plateau-value").textContent=plateau.toFixed(2);
}
get("chain-toggle").addEventListener("click",()=>running?stop():start());
get("chain-step").addEventListener("click",()=>{stop();sweep();});
get("chain-reset").addEventListener("click",reset);get("chain-length").addEventListener("change",reset);
get("sweep-time").addEventListener("change",()=>{if(running)start();});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
reset();
})();