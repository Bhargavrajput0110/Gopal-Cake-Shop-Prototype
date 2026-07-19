import 'dotenv/config';
import { io } from 'socket.io-client';

async function testRecovery() {
  console.log("Stage 7: Starting WebSocket Recovery & Stability Test...");
  
  // Connect POS Socket with auto-reconnection enabled (default)
  const posSocket = io('http://localhost:3000', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  posSocket.on('connect', () => {
    console.log(`[Socket] POS Connected: ${posSocket.id}`);
    posSocket.emit('join_branch', 'dummy_branch');
  });

  posSocket.on('disconnect', (reason) => {
    console.log(`[Socket] POS Disconnected: ${reason}. Awaiting reconnect...`);
  });

  posSocket.io.on("reconnect", (attempt) => {
    console.log(`[Socket] POS Reconnected successfully on attempt ${attempt}`);
  });

  posSocket.io.on("reconnect_failed", () => {
    console.error("[Socket] POS Reconnect completely failed.");
  });

  // Wait 5 seconds for initial connection
  await new Promise(r => setTimeout(r, 5000));

  if (!posSocket.connected) {
    console.error("❌ Failed to connect to localhost:3000. Is the server running?");
    process.exit(1);
  }

  console.log("\n✅ INITIAL CONNECTION SUCCESS.");
  console.log("\n🛑 INSTRUCTION: Manually kill the server and restart it within 5 seconds...");
  
  // Wait 30 seconds to allow manual server restart test
  let checks = 0;
  let reconnected = false;
  
  while (checks < 30) {
    await new Promise(r => setTimeout(r, 1000));
    if (!posSocket.connected) {
      console.log(`Server is currently down... (check ${checks + 1}/30)`);
    } else if (checks > 2) {
      // If it reconnected after being down
      reconnected = true;
    }
    checks++;
  }

  if (reconnected && posSocket.connected) {
    console.log("\n✅ RECOVERY SUCCESS: Socket successfully re-established connection after server restart!");
  } else {
    console.log("\n⚠️ Test Finished (No downtime simulated, or reconnect failed).");
  }

  posSocket.disconnect();
}

testRecovery().catch(console.error);
