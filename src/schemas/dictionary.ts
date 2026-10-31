import { z } from 'zod';

/**
 * STEP 1: DATA DICTIONARY
 * Enforces types, optionality, allowed values, and formatting rules.
 */

// 1. Customer
export const CustomerSchema = z.object({
  customerId: z.string().regex(/^CUS-\d{6}$/, "Must be CUS-XXXXXX"), // Primary Key
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  accountStatus: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
  signupDate: z.date(),
});

// 2. Category
export const CategorySchema = z.object({
  categoryId: z.string().regex(/^CAT-\d{6}$/), // Primary Key
  name: z.string(),
  parentCategoryId: z.string().nullable(), // Optional Foreign Key for hierarchy
  isSeasonal: z.boolean(),
});

// 3. Product
export const ProductSchema = z.object({
  productId: z.string().regex(/^SKU-\d{6}$/, "Must be SKU-XXXXXX"), // Primary Key
  name: z.string(),
  categoryId: z.string(), // Foreign Key -> Category
  price: z.number().positive(),
  status: z.enum(['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED']),
  launchDate: z.date(), // To handle cold-start logic
});

// 4. Session
export const SessionSchema = z.object({
  sessionId: z.string().regex(/^SES-2026-\d{6}$/), // Primary Key
  customerId: z.string().regex(/^CUS-\d{6}$/).nullable(), // FK -> Customer (Nullable for guests)
  startTime: z.date(),
  endTime: z.date(),
  deviceType: z.enum(['MOBILE', 'DESKTOP', 'TABLET', 'BOT']), // 'BOT' handles the noisy sessions requirement
});

// 5. PageView
export const PageViewSchema = z.object({
  eventId: z.string().regex(/^EVT-SES-2026-\d{6}-\d{3}$/), // Primary Key
  sessionId: z.string(), // Foreign Key -> Session
  productId: z.string().nullable(), // FK -> Product (null if viewing homepage/category)
  timestamp: z.date(),
  pageType: z.enum(['HOMEPAGE', 'CATEGORY', 'PRODUCT', 'CART', 'CHECKOUT']),
});

// 6. Cart
export const CartSchema = z.object({
  cartId: z.string().regex(/^CART-2026-\d{6}$/), // Primary Key
  sessionId: z.string(), // Foreign Key -> Session
  customerId: z.string().nullable(),
  status: z.enum(['ACTIVE', 'CONVERTED', 'ABANDONED']),
  createdAt: z.date(),
});

// 7. CartLine
export const CartLineSchema = z.object({
  cartLineId: z.string(), // Primary Key
  cartId: z.string(), // Foreign Key -> Cart
  productId: z.string(), // Foreign Key -> Product
  quantity: z.number().int().positive(),
  priceAtAdded: z.number().positive(),
});

// 8. Order
export const OrderSchema = z.object({
  orderId: z.string().regex(/^ORD-2026-\d{6}$/), // Primary Key
  cartId: z.string(), // Foreign Key -> Cart
  customerId: z.string(), // Foreign Key -> Customer
  totalAmount: z.number().nonnegative(),
  orderDate: z.date(),
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'CANCELLED']),
});

// 9. OrderLine
export const OrderLineSchema = z.object({
  orderLineId: z.string(), // Primary Key
  orderId: z.string(), // Foreign Key -> Order
  productId: z.string(), // Foreign Key -> Product
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  lineTotal: z.number().positive(),
});

// 10. ProductRelation (Bridge table for co-purchase/recommendations)
export const ProductRelationSchema = z.object({
  relationId: z.string(),
  primaryProductId: z.string(), // Foreign Key -> Product
  relatedProductId: z.string(), // Foreign Key -> Product
  relationType: z.enum(['CO_PURCHASED', 'VIEWED_TOGETHER', 'SIMILAR']),
  weight: z.number().min(0).max(1), // Strength of relationship
});

// 11. Recommendation
export const RecommendationSchema = z.object({
  recommendationId: z.string(),
  sessionId: z.string(), // Foreign Key -> Session
  recommendedProductId: z.string(), // Foreign Key -> Product
  rank: z.number().int().positive(),
  timestamp: z.date(),
});

// TypeScript Types extracted from Zod schemas for our generators
export type Customer = z.infer<typeof CustomerSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Session = z.infer<typeof SessionSchema>;
export type PageView = z.infer<typeof PageViewSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type CartLine = z.infer<typeof CartLineSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderLine = z.infer<typeof OrderLineSchema>;
export type ProductRelation = z.infer<typeof ProductRelationSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;