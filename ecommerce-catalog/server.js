require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 2. SCHEMAS & MODELS
const variantSchema = new mongoose.Schema({
    sku: { type: String, required: true },
    color: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 }
});

const reviewSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    rating: { type: Number, min: 1, max: 5 },
    comment: String
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    variants: [variantSchema],
    reviews: [reviewSchema],
    avgRating: { type: Number, default: 0 }
});

// Optimization: Index for the category ratings aggregation
productSchema.index({ category: 1, avgRating: -1 });

const Product = mongoose.model('Product', productSchema);

// 3. ROUTES

// Root Route
app.get('/', (req, res) => {
    res.send("<h1>E-commerce API is Live!</h1><p>Use /experiment-output to see the results.</p>");
});

/**
 * OBJECTIVE: Expected Output for Experiment 2.1.3
 * Returns the "Premium Headphones" document structure.
 */
app.get('/experiment-output', async (req, res) => {
    try {
        const product = await Product.findOne({ name: "Premium Headphones" }).select('-_id -__v');
        if (!product) return res.status(404).json({ message: "Product not found. Did you run the seed script?" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * OBJECTIVE: Aggregation Result (Image 1 - Low Stock)
 * Finds products where a variant's stock is less than 5.
 */
app.get('/aggregation/low-stock', async (req, res) => {
    try {
        const lowStock = await Product.aggregate([
            { $unwind: "$variants" },
            { $match: { "variants.stock": { $lt: 5 } } },
            { 
                $group: { 
                    _id: "$_id", 
                    name: { $first: "$name" }, 
                    lowStockProducts: { $push: "$variants" } 
                } 
            }
        ]);
        res.json({ lowStockProducts: lowStock });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * OBJECTIVE: Aggregation Result (Image 2 & 3 - Category Ratings)
 * Calculates average rating per category.
 */
app.get('/aggregation/category-ratings', async (req, res) => {
    try {
        const ratings = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    avgCategoryRating: { $avg: "$avgRating" }
                }
            },
            { $sort: { avgCategoryRating: -1 } }
        ]);
        res.json({ categoryRatings: [ratings] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});