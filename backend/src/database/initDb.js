import { seedDatabase } from './seed.js';

seedDatabase()
  .then(() => {
    console.log('Database schema and seed ready.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Initialization error:', err);
    process.exit(1);
  });
