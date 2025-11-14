# WebSocket server for NaturalCiencia — Cannon Game

This simple server pairs two connected clients into a match and relays 'shot' messages between them.

Prerequisites
- Node.js (14+ recommended)

Install and run

```bash
cd server
npm install
npm start
```

The server listens by default on port 8080. The client code in `juego_canion.html` attempts to connect to `ws://<host>:8080` (using the page host). For local development, open the pages with a local static server and run the WebSocket server on the same machine.

Behavior
- When a single client connects, it's put into a waiting queue (player 1) until a second client connects.
- When a second client connects, both are assigned players (1 and 2). A `start` message is sent and player 1 starts.
- When a client sends `{type:'shot', angle, power}` the server relays it to the opponent as `{type:'shot', angle, power, from}`.
- If a peer disconnects the other receives `{type:'peer_left'}`.

Security
- This server is intentionally minimal for local development. Do not expose it to the public Internet without proper authentication and validation.
