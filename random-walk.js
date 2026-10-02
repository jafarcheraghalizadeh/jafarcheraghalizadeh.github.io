"use strict";
(() => {
const get=id=>document.getElementById(id), canvas=get("walk-canvas"),ctx=canvas.getContext("2d");
const dirs=[[1,0],[-1,0],[0,1],[0,-1]],key=(a,b)=>a+","+b;
let path=[[0,0]],sites=new Map([["0,0",0]]),x=0,y=0,steps=0,loops=0,erased=0,longest=0,lastLength=0,frequencies=new Map(),flash=[],flashUntil=0,extent=12,running=false,speed=30,last=0,carry=0;
function pause(){running=false;carry=0;get("walk-toggle").textContent="Start";get("walk-status").textContent="Paused";}
function step(direction){
 if(steps>=20000){pause();get("walk-status").textContent="20,000 steps reached. Reset to start again.";return;}
 const [dx,dy]=direction||dirs[Math.floor(Math.random()*4)];x+=dx;y+=dy;steps++;extent=Math.max(extent,Math.abs(x)+3,Math.abs(y)+3);
 const id=key(x,y),hit=sites.get(id);
 if(hit!==undefined){
  lastLength=path.length-hit;loops++;erased+=lastLength;longest=Math.max(longest,lastLength);
  frequencies.set(lastLength,(frequencies.get(lastLength)||0)+1);
  flash=path.slice(hit).concat([[x,y]]);flashUntil=performance.now()+900;
  for(let i=hit+1;i<path.length;i++)sites.delete(key(...path[i]));
  path.length=hit+1;
 }else{sites.set(id,path.length);path.push([x,y]);}
}
function draw(){
 const scale=290/extent,px=v=>320+v*scale,py=v=>320-v*scale;
 ctx.clearRect(0,0,640,640);ctx.fillStyle="#f7f8fa";ctx.fillRect(0,0,640,640);
 ctx.strokeStyle="#dce4e2";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(20,320);ctx.lineTo(620,320);ctx.moveTo(320,20);ctx.lineTo(320,620);ctx.stroke();
 function trace(points,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(px(a),py(b)):ctx.moveTo(px(a),py(b)));ctx.stroke();}
 trace(path,"#236253",2.5);if(performance.now()<flashUntil)trace(flash,"#ce7958",3);
 for(const [a,b,color] of [[0,0,"#d4a458"],[x,y,"#236253"]]){ctx.beginPath();ctx.arc(px(a),py(b),5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 get("walk-count").textContent=steps;get("walk-position").textContent="("+x+", "+y+")";get("walk-distance").textContent=Math.hypot(x,y).toFixed(2);
 get("retained").textContent=path.length-1;get("loop-count").textContent=loops;get("erased-steps").textContent=erased;get("last-loop").textContent=lastLength;
 get("mean-loop").textContent=loops?(erased/loops).toFixed(2):"0";get("max-loop").textContent=longest;get("erased-percent").textContent=steps?(100*erased/steps).toFixed(1)+"%":"0%";
 const body=get("loop-table");body.replaceChildren();
 if(!frequencies.size){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=3;td.textContent="No loops erased yet.";tr.append(td);body.append(tr);}
 for(const [length,count] of [...frequencies].sort((a,b)=>a[0]-b[0])){const tr=document.createElement("tr");for(const value of [length,count,(100*count/loops).toFixed(1)+"%"]){const td=document.createElement("td");td.textContent=value;tr.append(td);}body.append(tr);}
}
get("walk-toggle").addEventListener("click",()=>{if(running)pause();else if(steps<20000){running=true;get("walk-toggle").textContent="Pause";get("walk-status").textContent="Running";}});
get("walk-step").addEventListener("click",()=>{pause();step();draw();});
get("walk-reset").addEventListener("click",()=>{pause();path=[[0,0]];sites=new Map([["0,0",0]]);x=y=steps=loops=erased=longest=lastLength=0;frequencies=new Map();flash=[];flashUntil=0;extent=12;draw();});
get("walk-speed").addEventListener("input",e=>{speed=Number(e.target.value);get("walk-speed-value").textContent=speed;});
document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();});
function frame(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;let changed=false;if(running){carry+=dt*speed;while(carry>=1&&running){carry--;step();changed=true;}}if(changed||flash.length){draw();if(now>=flashUntil)flash=[];}requestAnimationFrame(frame);}
draw();requestAnimationFrame(frame);
})();