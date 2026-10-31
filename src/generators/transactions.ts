import { faker } from '@faker-js/faker';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import { Customer, Product } from '../schemas/dictionary';

// Helper to create CSV write streams
function createCsvStream(fileName: string) {
  const filePath = path.resolve(__dirname, '../../output', fileName);
  const stream = fs.createWriteStream(filePath);
  const csvStream = csv.format({ headers: true });
  csvStream.pipe(stream);
  return csvStream;
}

export async function generateTransactions(customers: Customer[], products: Product[], sessionCount: number = 500000, targetOrders: number = 100000) {
  // Create output directory if it doesn't exist
  const outputDir = path.resolve(__dirname, '../../output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[2/3] Opening CSV Streams in /output...`);
  const sessionStream = createCsvStream('sessions.csv');
  const pageViewStream = createCsvStream('pageviews.csv');
  const cartStream = createCsvStream('carts.csv');
  const cartLineStream = createCsvStream('cart_lines.csv');
  const orderStream = createCsvStream('orders.csv');
  const orderLineStream = createCsvStream('order_lines.csv');

  let orderCounter = 1;
  const startDate = new Date('2026-01-01T00:00:00Z');
  
  console.log(`[3/3] Streaming transactions (This might take a minute)...`);

  for (let i = 1; i <= sessionCount; i++) {
    const sessionId = `SES-2026-${String(i).padStart(6, '0')}`;
    
    // 80% chance of known customer, 20% guest (sparse user logic)
    const isGuest = faker.datatype.boolean({ probability: 0.2 });
    const customer = isGuest ? null : faker.helpers.arrayElement(customers);
    
    // Simulate chronological time progression
    const sessionStart = new Date(startDate.getTime() + i * 1000 * 60); 
    const isBot = faker.datatype.boolean({ probability: 0.05 }); // 5% noisy bot traffic

    // Write Session
    sessionStream.write({
      sessionId,
      customerId: customer ? customer.customerId : null,
      startTime: sessionStart.toISOString(),
      endTime: new Date(sessionStart.getTime() + faker.number.int({ min: 60000, max: 3600000 })).toISOString(),
      deviceType: isBot ? 'BOT' : faker.helpers.arrayElement(['MOBILE', 'DESKTOP', 'TABLET'])
    });

    // Write Page Views (1 to 5 views per session)
    const viewCount = isBot ? 1 : faker.number.int({ min: 1, max: 5 });
    let lastProductViewed: Product | null = null;
    
    for (let v = 1; v <= viewCount; v++) {
      const isProductPage = faker.datatype.boolean({ probability: 0.6 });
      lastProductViewed = isProductPage ? faker.helpers.arrayElement(products) : null;
      
      pageViewStream.write({
        eventId: `EVT-${sessionId}-${String(v).padStart(3, '0')}`,
        sessionId,
        productId: lastProductViewed ? lastProductViewed.productId : null,
        timestamp: new Date(sessionStart.getTime() + v * 15000).toISOString(),
        pageType: isProductPage ? 'PRODUCT' : faker.helpers.arrayElement(['HOMEPAGE', 'CATEGORY'])
      });
    }

    // Convert to Cart & Order (until we hit 100,000 orders)
    // We only convert if it's not a bot, has a product view, and we haven't hit the target
    if (!isBot && lastProductViewed && orderCounter <= targetOrders && faker.datatype.boolean({ probability: 0.3 })) {
      const cartId = `CART-2026-${String(orderCounter).padStart(6, '0')}`;
      const orderId = `ORD-2026-${String(orderCounter).padStart(6, '0')}`;
      
      // Write Cart
      cartStream.write({
        cartId,
        sessionId,
        customerId: customer ? customer.customerId : null,
        status: 'CONVERTED',
        createdAt: new Date(sessionStart.getTime() + viewCount * 20000).toISOString(),
      });

      // Write CartLine
      const qty = faker.number.int({ min: 1, max: 3 });
      cartLineStream.write({
        cartLineId: `${cartId}-L1`,
        cartId,
        productId: lastProductViewed.productId,
        quantity: qty,
        priceAtAdded: lastProductViewed.price
      });

      // Write Order (Total must equal CartLines to satisfy validation math)
      const totalAmount = lastProductViewed.price * qty;
      orderStream.write({
        orderId,
        cartId,
        customerId: customer ? customer.customerId : 'GUEST',
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        orderDate: new Date(sessionStart.getTime() + viewCount * 25000).toISOString(),
        status: 'PAID'
      });

      // Write OrderLine
      orderLineStream.write({
        orderLineId: `${orderId}-L1`,
        orderId,
        productId: lastProductViewed.productId,
        quantity: qty,
        unitPrice: lastProductViewed.price,
        lineTotal: parseFloat(totalAmount.toFixed(2))
      });

      orderCounter++;
    }

    // Print progress every 100,000 sessions
    if (i % 100000 === 0) console.log(`  -> Processed ${i} sessions...`);
  }

  // Close all streams
  sessionStream.end();
  pageViewStream.end();
  cartStream.end();
  cartLineStream.end();
  orderStream.end();
  orderLineStream.end();

  console.log(`\n✅ Generation Complete! Files saved to the /output directory.`);
}