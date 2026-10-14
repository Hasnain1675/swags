import { seedDatabase } from './seed.ts';

async function main() {
  await seedDatabase(true); // force reset to Pakistani civic seed
  console.log('PAKISTAN_SEED_FINISHED_SUCCESSFULLY');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
