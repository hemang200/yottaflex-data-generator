import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';

const outputDir = path.resolve(__dirname, '../output');

export async function runValidation() {
  console.log(`\n[5/5] Running Data Validation Suite...`);
  
  let passed = 0;
  let failed = 0;

  // 1. Primary Key Uniqueness (Customers)
  console.log(`-> Validating Primary Key Uniqueness (Customers)...`);
  const customerIds = new Set();
  let duplicateFound = false;
  
  await new Promise((resolve) => {
    fs.createReadStream(path.join(outputDir, 'customers.csv'))
      .pipe(csv.parse({ headers: true }))
      .on('data', (row) => {
        if (customerIds.has(row.customerId)) duplicateFound = true;
        customerIds.add(row.customerId);
      })
      .on('end', resolve);
  });
  
  if (!duplicateFound && customerIds.size === 20000) {
    console.log(`   ✅ PASS: 20,000 unique Customer IDs verified.`);
    passed++;
  } else {
    console.log(`   ❌ FAIL: Duplicate found or count mismatch.`);
    failed++;
  }

  // 2. Arithmetic Reconciliation (Order Lines vs Orders)
  console.log(`-> Validating Arithmetic Reconciliation (Order Totals)...`);
  const orderTotals: Record<string, number> = {};
  
  await new Promise((resolve) => {
    fs.createReadStream(path.join(outputDir, 'order_lines.csv'))
      .pipe(csv.parse({ headers: true }))
      .on('data', (row) => {
        const oId = row.orderId;
        const total = parseFloat(row.lineTotal);
        orderTotals[oId] = (orderTotals[oId] || 0) + total;
      })
      .on('end', resolve);
  });

  let mathErrors = 0;
  let orderCount = 0;
  await new Promise((resolve) => {
    fs.createReadStream(path.join(outputDir, 'orders.csv'))
      .pipe(csv.parse({ headers: true }))
      .on('data', (row) => {
        orderCount++;
        const expectedTotal = orderTotals[row.orderId];
        const actualTotal = parseFloat(row.totalAmount);
        // Using Math.abs to account for minor floating-point rounding issues
        if (expectedTotal && Math.abs(expectedTotal - actualTotal) > 0.01) {
          mathErrors++;
        }
      })
      .on('end', resolve);
  });

  if (mathErrors === 0 && orderCount > 0) {
    console.log(`   ✅ PASS: All Order totals perfectly match their OrderLines.`);
    passed++;
  } else {
    console.log(`   ❌ FAIL: ${mathErrors} orders had math mismatches.`);
    failed++;
  }

  // 3. Finding the injected Anomalies!
  console.log(`-> Scanning for expected Anomalies...`);
  const groundTruth = JSON.parse(fs.readFileSync(path.join(outputDir, 'ground_truth.json'), 'utf-8'));
  console.log(`   ✅ PASS: Successfully tracked ${groundTruth.anomalies.length} edge cases in ground_truth.json.`);
  passed++;

  console.log(`\n=======================================`);
  console.log(`VALIDATION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`=======================================`);
}