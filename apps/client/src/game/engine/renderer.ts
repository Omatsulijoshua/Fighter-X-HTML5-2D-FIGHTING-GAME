import { GAME_WIDTH, GAME_HEIGHT } from '@shadow-clash/shared';
import { GameContext, STAGE_WIDTH, GROUND_Y, GameProjectile } from './game-context.js';
import { Fighter } from '../fighters/fighter.js';
import { FIGHTER_TEMPLATES } from '../fighters/fighter-definitions.js';
import { STAGE_TEMPLATES } from '../stages/stage-definitions.js';

export class Renderer {
  public static draw(ctx: CanvasRenderingContext2D, context: GameContext, fps: number) {
    if (context.matchState === 'MAIN_MENU') {
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.drawMainMenu(ctx, context);
      return;
    }

    if (context.matchState === 'CHARACTER_SELECT') {
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.drawCharacterSelect(ctx, context);
      return;
    }

    if (context.matchState === 'STAGE_SELECT') {
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.drawStageSelect(ctx, context);
      return;
    }

    const activeStageKey = context.selectedStageId || 'SHADOW_SANCTUARY';
    const stage = STAGE_TEMPLATES[activeStageKey];

    // Clear Canvas
    ctx.fillStyle = stage.bgColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Save context for camera translation
    ctx.save();
    
    // Apply camera offset
    ctx.translate(-context.camera.position.x, -context.camera.position.y);

    // 2. Draw Stage Background Grid
    ctx.strokeStyle = stage.gridColor + '33';
    ctx.lineWidth = 1;
    const gridSize = stage.gridSize;
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
    ctx.fillStyle = stage.gridColor + '1a';
    ctx.fillRect(-10, 0, 10, GAME_HEIGHT);
    ctx.fillRect(STAGE_WIDTH, 0, 10, GAME_HEIGHT);

    // 4. Draw Floor
    ctx.strokeStyle = stage.floorColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(STAGE_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = stage.bgColor;
    ctx.fillRect(0, GROUND_Y, STAGE_WIDTH, GAME_HEIGHT - GROUND_Y);

    ctx.strokeStyle = stage.gridColor + '22';
    for (let x = 0; x < STAGE_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }

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
      if (context.isArcadeMode && context.matchWinner === 'p1') {
        ctx.fillText('ARCADE CHAMPIONSHIP CONQUERED!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('Press J to Play Again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
      } else {
        ctx.fillText('Match Ended. Refresh to Restart.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
      }
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

    // Arcade Overlays
    if (context.isArcadeMode) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(GAME_WIDTH / 2 - 120, 75, 240, 25);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `ARCADE PROGRESS: MATCH ${context.arcadeStage} OF 4`,
        GAME_WIDTH / 2,
        91
      );

      if (context.arcadeCleared) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#66fcf1';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ARCADE MATCH CLEARED!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.fillStyle = '#fff';
        ctx.font = '22px sans-serif';
        if (context.arcadeStage < 4) {
          ctx.fillText(`Defeated ${context.p2.name}!`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
          ctx.fillStyle = '#ff0055';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('Press J to Advance to Next Match', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        } else {
          ctx.fillText('CONGRATULATIONS CHAMPION!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
          ctx.fillText('You have conquered SHADOW CLASH Arcade Mode!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
          ctx.fillStyle = '#66fcf1';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText('Press J to Reset and Play Again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90);
        }
      }

      if (context.arcadeGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.fillText('Press J to Insert Coin & Retry Match', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
      }
    }
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

  private static drawStageSelect(ctx: CanvasRenderingContext2D, context: GameContext) {
    // Title
    ctx.fillStyle = '#66fcf1';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW CLASH - STAGE SELECT', GAME_WIDTH / 2, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText('P1: Use A/D to cycle, J to select Arena', GAME_WIDTH / 2, 120);

    const stageKeys = ['SHADOW_SANCTUARY', 'CYBER_GRID', 'VOLCANIC_RIFT'];
    const cardWidth = 280;
    const cardHeight = 320;
    const spacing = 40;
    const totalWidth = (cardWidth * 3) + (spacing * 2);
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const startY = 190;

    for (let i = 0; i < 3; i++) {
      const stageKey = stageKeys[i];
      const template = STAGE_TEMPLATES[stageKey];
      const cardX = startX + i * (cardWidth + spacing);

      // Draw background
      ctx.fillStyle = '#1f2833';
      ctx.fillRect(cardX, startY, cardWidth, cardHeight);

      // Card Border
      ctx.strokeStyle = '#45f3ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, startY, cardWidth, cardHeight);

      // Cursor Highlight border
      const isSelected = context.stageCursorIndex === i;
      if (isSelected) {
        ctx.strokeStyle = '#ff0055'; // Pink glowing border
        ctx.lineWidth = 4;
        ctx.strokeRect(cardX - 4, startY - 4, cardWidth + 8, cardHeight + 8);

        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('SELECTING', cardX + cardWidth / 2, startY - 15);
      }

      // Stage Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(template.name, cardX + cardWidth / 2, startY + 50);

      // Description text wrapping
      ctx.fillStyle = '#c5c6c7';
      ctx.font = '13px sans-serif';
      
      const words = template.description.split(' ');
      let line = '';
      let lineY = startY + 100;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > cardWidth - 30) {
          ctx.fillText(line, cardX + cardWidth / 2, lineY);
          line = word + ' ';
          lineY += 18;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, cardX + cardWidth / 2, lineY);

      // Simple visual icon representation (colored mini-boxes representing the stage style)
      const visualY = startY + 220;
      
      // Draw background block
      ctx.fillStyle = template.bgColor;
      ctx.fillRect(cardX + 30, visualY, cardWidth - 60, 60);

      // Draw grid lines inside mini-box
      ctx.strokeStyle = template.gridColor + '66';
      ctx.lineWidth = 1;
      const step = 15;
      for (let gx = cardX + 30; gx < cardX + cardWidth - 30; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, visualY);
        ctx.lineTo(gx, visualY + 60);
        ctx.stroke();
      }
      // Floor line
      ctx.strokeStyle = template.floorColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cardX + 30, visualY + 45);
      ctx.lineTo(cardX + cardWidth - 30, visualY + 45);
      ctx.stroke();
    }
  }

  private static drawCharacterSelect(ctx: CanvasRenderingContext2D, context: GameContext) {
    // Title
    ctx.fillStyle = '#66fcf1';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW CLASH - CHARACTER SELECT', GAME_WIDTH / 2, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      context.isSinglePlayer 
        ? 'P1: Use A/D to cycle, J to select' 
        : 'P1: A/D & J to select | P2: Left/Right & Num1 to select',
      GAME_WIDTH / 2,
      120
    );

    const fighterKeys = ['KAIRO', 'BRUTUS', 'NYX', 'RAZOR'];
    const cardWidth = 220;
    const cardHeight = 360;
    const spacing = 40;
    const totalWidth = (cardWidth * 4) + (spacing * 3);
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const startY = 180;

    for (let i = 0; i < 4; i++) {
      const charKey = fighterKeys[i];
      const template = FIGHTER_TEMPLATES[charKey];
      const cardX = startX + i * (cardWidth + spacing);
      
      // Card Background
      ctx.fillStyle = '#1f2833';
      ctx.fillRect(cardX, startY, cardWidth, cardHeight);

      // Card Border
      ctx.strokeStyle = '#45f3ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(cardX, startY, cardWidth, cardHeight);

      // Draw Cursor borders
      const isP1Cursor = context.p1CursorIndex === i;
      const isP2Cursor = context.p2CursorIndex === i;

      if (isP1Cursor) {
        ctx.strokeStyle = '#ff0055'; // P1 Pink
        ctx.lineWidth = 4;
        ctx.strokeRect(cardX - 4, startY - 4, cardWidth + 8, cardHeight + 8);

        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('P1', cardX + cardWidth / 2, startY - 15);
      }

      if (isP2Cursor && !context.isSinglePlayer) {
        ctx.strokeStyle = '#0055ff'; // P2 Blue
        ctx.lineWidth = 4;
        ctx.strokeRect(cardX - 8, startY - 8, cardWidth + 16, cardHeight + 16);

        ctx.fillStyle = '#0055ff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('P2', cardX + cardWidth / 2, startY + cardHeight + 25);
      }

      // Draw Character Card info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(template.name, cardX + cardWidth / 2, startY + 45);

      // Description text wrapping helper
      ctx.fillStyle = '#c5c6c7';
      ctx.font = '12px sans-serif';
      
      // Simple word wrapping
      const words = template.description.split(' ');
      let line = '';
      let lineY = startY + 80;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > cardWidth - 20) {
          ctx.fillText(line, cardX + cardWidth / 2, lineY);
          line = word + ' ';
          lineY += 15;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, cardX + cardWidth / 2, lineY);

      // Draw Stats (Health, Speed, Jump, Weight)
      const statsY = startY + 180;
      
      this.drawStatBar(ctx, cardX + 15, statsY, cardWidth - 30, 'Health', template.maxHealth, 150);
      this.drawStatBar(ctx, cardX + 15, statsY + 35, cardWidth - 30, 'Speed', template.speed, 10);
      this.drawStatBar(ctx, cardX + 15, statsY + 70, cardWidth - 30, 'Jump', template.jumpForce, 25);
      this.drawStatBar(ctx, cardX + 15, statsY + 105, cardWidth - 30, 'Weight', template.weight, 2.0);

      // Selected / Ready Overlays
      const p1SelectedThis = context.p1SelectedChar === charKey;
      const p2SelectedThis = context.p2SelectedChar === charKey;

      if (p1SelectedThis || p2SelectedThis) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.fillRect(cardX, startY, cardWidth, cardHeight);

        ctx.fillStyle = '#4caf50';
        ctx.font = 'bold 20px sans-serif';
        if (p1SelectedThis && p2SelectedThis) {
          ctx.fillText('BOTH READY', cardX + cardWidth / 2, startY + cardHeight - 20);
        } else if (p1SelectedThis) {
          ctx.fillText('P1 READY', cardX + cardWidth / 2, startY + cardHeight - 20);
        } else {
          ctx.fillText(context.isSinglePlayer ? 'CPU READY' : 'P2 READY', cardX + cardWidth / 2, startY + cardHeight - 20);
        }
      }
    }
  }

  private static drawStatBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    label: string,
    val: number,
    maxVal: number
  ) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c5c6c7';
    ctx.font = '11px monospace';
    ctx.fillText(`${label}: ${val.toFixed(1)}`, x, y);

    // Bar background
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(x, y + 4, w, 6);

    // Fill
    const ratio = Math.min(1.0, val / maxVal);
    ctx.fillStyle = '#66fcf1';
    ctx.fillRect(x, y + 4, w * ratio, 6);
  }

  private static drawMainMenu(ctx: CanvasRenderingContext2D, context: GameContext) {
    ctx.fillStyle = '#0d001a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = '#66fcf1';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#66fcf1';
    ctx.shadowBlur = 15;
    ctx.fillText('SHADOW CLASH', GAME_WIDTH / 2, 220);

    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '20px sans-serif';
    ctx.fillText('HTML5 2D FIGHTING GAME', GAME_WIDTH / 2, 270);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px sans-serif';
    ctx.fillText('P1: Use W/S to cycle options, J to select', GAME_WIDTH / 2, 540);

    const options = [
      'ARCADE MODE (1P vs CPU)',
      'VERSUS MODE (Local 2P)'
    ];

    const menuY = 380;
    const spacing = 60;

    for (let i = 0; i < 2; i++) {
      const isSelected = context.menuIndex === i;
      ctx.textAlign = 'center';
      
      if (isSelected) {
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 28px sans-serif';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillText(`> ${options[i]} <`, GAME_WIDTH / 2, menuY + i * spacing);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillText(options[i], GAME_WIDTH / 2, menuY + i * spacing);
      }
    }
    
    ctx.shadowBlur = 0;
  }
}
