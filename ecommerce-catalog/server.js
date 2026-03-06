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

/**
 * HOMEPAGE: Matches your UI Screenshot
 * Displays products in a styled list.
 */
app.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        
        let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ecommerce Catalog</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background-color: #fff; color: #333; }
                h1 { font-size: 28px; margin-bottom: 30px; font-weight: bold; }
                .product-card { border: 1px solid #eee; padding: 25px; margin-bottom: 25px; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .product-name { font-size: 22px; font-weight: bold; margin: 0 0 15px 0; }
                .detail { margin: 8px 0; font-size: 16px; color: #444; }
                .nav-links { margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 5px; }
                a { color: #007bff; text-decoration: none; margin-right: 15px; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <h1>Ecommerce Catalog</h1>
            ${products.length > 0 ? products.map(p => `
                <div class="product-card">
                    <div class="product-name">${p.name}</div>
                    <p class="detail">Category: ${p.category}</p>
                    <p class="detail">Avg Rating: ${p.avgRating}</p>
                </div>
            `).join('') : '<p>No products found. Please seed your database.</p>'}

            <div class="nav-links">
                <strong>API Endpoints:</strong>
                <a href="/api/products">Raw JSON</a>
                <a href="/aggregation/low-stock">Low Stock Aggregation</a>
                <a href="/aggregation/category-ratings">Category Ratings Aggregation</a>
            </div>
        </body>
        </html>`;

        res.send(htmlContent);
    } catch (err) {
        res.status(500).send("Error loading catalog: " + err.message);
    }
});

/**
 * RAW JSON DATA: For verification
 */
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * AGGREGATION: Low Stock (Targeting Image 1)
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
 * AGGREGATION: Category Ratings (Targeting Image 2 & 3)
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