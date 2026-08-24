# SHADOW CLASH

Shadow Clash is a polished HTML5 2D fighting game monorepo with character selection, offline arcade mode, real-time multiplayer, AI opponents, and an admin dashboard.

## Tech Stack
- **Frontend**: TypeScript, HTML5 Canvas, CSS3, Vite
- **Backend**: Node.js, TypeScript, Express, Socket.IO
- **Database**: PostgreSQL, Prisma ORM
- **Testing**: Vitest

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup
1. Clone the repository and navigate into it:
   ```bash
   cd "Fghter x"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application (Local Development)
- **Run the Server**: `npm run dev:server` (Starts backend API/WebSocket server)
- **Run the Client**: `npm run dev:client` (Starts frontend Vite dev server)
- **Run Admin**: `npm run dev:admin` (Starts admin panel Vite dev server)

### Testing
- **Run Tests**: `npm run test`
