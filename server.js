const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (your HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB Atlas
// Replace <username>, <password>, <cluster-url>, <dbname> with your Atlas details
mongoose.connect('mongodb+srv://manpreetkhokhar2004_db_user:nearsell@cluster0.j1vbotx.mongodb.net/?appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Atlas connected'))
.catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schema for Items
const itemSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    category: String,
    state: String,
    city: String,
    sellerContact: String,
    images: [String],
    createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

// API to get all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching items' });
    }
});

// API to post new item
app.post('/api/items', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.json({ message: 'Item posted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error saving item' });
    }
});

// Assuming you have an Express app and a database connection

app.get('/api/user/listings', async (req, res) => {
  const ownerName = req.query.sellerContact;

  if (!ownerName) {
    return res.status(400).json({ error: 'Owner query parameter required' });
  }

  try {
    // Replace this with your actual DB call to fetch listings by owner
    const listings = await db.collection('listings')
      .find({ owner: ownerName })
      .toArray();

    res.json(listings);
  } catch (err) {
    console.error('Failed to fetch user listings', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
