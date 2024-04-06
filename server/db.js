const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI; // Add your MongoDB URI to .env file

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

// Assuming mongoose is already set up
const conversationSchema = new mongoose.Schema({
    history: [{
        role: String,
        content: String,
        timestamp: { type: Date, default: Date.now }
    }]
    // Optionally include a userId field if you want to differentiate between users
    // userId: String,
});

const Conversation = mongoose.model('Conversation', conversationSchema);


const assetSchema = new mongoose.Schema({
    name: String,
    ID: String,
    Department: String,
    date: String,
    notes: String,
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = { connectDB, Asset, Conversation };

