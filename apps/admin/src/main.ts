import { GAME_WIDTH, GAME_HEIGHT } from '@shadow-clash/shared';

console.log('Shadow Clash Admin Dashboard Booted.');
console.log(`Reference settings - Canvas width: ${GAME_WIDTH}, height: ${GAME_HEIGHT}`);

const appEl = document.getElementById('app');
if (appEl) {
  appEl.innerHTML = `
    <div style="margin-top: 20px; border-top: 1px solid #444; padding-top: 20px;">
      <h3>System Configuration Reference</h3>
      <p>Target Resolution: <strong>${GAME_WIDTH} x ${GAME_HEIGHT}</strong></p>
      <p>Status: <span style="color: #4caf50;">Ready</span></p>
    </div>
  `;
}
