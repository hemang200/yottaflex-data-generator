import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Customer, Category, Product } from '../schemas/dictionary';

export async function exportMasterAndInjectAnomalies(customers: Customer[], categories: Category[], products: Product[]) {
  const outputDir = path.resolve(__dirname, '../../output');
  
  console.log(`[4/4] Exporting Master Data & Injecting Edge Cases...`);

  // 1. Export Master Data to CSV
  await new Promise(res => csv.writeToPath(path.join(outputDir, 'customers.csv'), customers, { headers: true }).on('finish', res));
  await new Promise(res => csv.writeToPath(path.join(outputDir, 'categories.csv'), categories, { headers: true }).on('finish', res));
  await new Promise(res => csv.writeToPath(path.join(outputDir, 'products.csv'), products, { headers: true }).on('finish', res));

  // 2. Inject Edge Cases (Step 5) & Track in Ground Truth (Step 7)
  const groundTruth = {
    metadata: { generatedAt: new Date().toISOString(), seed: "20261022" },
    anomalies: [] as any[]
  };

  // Anomaly 1: Product Category Missing
  const badProductId = "SKU-999999";
  fs.appendFileSync(path.join(outputDir, 'products.csv'), `\n${badProductId},Ghost Product,,150.00,AVAILABLE,2026-01-01T00:00:00.000Z`);
  groundTruth.anomalies.push({ issue_type: "missing_category", id: badProductId, entity: "Product" });

  // Anomaly 2: Purchase appears before session view
  const badOrderId = "ORD-2026-999999";
  fs.appendFileSync(path.join(outputDir, 'orders.csv'), `\n${badOrderId},CART-2026-999999,CUS-000001,50.00,2020-01-01T00:00:00.000Z,PAID`);
  groundTruth.anomalies.push({ issue_type: "purchase_before_session", id: badOrderId, entity: "Order" });

  // Anomaly 3: Test events leak into training (Future date leakage)
  const leakEventId = "EVT-SES-2026-999999-999";
  fs.appendFileSync(path.join(outputDir, 'pageviews.csv'), `\n${leakEventId},SES-2026-000001,SKU-000001,2029-12-31T00:00:00.000Z,PRODUCT`);
  groundTruth.anomalies.push({ issue_type: "test_leakage", id: leakEventId, entity: "PageView" });

  // Anomaly 4: Recommendation includes discontinued product
  const badRecId = "REC-999999";
  // Creating the recommendations file specifically for this anomaly
  fs.writeFileSync(path.join(outputDir, 'recommendations.csv'), `recommendationId,sessionId,recommendedProductId,rank,timestamp\n${badRecId},SES-2026-000001,SKU-000001,1,2026-10-01T00:00:00.000Z\n`);
  groundTruth.anomalies.push({ issue_type: "discontinued_recommendation", id: badRecId, entity: "Recommendation" });

  // 3. Output the ground_truth.json
  fs.writeFileSync(path.join(outputDir, 'ground_truth.json'), JSON.stringify(groundTruth, null, 2));
  console.log(`  -> Saved Master CSVs and ground_truth.json successfully.`);
}