# Project Status - SHADOW CLASH

## Current Status
- **Current Phase**: Phase 4: Combat Engine (Completed)

## Completed Features
- **Root Configuration**: Setup npm workspaces, build scripts, tsconfig defaults, and testing framework (Vitest).
- **Shared Library (`packages/shared`)**: Configured TypeScript paths, declared core types (Vector2D, Hitbox, FighterState, MatchState, AttackDefinition, FighterDefinition, game state payloads), constant configs (GAME_WIDTH = 1280, GAME_HEIGHT = 720, TICK_RATE = 60), and network protocols (Socket.IO events map).
- **Server Scaffold (`apps/server`)**: Set up an authoritative Express server on port 3005 with Socket.IO integration and connection handlers.
- **Client Scaffold (`apps/client`)**: Configured Vite, Socket.IO client connections, dynamic responsive canvas sizing (1280x720 aspect ratio), and a 60 FPS drawing loop rendering a grid stage and mock fighter elements.
- **Admin Scaffold (`apps/admin`)**: Scaffolding Vite and admin portal dashboard foundation.
- **Prisma Schema (`prisma/schema.prisma`)**: Modeled Postgres entities (User, Profile, Match, MatchPlayer, Leaderboard, GameSession, Ban, Report, Admin, GameSetting).
- **Testing Foundation (`tests`)**: Vitest configuration and verification checks.
- **Input Manager (`apps/client/src/game/input/input-manager.ts`)**: Layout-independent keyboard event polling mapped to standard player inputs for local movement.
- **Physics Engine (`apps/client/src/game/physics/physics-engine.ts`)**: Rigid-body physics, gravity, horizontal air/ground friction, velocity clamps, and boundary clamps.
- **Collision Detector (`apps/client/src/game/collision/collision-detector.ts`)**: AABB overlaps detection and player-push resolution including corner clamping.
- **Game Camera (`apps/client/src/game/camera/game-camera.ts`)**: Viewport centring mid-point follow tracking with linear interpolation (lerp).
- **Renderer (`apps/client/src/game/engine/renderer.ts`)**: Renders stages, grids, player blocks, and HUD. Shows crouch, blocks, attack hits, special glows, combo numbers, round win dots, and dead/knocked-down positions.
- **Fixed Timestep Loop (`apps/client/src/game/engine/game-loop.ts`)**: Logic tick accumulator running at 60Hz.
- **Fighter Stance (`apps/client/src/game/fighters/fighter.ts`)**: Fighter class with stats, crouches, blocks, hit flash, health, and death triggers.
- **Hurtbox Set (`apps/client/src/game/fighters/fighter.ts`)**: Relative hurtbox definitions mapping Head, Torso, and Legs of fighters.
- **Combat Logic (`apps/client/src/game/engine/game-loop.ts`)**: Advanced hit validation checks, energy charge mechanics, unblockable grabs (throws), and combo hit counts with 15% damage scaling.
- **Stun / Invincibility Cycles (`apps/client/src/game/fighters/fighter.ts`)**: Invincible state flows during knockdowns (`KNOCKED_DOWN`) and recovery (`GETTING_UP`).
- **Round System (`apps/client/src/game/engine/game-loop.ts`)**: Best-of-3 round manager featuring countdown sequences, 99-second timers, round reset logic, and match winner screen states.

## Remaining Features
- **Phase 5**: Multiple fighters (Razor, Nyx, Brutus, Kairo unique definitions).
- **Phase 6**: AI system (Easy, Normal, Hard, Expert configurations).
- ... (Phases 7 to 16)

## Known Bugs
- None.

## Tests Performed
1. **TypeScript compilation**: Built all packages using `npm run build`.
2. **Unit tests**: Ran `npm run test` executing shared constants tests, physics tests (gravity, friction, floor clamps), collision tests (overlaps, body-pushes, corner resolution), fighter tests (crouches, blocks, deaths), and combat tests (hurtbox hits, combo decay scaling, special energy costs, unblockable throws).
3. **Browser Integration**: Ran headless Chrome via Puppeteer to load `http://localhost:5173/`, checked for JS console and network errors, and verified WebSocket connection handshake.

## Test Results
1. **TypeScript build**: Compiles cleanly with exit code 0.
2. **Vitest unit tests**: 20/20 tests passed successfully.
3. **Browser verification**: 0 console errors, 0 network errors. Verified stable loop ticking at 60 FPS, Socket.IO handshakes, canvas drawing of countdowns, combo counters, energy bars, and round indicators.

## Next Phase
- Phase 5: Multiple Fighters

## Important Architectural Decisions
1. **Monorepo structure**: Using npm workspaces under `apps/*` and `packages/*` to maintain distinct deployment units (client, server, admin) and share typescript models efficiently.
2. **Lightweight engine**: Custom Canvas game loop rather than heavy game frameworks to ensure low input latency and precise state reconciliation.
3. **TypeScript everywhere**: Strong compile-time guarantees across packages, with shared types compiled for node/browser contexts.
4. **Authoritative Backend port**: Port 3005 chosen to avoid local 3001 collisions.
5. **Decoupled Tick Rate**: Physics loop runs at a fixed 60Hz timestep, completely decoupled from the browser's paint loop (`requestAnimationFrame`), avoiding speed variations across displays.
6. **State-Machine Driven Fighters**: Fighter actions, timers, states, and hitboxes are encapsulated in a single, data-driven class, avoiding hardcoding individual player rules.
7. **Hurtbox Segmentation**: Fighters are partitioned into three distinct hurtboxes (Head, Torso, Legs) rather than a single large box, allowing for sophisticated hit detection, hit box alignment, and crouch evasions.
8. **Decay Damage Scaling**: Configured combo multipliers scaling down sequential hits to protect player balance and suppress infinite loop exploits.
