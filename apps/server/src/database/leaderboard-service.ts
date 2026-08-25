import { prisma } from './db.js';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  favoriteFighter: string;
}

let inMemoryLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'BrutusMaximus', rating: 1500, wins: 20, losses: 5, favoriteFighter: 'BRUTUS' },
  { rank: 2, username: 'KairoShadow', rating: 1420, wins: 15, losses: 3, favoriteFighter: 'KAIRO' },
  { rank: 3, username: 'NyxReaper', rating: 1310, wins: 12, losses: 6, favoriteFighter: 'NYX' },
  { rank: 4, username: 'RazorBlade', rating: 1100, wins: 8, losses: 8, favoriteFighter: 'RAZOR' }
];

export class LeaderboardService {
  public static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const profiles = await prisma.profile.findMany({
        orderBy: [
          { rating: 'desc' },
          { wins: 'desc' }
        ],
        take: limit
      });

      if (profiles.length > 0) {
        return profiles.map((p: any, index: number) => ({
          rank: index + 1,
          username: p.username,
          rating: p.rating,
          wins: p.wins,
          losses: p.losses,
          favoriteFighter: p.favoriteFighter
        }));
      }
    } catch (e) {
      // Database offline or uninitialized
    }

    return inMemoryLeaderboard.slice(0, limit);
  }

  public static async submitMatchResult(
    userId: string,
    username: string,
    result: 'WIN' | 'LOSS',
    ratingChange: number
  ): Promise<boolean> {
    try {
      const winsInc = result === 'WIN' ? 1 : 0;
      const lossesInc = result === 'LOSS' ? 1 : 0;

      const profile = await prisma.profile.upsert({
        where: { userId },
        update: {
          wins: { increment: winsInc },
          losses: { increment: lossesInc },
          rating: { increment: ratingChange }
        },
        create: {
          userId,
          username,
          wins: winsInc,
          losses: lossesInc,
          rating: 1000 + ratingChange
        }
      });

      await prisma.leaderboard.upsert({
        where: { profileId: profile.id },
        update: {
          rating: profile.rating,
          rankName: profile.rank
        },
        create: {
          profileId: profile.id,
          rating: profile.rating,
          rankName: profile.rank
        }
      });

      return true;
    } catch (e) {
      // Database offline or uninitialized
    }

    let entry = inMemoryLeaderboard.find(e => e.username === username);
    if (!entry) {
      entry = {
        rank: 0,
        username,
        rating: 1000,
        wins: 0,
        losses: 0,
        favoriteFighter: 'KAIRO'
      };
      inMemoryLeaderboard.push(entry);
    }

    if (result === 'WIN') {
      entry.wins++;
    } else {
      entry.losses++;
    }
    entry.rating += ratingChange;

    inMemoryLeaderboard.sort((a, b) => b.rating - a.rating || b.wins - a.wins);
    inMemoryLeaderboard.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return true;
  }
}
