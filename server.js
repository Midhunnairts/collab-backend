require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const Document = require('./models/Document'); // Import Document model
const Delta = require('quill-delta'); // Import Quill Delta

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Join a document room
  socket.on('join-document', async (documentId) => {
    socket.join(documentId);
    console.log(`User ${socket.id} joined document ${documentId}`);

    // Load initial document content
    try {
      // Load initial document content
      const document = await Document.findById(documentId);
      if (document) {
        socket.emit('load-document', document.content || new Delta()); // Send Delta format
      } else {
        console.warn(`Document not found: ${documentId}`);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    }
  });

  // Handle real-time content updates
  socket.on('update-document', async ({ documentId, delta }) => {
    try {
      // Broadcast the delta to other users in the room
      socket.to(documentId).emit('receive-changes', delta);

      // Update the document in the database
      const document = await Document.findById(documentId);
      if (document) {
        const currentContent = new Delta(document.content || []);
        const updatedContent = currentContent.compose(new Delta(delta)); // Merge changes
        document.content = updatedContent; // Save the merged Delta
        await document.save();
      }
    } catch (error) {
      console.error('Error updating document:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
