const express = require('express');
const cors = require('cors');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// In-memory "database"
// ---------------------------------------------------------------------------

const menu = [
  { id: 'm1', name: 'Margherita Pizza', category: 'Pizza', price: 9.5, description: 'Tomato, mozzarella, basil', image: '🍕', available: true },
  { id: 'm2', name: 'Pepperoni Pizza', category: 'Pizza', price: 11.0, description: 'Tomato, mozzarella, pepperoni', image: '🍕', available: true },
  { id: 'm3', name: 'Cheeseburger', category: 'Burgers', price: 8.75, description: 'Beef patty, cheddar, lettuce, tomato', image: '🍔', available: true },
  { id: 'm4', name: 'Veggie Burger', category: 'Burgers', price: 8.25, description: 'Grilled veggie patty, avocado, sprouts', image: '🍔', available: true },
  { id: 'm5', name: 'Caesar Salad', category: 'Salads', price: 7.0, description: 'Romaine, parmesan, croutons, caesar dressing', image: '🥗', available: true },
  { id: 'm6', name: 'Pad Thai', category: 'Noodles', price: 10.5, description: 'Rice noodles, egg, peanuts, tamarind sauce', image: '🍜', available: true },
  { id: 'm7', name: 'Chicken Dumplings', category: 'Appetizers', price: 6.5, description: '6 steamed dumplings with soy dip', image: '🥟', available: true },
  { id: 'm8', name: 'Chocolate Lava Cake', category: 'Desserts', price: 5.5, description: 'Warm cake, molten center, vanilla ice cream', image: '🍫', available: true },
  { id: 'm9', name: 'Iced Lemon Tea', category: 'Drinks', price: 3.0, description: 'Freshly brewed, served cold', image: '🧋', available: true },
  { id: 'm10', name: 'Sparkling Water', category: 'Drinks', price: 2.0, description: '500ml bottle', image: '💧', available: true },
];

// orders keyed by id
const orders = new Map();

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findMenuItem(id) {
  return menu.find((item) => item.id === id);
}

function calculateOrderTotals(items) {
  let subtotal = 0;
  const lineItems = items.map(({ id, qty }) => {
    const menuItem = findMenuItem(id);
    if (!menuItem) throw new Error(`Unknown menu item: ${id}`);
    if (!menuItem.available) throw new Error(`Item not available: ${menuItem.name}`);
    if (!Number.isInteger(qty) || qty < 1) throw new Error(`Invalid quantity for ${menuItem.name}`);
    const lineTotal = +(menuItem.price * qty).toFixed(2);
    subtotal += lineTotal;
    return { id, name: menuItem.name, price: menuItem.price, qty, lineTotal };
  });
  subtotal = +subtotal.toFixed(2);
  const deliveryFee = subtotal > 0 ? 2.5 : 0;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + deliveryFee + tax).toFixed(2);
  return { lineItems, subtotal, deliveryFee, tax, total };
}

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

// Get full menu (optionally filter by category)
app.get('/api/menu', (req, res) => {
  const { category } = req.query;
  const result = category
    ? menu.filter((m) => m.category.toLowerCase() === category.toLowerCase())
    : menu;
  res.json(result);
});

// Get distinct categories
app.get('/api/menu/categories', (req, res) => {
  res.json([...new Set(menu.map((m) => m.category))]);
});

// Get single menu item
app.get('/api/menu/:id', (req, res) => {
  const item = findMenuItem(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// Quote a cart (compute totals without placing an order)
app.post('/api/cart/quote', (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }
    res.json(calculateOrderTotals(items));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Place an order
app.post('/api/orders', (req, res) => {
  try {
    const { customerName, phone, address, items, notes } = req.body;
    if (!customerName || !phone || !address) {
      return res.status(400).json({ error: 'customerName, phone, and address are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    const totals = calculateOrderTotals(items);
    const id = randomUUID().slice(0, 8);
    const order = {
      id,
      customerName,
      phone,
      address,
      notes: notes || '',
      ...totals,
      status: STATUS_FLOW[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.set(id, order);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List all orders (admin/kitchen view)
app.get('/api/orders', (req, res) => {
  const list = [...orders.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list);
});

// Get single order (for tracking)
app.get('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Advance / set order status (admin/kitchen action)
app.patch('/api/orders/:id/status', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { status } = req.body;
  if (status) {
    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUS_FLOW.join(', ')}` });
    }
    order.status = status;
  } else {
    // No status provided -> advance to next step in the flow
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
      return res.status(400).json({ error: 'Order already at final status' });
    }
    order.status = STATUS_FLOW[currentIndex + 1];
  }
  order.updatedAt = new Date().toISOString();
  res.json(order);
});

// Cancel an order (only while pending/confirmed)
app.delete('/api/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ error: 'Order can no longer be cancelled' });
  }
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  res.json(order);
});

// Fallback to index.html for the SPA-style front end
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️  Food ordering app running at http://localhost:${PORT}`);
});
