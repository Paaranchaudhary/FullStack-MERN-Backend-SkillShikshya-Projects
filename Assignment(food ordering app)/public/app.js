const state = {
  menu: [],
  cart: {}, // id -> qty
  activeCategory: 'All',
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    if (btn.dataset.view === 'admin') loadAdminOrders();
  });
});

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
async function loadMenu() {
  const res = await fetch('/api/menu');
  state.menu = await res.json();
  renderCategories();
  renderMenu();
}

function renderCategories() {
  const cats = ['All', ...new Set(state.menu.map((m) => m.category))];
  const bar = document.getElementById('categoryBar');
  bar.innerHTML = '';
  cats.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === state.activeCategory ? ' active' : '');
    chip.textContent = cat;
    chip.addEventListener('click', () => {
      state.activeCategory = cat;
      renderCategories();
      renderMenu();
    });
    bar.appendChild(chip);
  });
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const items = state.activeCategory === 'All'
    ? state.menu
    : state.menu.filter((m) => m.category === state.activeCategory);

  grid.innerHTML = '';
  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.innerHTML = `
      <div class="emoji">${item.image}</div>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div class="row">
        <span class="price">$${item.price.toFixed(2)}</span>
        <button class="add-btn" data-id="${item.id}">+</button>
      </div>
    `;
    el.querySelector('.add-btn').addEventListener('click', () => addToCart(item.id));
    grid.appendChild(el);
  });
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------
function addToCart(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  renderCart();
  openCart();
}

function changeQty(id, delta) {
  if (!state.cart[id]) return;
  state.cart[id] += delta;
  if (state.cart[id] <= 0) delete state.cart[id];
  renderCart();
}

function cartCount() {
  return Object.values(state.cart).reduce((a, b) => a + b, 0);
}

function renderCart() {
  document.getElementById('cartCount').textContent = cartCount();
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  const form = document.getElementById('checkoutForm');
  const ids = Object.keys(state.cart);

  if (ids.length === 0) {
    container.innerHTML = 'Your cart is empty.';
    summary.innerHTML = '';
    form.classList.add('hidden');
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;
  ids.forEach((id) => {
    const item = state.menu.find((m) => m.id === id);
    const qty = state.cart[id];
    const lineTotal = item.price * qty;
    subtotal += lineTotal;
    const line = document.createElement('div');
    line.className = 'cart-line';
    line.innerHTML = `
      <div>
        <div>${item.name}</div>
        <div class="muted">$${item.price.toFixed(2)} each</div>
      </div>
      <div class="qty-controls">
        <button data-action="dec">−</button>
        <span>${qty}</span>
        <button data-action="inc">+</button>
      </div>
    `;
    line.querySelector('[data-action="dec"]').addEventListener('click', () => changeQty(id, -1));
    line.querySelector('[data-action="inc"]').addEventListener('click', () => changeQty(id, 1));
    container.appendChild(line);
  });

  const deliveryFee = 2.5;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  summary.innerHTML = `
    <div><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
    <div><span>Delivery fee</span><span>$${deliveryFee.toFixed(2)}</span></div>
    <div><span>Tax</span><span>$${tax.toFixed(2)}</span></div>
    <div class="total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
  `;
  form.classList.remove('hidden');
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('show');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('show');
}
document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing order…';

  const payload = {
    customerName: form.customerName.value,
    phone: form.phone.value,
    address: form.address.value,
    notes: form.notes.value,
    items: Object.entries(state.cart).map(([id, qty]) => ({ id, qty })),
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not place order');

    state.cart = {};
    renderCart();
    closeCart();
    form.reset();
    showConfirmation(data.id);
  } catch (err) {
    alert(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Place order';
  }
});

function showConfirmation(orderId) {
  document.getElementById('confirmOrderId').textContent = orderId;
  document.getElementById('confirmModal').classList.add('show');
  document.getElementById('confirmOverlay').classList.add('show');
}
document.getElementById('confirmClose').addEventListener('click', () => {
  document.getElementById('confirmModal').classList.remove('show');
  document.getElementById('confirmOverlay').classList.remove('show');
});

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------
document.getElementById('trackBtn').addEventListener('click', trackOrder);
document.getElementById('trackInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') trackOrder();
});

async function trackOrder() {
  const id = document.getElementById('trackInput').value.trim();
  const resultEl = document.getElementById('trackResult');
  if (!id) return;
  resultEl.innerHTML = 'Looking up order…';

  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) {
    resultEl.innerHTML = `<p class="muted">No order found with that ID.</p>`;
    return;
  }
  const order = await res.json();
  resultEl.innerHTML = renderStatusTrack(order) + `
    <p><strong>${order.customerName}</strong> · ${order.items?.length || order.lineItems.length} item(s) · $${order.total.toFixed(2)}</p>
  `;
}

function renderStatusTrack(order) {
  if (order.status === 'cancelled') {
    return `<p><span class="badge cancelled">Cancelled</span></p>`;
  }
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const steps = STATUS_FLOW.map((s, i) => `
    <div class="status-step ${i <= currentIndex ? 'done' : ''}">
      <div class="dot"></div>
      ${STATUS_LABELS[s]}
    </div>
  `).join('');
  return `<div class="status-track">${steps}</div>`;
}

// ---------------------------------------------------------------------------
// Admin / kitchen dashboard
// ---------------------------------------------------------------------------
document.getElementById('refreshOrders').addEventListener('click', loadAdminOrders);

async function loadAdminOrders() {
  const res = await fetch('/api/orders');
  const orders = await res.json();
  const list = document.getElementById('ordersList');

  if (orders.length === 0) {
    list.innerHTML = 'No orders yet.';
    return;
  }

  list.innerHTML = '';
  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'order-card';
    const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
    card.innerHTML = `
      <div class="row space-between">
        <strong>#${order.id}</strong>
        <span class="badge ${order.status}">${STATUS_LABELS[order.status]}</span>
      </div>
      <div class="muted">${order.customerName} · ${order.phone}</div>
      <div class="muted">${order.address}</div>
      <div>${order.lineItems.map((li) => `${li.qty}× ${li.name}`).join(', ')}</div>
      <div><strong>Total: $${order.total.toFixed(2)}</strong></div>
      <div class="row" style="margin-top:10px;">
        ${nextStatus ? `<button class="primary" data-advance="${order.id}">Mark ${STATUS_LABELS[nextStatus]}</button>` : ''}
        ${['pending', 'confirmed'].includes(order.status) ? `<button class="secondary" data-cancel="${order.id}">Cancel</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('[data-advance]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/orders/${btn.dataset.advance}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      loadAdminOrders();
    });
  });
  list.querySelectorAll('[data-cancel]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/orders/${btn.dataset.cancel}`, { method: 'DELETE' });
      loadAdminOrders();
    });
  });
}

// ---------------------------------------------------------------------------
loadMenu();
