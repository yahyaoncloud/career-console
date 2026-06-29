import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from the 'env' file
dotenv.config({ path: path.resolve(process.cwd(), 'env') });

async function checkCollections() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in the env file');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db();
    
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in the database:');
    collections.forEach(c => console.log(`- ${c.name}`));

    // Print a sample document from each collection
    for (const c of collections) {
        console.log(`\nSample from ${c.name}:`);
        const sample = await db.collection(c.name).findOne({});
        console.log(JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
}

checkCollections();
