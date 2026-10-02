"use strict";
(async()=>{
 const grid=document.getElementById("travel-gallery"),dialog=document.getElementById("photo-viewer"),large=document.getElementById("viewer-image"),count=document.getElementById("viewer-count");
 let photos=[],current=0,oldOverflow="";
 function show(i){current=(i+photos.length)%photos.length;large.src=photos[current].url;large.alt=photos[current].alt||"Travel photograph";count.textContent=(current+1)+" / "+photos.length;document.getElementById("viewer-prev").hidden=document.getElementById("viewer-next").hidden=photos.length<2;}
 function open(i){show(i);oldOverflow=document.body.style.overflow;document.body.style.overflow="hidden";dialog.showModal();}
 document.getElementById("viewer-close").addEventListener("click",()=>dialog.close());
 document.getElementById("viewer-prev").addEventListener("click",()=>show(current-1));
 document.getElementById("viewer-next").addEventListener("click",()=>show(current+1));
 dialog.addEventListener("close",()=>{document.body.style.overflow=oldOverflow;});
 dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"){e.preventDefault();show(current-1);}if(e.key==="ArrowRight"){e.preventDefault();show(current+1);}});
 const sources=await Promise.allSettled([
 fetch("travel-photos.json").then(r=>{if(!r.ok)throw Error();return r.json();}),
 fetch("https://api.github.com/repos/jafarcheraghalizadeh/jafarcheraghalizadeh.github.io/contents/images/travel?ref=main").then(r=>{if(!r.ok)throw Error();return r.json();})
 ]);
 if(sources[0].status==="fulfilled"&&Array.isArray(sources[0].value))photos.push(...sources[0].value.filter(p=>typeof p.url==="string"&&p.url.startsWith("https://")));
 if(sources[1].status==="fulfilled"&&Array.isArray(sources[1].value))photos.push(...sources[1].value.filter(f=>f.type==="file"&&/\.(png|jpe?g|webp|gif|avif)$/i.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(f=>({url:f.download_url,alt:"Travel photograph: "+f.name})));
 if(!photos.length)return;
 photos=photos.filter((p,i,a)=>a.findIndex(q=>q.url===p.url)===i);
 grid.replaceChildren();
 photos.forEach((photo,i)=>{
  const button=document.createElement("button");button.type="button";button.className="photo-thumbnail";button.style.setProperty("--photo-delay",(-i*.7)+"s");button.setAttribute("aria-label","Enlarge photograph "+(i+1));
  const img=document.createElement("img");img.src=photo.url;img.alt=photo.alt||"Travel photograph";img.loading="lazy";img.decoding="async";
  button.append(img);button.addEventListener("click",()=>open(i));grid.append(button);
 });
})();