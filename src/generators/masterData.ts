import { faker } from '@faker-js/faker';
import { Customer, Category, Product } from '../schemas/dictionary';

// Generate 20,000 Customers
export function generateCustomers(count: number = 20000): Customer[] {
  const customers: Customer[] = [];
  
  for (let i = 1; i <= count; i++) {
    // Deterministic zero-padded ID: CUS-000001
    const customerId = `CUS-${String(i).padStart(6, '0')}`;
    
    customers.push({
      customerId,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      accountStatus: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'BANNED']), // Weighted towards active
      signupDate: faker.date.past({ years: 3 }), // Signed up sometime in the last 3 years
    });
  }
  
  return customers;
}

// Generate Categories (Parent & Child Hierarchy)
export function generateCategories(): Category[] {
  const categories: Category[] = [];
  
  // Create 5 Parent Categories
  for (let i = 1; i <= 5; i++) {
    categories.push({
      categoryId: `CAT-${String(i).padStart(6, '0')}`,
      name: faker.commerce.department(),
      parentCategoryId: null,
      isSeasonal: faker.datatype.boolean({ probability: 0.2 }), // 20% chance of being seasonal
    });
  }

  // Create 20 Child Categories linked to parents
  for (let i = 6; i <= 25; i++) {
    const parentId = `CAT-${String(faker.number.int({ min: 1, max: 5 })).padStart(6, '0')}`;
    categories.push({
      categoryId: `CAT-${String(i).padStart(6, '0')}`,
      name: faker.commerce.productAdjective() + ' ' + faker.commerce.department(),
      parentCategoryId: parentId, // Foreign Key linking to parent
      isSeasonal: faker.datatype.boolean({ probability: 0.3 }),
    });
  }

  return categories;
}

// Generate 10,000 Products
export function generateProducts(count: number = 10000, categories: Category[]): Product[] {
  const products: Product[] = [];
  
  for (let i = 1; i <= count; i++) {
    const productId = `SKU-${String(i).padStart(6, '0')}`;
    // Assign to a random child category (IDs 6 to 25)
    const categoryId = `CAT-${String(faker.number.int({ min: 6, max: 25 })).padStart(6, '0')}`;
    
    products.push({
      productId,
      name: faker.commerce.productName(),
      categoryId,
      price: parseFloat(faker.commerce.price({ min: 5, max: 2000, dec: 2 })),
      status: faker.helpers.arrayElement(['AVAILABLE', 'AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED']),
      launchDate: faker.date.past({ years: 2 }), 
    });
  }
  
  return products;
}