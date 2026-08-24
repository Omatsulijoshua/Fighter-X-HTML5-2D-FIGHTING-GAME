import { GAME_WIDTH, GAME_HEIGHT } from '@shadow-clash/shared';
import { GameContext, STAGE_WIDTH, GROUND_Y, GameProjectile } from './game-context.js';
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

    // Draw active projectiles
    this.drawProjectiles(ctx, context.projectiles);

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

    // Rotate player flat if KNOCKED_DOWN or DEAD
    if (player.state === 'DEAD' || player.state === 'KNOCKED_DOWN') {
      ctx.fillStyle = player.state === 'DEAD' ? '#3a3a3a' : '#ff4444';
      ctx.translate(player.position.x + player.width / 2, GROUND_Y);
      ctx.rotate(player.facingLeft ? -Math.PI / 2 : Math.PI / 2);
      ctx.fillRect(-player.width / 2, -player.width, player.width, player.height);
      ctx.restore();
      return;
    }

    // If GETTING_UP, draw slightly shorter/slanted
    const drawHeight = player.state === 'GETTING_UP' ? 180 : player.height;
    const drawY = player.state === 'GETTING_UP' ? player.position.y + 70 : player.position.y;

    // Apply color/flash logic
    if (player.hitFlash) {
      ctx.fillStyle = '#ffffff'; // White hit flash
    } else if (player.state === 'ATTACKING' && player.currentAttack?.id === 'special') {
      // Glow orange during special attacks
      ctx.fillStyle = '#ff8c00';
    } else {
      ctx.fillStyle = color;
    }

    // Draw body bounding box
    ctx.fillRect(player.position.x, drawY, player.width, drawHeight);

    // Draw facing direction line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const startX = player.position.x + player.width / 2;
    const startY = drawY + 40;
    const endX = startX + (player.facingLeft ? -40 : 40);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.stroke();

    // Draw eyes indicator
    ctx.fillStyle = '#000';
    const eyeX = player.facingLeft ? player.position.x + 20 : player.position.x + player.width - 30;
    ctx.fillRect(eyeX, drawY + 30, 10, 10);

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

    // Draw active attack hitbox
    const hitbox = player.getAttackHitbox();
    if (hitbox && player.currentAttack) {
      const isSpecial = player.currentAttack.id === 'special';
      const isThrow = player.currentAttack.id === 'throw';
      
      ctx.strokeStyle = isSpecial ? '#ff4500' : (isThrow ? '#ff00ff' : '#ff0000');
      ctx.lineWidth = 2;
      ctx.strokeRect(hitbox.position.x, hitbox.position.y, hitbox.width, hitbox.height);
      ctx.fillStyle = isSpecial ? 'rgba(255, 69, 0, 0.25)' : (isThrow ? 'rgba(255, 0, 255, 0.2)' : 'rgba(255, 0, 0, 0.15)');
      ctx.fillRect(hitbox.position.x, hitbox.position.y, hitbox.width, hitbox.height);
    }

    // Debug overlays (Hitboxes/Hurtboxes wireframes)
    if (debugMode) {
      // Body collision box outline (Blue)
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(player.position.x, drawY, player.width, drawHeight);

      // Draw multi-hurtboxes (Green)
      ctx.strokeStyle = '#00ff00';
      const hurtboxes = player.getHurtboxes();
      for (const hurtbox of hurtboxes) {
        ctx.strokeRect(hurtbox.position.x, hurtbox.position.y, hurtbox.width, hurtbox.height);
      }
    }

    ctx.restore();
  }

  private static drawHUD(ctx: CanvasRenderingContext2D, context: GameContext, fps: number) {
    // 1. Draw Player 1 Stature (Left Side)
    this.drawHealthBar(ctx, 50, 45, 400, 20, context.p1.health, context.p1.maxHealth, false);
    this.drawEnergyBar(ctx, 50, 70, 300, 10, context.p1.energy, context.p1.maxEnergy, false);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(context.p1.name, 50, 35);
    this.drawRoundWins(ctx, 50, 90, context.p1RoundWins, false);

    // 2. Draw Player 2 Stature (Right Side)
    this.drawHealthBar(ctx, GAME_WIDTH - 450, 45, 400, 20, context.p2.health, context.p2.maxHealth, true);
    this.drawEnergyBar(ctx, GAME_WIDTH - 350, 70, 300, 10, context.p2.energy, context.p2.maxEnergy, true);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(context.p2.name, GAME_WIDTH - 50, 35);
    this.drawRoundWins(ctx, GAME_WIDTH - 50, 90, context.p2RoundWins, true);

    // 3. Draw Timer in the top center
    const displayTime = Math.max(0, Math.ceil(context.roundTimer / 60));
    ctx.fillStyle = displayTime <= 10 ? '#ff3333' : '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(displayTime.toString(), GAME_WIDTH / 2, 45);

    // 4. Draw Match Progress Overlays
    if (context.matchState === 'COUNTDOWN') {
      const remainingSec = Math.ceil(context.countdownTimer / 60);
      ctx.fillStyle = '#66fcf1';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      
      const txt = remainingSec > 0 ? remainingSec.toString() : 'FIGHT!';
      ctx.fillText(txt, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`ROUND ${context.roundNumber}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140);
    } else if (context.matchState === 'ROUND_END') {
      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KO!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

      ctx.fillStyle = '#66fcf1';
      ctx.font = 'bold 32px sans-serif';
      if (context.roundWinner === 'p1') {
        ctx.fillText(`${context.p1.name} WINS THE ROUND!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
      } else if (context.roundWinner === 'p2') {
        ctx.fillText(`${context.p2.name} WINS THE ROUND!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
      } else {
        ctx.fillText('DRAW ROUND!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
      }
    } else if (context.matchState === 'MATCH_END') {
      ctx.fillStyle = '#66fcf1';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      const winnerName = context.matchWinner === 'p1' ? context.p1.name : context.p2.name;
      ctx.fillText(`${winnerName} WINS THE MATCH!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText('Match Ended. Refresh to Restart.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    }

    // 5. Draw Combo Counters
    if (context.p1.comboCount > 1) {
      ctx.fillStyle = '#ff80aa';
      ctx.font = 'italic bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${context.p1.comboCount} HITS!`, 60, 130);
    }
    if (context.p2.comboCount > 1) {
      ctx.fillStyle = '#80b3ff';
      ctx.font = 'italic bold 24px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${context.p2.comboCount} HITS!`, GAME_WIDTH - 60, 130);
    }

    // 6. Draw Instruction footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'P1: A/D Walk, W Jump, S Crouch, I Block, J Light, K Heavy, L Special (Cost 30), U Grab | P2: Arrows, Digit4 Block, Digit1 Light, Digit2 Heavy, Digit3 Special, Digit5 Grab | Toggle Debug: F3',
      GAME_WIDTH / 2,
      GAME_HEIGHT - 15
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

  private static drawRoundWins(ctx: CanvasRenderingContext2D, x: number, y: number, wins: number, rightToLeft: boolean) {
    ctx.save();
    const dotRadius = 6;
    const spacing = 18;

    for (let i = 0; i < 2; i++) {
      const offset = rightToLeft ? -i * spacing : i * spacing;
      ctx.beginPath();
      ctx.arc(x + offset, y, dotRadius, 0, 2 * Math.PI);
      
      if (i < wins) {
        ctx.fillStyle = '#ffb300'; // Gold circle for won round
      } else {
        ctx.fillStyle = '#1f2833'; // Empty circle
      }
      ctx.fill();
      
      ctx.strokeStyle = '#c5c6c7';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawDebugOverlay(ctx: CanvasRenderingContext2D, context: GameContext, fps: number) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(10, 110, 360, 260);

    ctx.strokeStyle = '#66fcf1';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 110, 360, 260);

    ctx.fillStyle = '#66fcf1';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW CLASH ENGINE DEBUG', 20, 135);

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${fps} | Tick: ${context.tickCount}`, 20, 160);
    ctx.fillText(`Match State: ${context.matchState} | Round: ${context.roundNumber}`, 20, 175);
    ctx.fillText(`P1 Wins: ${context.p1RoundWins} | P2 Wins: ${context.p2RoundWins}`, 20, 190);
    ctx.fillText(`Camera Offset: [${Math.round(context.camera.position.x)}, ${Math.round(context.camera.position.y)}]`, 20, 205);

    // Player 1 details
    ctx.fillStyle = '#ff80aa';
    ctx.fillText(`P1 (${context.p1.name}):`, 20, 230);
    ctx.fillText(` Pos: [${Math.round(context.p1.position.x)}, ${Math.round(context.p1.position.y)}] | State: ${context.p1.state}`, 20, 245);
    ctx.fillText(` Vel: [${context.p1.velocity.x.toFixed(2)}, ${context.p1.velocity.y.toFixed(2)}] | Stun: ${context.p1.stateTimer}`, 20, 260);
    ctx.fillText(` Health: ${context.p1.health} | Energy: ${context.p1.energy} | Combo: ${context.p1.comboCount}`, 20, 275);

    // Player 2 details
    ctx.fillStyle = '#80b3ff';
    ctx.fillText(`P2 (${context.p2.name}):`, 20, 300);
    ctx.fillText(` Pos: [${Math.round(context.p2.position.x)}, ${Math.round(context.p2.position.y)}] | State: ${context.p2.state}`, 20, 315);
    ctx.fillText(` Vel: [${context.p2.velocity.x.toFixed(2)}, ${context.p2.velocity.y.toFixed(2)}] | Stun: ${context.p2.stateTimer}`, 20, 330);
    ctx.fillText(` Health: ${context.p2.health} | Energy: ${context.p2.energy} | Combo: ${context.p2.comboCount}`, 20, 345);
  }

  private static drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: GameProjectile[]) {
    ctx.save();
    for (const proj of projectiles) {
      if (!proj.active) continue;

      // Draw as a glowing cyan slash blade
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(proj.position.x, proj.position.y, proj.width, proj.height);

      // Inner blade glow
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(proj.position.x + 4, proj.position.y + 3, proj.width - 8, proj.height - 6);

      // Tail trailing particles placeholder
      ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
      const tailX = proj.velocity.x > 0 ? proj.position.x - 15 : proj.position.x + proj.width;
      ctx.fillRect(tailX, proj.position.y + 4, 15, proj.height - 8);
    }
    ctx.restore();
  }
}
