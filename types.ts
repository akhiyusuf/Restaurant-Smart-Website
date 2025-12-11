export enum Category {
  STARTER = 'Starters',
  MAIN = 'Mains',
  DESSERT = 'Desserts',
  DRINK = 'Wine & Cocktails'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  tags: string[];
  calories: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  action?: 'checkout'; // Add action type
}

export interface CartItem extends MenuItem {
  quantity: number;
  instanceId: string; // Unique ID for this specific addition
}

export enum CheckoutStep {
  CART = 'cart',
  DETAILS = 'details',
  PAYMENT = 'payment',
  TRACKING = 'tracking'
}