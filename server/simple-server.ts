import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 5000;

// Basic middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock user endpoint for development
app.get('/api/auth/user', (req, res) => {
  res.json({
    id: 'dev-user-123',
    email: 'dev@example.com',
    firstName: 'Dev',
    lastName: 'User',
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
});

// Simple login/logout routes
app.get('/api/login', (req, res) => {
  res.redirect('/');
});

app.get('/api/logout', (req, res) => {
  res.redirect('/');
});

// Simple static serving
app.use(express.static('client'));

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client/index.html'));
});

const httpServer = createServer(app);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Simple server ready at http://0.0.0.0:${port}`);
});

httpServer.on('error', (error) => {
  console.error('Server error:', error);
});