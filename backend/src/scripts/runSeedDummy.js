import db from '../db.js';
import { seedDummyData } from '../seedDummyData.js';

try {
  const result = seedDummyData(db);
  console.log('Seed dummy selesai:');
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Seed dummy gagal:', err.message);
  process.exit(1);
}
