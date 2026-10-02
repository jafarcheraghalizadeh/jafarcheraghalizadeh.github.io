"use strict";
(() => {
const get=id=>document.getElementById(id), canvas=get("walk-canvas"), ctx=canvas.getContext("2d");
const directions=[[1,0],[-1,0],[0,1],[0,-1]];
let path=[[0,0]],x=0,y=0,extent=12,running=false,speed=30,last=0,carry=0;
function pause(){running=false;carry=0;get("walk-toggle").textContent="Start";get("walk-status").textContent="Paused";}
function step(){if(path.length>20000){pause();get("walk-status").textContent="20,000 steps reached. Reset to start again.";return;}const [dx,dy]=directions[Math.floor(Math.random()*4)];x+=dx;y+=dy;path.push([x,y]);extent=Math.max(extent,Math.abs(x)+3,Math.abs(y)+3);}
function draw(){
 const scale=290/extent, px=v=>320+v*scale,py=v=>320-v*scale,n=path.length-1;
 ctx.clearRect(0,0,640,640);ctx.fillStyle="#f7f8fa";ctx.fillRect(0,0,640,640);
 ctx.strokeStyle="#dce4e2";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(20,320);ctx.lineTo(620,320);ctx.moveTo(320,20);ctx.lineTo(320,620);ctx.stroke();
 ctx.strokeStyle="#236253";ctx.lineWidth=1.8;ctx.beginPath();path.forEach(([a,b],i)=>i?ctx.lineTo(px(a),py(b)):ctx.moveTo(px(a),py(b)));ctx.stroke();
 for(const [a,b,color] of [[0,0,"#d4a458"],[x,y,"#236253"]]){ctx.beginPath();ctx.arc(px(a),py(b),5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
 get("walk-count").textContent=n;get("walk-position").textContent="("+x+", "+y+")";get("walk-distance").textContent=Math.hypot(x,y).toFixed(2);get("walk-squared").textContent=x*x+y*y;get("walk-rms").textContent=Math.sqrt(n).toFixed(2);
}
get("walk-toggle").addEventListener("click",()=>{if(running)pause();else if(path.length<=20000){running=true;get("walk-toggle").textContent="Pause";get("walk-status").textContent="Running";}});
get("walk-step").addEventListener("click",()=>{pause();step();draw();});
get("walk-reset").addEventListener("click",()=>{pause();path=[[0,0]];x=0;y=0;extent=12;draw();});
get("walk-speed").addEventListener("input",e=>{speed=Number(e.target.value);get("walk-speed-value").textContent=speed;});
document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();});
function frame(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;if(running){carry+=dt*speed;let changed=false;while(carry>=1&&running){carry--;step();changed=true;}if(changed)draw();}requestAnimationFrame(frame);}
draw();requestAnimationFrame(frame);
})();