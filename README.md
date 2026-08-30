# SHADOW CLASH ⚔️
### HTML5 2D Fighting Game Monorepo

Shadow Clash is a fully featured, high-performance HTML5 2D fighting game built using a custom physics engine, authoritative server pairing, deterministic delay-based network synchronization, and expressive Elo leaderboards.

---

## 🚀 Key Features

*   **Custom Physics & Body Collisions**: Features rigid-body calculations, gravity curves, air/ground friction coefficients, speed clamps, and boundary clamps.
*   **Segmented Multi-Hurtbox System**: Partitioned Head, Torso, Leg hurtboxes mapping fighter profiles, enabling crouch evasion, attack ranges, and unblockable grab checks.
*   **Unique Special Attacks & Projectiles**: Balanced fighter templates featuring Kairo's energy dash, Brutus's heavy ground smash, Nyx's teleport, and Razor's Energy Blade projectiles.
*   **AI Decision Engine**: Rules-based AI decision routers driving virtual inputs with Easy, Normal, Hard, and Expert difficulties.
*   **Local & Single-Player Arcade Progression**: A 4-match AI ladder stage progression featuring countdowns, best-of-3 round logic, custom arenas, retries, and high-score scoreboard panels.
*   **FIFO REST Express Matchmaking**: Pairings queue coordinator paired with authoritative lobby management.
*   **Deterministic Netcode**: Delay-based (wait-for-input) network synchronization that freezes ticking until input frames from both clients are received, completely preventing position desyncs.
*   **Prisma Database & Leaderboards**: Full Express rating endpoints (`GET /api/leaderboard`, `POST /api/leaderboard/submit`) backed by an error-safe offline cache fallback.
*   **Responsive Viewport & Mobile Controls**: Aspect-ratio-locked scaling canvas containers alongside dynamically toggled virtual touch controllers (D-pad & action buttons).

---

## 📁 Repository Structure

```
├── apps/
│   ├── client/         # Vite client bundle housing canvas renderer and inputs manager
│   ├── server/         # Express autoritative websocket backend and database coordinator
│   └── admin/          # Admin operations dashboard portal
├── packages/
│   └── shared/         # Shared typescript models, constants, and network protocols
├── prisma/
│   └── schema.prisma   # PostgreSQL prisma relational schemas
├── tests/              # Comprehensive Vitest unit test suites and Puppeteer QA checks
└── README.md
```

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18+)
*   NPM (v9+)

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   cd "Fghter x"
   ```
2. Install monorepo dependencies:
   ```bash
   npm install
   ```
3. Generate the Prisma Client models:
   ```bash
   npm run prisma:generate
   ```

### Running the Game
Launch the server and client dev servers concurrently in separate terminals:

1. **Start the Backend Server (Express + Socket.IO)**:
   ```bash
   npm run dev:server
   ```
   *Runs on port 3005.*

2. **Start the Frontend Client (Vite)**:
   ```bash
   npm run dev:client
   ```
   *Runs on port 5173.* Navigate to `http://localhost:5173` to play the game.

---

## 🕹️ Controls Guide

### Keyboard Bindings
| Action | Player 1 (Local / Host) | Player 2 (Local / Guest) |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | `◀` / `▶` |
| **Jump / Crouch** | `W` / `S` | `▲` / `▼` |
| **Light Attack (L)** | `J` | `Numpad 1` |
| **Heavy Attack (H)** | `K` | `Numpad 2` |
| **Special Attack (S)** | `L` | `Numpad 3` |
| **Block (B)** | `I` | `Numpad 4` |
| **Grab / Throw (G)** | `U` | `Numpad 5` |
| **Debug Mode Toggle** | `F3` | — |

### Mobile Touch Controls
When playing on touch-enabled devices (or using mobile screen emulation), virtual overlays will automatically appear:
*   **Left Side (D-pad)**: ◀ (Left), ▶ (Right), ▲ (Jump), ▼ (Crouch).
*   **Right Side (Action buttons)**: **L** (Light), **H** (Heavy), **S** (Special), **B** (Block), **G** (Grab).

---

## 🧪 Testing and Verification
Run the Vitest assertion suite checking physics, combat combos, matchmaking rooms, netcode synchronization, and leaderboards:
```bash
npm run test
```
*Current test suite: 53/53 tests passing.*
