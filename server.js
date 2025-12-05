// ============================================
// My Backend (express + MongoDB)
// ===========================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();

// --------------------------------------------
// CORS (allows frontend to talk to backend)
// --------------------------------------------
const corsOptions = {
  origin: "https://asalah03.github.io", 
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsOptions));

// --------------------------------------------
// Middleware
// --------------------------------------------

// Parse JSON request bodies (for POST / PUT)
app.use(express.json());

// logger middleware 
// Logs every request method + URL to the console
app.use((req, res, next) => {
  console.log(`[LOG] ${req.method} ${req.url}`);
  next();
});

// --------------------------------------------
// Static Images Folder 
// --------------------------------------------

// Serve image files from the "images" folder
const imagesDir = path.join(__dirname, 'images');
app.use('/images', express.static(imagesDir));

// If image not found by express.static, return JSON error
app.use('/images', (_req, res) => {
  res.status(404).json({ error: 'Image not found' });
});

// --------------------------------------------
// MongoDB Setup
// --------------------------------------------

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME; // educate_app

let Lessons;
let Orders;

async function connectDB() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  Lessons = db.collection('lessons');
  Orders  = db.collection('orders');

  console.log(`Connected to MongoDB → Database: ${dbName}`);
}

// --------------------------------------------
// API ROUTES
// --------------------------------------------

// GET all lessons (subject, location, price, spaces, image)
app.get('/api/lessons', async (_req, res) => {
  try {
    const data = await Lessons.find().toArray();
    res.json(data);
  } catch (err) {
    console.error('Error loading lessons:', err);
    res.status(500).json({ message: 'Failed to load lessons' });
  }
});

// POST new order
app.post('/api/order', async (req, res) => {
  try {
    const order = {
      name: req.body.name,
      phone: req.body.phone,
      items: req.body.items,
      total: req.body.total,
      createdAt: new Date()
    };

    await Orders.insertOne(order);
    res.json({ message: 'Order saved' });
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ message: 'Failed to save order' });
  }
});

// PUT update lesson spaces (identified by subject + location)
app.put('/api/lessons', async (req, res) => {
  try {
    const { subject, location, spaces } = req.body;

    // Basic validation
    if (!subject || !location || typeof spaces !== 'number') {
      return res
        .status(400)
        .json({ message: 'subject, location, and numeric spaces are required' });
    }

    const result = await Lessons.updateOne(
      { subject, location },        // which lesson
      { $set: { spaces: spaces } }  // new spaces value
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.json({ message: 'Lesson updated' });
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ message: 'Failed to update lesson' });
  }
});

// --------------------------------------------
// Start server AFTER connecting to DB
// --------------------------------------------

const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
