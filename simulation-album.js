"use strict";
(async function () {
  const root = document.getElementById("simulation-album");
  const image = document.getElementById("album-image");
  const status = document.getElementById("album-status");
  const caption = document.getElementById("album-caption");
  const controls = document.getElementById("album-controls");
  let files = [], index = 0, timer = null;
  const play = document.getElementById("album-play");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  function stop() { clearInterval(timer); timer = null; play.textContent = "Play slideshow"; }
  function start() { stop(); if(files.length > 1) {timer = setInterval(() => show(index + 1), 4000); play.textContent = "Pause slideshow";} }
  function show(next) {
    index = (next + files.length) % files.length;
    image.classList.remove("album-fade");
    void image.offsetWidth;
    image.src = files[index].download_url;
    image.alt = "Simulation image: " + files[index].name;
    caption.textContent = files[index].name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
    status.textContent = (index + 1) + " / " + files.length;
    image.classList.add("album-fade");
  }
  document.getElementById("album-prev").addEventListener("click", () => {stop(); show(index - 1);});
  document.getElementById("album-next").addEventListener("click", () => {stop(); show(index + 1);});
  play.addEventListener("click", () => timer ? stop() : start());
  root.addEventListener("keydown", event => {
    if(event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault(); stop(); show(index + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });
  document.addEventListener("visibilitychange", () => {if(document.hidden) stop();});
  reduced.addEventListener("change", () => {if(reduced.matches) stop();});
  image.addEventListener("error", () => {stop(); status.textContent = "This image could not load. Try the next image.";});
  try {
    const response = await fetch("https://api.github.com/repos/jafarcheraghalizadeh/jafarcheraghalizadeh.github.io/contents/simulation?ref=main");
    if(!response.ok) throw new Error("Folder unavailable");
    const data = await response.json();
    files = data.filter(file => file.type === "file" && /\.(png|jpe?g|gif|webp|avif)$/i.test(file.name) && file.download_url);
    files.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true}));
    if(!files.length) {status.textContent = "Simulation images will appear here soon."; return;}
    document.getElementById("album-figure").hidden = false;
    controls.hidden = false;
    show(0);
    for(const id of ["album-prev","album-next","album-play"]) document.getElementById(id).disabled = files.length < 2;
    if(!reduced.matches) start();
  } catch(error) {status.textContent = "The album is temporarily unavailable. Please refresh later.";}
})();