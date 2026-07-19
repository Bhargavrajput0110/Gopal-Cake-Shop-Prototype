const express = require('express');
const next = require('next');
const { createServer } = require('http');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  
  // Attach Socket.IO to the HTTP server
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Make io accessible globally for API routes to emit events
  global.io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join branch-specific rooms
    socket.on('join_branch', (branchId) => {
      socket.join(`branch_${branchId}`);
      console.log(`[Socket] ${socket.id} joined room: branch_${branchId}`);
    });

    socket.on('join_admin', () => {
      socket.join('admin_global');
      console.log(`[Socket] ${socket.id} joined room: admin_global`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });



  // Let Next.js handle all routes
  server.use((req, res) => {
    return handle(req, res);
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> 🚀 Custom Server ready on http://${hostname}:${port}`);
    console.log(`> ⚡ Socket.IO initialized`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
