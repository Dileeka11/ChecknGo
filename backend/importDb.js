const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function importDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const inputPath = path.join(__dirname, 'db_export.json');
    const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    for (const [collectionName, docs] of Object.entries(data)) {
      if (docs.length === 0) {
        console.log(`Skipping empty collection: ${collectionName}`);
        continue;
      }
      console.log(`Importing ${docs.length} docs into ${collectionName}...`);
      const collection = db.collection(collectionName);
      await collection.deleteMany({});  // Clear existing data
      await collection.insertMany(docs);
      console.log(`  -> Done!`);
    }

    await mongoose.disconnect();
    console.log('\nDatabase imported successfully!');
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
}

importDatabase();
