const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product'); // Ensure this points to your model file

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
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
  console.log("Data Seeded!");
  process.exit();
};

seedData();