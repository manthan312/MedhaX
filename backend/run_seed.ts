import { seedQuestions } from './src/data/seed.js';

async function run() {
  console.log("Starting seed process...");
  await seedQuestions();
  console.log("Done.");
  process.exit(0);
}

run();
