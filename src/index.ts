import { Command } from 'commander';
import { faker } from '@faker-js/faker';
import { generateCustomers, generateCategories, generateProducts } from './generators/masterData';
import { generateTransactions } from './generators/transactions';
import { exportMasterAndInjectAnomalies } from './generators/anomalies';
import { runValidation } from './validation'; // <-- Import validation

const program = new Command();

program
  .name('yottaflex-generator')
  .description('Synthetic e-commerce data generator')
  .version('1.0.0');

// Command 1: Generate Data
program
  .command('generate')
  .description('Generate synthetic data files')
  .requiredOption('-s, --seed <number>', 'Fixed seed for reproducibility')
  .option('--scale <type>', 'Volume scale (e.g., baseline)', 'baseline')
  .action(async (options) => {
    const seedValue = parseInt(options.seed, 10);
    faker.seed(seedValue);
    
    console.log(`\nStarting generation with seed: ${seedValue}`);
    console.log(`=======================================`);
    
    console.log(`[1/4] Generating Master Data...`);
    const customers = generateCustomers(20000);
    const categories = generateCategories();
    const products = generateProducts(10000, categories);
    
    const sessionCount = options.scale === 'baseline' ? 500000 : 10000;
    const targetOrders = options.scale === 'baseline' ? 100000 : 2000;

    await generateTransactions(customers, products, sessionCount, targetOrders);
    await exportMasterAndInjectAnomalies(customers, categories, products);

    console.log(`\n✅ Full Data Generation & Anomaly Injection Complete!`);
    console.log(`Run 'npx tsx src/index.ts validate' to check the data.`);
  });

// Command 2: Validate Data
program
  .command('validate')
  .description('Run validation checks on the generated CSVs')
  .action(async () => {
    await runValidation();
  });

program.parse();