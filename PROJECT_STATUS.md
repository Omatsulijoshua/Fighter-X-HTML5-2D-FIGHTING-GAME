# Project Status - SHADOW CLASH

## Current Status
- **Current Phase**: Phase 12: Multiplayer Rooms (Completed)

## Completed Features
- **Root Configuration**: Setup npm workspaces, build scripts, tsconfig defaults, and testing framework (Vitest).
- **Shared Library (`packages/shared`)**: Configured TypeScript paths, declared core types (Vector2D, Hitbox, FighterState, MatchState, AttackDefinition, FighterDefinition, game state payloads), constant configs (GAME_WIDTH = 1280, GAME_HEIGHT = 720, TICK_RATE = 60), and network protocols (Socket.IO events map).
- **Server Scaffold (`apps/server`)**: Set up an authoritative Express server on port 3005 with Socket.IO integration and connection handlers.
- **Client Scaffold (`apps/client`)**: Configured Vite, Socket.IO client connections, dynamic responsive canvas sizing (1280x720 aspect ratio), and a 60 FPS drawing loop rendering a grid stage and mock fighter elements.
- **Admin Scaffold (`apps/admin`)**: Scaffolding Vite and admin portal dashboard foundation.
- **Prisma Schema (`prisma/schema.prisma`)**: Modeled Postgres entities (User, Profile, Match, MatchPlayer, Leaderboard, GameSession, Ban, Report, Admin, GameSetting).
- **Testing Foundation (`tests`)**: Vitest configuration and verification checks.
- **Input Manager (`apps/client/src/game/input/input-manager.ts`)**: Layout-independent keyboard event polling mapped to standard player inputs for local movement. Guarded event listener setup with `typeof window` check for server safety.
- **Physics Engine (`apps/client/src/game/physics/physics-engine.ts`)**: Rigid-body physics, gravity, horizontal air/ground friction, velocity clamps, and boundary clamps.
- **Collision Detector (`apps/client/src/game/collision/collision-detector.ts`)**: AABB overlaps detection and player-push resolution including corner clamping.
- **Game Camera (`apps/client/src/game/camera/game-camera.ts`)**: Viewport centring mid-point follow tracking with linear interpolation (lerp).
- **Renderer (`apps/client/src/game/engine/renderer.ts`)**: Renders stages, grids, player blocks, and HUD. Shows crouch, blocks, attack hits, special glows, combo numbers, round win dots, and dead/knocked-down positions. Added active projectiles drawing support. Draws active stage graphics dynamically. Renders custom arcade overlays, maps, and retry/clear screens. Draws Main Menu with selections and glows.
- **Fixed Timestep Loop (`apps/client/src/game/engine/game-loop.ts`)**: Logic tick accumulator running at 60Hz.
- **Fighter Stance (`apps/client/src/game/fighters/fighter.ts`)**: Fighter class with stats, crouches, blocks, hit flash, health, and death triggers.
- **Hurtbox Set (`apps/client/src/game/fighters/fighter.ts`)**: Relative hurtbox definitions mapping Head, Torso, and Legs of fighters.
- **Combat Logic (`apps/client/src/game/engine/game-loop.ts`)**: Advanced hit validation checks, energy charge mechanics, unblockable grabs (throws), and combo hit counts with 15% damage scaling.
- **Stun / Invincibility Cycles (`apps/client/src/game/fighters/fighter.ts`)**: Invincible state flows during knockdowns (`KNOCKED_DOWN`) and recovery (`GETTING_UP`).
- **Round System (`apps/client/src/game/engine/game-loop.ts`)**: Best-of-3 round manager featuring countdown sequences, 99-second timers, round reset logic, and match winner screen states.
- **Fighter Templates (`apps/client/src/game/fighters/fighter-definitions.ts`)**: Configured 4 balanced, data-driven templates: Kairo, Brutus, Nyx, and Razor.
- **Unique Specials & Projectile Engine (`apps/client/src/game/engine/game-loop.ts`)**: Implemented Kairo's speed dash, Nyx's swap-side teleportation, Brutus's heavy ground smash, and Razor's traveling Energy Blade projectile.
- **Circular Dependency Break (`apps/client/src/game/fighters/attack-definitions.ts`)**: Decoupled default attacks from `fighter.ts` to allow templates and fighters to import them independently.
- **AI Decision Engine (`apps/client/src/game/engine/ai-opponent.ts`)**: Rules-based AI routing logic driving Player 2's inputs dynamically. Supports Easy, Normal, Hard, and Expert difficulty levels.
- **Character Selection Screen (`apps/client/src/game/engine/renderer.ts`)**: Canvas-rendered character select interface. Features horizontal statistics cards, description word wrapping, pink/blue cursor glowing boundaries, and unblockable select overlays.
- **Selection Loop Controls (`apps/client/src/game/engine/game-loop.ts`)**: Cycle-navigation inputs with cooldown limit ticks (WASD for P1, Arrows for local P2) and random CPU locks in single-player mode. Instantiates fighters and triggers match fight countdowns.
- **Arena Stage Selection Screen (`apps/client/src/game/engine/renderer.ts`)**: Canvas-rendered stage select selector. Draws 3 side-by-side cards representing arenas (Shadow Sanctuary, Cyber Grid, Volcanic Rift) displaying preview icons (with colors, grids, floors), selection highlights, and descriptions.
- **Stage Selection Loops (`apps/client/src/game/engine/game-loop.ts`)**: Tracks P1's selection inputs (A/D to cycle, J to select) during the STAGE_SELECT matchState, initializing battle countdowns upon lock.
- **Single-Player Arcade Ladder (`apps/client/src/game/engine/game-loop.ts`)**: Structured a 4-match AI progression sequence (Easy Kairo -> Normal Nyx -> Hard Razor -> Expert Brutus) in themed arenas, complete with stage-clear overlays, Game Over retries, and victory screens.
- **Landing Main Menu Screen (`apps/client/src/game/engine/renderer.ts`)**: Designed canvas-rendered main landing selection menu supporting up/down scrolling selection inputs (W/S to cycle, J to lock) toggling between Arcade Mode (SP) and Versus Mode (Local 2P).
- **Match Scoreboard Menu Reset (`apps/client/src/game/engine/game-loop.ts`)**: Enabled resetting games directly back to the Main Menu when P1 presses Light Attack on match end scoreboards.
- **Multiplayer Matchmaking Service (`apps/server/src/matchmaking/matchmaker.ts`)**: Implemented FIFO player queue matcher generating unique random match room codes. Exposed HTTP endpoints (`GET /api/matchmaking/status`, `POST /api/matchmaking/join`, `POST /api/matchmaking/leave`) and WebSocket handlers (`matchmaking-join`, `matchmaking-leave`) that pair active sockets.
- **Multiplayer Game Rooms System (`apps/server/src/rooms/room-manager.ts`)**: Coded a synchronized lobby rooms coordinator. Features socket triggers (`create-room`, `join-room`, `character-selected`, `stage-selected`), automatic host migration on disconnects, lobby empty purges, and real-time input-relay tunnels mapping matched connection ticks.

## Remaining Features
- **Phase 13**: Online character selection (network selection updates, ready locking).
- ... (Phases 14 to 16)

## Known Bugs
- None.

## Tests Performed
1. **TypeScript compilation**: Built all packages using `npm run build`.
2. **Unit tests**: Ran `npm run test` executing 43 tests checking shared models, physics, pushbacks, fighter hit behaviors, combat combo scaling, specials, projectiles, AI reaction delays, character select cursors, CPU selections, stage cursor cycles, stage select locks, arcade bypass selectors, stage clear advancing, game over retries, main menu cursors, versus mode select transitions, matchmaking queue additions, duplicate queue blocks, matchmaking queue leaves, matchmaking pairs, host migrations, multiplayer lobby allocations, guest limits, disconnect purges, and fighter initializations.
3. **Browser Integration**: Ran headless Chrome via Puppeteer to load `http://localhost:5173/`, checked for JS console and network errors, and verified WebSocket connection handshake.

## Test Results
1. **TypeScript build**: Compiles cleanly with exit code 0.
2. **Vitest unit tests**: 43/43 tests passed successfully.
3. **Browser verification**: 0 console errors, 0 network errors. Verified stable loop ticking at 60 FPS, Socket.IO handshakes, canvas drawing, and server health.

## Next Phase
- Phase 13: Online Character Selection

## Important Architectural Decisions
1. **Monorepo structure**: Using npm workspaces under `apps/*` and `packages/*` to maintain distinct deployment units (client, server, admin) and share typescript models efficiently.
2. **Lightweight engine**: Custom Canvas game loop rather than heavy game frameworks to ensure low input latency and precise state reconciliation.
3. **TypeScript everywhere**: Strong compile-time guarantees across packages, with shared types compiled for node/browser contexts.
4. **Authoritative Backend port**: Port 3005 chosen to avoid local 3001 collisions.
5. **Decoupled Tick Rate**: Physics loop runs at a fixed 60Hz timestep, completely decoupled from the browser's paint loop (`requestAnimationFrame`), avoiding speed variations across displays.
6. **State-Machine Driven Fighters**: Fighter actions, timers, states, and hitboxes are encapsulated in a single, data-driven class, avoiding hardcoding individual player rules.
7. **Hurtbox Segmentation**: Fighters are partitioned into three distinct hurtboxes (Head, Torso, Legs) rather than a single large box, allowing for sophisticated hit detection, hit box alignment, and crouch evasions.
8. **Decay Damage Scaling**: Configured combo multipliers scaling down sequential hits to protect player balance and suppress infinite loop exploits.
9. **Attack definitions decoupling**: Decoupling default attacks into `attack-definitions.ts` resolves circular dependency loops during template instantiation.
10. **AIOpponent isolation**: Placed the AI logic in a standalone decision component, returning virtual input masks that route seamlessly into P2 in place of physical keyboard inputs.
11. **State Isolation**: Checked matchState inside Renderer.draw and GameLoop.tick to completely isolate character selection render and control loops from battle loops.
12. **Stage definitions decoupling**: Decoupling stage templates into `stage-definitions.ts` keeps stage data out of the main renderer file, allowing the engine to adapt to future stages dynamically.
13. **Arcade Progression Interception**: Overlay states (`arcadeCleared` and `arcadeGameOver`) intercept standard tick cycles at the start of `tick()`, allowing dedicated input queries for menu navigation (retrying and advancing) before physics and combat evaluate.
14. **State Machine Rooting**: Introducing `MAIN_MENU` at the beginning of the `MatchState` lifecycle cleanly coordinates game mode properties, player control assignments, and post-game score resets.
15. **Event-driven Matchmaker**: Decoupled matching pairing tickers run asynchronously from network threads, relying on Socket rooms broadcasting to handle game synchronization and room allocations.
16. **FIFO relay netcode**: The server delegates game frame inputs dynamically between paired sockets without processing physics, minimizing server memory footprints and input latency.
