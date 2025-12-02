// Simple WebSocket pairing server for Cannon game
// Usage: node ws-server.js
const WebSocket = require('ws');
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });
console.log('WebSocket server listening on', port);

let queue = null; // waiting socket
let rooms = new Map(); // socket -> peer

wss.on('connection', function connection(ws){
  ws.id = Math.random().toString(36).slice(2,9);
  console.log('client connected', ws.id);

  if(queue === null){
    queue = ws;
    ws.send(JSON.stringify({ type: 'assign', player: 1 }));
    ws._player = 1;
    ws.send(JSON.stringify({ type: 'wait', message: 'Esperando oponente...' }));
  } else {
    // pair with queue
    const a = queue; const b = ws; queue = null;
    a._peer = b; b._peer = a;
    a._player = 1; b._player = 2;
    // notify assignments
    a.send(JSON.stringify({ type: 'assign', player: 1 }));
    b.send(JSON.stringify({ type: 'assign', player: 2 }));
    // start game, let player 1 begin -- pick a random distance for the duel
    const distances = [120, 160, 200, 240, 300];
    const distance = distances[Math.floor(Math.random()*distances.length)];
    // include opponent uid if provided earlier via 'identify'
    a.send(JSON.stringify({ type: 'start', turn: 1, distance, opponentUid: b._uid || null }));
    b.send(JSON.stringify({ type: 'start', turn: 1, distance, opponentUid: a._uid || null }));
    console.log('paired', a.id, 'with', b.id);
  }

  ws.on('message', function incoming(message){
    // relay 'shot' messages to peer
    try{
      const msg = JSON.parse(message);
      // handle identify message
      if(msg.type === 'identify'){
        ws._uid = msg.uid || null;
        return;
      }
      if(ws._peer && ws._peer.readyState === WebSocket.OPEN){
        // augment with player id and forward uid when available
        if(msg.type === 'shot'){
          ws._peer.send(JSON.stringify({ type: 'shot', angle: msg.angle, power: msg.power, from: ws._player, uid: msg.uid || ws._uid || null }));
        } else {
          ws._peer.send(message);
        }
      }
    }catch(e){ console.error('invalid msg', e); }
  });

  ws.on('close', ()=>{
    console.log('client disconnected', ws.id);
    if(ws._peer && ws._peer.readyState === WebSocket.OPEN){
      ws._peer.send(JSON.stringify({ type: 'peer_left' }));
      ws._peer._peer = null;
    }
    if(queue === ws) queue = null;
  });
});
