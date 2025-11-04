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
app.use(express.static(path.join(__dirname))); // Serves index.html, etc.

// MongoDB connection URI (do NOT expose in public repos)
const MONGODB_URI = 'mongodb+srv://manpreetkhokhar2004_db_user:nearsell@cluster0.j1vbotx.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => console.log('MongoDB Atlas connected'));
mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));

// Item Schema & Model
const itemSchema = new mongoose.Schema({
    owner: String,
    title: String,
    description: String,
    price: Number,
    category: String,
    state: String,
    city: String,
    sellerContact: String,
    status: String, // "active" or "sold"
    images: [String],
    createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', itemSchema);

// =========== API ROUTES ===========

// Get all items (descending by time)
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching items' });
    }
});

// Create new item
app.post('/api/items', async (req, res) => {
    try {
        const newItem = new Item(req.body);
        await newItem.save();
        res.json({ message: 'Item posted successfully', item: newItem });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error saving item' });
    }
});

// Get user listings by sellerContact
app.get('/api/user/listings', async (req, res) => {
    const sellerContact = req.query.sellerContact;
    if (!sellerContact) {
        return res.status(400).json({ error: 'sellerContact query parameter required' });
    }
    try {
        const listings = await Item.find({ sellerContact }).sort({ createdAt: -1 });
        res.json(listings);
    } catch (err) {
        console.error('Failed to fetch user listings', err);
        res.status(500).json({ error: 'Failed to fetch listings' });
    }
});

// PATCH: Update item status by ID
app.patch('/api/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        const updatedItem = await Item.findByIdAndUpdate(
            id, 
            { status }, 
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json({ message: 'Status updated', item: updatedItem });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update status' });
    }
});

// =========== START SERVER ===========
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

