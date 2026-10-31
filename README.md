# YottaFlex Synthetic E-Commerce Data Generator

This repository contains an end-to-end synthetic data generation workflow built for the YottaFlex.ai challenge. It generates highly realistic session, product, cart, and purchase data to train recommendation systems, complete with deliberate edge cases, logical workflows, and strict mathematical reconciliation.

## Tech Stack
- **Runtime:** Node.js (v22+)
- **Language:** TypeScript
- **Data Generation:** `@faker-js/faker`
- **File Streaming:** `fast-csv` (handles 500,000+ rows efficiently without memory crashes)
- **Validation & Schema:** `zod`
- **CLI Framework:** `commander`

## How to Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate the Baseline Data
This command seeds Faker and generates 20,000 customers, 10,000 products, 500,000 sessions, and targets up to 100,000 orders.

```bash
npx tsx src/index.ts generate --seed 20261022 --scale baseline
```

### 3. Run the Validation Suite
This script proves Primary Key uniqueness, arithmetic reconciliation, and the successful tracking of injected anomalies.

```bash
npx tsx src/index.ts validate
```

## Generated Output
The generator writes CSV files and anomaly labels to `output/`. The directory is intentionally excluded from Git so the large generated dataset does not need to be committed; reviewers can generate it locally with the command above.

| File | Contents |
|---|---|
| `customers.csv` | Customer profiles and account status |
| `categories.csv` | Category hierarchy and seasonal flag |
| `products.csv` | Product catalog, category, price, and availability |
| `sessions.csv` | Customer or guest sessions and device type |
| `pageviews.csv` | Timestamped page-view events |
| `carts.csv`, `cart_lines.csv` | Carts and their product lines |
| `orders.csv`, `order_lines.csv` | Orders and reconciliable line totals |
| `recommendations.csv` | Recommendation record used for the discontinued-product edge case |
| `ground_truth.json` | Labels for the four deliberately injected anomalies |

Example session record:

```csv
sessionId,customerId,startTime,endTime,deviceType
SES-2026-000001,CUS-011369,2026-01-01T00:01:00.000Z,2026-01-01T00:07:44.417Z,TABLET
```

Example order-line record:

```csv
orderLineId,orderId,productId,quantity,unitPrice,lineTotal
ORD-2026-000001-L1,ORD-2026-000001,SKU-008762,2,1950.29,3900.58
```

Example anomaly label from `ground_truth.json`:

```json
{
  "issue_type": "missing_category",
  "id": "SKU-999999",
  "entity": "Product"
}
```

After running the validation command, the summary is:

```text
VALIDATION SUMMARY: 3 Passed, 0 Failed
```

It checks customer ID uniqueness, order/line total reconciliation, and confirms that four anomaly entries are recorded. The recommendations file currently demonstrates the discontinued-product edge case; it is not a full recommendation-results dataset.

## Reproducibility & Fixed Seed (Step 10)
The generation command seeds Faker with `20261022`. IDs and seeded random choices are repeatable for the same generator version and runtime. `ground_truth.json` also records the actual generation time, so that metadata will differ between runs.

## Data Dictionary & Schema
The strict data dictionary is defined using Zod schemas inside `src/schemas/dictionary.ts`. It enforces:

- **Deterministic IDs:** `CUS-XXXXXX`, `SKU-XXXXXX`, `SES-2026-XXXXXX`
- **Allowed Enums:** e.g., `ACTIVE`, `OUT_OF_STOCK`, `BOT`
- **Foreign Key Relationships:** Order -> Cart -> Session -> Customer

### Core Entities Generated:

1. **Master Data:** Customer, Category, Product
2. **Transactional Data:** Session, PageView, Cart, CartLine, Order, OrderLine
3. **Recommendation example:** Recommendation (the injected discontinued-product case)

## Injected Edge Cases (Ground Truth)
Deliberate anomalies are injected for model training and tracked dynamically in `output/ground_truth.json` so they do not silently corrupt the main data flow:

1. `missing_category`: A product missing its category mapping (`SKU-999999`).
2. `purchase_before_session`: An orphaned order without a valid session (`ORD-2026-999999`).
3. `test_leakage`: A PageView timestamped in the year 2029.
4. `discontinued_recommendation`: Recommending a discontinued product.

## Source Manifest & Lawful Use
**100% Synthetic:** No external datasets, scraped data, or public APIs were used to build this dataset. All customer profiles, products, and transactional events are entirely simulated and randomly generated using the `@faker-js/faker` library, ensuring complete compliance with data privacy laws (no PII) and bypassing any licensing restrictions.

## Validation Summary
The built-in validation script (`src/validation.ts`) performs the following checks:

1. **Primary Key Uniqueness:** Verifies that exactly 20,000 unique Customer IDs exist.
2. **Arithmetic Reconciliation:** Recalculates all cart items and verifies that the `totalAmount` on the parent `Order` perfectly matches the sum of its `OrderLines`.
3. **Anomaly Tracking:** Confirms the 4 deliberate edge cases were properly sequestered in the `ground_truth.json` file.
