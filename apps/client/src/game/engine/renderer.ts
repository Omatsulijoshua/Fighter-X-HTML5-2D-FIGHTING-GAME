import { GAME_WIDTH, GAME_HEIGHT } from '@shadow-clash/shared';
import { GameContext, STAGE_WIDTH, GROUND_Y } from './game-context.js';
import { Fighter } from '../fighters/fighter.js';

export class Renderer {
  public static draw(ctx: CanvasRenderingContext2D, context: GameContext, fps: number) {
    // 1. Clear Canvas
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Save context for camera translation
    ctx.save();
    
    // Apply camera offset
    ctx.translate(-context.camera.position.x, -context.camera.position.y);

    // 2. Draw Stage Background Grid
    ctx.strokeStyle = '#1f2833';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < STAGE_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(STAGE_WIDTH, y);
      ctx.stroke();
    }

    // 3. Draw Stage Boundaries
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(-10, 0, 10, GAME_HEIGHT);
    ctx.fillRect(STAGE_WIDTH, 0, 10, GAME_HEIGHT);

    // 4. Draw Floor
    ctx.strokeStyle = '#45f3ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(STAGE_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(31, 40, 51, 0.5)';
    ctx.fillRect(0, GROUND_Y, STAGE_WIDTH, GAME_HEIGHT - GROUND_Y);

    // 5. Draw Players
    this.drawPlayer(ctx, context.p1, '#ff0055', context.debugMode);
    this.drawPlayer(ctx, context.p2, '#0055ff', context.debugMode);

    // Restore translation for HUD drawing (screen space)
    ctx.restore();

    // 6. Draw HUD
    this.drawHUD(ctx, context, fps);

    // 7. Draw Debug Overlay (F3)
    if (context.debugMode) {
      this.drawDebugOverlay(ctx, context, fps);
    }
  }

  private static drawPlayer(ctx: CanvasRenderingContext2D, player: Fighter, color: string, debugMode: boolean) {
    ctx.save();

    // Draw death animation flat on floor
    if (player.state === 'DEAD') {
      ctx.fillStyle = '#3a3a3a';
      ctx.translate(player.position.x + player.width / 2, GROUND_Y);
      ctx.rotate(player.facingLeft ? -Math.PI / 2 : Math.PI / 2);
      ctx.fillRect(-player.width / 2, -player.width, player.width, player.height);
      ctx.restore();
      return;
    }

    // Highlight player solid pink-white during hit flash
    if (player.hitFlash) {
      ctx.fillStyle = '#ffcccc';
    } else {
      ctx.fillStyle = color;
    }

    // Draw standard body box
    ctx.fillRect(player.position.x, player.position.y, player.width, player.height);

    // Draw facing direction line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const startX = player.position.x + player.width / 2;
    const startY = player.position.y + 40;
    const endX = startX + (player.facingLeft ? -40 : 40);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.stroke();

    // Draw eyes indicator
    ctx.fillStyle = '#000';
    const eyeX = player.facingLeft ? player.position.x + 20 : player.position.x + player.width - 30;
    ctx.fillRect(eyeX, player.position.y + 30, 10, 10);

    // Draw blocking shield indicator
    if (player.state === 'BLOCKING') {
      ctx.strokeStyle = '#00f6ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const shieldX = player.facingLeft ? player.position.x - 10 : player.position.x + player.width + 10;
      ctx.arc(
        shieldX,
        player.position.y + player.height / 2,
        60,
        player.facingLeft ? Math.PI / 2 : -Math.PI / 2,
        player.facingLeft ? 3 * Math.PI / 2 : Math.PI / 2
      );
      ctx.stroke();
    }

    // Draw attack hitbox (active frames)
    const hitbox = player.getAttackHitbox();
    if (hitbox) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(hitbox.position.x, hitbox.position.y, hitbox.width, hitbox.height);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.fillRect(hitbox.position.x, hitbox.position.y, hitbox.width, hitbox.height);
    }

    // Debug overlays (Hitbox outlines)
    if (debugMode) {
      // Body collision box outline (Blue)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.position.x, player.position.y, player.width, player.height);

      // Hurtbox outline (Green)
      ctx.strokeStyle = '#00ff00';
      ctx.strokeRect(player.position.x + 5, player.position.y + 5, player.width - 10, player.height - 10);
    }

    ctx.restore();
  }

  private static drawHUD(ctx: CanvasRenderingContext2D, context: GameContext, fps: number) {
    // Player 1 HUD (Left)
    this.drawHealthBar(ctx, 50, 45, 400, 20, context.p1.health, context.p1.maxHealth, false);
    this.drawEnergyBar(ctx, 50, 70, 300, 10, context.p1.energy, context.p1.maxEnergy, false);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(context.p1.name, 50, 35);

    // VS text in center
    ctx.fillStyle = '#66fcf1';
    ctx.font = 'italic bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', GAME_WIDTH / 2, 60);

    // Player 2 HUD (Right)
    this.drawHealthBar(ctx, GAME_WIDTH - 450, 45, 400, 20, context.p2.health, context.p2.maxHealth, true);
    this.drawEnergyBar(ctx, GAME_WIDTH - 350, 70, 300, 10, context.p2.energy, context.p2.maxEnergy, true);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(context.p2.name, GAME_WIDTH - 50, 35);

    // Check for KO
    if (context.p1.state === 'DEAD' || context.p2.state === 'DEAD') {
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KO!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

      ctx.fillStyle = '#66fcf1';
      ctx.font = 'bold 28px sans-serif';
      const winner = context.p1.state === 'DEAD' ? context.p2.name : context.p1.name;
      ctx.fillText(`${winner} WINS!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
    }

    // Display Instruction
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'P1: A/D Move, W Jump, S Crouch, I Block, J Light Attack, K Heavy Attack | P2: Arrows, Digit4 Block, Num1/Digit1 Light, Num2/Digit2 Heavy | Toggle Debug: F3',
      GAME_WIDTH / 2,
      GAME_HEIGHT - 25
    );
  }

  private static drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    health: number,
    maxHealth: number,
    rightToLeft: boolean
  ) {
    ctx.fillStyle = '#1f2833';
    ctx.fillRect(x, y, w, h);

    const ratio = Math.max(0, health / maxHealth);
    const fillWidth = w * ratio;

    // Green Health overlay
    ctx.fillStyle = '#4caf50';
    if (rightToLeft) {
      ctx.fillRect(x + w - fillWidth, y, fillWidth, h);
    } else {
      ctx.fillRect(x, y, fillWidth, h);
    }

    ctx.strokeStyle = '#c5c6c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  private static drawEnergyBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    energy: number,
    maxEnergy: number,
    rightToLeft: boolean
  ) {
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(x, y, w, h);

    const ratio = Math.max(0, energy / maxEnergy);
    const fillWidth = w * ratio;

    // Blue Energy overlay
    ctx.fillStyle = '#00bcd4';
    if (rightToLeft) {
      ctx.fillRect(x + w - fillWidth, y, fillWidth, h);
    } else {
      ctx.fillRect(x, y, fillWidth, h);
    }

    ctx.strokeStyle = '#1f2833';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  private static drawDebugOverlay(ctx: CanvasRenderingContext2D, context: GameContext, fps: number) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(10, 100, 350, 240);

    ctx.strokeStyle = '#66fcf1';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 100, 350, 240);

    ctx.fillStyle = '#66fcf1';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW CLASH ENGINE DEBUG', 20, 125);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${fps}`, 20, 150);
    ctx.fillText(`Engine Tick: ${context.tickCount}`, 20, 170);
    ctx.fillText(`Camera X: ${Math.round(context.camera.position.x)}`, 20, 190);

    // Player 1 coordinates
    ctx.fillStyle = '#ff80aa';
    ctx.fillText(`P1 (${context.p1.name}):`, 20, 220);
    ctx.fillText(` Pos: [${Math.round(context.p1.position.x)}, ${Math.round(context.p1.position.y)}]`, 20, 235);
    ctx.fillText(` Vel: [${context.p1.velocity.x.toFixed(2)}, ${context.p1.velocity.y.toFixed(2)}]`, 20, 250);
    ctx.fillText(` State: ${context.p1.state} | Timer: ${context.p1.stateTimer} | Phase: ${context.p1.attackPhase}`, 20, 265);

    // Player 2 coordinates
    ctx.fillStyle = '#80b3ff';
    ctx.fillText(`P2 (${context.p2.name}):`, 20, 290);
    ctx.fillText(` Pos: [${Math.round(context.p2.position.x)}, ${Math.round(context.p2.position.y)}]`, 20, 305);
    ctx.fillText(` Vel: [${context.p2.velocity.x.toFixed(2)}, ${context.p2.velocity.y.toFixed(2)}]`, 20, 320);
    ctx.fillText(` State: ${context.p2.state} | Timer: ${context.p2.stateTimer} | Phase: ${context.p2.attackPhase}`, 20, 335);
  }
}
