require('dotenv').config();
const mongoose = require('mongoose');

// Define the schema directly inside seed.js to avoid "Module Not Found" errors
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    variants: [{
        sku: String,
        color: String,
        price: Number,
        stock: Number
    }],
    reviews: [{
        userId: mongoose.Schema.Types.ObjectId,
        rating: Number,
        comment: String
    }],
    avgRating: { type: Number, default: 0 }
});

const Product = mongoose.model('Product', productSchema);

const seedData = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected! Seeding data...");

        // Clear existing data to avoid duplicates
        await Product.deleteMany({});

        const sampleProduct = new Product({
            name: "Premium Headphones",
            category: "Electronics",
            variants: [
                { sku: "HP-BL-001", color: "Black", price: 199.99, stock: 15 },
                { sku: "HP-WH-001", color: "White", price: 209.99, stock: 8 }
            ],
            reviews: [
                { userId: new mongoose.Types.ObjectId(), rating: 5, comment: "Excellent sound quality" }
            ],
            avgRating: 5
        });

        await sampleProduct.save();
        console.log("✅ Database seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
};

seedData();