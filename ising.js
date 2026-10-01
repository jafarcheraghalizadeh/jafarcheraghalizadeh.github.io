"use strict";
const size = 64;
const spins = new Int8Array(size * size);
let temperature = 2.27, running = false, sweeps = 0, lastFrame = 0;
const canvas = document.getElementById('lattice');
const ctx = canvas.getContext('2d');
const get = id => document.getElementById(id);
function neighbors(i) {
  const x = i % size, y = Math.floor(i / size);
  return spins[y * size + (x + 1) % size] + spins[y * size + (x + size - 1) % size]
    + spins[((y + 1) % size) * size + x] + spins[((y + size - 1) % size) * size + x];
}
function sweep() {
  for (let n = 0; n < spins.length; n++) {
    const i = Math.floor(Math.random() * spins.length);
    const deltaE = 2 * spins[i] * neighbors(i);
    if (deltaE <= 0 || Math.random() < Math.exp(-deltaE / temperature)) spins[i] *= -1;
  }
  sweeps++;
}
function render() {
  let magnetization = 0, energy = 0;
  const cell = canvas.width / size;
  for (let i = 0; i < spins.length; i++) {
    const x = i % size, y = Math.floor(i / size);
    magnetization += spins[i];
    energy -= spins[i] * (spins[y * size + (x + 1) % size] + spins[((y + 1) % size) * size + x]);
    ctx.fillStyle = spins[i] === 1 ? '#236253' : '#e6b46a';
    ctx.fillRect(x * cell, y * cell, cell, cell);
  }
  get('magnetization').textContent = (magnetization / spins.length).toFixed(3);
  get('energy').textContent = (energy / spins.length).toFixed(3);
  get('sweeps').textContent = sweeps;
}
function reset(mode = 'random') {
  for (let i = 0; i < spins.length; i++) spins[i] = mode === 'ordered' ? 1 : Math.random() < .5 ? -1 : 1;
  sweeps = 0;
  render();
}
function setTemperature(value) {
  temperature = Number(value);
  get('temperature').value = temperature;
  get('temperature-value').textContent = temperature.toFixed(2);
}
get('temperature').addEventListener('input', event => setTemperature(event.target.value));
get('toggle').addEventListener('click', () => {
  running = !running;
  get('toggle').textContent = running ? 'Pause' : 'Start';
  get('status').textContent = running ? 'Running' : 'Paused';
});
get('step').addEventListener('click', () => { sweep(); render(); });
get('reset').addEventListener('click', () => reset());
get('ordered').addEventListener('click', () => reset('ordered'));
document.querySelectorAll('[data-temperature]').forEach(button => button.addEventListener('click', () => setTemperature(button.dataset.temperature)));
function frame(now) {
  if (running && now - lastFrame >= 50) {
    sweep(); render(); lastFrame = now;
  }
  requestAnimationFrame(frame);
}
setTemperature(temperature); reset(); requestAnimationFrame(frame);
