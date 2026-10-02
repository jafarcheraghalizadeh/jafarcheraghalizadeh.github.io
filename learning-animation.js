"use strict";
(() => {
 const canvas = document.getElementById("learning-particles");
 if (!canvas) return;
 const context = canvas.getContext("2d"), motion = matchMedia("(prefers-reduced-motion: reduce)");
 const points = Array.from({length:72}, (_,i) => ({angle:i*2.39996,radius:35+Math.sqrt(i/72)*140,speed:.12+(i%7)*.025,phase:i*.71}));
 let visible=true, last=0, time=0;
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}); observer.observe(canvas);
 function draw(t) {
 context.clearRect(0,0,480,420);
 const gradient=context.createRadialGradient(240,210,15,240,210,200);
 gradient.addColorStop(0,"rgba(141,189,168,.25)");gradient.addColorStop(1,"rgba(141,189,168,0)");
 context.fillStyle=gradient;context.fillRect(0,0,480,420);
 const positions=points.map(p=>{const a=p.angle+t*p.speed;const r=p.radius+12*Math.sin(t*.7+p.phase);return {x:240+Math.cos(a)*r,y:210+Math.sin(a)*r*.8,z:Math.sin(a+p.phase)};});
 for(let i=0;i<positions.length;i++) {
 const a=positions[i];
 for(let j=i+1;j<positions.length;j++){const b=positions[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<55){context.strokeStyle="rgba(35,98,83,"+(.2*(1-d/55))+")";context.lineWidth=1;context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.stroke();}}
 context.beginPath();context.arc(a.x,a.y,2.5+(a.z+1)*1.4,0,Math.PI*2);context.fillStyle=i%9===0?"#d4a458":"#236253";context.fill();
 }
 context.strokeStyle="rgba(35,98,83,.12)";context.lineWidth=1;
 for(let i=0;i<3;i++){context.beginPath();context.ellipse(240,210,170+i*12,122+i*10,t*.03+i*.55,0,Math.PI*2);context.stroke();}
 }
 function frame(now){const elapsed=last?Math.min((now-last)/1000,.05):0;last=now;if(visible&&!document.hidden&&!motion.matches){time+=elapsed;draw(time);}requestAnimationFrame(frame);}
 draw(0); requestAnimationFrame(frame);
})();