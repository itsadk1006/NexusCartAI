require('dotenv').config();
const mongoose = require('mongoose');
const InventoryItem = require('./models/InventoryItem');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chefcart';

const seedData = [
  { sku: 'ITM-001', name: 'Cocoa Powder', category: 'baking', price: 150, stock: 50, isMarginBooster: false, unit: '250g' },
  { sku: 'ITM-002', name: 'All-Purpose Flour', category: 'baking', price: 60, stock: 100, isMarginBooster: false, unit: '1kg' },
  { sku: 'ITM-003', name: 'Unsalted Butter', category: 'dairy', price: 250, stock: 0, isMarginBooster: false, unit: '500g' }, // Out of stock for testing
  { sku: 'ITM-004', name: 'Vanilla Extract', category: 'baking', price: 300, stock: 20, isMarginBooster: false, unit: '50ml' },
  { sku: 'ITM-005', name: '8-inch Cake Tin', category: 'cookware', price: 450, stock: 15, isMarginBooster: true, unit: '1 unit' },
  { sku: 'ITM-006', name: 'Cupcake Liners', category: 'baking', price: 80, stock: 200, isMarginBooster: true, unit: '100 units' },
  { sku: 'ITM-007', name: 'Pasta (Penne)', category: 'grocery', price: 120, stock: 80, isMarginBooster: false, unit: '500g' },
  { sku: 'ITM-008', name: 'Olive Oil', category: 'grocery', price: 800, stock: 40, isMarginBooster: true, unit: '1L' },
  { sku: 'ITM-009', name: 'Tomato Basil Sauce', category: 'grocery', price: 200, stock: 60, isMarginBooster: false, unit: '400g' },
  { sku: 'ITM-010', name: 'Parmesan Cheese', category: 'dairy', price: 400, stock: 0, isMarginBooster: true, unit: '200g' }, // Out of stock for testing
  { sku: 'ITM-011', name: 'Non-stick Cake Pan', category: 'cookware', price: 250, stock: 30, isMarginBooster: true, unit: '1 unit' },
  { sku: 'ITM-012', name: 'Dark Chocolate Chips', category: 'baking', price: 180, stock: 45, isMarginBooster: true, unit: '200g' },
  { sku: 'ITM-013', name: 'Baking Powder', category: 'baking', price: 40, stock: 150, isMarginBooster: false, unit: '100g' },
  { sku: 'ITM-014', name: 'Brown Sugar', category: 'baking', price: 85, stock: 90, isMarginBooster: false, unit: '500g' },
  { sku: 'ITM-015', name: 'Eggs (Dozen)', category: 'dairy', price: 90, stock: 120, isMarginBooster: false, unit: '12 units' },
  { sku: 'ITM-016', name: 'Milk', category: 'dairy', price: 70, stock: 200, isMarginBooster: false, unit: '1L' },
  { sku: 'ITM-017', name: 'Whipping Cream', category: 'dairy', price: 220, stock: 40, isMarginBooster: true, unit: '250ml' },
  { sku: 'ITM-018', name: 'Measuring Spoons', category: 'cookware', price: 150, stock: 60, isMarginBooster: true, unit: '1 set' },
  { sku: 'ITM-019', name: 'Silicone Spatula', category: 'cookware', price: 120, stock: 75, isMarginBooster: true, unit: '1 unit' },
  { sku: 'ITM-020', name: 'Parchment Paper', category: 'baking', price: 190, stock: 110, isMarginBooster: false, unit: '1 roll' },
  { sku: 'ITM-021', name: 'Garlic', category: 'grocery', price: 50, stock: 300, isMarginBooster: false, unit: '250g' },
  { sku: 'ITM-022', name: 'Onions', category: 'grocery', price: 40, stock: 500, isMarginBooster: false, unit: '1kg' },
  { sku: 'ITM-023', name: 'Fresh Basil', category: 'grocery', price: 30, stock: 25, isMarginBooster: false, unit: '50g' },
  { sku: 'ITM-024', name: 'Sea Salt', category: 'grocery', price: 110, stock: 85, isMarginBooster: false, unit: '500g' },
  { sku: 'ITM-025', name: 'Black Pepper', category: 'grocery', price: 140, stock: 65, isMarginBooster: false, unit: '100g' }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await InventoryItem.deleteMany({});
    console.log('Cleared existing inventory items');

    // Insert new data
    await InventoryItem.insertMany(seedData);
    console.log(`Successfully seeded ${seedData.length} items`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDB();
