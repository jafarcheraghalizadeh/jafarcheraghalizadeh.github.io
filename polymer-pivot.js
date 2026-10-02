"use strict";
(() => {
const get=id=>document.getElementById(id),canvas=get("chain-canvas"),ctx=canvas.getContext("2d");
const transforms=[(x,y)=>[-y,x],(x,y)=>[-x,-y],(x,y)=>[y,-x],(x,y)=>[-x,y],(x,y)=>[x,-y],(x,y)=>[y,x],(x,y)=>[-y,-x]];
let N=64,chain=[],sweeps=0,attempts=0,accepted=0,running=false,timer=null,samples=[],lastMove=null,busy=false,generation=0,shapeSums=new Float64Array(65),shapeCount=0;
const names=["Rotate 90° counterclockwise","Rotate 180°","Rotate 90° clockwise","Reflect across y axis","Reflect across x axis","Reflect across y = x","Reflect across y = −x"];
function attempt(k=Math.floor(Math.random()*N), transform=transforms[Math.floor(Math.random()*7)]){
 attempts++;const [px,py]=chain[k],next=chain.slice(0,k+1),occupied=new Set(next.map(p=>p.join(",")));
 let collision=false;
 for(let i=k+1;i<=N;i++){const [a,b]=transform(chain[i][0]-px,chain[i][1]-py),p=[px+a,py+b],key=p.join(",");if(occupied.has(key))collision=true;occupied.add(key);next.push(p);}
 lastMove={k,pivot:[px,py],proposal:next,accepted:!collision,name:names[transforms.indexOf(transform)]||"Custom symmetry"};
 if(!collision){chain=next;accepted++;}
 if(attempts%N===0){sweeps++;if(sweeps>20){shapeCount++;for(let bead=1;bead<=N;bead++)shapeSums[bead]+=chain[bead][0]**2+chain[bead][1]**2;const sample=chain[N].slice();sample.com=chain.reduce((a,p)=>[a[0]+p[0]/chain.length,a[1]+p[1]/chain.length],[0,0]);samples.push(sample);if(samples.length>1200)samples.shift();}}
 return !collision;
}
function sweep(){
 if(busy)return;busy=true;const token=generation;let remaining=N;
 function chunk(){if(token!==generation)return;const until=performance.now()+8;do{attempt();remaining--;}while(remaining>0&&performance.now()<until);
 if(remaining>0)setTimeout(chunk,0);else{busy=false;render();}}
 chunk();
}
function tick(){if(busy)return;if(get("inspect-pivots").checked){attempt();render();}else sweep();}
function stop(){running=false;clearInterval(timer);generation++;busy=false;get("chain-toggle").textContent="Start";get("chain-status").textContent="Paused";}
function start(){running=true;get("chain-toggle").textContent="Pause";get("chain-status").textContent="Running";clearInterval(timer);timer=setInterval(tick,Number(get("sweep-time").value));}
function reset(){stop();N=Number(get("chain-length").value);chain=Array.from({length:N+1},(_,i)=>[i,0]);sweeps=attempts=accepted=0;samples=[];shapeSums=new Float64Array(N+1);shapeCount=0;lastMove=null;render();}
function estimate(com=false){
 const data=samples.map(p=>com?p.com:p);
 const n=samples.length;if(!n)return {plateau:0,points:[]};
 let sx=0,sy=0,sr=0;for(const [x,y] of data){sx+=x;sy+=y;sr+=x*x+y*y;}
 const plateau=Math.max(0,2*(sr/n-(sx/n)**2-(sy/n)**2));
 const points=[];for(let lag=0;lag<=Math.min(128,Math.floor(n/3));lag++){let sum=0;for(let i=0;i<n-lag;i++){const dx=data[i+lag][0]-data[i][0],dy=data[i+lag][1]-data[i][1];sum+=dx*dx+dy*dy;}points.push({lag,value:sum/(n-lag)});}
 return {plateau,points};
}

function logPlot(id,series,xLabel,yLabel){
 const all=series.flatMap(s=>s.points).filter(p=>p.x>0&&p.y>0),l=90,r=750,t=30,b=330;
 let xmin=0,xmax=1,ymin=-1,ymax=1;
 if(all.length){xmin=Math.floor(Math.log10(Math.min(...all.map(p=>p.x))));xmax=Math.max(xmin+1,Math.ceil(Math.log10(Math.max(...all.map(p=>p.x)))));ymin=Math.floor(Math.log10(Math.min(...all.map(p=>p.y))));ymax=Math.max(ymin+1,Math.ceil(Math.log10(Math.max(...all.map(p=>p.y)))));}
 const X=x=>l+(Math.log10(x)-xmin)/(xmax-xmin)*(r-l),Y=y=>b-(Math.log10(y)-ymin)/(ymax-ymin)*(b-t);
 let svg='<rect width="800" height="410" fill="white"/>';
 const tick=(v)=>'10<tspan baseline-shift="super" font-size="10">'+v+'</tspan>';
 for(let p=xmin;p<=xmax;p++){const xx=X(10**p);svg+='<path d="M'+xx+' '+t+'V'+b+'" stroke="#e5ebe8"/><text x="'+xx+'" y="355" text-anchor="middle">'+tick(p)+'</text>';}
 for(let p=ymin;p<=ymax;p++){const yy=Y(10**p);svg+='<path d="M'+l+' '+yy+'H'+r+'" stroke="#e5ebe8"/><text x="'+(l-12)+'" y="'+(yy+5)+'" text-anchor="end">'+tick(p)+'</text>';}
 svg+='<path d="M'+l+' '+t+'V'+b+'H'+r+'" fill="none" stroke="#53676a"/>';
 for(const seriesItem of series){const points=seriesItem.points.filter(p=>p.x>0&&p.y>0);if(!seriesItem.dash){
 const chosen=new Set();
 if(points.length){const min=points[0].x,max=points[points.length-1].x;for(let i=0;i<24;i++){const target=min*Math.pow(max/min,i/23);let best=0,distance=Infinity;for(let k=0;k<points.length;k++){const d=Math.abs(Math.log(points[k].x/target));if(d<distance){distance=d;best=k;}}chosen.add(best);}}
 for(const index of chosen){const p=points[index];svg+='<circle cx="'+X(p.x)+'" cy="'+Y(p.y)+'" r="5.5" fill="white" stroke="'+seriesItem.color+'" stroke-width="2"><title>s = '+p.x+'; RMS = '+p.y.toFixed(3)+'</title></circle>';}
}else if(points.length)svg+='<path d="'+points.map((p,i)=>(i?"L":"M")+X(p.x)+" "+Y(p.y)).join(" ")+'" fill="none" stroke="'+seriesItem.color+'" stroke-width="2.5" stroke-dasharray="'+(seriesItem.dash||"none")+'"/>';}
 if(!all.length)svg+='<text x="415" y="180" text-anchor="middle">Collect samples after warm-up to see the plot.</text>';
 svg+='<text x="420" y="395" text-anchor="middle">'+xLabel+'</text><text transform="translate(22,185) rotate(-90)" text-anchor="middle">'+yLabel+'</text>';get(id).innerHTML=svg;
}

function render(){
 ctx.clearRect(0,0,640,480);ctx.fillStyle="#f7f8fa";ctx.fillRect(0,0,640,480);
 const view=get('inspect-pivots').checked&&lastMove?chain.concat(lastMove.proposal):chain;
 const xs=view.map(p=>p[0]),ys=view.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(560/Math.max(12,maxX-minX),400/Math.max(12,maxY-minY)),X=x=>320+(x-(minX+maxX)/2)*scale,Y=y=>240-(y-(minY+maxY)/2)*scale;
 ctx.strokeStyle="#236253";ctx.lineWidth=2;ctx.beginPath();chain.forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));ctx.stroke();

 if(get("inspect-pivots").checked&&lastMove){ctx.strokeStyle="#b98b50";ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();lastMove.proposal.slice(lastMove.k).forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));ctx.stroke();ctx.setLineDash([]);const [x,y]=lastMove.pivot;ctx.strokeStyle="#ce7958";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(x)-6,Y(y));ctx.lineTo(X(x)+6,Y(y));ctx.moveTo(X(x),Y(y)-6);ctx.lineTo(X(x),Y(y)+6);ctx.stroke();}

 get("chain-sweeps").textContent=sweeps;get("chain-acceptance").textContent=attempts?(100*accepted/attempts).toFixed(1)+"%":"—";
 get("chain-r2").textContent=chain[N][0]**2+chain[N][1]**2;
 get("chain-samples").textContent=samples.length;get("chain-burn").textContent=sweeps<=20?"Warm-up: "+sweeps+" / 20 sweeps":"Collecting endpoint samples";

 const shape=[];if(shapeCount)for(let bead=1;bead<=N;bead++)shape.push({x:bead,y:Math.sqrt(shapeSums[bead]/shapeCount)});
 const anchor=shape[Math.max(0,Math.floor(shape.length/2)-1)];
 const theory=anchor?shape.map(p=>({x:p.x,y:anchor.y*(p.x/anchor.x)**.75})):[];
 logPlot("chain-scaling",[{points:shape,color:"#236253"},{points:theory,color:"#b98b50",dash:"6 5"}],"Contour distance s (bonds) · log","RMS distance from first bead · log");
 get("scaling-note").textContent=shapeCount+" sampled configurations after warm-up. Gold reference: slope ν = 0.75, normalized to measured RMS at s = "+(anchor?anchor.x:"—")+".";

}
get("chain-toggle").addEventListener("click",()=>running?stop():start());
get("chain-step").addEventListener("click",()=>{stop();tick();});
get("inspect-pivots").addEventListener("change",()=>{stop();render();});
get("chain-reset").addEventListener("click",reset);get("chain-length").addEventListener("change",reset);
get("sweep-time").addEventListener("change",()=>{if(running)start();});
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
reset();
})();