const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function exportDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const exportData = {};

    for (const col of collections) {
      const name = col.name;
      console.log(`Exporting collection: ${name}`);
      const docs = await db.collection(name).find({}).toArray();
      exportData[name] = docs;
      console.log(`  -> ${docs.length} documents`);
    }

    const outputPath = path.join(__dirname, 'db_export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`\nDatabase exported to: ${outputPath}`);
    
    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Export failed:', err.message);
    process.exit(1);
  }
}

exportDatabase();
