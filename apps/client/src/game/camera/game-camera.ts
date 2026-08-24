import { Vector2D, GAME_WIDTH } from '@shadow-clash/shared';

export class GameCamera {
  public position: Vector2D = { x: 0, y: 0 };
  public zoom: number = 1.0;
  
  private targetPosition: Vector2D = { x: 0, y: 0 };
  private lerpSpeed: number = 0.1;

  public update(p1Pos: Vector2D, p2Pos: Vector2D, stageWidth: number) {
    // Center point between the two players
    const midX = (p1Pos.x + p2Pos.x) / 2;

    // Camera origin is top-left, center the camera on midX
    this.targetPosition.x = midX - GAME_WIDTH / 2;
    
    // Smooth tracking (LERP)
    this.position.x += (this.targetPosition.x - this.position.x) * this.lerpSpeed;

    // Clamp within stage bounds
    const minX = 0;
    const maxX = stageWidth - GAME_WIDTH;
    if (this.position.x < minX) this.position.x = minX;
    if (this.position.x > maxX) this.position.x = maxX;

    // Vertical position remains static at 0
    this.position.y = 0;
  }
}
