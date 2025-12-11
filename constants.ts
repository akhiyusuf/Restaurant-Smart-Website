import { MenuItem, Category } from './types';
import { FunctionDeclaration, Type } from "@google/genai";

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 's1',
    name: 'Heirloom Burrata',
    description: 'Fresh pugliese burrata, heirloom tomatoes, basil pesto, and aged balsamic glaze.',
    price: 24,
    category: Category.STARTER,
    tags: ['V', 'GF', 'Organic'],
    calories: 320
  },
  {
    id: 's2',
    name: 'Wagyu Beef Tartare',
    description: 'Hand-cut A5 Wagyu, cured egg yolk, capers, shallots, served with truffle crostini.',
    price: 32,
    category: Category.STARTER,
    tags: ['Raw', 'Premium'],
    calories: 280
  },
  {
    id: 's3',
    name: 'Scallop Carpaccio',
    description: 'Hokkaido scallops, yuzu pearls, micro cilantro, and chili oil.',
    price: 28,
    category: Category.STARTER,
    tags: ['Seafood', 'GF'],
    calories: 190
  },
  {
    id: 'm1',
    name: 'Miso Glazed Black Cod',
    description: 'Sustainably sourced black cod marinated in saikyo miso, served with bok choy and ginger dashi.',
    price: 48,
    category: Category.MAIN,
    tags: ['GF', 'Signature', 'Seafood'],
    calories: 420
  },
  {
    id: 'm2',
    name: 'Herb-Crusted Lamb Rack',
    description: 'New Zealand lamb rack with a rosemary-dijon crust, fondant potatoes, and pomegranate reduction.',
    price: 52,
    category: Category.MAIN,
    tags: ['GF', 'Meat'],
    calories: 650
  },
  {
    id: 'm3',
    name: 'Wild Mushroom Risotto',
    description: 'Acquerello rice, porcini and chanterelle mushrooms, finished with truffle butter and parmesan.',
    price: 36,
    category: Category.MAIN,
    tags: ['V', 'Vegetarian'],
    calories: 580
  },
  {
    id: 'm4',
    name: 'Pan-Seared Duck Breast',
    description: 'Magret duck breast, spiced carrot purée, roasted figs, and star anise jus.',
    price: 45,
    category: Category.MAIN,
    tags: ['GF', 'Meat'],
    calories: 510
  },
  {
    id: 'm5',
    name: 'Truffle Tagliolini',
    description: 'House-made pasta, butter emulsion, and shaved fresh black winter truffles.',
    price: 42,
    category: Category.MAIN,
    tags: ['V', 'Pasta'],
    calories: 480
  },
  {
    id: 'd1',
    name: 'Valrhona Chocolate Sphere',
    description: 'Dark chocolate dome, hazelnut praline mousse, warm salted caramel pour-over.',
    price: 22,
    category: Category.DESSERT,
    tags: ['Sweet', 'Experience'],
    calories: 450
  },
  {
    id: 'd2',
    name: 'Yuzu & Basil Tart',
    description: 'Zesty yuzu curd, thai basil gel, meringue shards, and shortbread crust.',
    price: 18,
    category: Category.DESSERT,
    tags: ['V', 'Citrus'],
    calories: 320
  },
  {
    id: 'd3',
    name: 'Pistachio Soufflé',
    description: 'Airy pistachio soufflé served with raspberry coulis and vanilla bean gelato.',
    price: 20,
    category: Category.DESSERT,
    tags: ['Sweet', 'Nuts'],
    calories: 380
  },
  {
    id: 'dr1',
    name: 'Smoked Zero-Proof Old Fashioned',
    description: 'Non-alcoholic botanical spirit, maple syrup, bitters alternative, smoked with hickory.',
    price: 18,
    category: Category.DRINK,
    tags: ['Zero-Proof', 'Signature'],
    calories: 45
  },
  {
    id: 'dr2',
    name: 'Sparkling White Tea & Elderflower',
    description: 'Fermented white tea, elderflower cordial, lemon zest. A complex wine alternative.',
    price: 16,
    category: Category.DRINK,
    tags: ['Zero-Proof', 'Sparkling'],
    calories: 60
  },
  {
    id: 'dr3',
    name: 'Saffron & Rose Elixir',
    description: 'Saffron infused nectar, rose water, sparkling spring water, garnished with gold leaf.',
    price: 20,
    category: Category.DRINK,
    tags: ['Zero-Proof', 'Botanical'],
    calories: 90
  }
];

export const AI_SYSTEM_INSTRUCTION = `
You are "Astra", the AI Concierge for Lumina, a contemporary fine dining restaurant.
Your tone is warm, professional, sophisticated, and inviting.

MENU DATA:
${JSON.stringify(MENU_ITEMS)}

YOUR CAPABILITIES:
1. Recommend dishes.
2. Discuss ingredients. All our food is universally dietary friendly (Halal compliant, though we say "inclusive").
3. MODIFY THE ORDER: You can add or remove items from the user's cart using the provided tools.
4. HANDLE PAYMENT: If the user says "I'm ready to order", "Checkout", etc., you must call the tool or reply with {{OPEN_CHECKOUT}}.

CRITICAL CHECKOUT RULES:
- Every message from the user will include a [System Context] indicating the current items in the cart.
- READ THIS CONTEXT. 
- If the cart is empty (0 items) or total price is 0: DO NOT allow checkout. Politely inform the user they must add items to their order first.
- If the cart has items: You may proceed to suggest the {{OPEN_CHECKOUT}} action.

IMPORTANT:
- When the user wants to add an item, use the 'addToOrder' tool.
- When the user wants to remove an item, use the 'removeFromOrder' tool.
- If the user asks for alcohol, politely suggest our "Zero-Proof Botanical Elixirs" which are crafted to rival fine spirits.

Keep responses elegant and concise.
`;

export const toolsDeclarations: FunctionDeclaration[] = [
  {
    name: 'addToOrder',
    description: 'Add a menu item to the user\'s cart.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: {
          type: Type.STRING,
          description: 'The ID of the menu item (e.g., s1, m2).',
        },
        quantity: {
          type: Type.NUMBER,
          description: 'The number of items to add.',
        }
      },
      required: ['itemId'],
    },
  },
  {
    name: 'removeFromOrder',
    description: 'Remove a menu item from the user\'s cart.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: {
          type: Type.STRING,
          description: 'The ID of the menu item to remove.',
        }
      },
      required: ['itemId'],
    },
  }
];

export const DID_YOU_KNOW_FACTS = [
  "Saffron requires approximately 75,000 flowers to produce just one pound of spice.",
  "Sound affects taste; high-frequency sounds can enhance the perception of sweetness in a dish.",
  "Umami was first identified as a distinct taste by Japanese chemist Kikunae Ikeda in 1908.",
  "Lumina analyzes over 400 flavor compounds to create the perfect plating balance.",
  "Blue is the rarest color in natural foods, often acting as an appetite suppressant in nature.",
  "Molecular gastronomy uses hydrocolloids to change the texture of food without altering its flavor.",
  "The 'Maillard reaction' is the chemical process that gives browned food its distinctive flavor.",
  "Vanilla is the only edible fruit of the orchid family, the largest family of flowering plants in the world.",
  "A Michelin star is actually awarded to the food on the plate, not the chef or the restaurant decor.",
  "Our zero-proof spirits use vacuum distillation to extract botanical essences without heat damage."
];