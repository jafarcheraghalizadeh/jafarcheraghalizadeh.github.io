
let checked=0;
function cross(a,b,c,d){const o=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);const on=(p,q,r)=>o(p,q,r)===0&&r.x>=Math.min(p.x,q.x)&&r.x<=Math.max(p.x,q.x)&&r.y>=Math.min(p.y,q.y)&&r.y<=Math.max(p.y,q.y);let x=o(a,b,c),y=o(a,b,d),z=o(c,d,a),w=o(c,d,b);return (x*y<0&&z*w<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);}
function check(c,moved){checked++;for(let i=0;i<c.length-1;i++)for(let j=i+2;j<c.length-1;j++)if((moved===undefined||i===moved||i+1===moved||j===moved||j+1===moved)&&cross(c[i],c[i+1],c[j],c[j+1]))throw Error('Crossing bonds '+i+' and '+j+' at configuration '+checked);}
const elems={};const vals={eps:1.5,temp:1,n:48,speed:20,seed:42,burn:1000,tether:0};
for(const k in vals)elems['[data-p="'+k+'"]']={value:vals[k],checked:k==='tether'};
const root={querySelector:s=>elems[s]||(elems[s]={textContent:'',setAttribute(){},getBoundingClientRect(){return {width:700}},innerHTML:''})};
global.document={getElementById:()=>root};global.ResizeObserver=class{observe(){}};global.setInterval=()=>{};


const fs=require('node:fs'),path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'..','polymer-adsorption.js'),'utf8');
source=source.replace('chain[i]=v;accept++;','chain[i]=v;accept++;check(chain,i);').replace('})();','globalThis.test={sweep,init,stats,getChain:()=>chain};})();');
eval(source);
let runs=0,attempts=0;
for(const n of [16,48,128])for(const seed of [1,42,987])for(const tether of [true,false])for(const eps of [0,6]){elems['[data-p="n"]'].value=n;elems['[data-p="seed"]'].value=seed;elems['[data-p="tether"]'].checked=tether;elems['[data-p="eps"]'].value=eps;test.init();check(test.getChain());test.sweep(200);runs++;attempts+=n*200;}
console.log(JSON.stringify({runs,attempts,configurationsChecked:checked,crossings:0}));

// Equal epsilon/temperature ratios must produce identical seeded trajectories.
elems['[data-p="n"]'].value=48;elems['[data-p="seed"]'].value=42;elems['[data-p="tether"]'].checked=true;
elems['[data-p="eps"]'].value=1.5;elems['[data-p="temp"]'].value=1;test.init();test.sweep(200);const first=JSON.stringify(test.getChain());
elems['[data-p="eps"]'].value=3;elems['[data-p="temp"]'].value=2;test.init();test.sweep(200);if(first!==JSON.stringify(test.getChain()))throw Error('Equal-ratio trajectories differ');
elems['[data-action="step"]'].onclick();if(!elems['[data-r="now"]'].textContent.startsWith('Sweep 300'))throw Error('Step control failed');
elems['[data-p="eps"]'].oninput();if(!elems['[data-r="now"]'].textContent.startsWith('Sweep 0'))throw Error('Attraction does not reset sampling');
elems['[data-action="run"]'].onclick();if(elems['[data-action="run"]'].textContent!=='Pause')throw Error('Run control failed');elems['[data-action="run"]'].onclick();if(elems['[data-action="run"]'].textContent!=='Run')throw Error('Pause control failed');
const html=fs.readFileSync(path.join(__dirname,'..','polymer-adsorption.html'),'utf8');for(const key of Object.keys(vals))if(!html.includes('data-p="'+key+'"'))throw Error('Missing control '+key);
console.log('Controls and equal-ratio seeded trajectories passed.');
