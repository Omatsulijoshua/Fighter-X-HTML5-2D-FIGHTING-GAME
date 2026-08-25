import { expect, test, describe } from 'vitest';
import { LeaderboardService } from '../apps/server/src/database/leaderboard-service.js';

describe('Express Leaderboard API Tests', () => {
  test('should retrieve sorted leaderboard list', async () => {
    const list = await LeaderboardService.getLeaderboard(2);

    expect(list).toHaveLength(2);
    expect(list[0].rating).toBeGreaterThanOrEqual(list[1].rating);
    expect(list[0].username).toBe('BrutusMaximus');
  });

  test('should record score entries and update ranking placement', async () => {
    const submitSuccess = await LeaderboardService.submitMatchResult(
      'new_user_id',
      'ApexFighter',
      'WIN',
      100
    );

    expect(submitSuccess).toBe(true);

    const list = await LeaderboardService.getLeaderboard(10);
    const entry = list.find(e => e.username === 'ApexFighter');

    expect(entry).not.toBeUndefined();
    expect(entry!.rating).toBe(1100);
    expect(entry!.wins).toBe(1);
    expect(entry!.losses).toBe(0);

    await LeaderboardService.submitMatchResult('new_user_id', 'ApexFighter', 'WIN', 400);

    const updatedList = await LeaderboardService.getLeaderboard(10);
    const updatedEntry = updatedList.find(e => e.username === 'ApexFighter');

    expect(updatedEntry!.rating).toBe(1500);
    expect(updatedEntry!.wins).toBe(2);
    expect(updatedEntry!.rank).toBe(2);
  });
});
