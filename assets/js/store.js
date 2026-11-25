/* The Beaded Florist – data layer (localStorage acts as the "database") */
(function () {
  'use strict';
  var V = 'bf-v1';
  var ROOT = document.body ? (document.body.dataset.root || '') : '';

  /* Hardcoded demo credentials (always work, even if browser data is reset) */
  var DEMO_ADMIN = { email: 'owner@thebeadedflorist.pk', password: 'admin1234' };
  var DEMO_USER = { name: 'Ayesha K.', email: 'ayesha@example.com', phone: '0300 1234567', password: 'password123', address: 'House 12, Street 4, Model Town', city: 'Lahore', postal: '54000' };

  var S = {
    ROOT: ROOT,
    DEMO_ADMIN: DEMO_ADMIN,
    DEMO_USER: DEMO_USER,
    get: function (k, d) {
      try { var v = localStorage.getItem('bf_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('bf_' + k, JSON.stringify(v)); return true; }
      catch (e) { S.toast('Storage is full – try smaller photos.'); return false; }
    },
    sget: function (k, d) { try { var v = sessionStorage.getItem('bf_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    sset: function (k, v) { try { sessionStorage.setItem('bf_' + k, JSON.stringify(v)); } catch (e) {} },
    fmt: function (n) { return 'PKR ' + Math.round(n || 0).toLocaleString('en-US'); },
    num: function (n) { return Math.round(n || 0).toLocaleString('en-US'); },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); },
    img: function (p) { return !p ? '' : (/^(data:|https?:)/.test(p) ? p : ROOT + p); },
    qs: function (k) { return new URLSearchParams(location.search).get(k); },
    toast: function (msg) {
      var t = document.querySelector('.toast');
      if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600);
    },
    uid: function () { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    /* Resize an uploaded image to keep localStorage small */
    readImage: function (file, max) {
      max = max || 700;
      return new Promise(function (res, rej) {
        if (!file || !/^image\//.test(file.type)) return rej(new Error('Please choose a JPG or PNG image.'));
        var r = new FileReader();
        r.onerror = function () { rej(new Error('Could not read that file.')); };
        r.onload = function () {
          var im = new Image();
          im.onload = function () {
            var sc = Math.min(1, max / Math.max(im.width, im.height));
            var c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.72));
          };
          im.onerror = function () { rej(new Error('That image could not be opened.')); };
          im.src = r.result;
        };
        r.readAsDataURL(file);
      });
    }
  };

  /* ---------- Seed data ---------- */
  var IMG = function (n) { return 'assets/images/' + n + '.png'; };
  function seedProducts() {
    var g = function (m) { return [IMG(m), IMG('craft-closeup'), IMG('hero-vase'), IMG('single-lily')].filter(function (x, i, a) { return a.indexOf(x) === i; }); };
    var big = function (b) { return [{ name: 'Small', price: b - 1500 }, { name: 'Medium', price: b }, { name: 'Large', price: b + 1500 }]; };
    var one = function (b) { return [{ name: 'Standard', price: b }]; };
    var desc = 'Hand-beaded from glass seed beads and wire. Lasts for decades, perfect as a gift or as home decoration.';
    return [
      { id: 'pink-lily-bouquet', name: 'Pink Lily Bouquet', category: 'Bouquets', price: 8500, sizes: [{ name: 'Small', price: 7000 }, { name: 'Medium', price: 8500 }, { name: 'Large', price: 10000 }], desc: 'A bouquet of hand-beaded lilies made from glass seed beads and wire. Lasts for decades, perfect as a gift or as home decoration.', images: g('lily-bouquet'), stock: 'Made to order', visible: true, order: 1 },
      { id: 'sunflower-bouquet', name: 'Sunflower Bouquet', category: 'Bouquets', price: 8000, sizes: big(8000), desc: 'Bright beaded sunflowers tied with a cream ribbon. ' + desc, images: g('sunflower-bouquet'), stock: 'Made to order', visible: true, order: 2 },
      { id: 'spring-pastel-bouquet', name: 'Spring Pastel Bouquet', category: 'Bouquets', price: 9000, sizes: big(9000), desc: 'Soft pinks, lavender and white in one gentle bouquet. ' + desc, images: g('pastel-bouquet'), stock: 'Made to order', visible: true, order: 3 },
      { id: 'single-beaded-lily', name: 'Single Beaded Lily', category: 'Single flowers', price: 3500, sizes: one(3500), desc: 'One beaded lily on a long wire stem. ' + desc, images: g('single-lily'), stock: '3 in stock', visible: true, order: 4 },
      { id: 'single-beaded-rose', name: 'Single Beaded Rose', category: 'Single flowers', price: 3000, sizes: one(3000), desc: 'A detailed beaded rose with wire leaves. ' + desc, images: g('rose'), stock: '4 in stock', visible: true, order: 5 },
      { id: 'beaded-tree', name: 'Beaded Tree', category: 'Trees & more', price: 6500, sizes: [{ name: 'Small', price: 5500 }, { name: 'Medium', price: 6500 }, { name: 'Large', price: 8500 }], desc: 'A blossoming beaded tree in a ceramic pot. ' + desc, images: g('beaded-tree'), stock: 'Made to order', visible: true, order: 6 },
      { id: 'pebble-tree', name: 'Pebble Tree', category: 'Trees & more', price: 5500, sizes: [{ name: 'Small', price: 4500 }, { name: 'Medium', price: 5500 }, { name: 'Large', price: 7500 }], desc: 'A twisted-wire tree standing on smooth river pebbles. ' + desc, images: g('pebble-tree'), stock: 'Made to order', visible: true, order: 7 },
      { id: 'beaded-earrings', name: 'Beaded Earrings', category: 'Jewellery', price: 2500, sizes: one(2500), desc: 'Light, delicate flower drop earrings with gold-tone hooks. ' + desc, images: g('earrings'), stock: '6 in stock', visible: true, order: 8 }
    ];
  }
  function seedPricing() {
    return {
      flowers: [
        { id: 'lily', name: 'Lily', price: 3500, image: IMG('single-lily') },
        { id: 'sunflower', name: 'Sunflower', price: 4000, image: IMG('sunflower-bouquet') },
        { id: 'rose', name: 'Rose', price: 3000, image: IMG('rose') },
        { id: 'daisy', name: 'Daisy', price: 3000, image: IMG('daisy') },
        { id: 'tulip', name: 'Tulip', price: 3200, image: IMG('pastel-bouquet') }
      ],
      trees: [
        { id: 'blossom-tree', name: 'Blossom tree in pot', price: 6500, image: IMG('beaded-tree') },
        { id: 'pebble-tree', name: 'Pebble tree', price: 5500, image: IMG('pebble-tree') }
      ],
      jewellery: [
        { id: 'earrings', name: 'Earrings', price: 2500, image: IMG('earrings') },
        { id: 'necklace', name: 'Necklace', price: 3500, image: IMG('earrings') },
        { id: 'bracelet', name: 'Bracelet', price: 3000, image: IMG('earrings') }
      ],
      beads: [
        { id: 'glass', name: 'Glass seed beads', note: 'Included in the price', extra: 0 },
        { id: 'dana', name: 'Cut dana / crystal-type', note: '', extra: 300 },
        { id: 'mix', name: 'Mix of both', note: '', extra: 150 }
      ],
      colours: [
        { name: 'Blush', hex: '#e8a99c' }, { name: 'Rose', hex: '#cc7080' }, { name: 'White', hex: '#f9f6f2' },
        { name: 'Cream', hex: '#f2e3c8' }, { name: 'Sage', hex: '#a0b79b' }, { name: 'Lavender', hex: '#bfaedb' },
        { name: 'Butter', hex: '#f5d77e' }, { name: 'Sky', hex: '#b5d4e8' }
      ],
      wrapping: 500, urgent: 1000, lahore: 300, other: 450, international: 2500, advance: 50
    };
  }
  function seedReviews() {
    var r = function (id, name, prod, img, text, status) { return { id: id, name: name, product: prod, image: IMG(img), rating: 5, text: text, status: status || 'published', date: '2026-11-0' + (1 + (id.length % 7)) }; };
    return [
      r('r1', 'Hira A.', 'Pink Lily Bouquet', 'lily-bouquet', 'The bouquet looks even better in person. Every petal is perfect and the colours matched my dress exactly.'),
      r('r2', 'Sana M.', 'Sunflower Bouquet', 'sunflower-bouquet', 'Ordering was so easy. I picked the flowers, saw the price straight away and tracked my order until it arrived.'),
      r('r3', 'Zainab R.', 'Spring Pastel Bouquet', 'pastel-bouquet', 'A gift that will never wilt. My mother loved it and it arrived beautifully packed.'),
      r('r4', 'Maryam K.', 'Single Beaded Rose', 'rose', 'Small but so detailed. It sits on my desk and gets compliments every day.'),
      r('r5', 'Ayesha T.', 'Beaded Tree', 'beaded-tree', 'The beaded tree is the centrepiece of my living room. It looks just like the photos.'),
      r('r6', 'Noor F.', 'Beaded Earrings', 'earrings', 'Light, delicate and unlike anything else. I wore them to a wedding and everyone asked where they were from.'),
      r('r7', 'Mehwish S.', 'Pink Lily Bouquet', 'lily-bouquet', 'Beautiful work and perfect for gifting. Delivery was on time.'),
      r('r8', 'Areeba N.', 'Pink Lily Bouquet', 'lily-bouquet', 'The size is just right for my table. Highly recommend.'),
      r('r9', 'Laiba S.', 'Pebble Tree', 'pebble-tree', 'Such a calm, pretty piece. Packed with a lot of care.', 'pending')
    ];
  }
  function seedOrders() {
    var cust = function (n, e, p) { return { name: n, email: e, phone: p, address: 'House 12, Street 4, Model Town', city: 'Lahore', postal: '54000' }; };
    var pay = function (plan, total, st, receipt) { var now = plan === 'full' ? total : Math.round(total / 2); return { plan: plan, method: 'Bank transfer', paidNow: now, balance: total - now, receipt: receipt || null, status: st, balanceStatus: total - now ? 'due' : 'paid', balanceReceipt: null }; };
    var hist = function (d, s) { return [{ d: d, s: s }]; };
    return [
      { id: 'BF-1024', date: '2026-11-21', userEmail: 'ayesha@example.com', customer: cust('Ayesha K.', 'ayesha@example.com', '0300 1234567'),
        items: [{ name: 'Custom bouquet', meta: '2 × Lily, 1 × Sunflower • Blush, Cream • Glass seed beads', qty: 1, price: 11500, image: IMG('pastel-bouquet'), custom: { packaging: 'Neutral colours only for the wrapping.', notes: 'Match the colours to the dress photo.', needed: '2026-12-15', photos: [IMG('hero-vase'), IMG('pastel-bouquet')] } },
                { name: 'Single Beaded Rose', meta: 'Ready-made', qty: 1, price: 3000, image: IMG('rose') }],
        itemsTotal: 14500, delivery: { area: 'lahore', label: 'Lahore, Bykea', fee: 300 }, total: 14800, payment: pay('advance', 14800, 'verified', IMG('craft-closeup')), status: 'in_progress', tracking: '', notes: '', history: hist('2026-11-21', 'Order placed') },
      { id: 'BF-1023', date: '2026-11-20', userEmail: '', customer: cust('Hira A.', 'hira@example.com', '0301 7654321'), items: [{ name: 'Pink Lily Bouquet', meta: 'Medium', qty: 1, price: 8500, image: IMG('lily-bouquet') }], itemsTotal: 8500, delivery: { area: 'lahore', label: 'Lahore, Bykea', fee: 300 }, total: 9500 - 700, payment: pay('advance', 8800, 'verified'), status: 'in_progress', tracking: '', notes: '', history: hist('2026-11-20', 'Order placed') },
      { id: 'BF-1022', date: '2026-11-18', userEmail: '', customer: cust('Sana M.', 'sana@example.com', '0302 1112233'), items: [{ name: 'Custom bouquet', meta: '1 × Sunflower • Butter • Glass seed beads', qty: 1, price: 4500, image: IMG('sunflower-bouquet') }], itemsTotal: 4500, delivery: { area: 'other', label: 'Other city, TCS', fee: 0 }, total: 4500, payment: pay('full', 4500, 'verified'), status: 'shipped', tracking: 'TCS-778123990', notes: '', history: hist('2026-11-18', 'Order placed') },
      { id: 'BF-1021', date: '2026-11-15', userEmail: '', customer: cust('Noor F.', 'noor@example.com', '0303 9988776'), items: [{ name: 'Beaded Earrings', meta: 'Ready-made', qty: 1, price: 2500, image: IMG('earrings') }], itemsTotal: 2500, delivery: { area: 'lahore', label: 'Lahore, Bykea', fee: 700 }, total: 3200, payment: pay('full', 3200, 'verified'), status: 'delivered', tracking: '', notes: '', history: hist('2026-11-15', 'Order placed') },
      { id: 'BF-1020', date: '2026-11-12', userEmail: '', customer: cust('Maryam K.', 'maryam@example.com', '0304 5566778'), items: [{ name: 'Custom bouquet', meta: '3 × Rose, 2 × Daisy • Blush, White', qty: 1, price: 15500, image: IMG('pastel-bouquet') }, { name: 'Beaded Tree', meta: 'Ready-made', qty: 1, price: 2400, image: IMG('beaded-tree') }], itemsTotal: 17900, delivery: { area: 'lahore', label: 'Lahore, Bykea', fee: 300 }, total: 18200, payment: pay('advance', 18200, 'verified'), status: 'in_progress', tracking: '', notes: '', history: hist('2026-11-12', 'Order placed') },
      { id: 'BF-0987', date: '2026-10-02', userEmail: 'ayesha@example.com', customer: cust('Ayesha K.', 'ayesha@example.com', '0300 1234567'), items: [{ name: 'Custom bouquet', meta: '1 × Sunflower • Butter • Glass seed beads', qty: 1, price: 4500, image: IMG('sunflower-bouquet') }], itemsTotal: 4500, delivery: { area: 'lahore', label: 'Lahore, Bykea', fee: 0 }, total: 4500, payment: pay('full', 4500, 'verified'), status: 'delivered', tracking: '', notes: '', history: hist('2026-10-02', 'Order placed') }
    ];
  }
  function seedSettings() {
    return { shopName: 'The Beaded Florist', email: 'owner@thebeadedflorist.pk', phone: '03XX XXXXXXX', city: 'Lahore, Pakistan',
      accountTitle: 'Shiza Naveed', bank: 'Sample Bank • 0000-0000000-0', wallet: '03XX XXXXXXX',
      lahoreCourier: 'Bykea', otherCourier: 'TCS', prep: '10–15 days',
      notify: { order: true, receipt: true, review: true }, adminEmail: 'owner@thebeadedflorist.pk', adminPass: 'admin1234' };
  }
  function init() {
    if (S.get('version') === V) return;
    S.set('products', seedProducts()); S.set('pricing', seedPricing()); S.set('reviews', seedReviews());
    S.set('orders', seedOrders()); S.set('settings', seedSettings()); S.set('messages', []);
    S.set('users', [{ name: 'Ayesha K.', email: 'ayesha@example.com', phone: '0300 1234567', password: 'password123', address: 'House 12, Street 4, Model Town', city: 'Lahore', postal: '54000' }]);
    S.set('cart', []); S.set('counter', 1024); S.set('version', V);
  }
  init();

  /* ---------- Domain helpers ---------- */
  S.products = function (all) { var p = S.get('products', []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }); return all ? p : p.filter(function (x) { return x.visible; }); };
  S.product = function (id) { return S.get('products', []).filter(function (p) { return p.id === id; })[0]; };
  S.saveProducts = function (list) { S.set('products', list); };
  S.pricing = function () { return S.get('pricing', seedPricing()); };
  S.settings = function () { return S.get('settings', seedSettings()); };
  S.reviews = function (status) { var r = S.get('reviews', []); return status ? r.filter(function (x) { return x.status === status; }) : r; };

  /* Cart */
  S.cart = function () { return S.get('cart', []); };
  S.saveCart = function (c) { S.set('cart', c); S.updateBadge(); };
  S.cartCount = function () { return S.cart().reduce(function (n, i) { return n + i.qty; }, 0); };
  S.cartTotal = function () { return S.cart().reduce(function (n, i) { return n + i.price * i.qty; }, 0); };
  S.addToCart = function (item) {
    var c = S.cart();
    var ex = !item.custom && c.filter(function (i) { return !i.custom && i.productId === item.productId && i.meta === item.meta; })[0];
    if (ex) ex.qty += item.qty; else { item.id = item.id || S.uid(); c.push(item); }
    S.saveCart(c);
  };
  S.updateBadge = function () { document.querySelectorAll('[data-cart-count]').forEach(function (e) { e.textContent = S.cartCount(); }); };

  /* Auth */
  S.users = function () { return S.get('users', []); };
  S.user = function () { var e = S.get('session'); return e ? S.users().filter(function (u) { return u.email === e; })[0] || null : null; };
  S.signIn = function (email, pass) {
    email = String(email).trim().toLowerCase();
    if (email === DEMO_USER.email && pass === DEMO_USER.password) {
      var us = S.users();
      if (!us.some(function (x) { return x.email.toLowerCase() === email; })) { us.push(Object.assign({}, DEMO_USER)); S.set('users', us); }
      S.set('session', DEMO_USER.email); return S.users().filter(function (x) { return x.email.toLowerCase() === email; })[0];
    }
    var u = S.users().filter(function (x) { return x.email.toLowerCase() === email && x.password === pass; })[0];
    if (u) { S.set('session', u.email); return u; } return null;
  };
  S.adminLogin = function (email, pass) {
    email = String(email).trim().toLowerCase();
    var st = S.settings();
    var ok = (email === DEMO_ADMIN.email && pass === DEMO_ADMIN.password) || (email === String(st.adminEmail).toLowerCase() && pass === st.adminPass);
    if (ok) S.set('admin', true); return ok;
  };
  S.signOut = function () { localStorage.removeItem('bf_session'); };
  S.register = function (d) {
    var us = S.users();
    if (us.some(function (x) { return x.email.toLowerCase() === d.email.toLowerCase(); })) return { error: 'An account with this email already exists. Try signing in.' };
    us.push({ name: d.name, email: d.email, phone: d.phone, password: d.password, address: '', city: '', postal: '' });
    S.set('users', us); S.set('session', d.email); return { ok: true };
  };
  S.admin = function () { return S.get('admin') === true; };

  /* Orders */
  S.orders = function () { return S.get('orders', []); };
  S.order = function (id) { return S.orders().filter(function (o) { return o.id.toLowerCase() === String(id).trim().toLowerCase(); })[0]; };
  S.saveOrder = function (o) { var l = S.orders().map(function (x) { return x.id === o.id ? o : x; }); S.set('orders', l); };
  S.nextOrderId = function () { var n = S.get('counter', 1024) + 1; S.set('counter', n); return 'BF-' + n; };
  S.statusLabel = { new: 'New', in_progress: 'In progress', ready: 'Ready & packed', shipped: 'Shipped', delivered: 'Delivered' };
  S.customerStatusLabel = function (o) {
    if (o.status === 'new') return o.payment.status === 'rejected' ? 'Payment problem' : 'Checking payment';
    return o.status === 'in_progress' ? 'Being made' : S.statusLabel[o.status];
  };
  S.statusClass = function (st) { return st === 'new' ? 'new' : (st === 'in_progress' || st === 'ready') ? 'warn' : 'ok'; };
  S.deliveryOptions = function () {
    var p = S.pricing(), s = S.settings();
    return [
      { id: 'lahore', label: 'Lahore (' + s.lahoreCourier + ')', short: 'Lahore, ' + s.lahoreCourier, fee: p.lahore, note: '1–2 days after ready' },
      { id: 'other', label: 'Other city in Pakistan (' + s.otherCourier + ')', short: 'Other city, ' + s.otherCourier, fee: p.other, note: '3–5 days after ready' },
      { id: 'intl', label: 'International', short: 'International', fee: p.international, note: 'Calculated by country – we confirm the exact cost by email' }
    ];
  };

  /* Custom order pricing */
  S.catalogFor = function (type) {
    var p = S.pricing();
    return type === 'bouquet' || type === 'single' ? p.flowers : type === 'tree' ? p.trees : p.jewellery;
  };
  S.priceCustom = function (d) {
    var p = S.pricing(), cat = S.catalogFor(d.type), lines = [], flowers = 0, count = 0;
    Object.keys(d.items || {}).forEach(function (id) {
      var q = d.items[id]; if (!q) return;
      var it = cat.filter(function (x) { return x.id === id; })[0]; if (!it) return;
      lines.push({ label: q + ' × ' + it.name + ' (' + S.fmt(it.price) + ' each)', amount: q * it.price }); flowers += q * it.price; count += q;
    });
    var wrap = d.type === 'bouquet' && count ? p.wrapping : 0;
    var bead = p.beads.filter(function (b) { return b.id === d.bead; })[0] || p.beads[0];
    var beadCost = bead.extra * count, urgent = d.urgent ? p.urgent : 0;
    return { lines: lines, flowers: flowers, count: count, wrap: wrap, bead: bead, beadCost: beadCost, urgent: urgent, total: flowers + wrap + beadCost + urgent };
  };

  /* Review submission */
  S.addReview = function (r) { var l = S.get('reviews', []); l.push(r); S.set('reviews', l); };

  window.BF = S;
})();
