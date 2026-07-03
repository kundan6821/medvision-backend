require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.model');
const existingUsers = require('./database/users.json');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let inserted = 0;
  let skipped = 0;

  for (const user of existingUsers.users) {
    const exists = await User.findOne({ email: user.email });
    if (exists) {
      console.log(`Skipping (already exists): ${user.email}`);
      skipped++;
      continue;
    }
    await User.create(user);
    console.log(`Migrated: ${user.email}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
