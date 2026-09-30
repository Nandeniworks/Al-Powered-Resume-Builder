const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const templateRoutes = require('./routes/templateRoutes');
const aiRoutes = require('./routes/aiRoutes');
const shareRoutes = require('./routes/shareRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// 1. Load environment variables from backend/.env explicitly
dotenv.config({ path: path.resolve(__dirname, '.env') });

// 2. Connect to Database
connectDB();

// 3. Initialize Express application
const app = express();

// 4. Create HTTP server for Express and Socket.io
const server = http.createServer(app);

// 5. Minimal Socket.io setup (basic integration placeholder for future real-time features)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  // Real-time connection placeholder
});

// 6. Built-in and third-party Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. Base test route
app.get('/', (req, res) => {
  res.send('AI-Powered Resume Builder API is running...');
});

// 8. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// 9. Start server listening on configured PORT (PORT=3000)
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle common startup errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
});
