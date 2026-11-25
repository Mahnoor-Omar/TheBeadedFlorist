/* Admin panel – shop owner area */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var E = BF.esc, F = BF.fmt, R = BF.ROOT, key = document.body.dataset.page, A = {};

  function fdate(iso, long) { var d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-GB', long ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }); }
  function setNote(el, m) { el.textContent = m; el.classList.remove('hidden'); }
  function tag(txt, cls) { return '<span class="tag ' + (cls || '') + '">' + E(txt) + '</span>'; }
  function payTag(o) {
    var p = o.payment;
    if (p.status === 'receipt_uploaded') return tag('Receipt uploaded', 'warn');
    if (p.status === 'rejected') return tag('Receipt rejected', 'new');
    if (p.balanceStatus === 'pending') return tag('Balance receipt sent', 'warn');
    return p.balanceStatus === 'paid' || p.plan === 'full' ? tag('Paid in full', 'ok') : tag('Advance paid', 'ok');
  }
  function needsCheck(o) { return o.payment.status === 'receipt_uploaded' || o.payment.balanceStatus === 'pending'; }
  function itemCount(o) { return o.items.reduce(function (n, i) { return n + i.qty; }, 0); }

  /* ---------- Login ---------- */
  if (key === 'admin-login') {
    var s = BF.settings();
    if (BF.admin()) { location.replace('dashboard.html'); return; }
    document.getElementById('app').innerHTML =
      '<div class="a-login"><img src="' + R + 'assets/images/hero-vase.png" alt="A beaded flower bouquet in a floral vase"><div class="f"><div style="max-width:520px">' +
      '<span class="eyebrow">Admin panel</span><h1>Sign in to manage your shop</h1><p class="muted" style="margin-bottom:24px">Orders, products, prices and reviews, all in one place.</p>' +
      '<form id="lf" novalidate><div class="field"><label for="le">Admin email</label><input id="le" type="email" value="' + E(s.adminEmail) + '" autocomplete="username"></div>' +
      '<div class="field"><label for="lp">Password</label><input id="lp" type="password" autocomplete="current-password"></div>' +
      '<p style="margin:-4px 0 16px"><a href="#" id="fg" style="color:var(--rose);font-size:14px">Forgot password?</a></p>' +
      '<p class="err hidden" id="le-err" role="alert" style="margin:0 0 12px"></p><button class="btn full" type="submit">Log in</button></form>' +
      '<p class="hint" style="margin-top:16px">Only the shop owner can access this area.</p>' +
      '<p class="demo-note">Demo password: admin1234 (you can change it in Settings)</p>' +
      '<p style="margin-top:6px"><a href="' + R + 'index.html" class="muted" style="font-size:14px"><u>Back to website</u></a></p></div></div></div>';
    $('#lf').addEventListener('submit', function (e) {
      e.preventDefault(); var st = BF.settings();
      if (BF.adminLogin($('#le').value, $('#lp').value)) { location.href = 'dashboard.html'; }
      else setNote($('#le-err'), 'That email and password do not match. Check them and try again.');
    });
    $('#fg').addEventListener('click', function (e) { e.preventDefault(); BF.toast('Password reset is not enabled in this prototype.'); });
    return;
  }

  /* ---------- Shell ---------- */
  if (!BF.admin()) { location.replace('login.html'); return; }
  var nav = [['dashboard', 'Dashboard'], ['orders', 'Orders'], ['products', 'Products'], ['pricing', 'Pricing & options'], ['reviews', 'Reviews'], ['settings', 'Settings']];
  var active = { 'admin-order': 'orders', 'admin-product': 'products' }[key] || key.replace('admin-', '');
  var newCount = BF.orders().filter(function (o) { return o.status === 'new'; }).length;
  var title = document.body.dataset.title || '';
  document.getElementById('app').innerHTML =
    '<div class="admin"><aside class="a-side"><div class="logo"><img src="' + R + 'assets/images/logo-admin.png" alt=""><div><b>Admin panel</b><small>' + E(BF.settings().shopName) + '</small></div></div>' +
    '<nav aria-label="Admin">' + nav.map(function (n) { return '<a href="' + n[0] + '.html"' + (active === n[0] ? ' class="on" aria-current="page"' : '') + '>' + E(n[1]) + (n[0] === 'orders' && newCount ? '<span class="badge-count">' + newCount + '</span>' : '') + '</a>'; }).join('') + '</nav>' +
    '<div class="bottom"><a href="' + R + 'index.html">Back to website</a><a href="#" id="logout">Log out</a></div></aside>' +
    '<div class="a-main"><header class="a-top"><h1 id="a-title">' + E(title) + '</h1><div class="who"><span id="a-actions"></span><span>Shiza (Owner)</span><span class="avatar">S</span></div></header><div class="a-body" id="a-body"></div></div></div>';
  $('#logout').addEventListener('click', function (e) { e.preventDefault(); localStorage.removeItem('bf_admin'); location.href = 'login.html'; });
  var body = $('#a-body'), actions = $('#a-actions');
  document.title = title + ' – Admin – The Beaded Florist';

  /* ---------- Dashboard ---------- */
  A['admin-dashboard'] = function () {
    var os = BF.orders(), now = new Date(), ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var month = os.filter(function (o) { return o.date.slice(0, 7) === ym; });
    var rev = month.reduce(function (n, o) { return n + o.total; }, 0);
    var nNew = os.filter(function (o) { return o.status === 'new'; }).length, nProg = os.filter(function (o) { return o.status === 'in_progress'; }).length, nChk = os.filter(needsCheck).length;
    var attn = [];
    if (nChk) attn.push(nChk + ' payment receipt' + (nChk > 1 ? 's' : '') + ' to verify');
    os.filter(function (o) { return o.status !== 'delivered'; }).forEach(function (o) {
      o.items.forEach(function (i) { if (i.custom && i.custom.packaging) attn.push(o.id + ': customer asked for ' + i.custom.packaging.replace(/\.$/, '').toLowerCase()); });
      var due = o.items.map(function (i) { return i.custom && i.custom.needed; }).filter(Boolean)[0];
      if (due) { var days = Math.ceil((new Date(due + 'T12:00:00') - now) / 864e5); if (days >= 0 && days <= 14) attn.push('Order ' + o.id + ' is needed by ' + fdate(due) + ' (' + (days === 0 ? 'today' : 'in ' + days + ' day' + (days > 1 ? 's' : '')) + ')'); }
    });
    var pr = BF.reviews('pending').length; if (pr) attn.push(pr + ' review' + (pr > 1 ? 's' : '') + ' waiting for approval');
    var mc = BF.get('messages', []).length; if (mc) attn.push(mc + ' customer message' + (mc > 1 ? 's' : '') + ' from the contact form');
    body.innerHTML = '<div class="stats">' +
      '<div class="stat"><small>New orders</small><div class="v">' + nNew + '</div><div class="s">Waiting for you</div></div>' +
      '<div class="stat"><small>In progress</small><div class="v">' + nProg + '</div><div class="s">Being made</div></div>' +
      '<div class="stat"><small>Awaiting payment check</small><div class="v">' + nChk + '</div><div class="s">Receipts to verify</div></div>' +
      '<div class="stat"><small>This month (PKR)</small><div class="v">' + BF.num(rev) + '</div><div class="s">From ' + month.length + ' order' + (month.length === 1 ? '' : 's') + '</div></div></div>' +
      '<div class="a-grid"><div><h2>Recent orders</h2><div class="table-card"><table><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>' +
      os.slice(0, 5).map(function (o) { return '<tr><td class="id"><a href="order.html?id=' + E(o.id) + '">' + E(o.id) + '</a></td><td>' + E(o.customer.name) + '</td><td>' + BF.num(o.total) + '</td><td>' + tag(BF.statusLabel[o.status], BF.statusClass(o.status)) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div><div><h2>Needs attention</h2><div class="list-card">' + (attn.length ? '<ul>' + attn.slice(0, 8).map(function (a) { return '<li>' + E(a) + '</li>'; }).join('') + '</ul>' : '<p class="muted">Nothing needs attention right now.</p>') + '</div></div></div>';
  };

  /* ---------- Orders ---------- */
  A['admin-orders'] = function () {
    var f = 'all', q = '', fl = [['all', 'All'], ['new', 'New'], ['check', 'Awaiting payment check'], ['in_progress', 'In progress'], ['shipped', 'Shipped'], ['delivered', 'Delivered']];
    body.innerHTML = '<div class="toolbar"><div class="chips" id="fchips">' + fl.map(function (x) { return '<button class="chip' + (x[0] === 'all' ? ' on' : '') + '" data-f="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<input id="oq" type="search" placeholder="Search by name or order ID" aria-label="Search orders"></div><div class="table-card"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody id="orows"></tbody></table></div>';
    function draw() {
      var l = BF.orders().filter(function (o) {
        var ok = f === 'all' || (f === 'check' ? needsCheck(o) : f === 'in_progress' ? (o.status === 'in_progress' || o.status === 'ready') : o.status === f);
        return ok && (!q || (o.id + ' ' + o.customer.name).toLowerCase().indexOf(q) > -1);
      });
      $('#orows').innerHTML = l.length ? l.map(function (o) {
        return '<tr><td class="id">' + E(o.id) + '</td><td>' + E(o.customer.name) + '</td><td>' + fdate(o.date) + '</td><td>' + itemCount(o) + '</td><td>' + BF.num(o.total) + '</td><td>' + payTag(o) + '</td><td>' + tag(BF.statusLabel[o.status], BF.statusClass(o.status)) + '</td><td><a class="btn ghost sm" href="order.html?id=' + E(o.id) + '">View</a></td></tr>';
      }).join('') : '<tr><td colspan="8" class="muted" style="padding:28px 10px">No orders match. Try another filter or search.</td></tr>';
    }
    $('#fchips').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; $$('.chip').forEach(function (c) { c.classList.toggle('on', c === b); }); draw(); });
    $('#oq').addEventListener('input', function () { q = this.value.trim().toLowerCase(); draw(); });
    draw();
  };

  /* ---------- Order detail ---------- */
  A['admin-order'] = function () {
    var o = BF.order(BF.qs('id') || '');
    if (!o) { body.innerHTML = '<div class="card"><h2>Order not found</h2><p class="muted" style="margin:10px 0 16px">It may have been removed.</p><a class="btn" href="orders.html">Back to orders</a></div>'; return; }
    $('#a-title').textContent = 'Order ' + o.id;
    actions.innerHTML = '<button class="btn" id="print">Print packing slip</button> ';
    $('#print').addEventListener('click', function () { window.print(); });
    function draw() {
      o = BF.order(o.id); var p = o.payment, cu = o.customer;
      var reqs = o.items.filter(function (i) { return i.custom; }).map(function (i) { return i.custom; });
      var photos = [].concat.apply([], reqs.map(function (c) { return c.photos || []; }));
      var pct = Math.round(p.paidNow / o.total * 100);
      body.innerHTML = '<div class="a-cols"><div>' +
        '<div class="card"><h2>Items</h2>' + o.items.map(function (i) { return '<div class="sitem" style="margin-bottom:14px"><img src="' + BF.img(i.image) + '" alt="" style="width:54px;height:54px"><div class="t"><b style="font-weight:500">' + E(i.name) + '</b><small>' + E(i.meta || '') + (i.qty > 1 ? ' • Qty ' + i.qty : '') + '</small></div><span>' + F(i.price * i.qty) + '</span></div>'; }).join('') +
        '<div style="border-top:1px solid var(--line);padding-top:8px;margin-top:6px"><div class="sline"><span>Delivery (' + E(o.delivery.label) + ')</span><b>' + F(o.delivery.fee) + '</b></div><div class="sline total"><span>Total</span><span class="big" style="font-size:26px;font-family:var(--sans);font-weight:600">' + F(o.total) + '</span></div></div></div>' +
        '<div class="card"><h2>Customer requests</h2>' + (reqs.length ? reqs.map(function (c) { return (c.packaging ? '<p>Packaging note: ' + E(c.packaging) + '</p>' : '') + (c.notes ? '<p style="margin-top:8px">Notes: ' + E(c.notes) + '</p>' : '') + (c.needed ? '<p style="margin-top:8px">Needed by: ' + fdate(c.needed, true) + '</p>' : ''); }).join('') || '<p class="muted">No special requests.</p>' : '<p class="muted">No custom items in this order.</p>') +
        (photos.length ? '<div class="photos-grid">' + photos.map(function (ph, i) { return '<a href="' + BF.img(ph) + '" target="_blank" rel="noopener"><img src="' + BF.img(ph) + '" alt="Inspiration ' + (i + 1) + '"></a>'; }).join('') + '</div>' : '') + '</div>' +
        '<div class="card"><h2>Customer &amp; delivery</h2><p>' + E(cu.name) + ' • ' + E(cu.phone) + ' • ' + E(cu.email) + '</p><p class="muted" style="margin-top:6px">' + E(cu.address) + ', ' + E(cu.city) + (cu.postal ? ' ' + E(cu.postal) : '') + '</p></div></div>' +
        '<div><div class="card receipt"><h2>Payment</h2>' +
        '<div class="sline"><span>Method</span><b>' + E(p.method) + '</b></div><div class="sline"><span>Paid now</span><b>' + F(p.paidNow) + ' (' + pct + '%)</b></div><div class="sline"><span>Balance</span><b>' + (p.balanceStatus === 'paid' ? 'Paid' : F(p.balance)) + '</b></div>' +
        (p.receipt ? '<a href="' + BF.img(p.receipt) + '" target="_blank" rel="noopener"><img src="' + BF.img(p.receipt) + '" alt="Payment receipt"></a>' : '<p class="muted" style="margin:10px 0">No receipt on file.</p>') +
        (p.status === 'receipt_uploaded' ? '<div class="row-actions"><button class="btn" id="appr">Approve receipt</button><button class="btn ghost" id="rej">Reject</button></div>' : '<p>' + (p.status === 'verified' ? tag('Receipt approved', 'ok') : tag('Receipt rejected', 'new')) + (p.status === 'rejected' ? ' <button class="link-btn" id="appr">Approve anyway</button>' : '') + '</p>') +
        (p.balanceReceipt ? '<h3 style="font-size:22px;margin-top:18px">Balance receipt</h3><a href="' + BF.img(p.balanceReceipt) + '" target="_blank" rel="noopener"><img src="' + BF.img(p.balanceReceipt) + '" alt="Balance receipt"></a>' + (p.balanceStatus === 'pending' ? '<button class="btn" id="balok">Mark balance paid</button>' : '<p>' + tag('Balance paid', 'ok') + '</p>') : '') +
        (!p.balanceReceipt && p.balanceStatus === 'due' && p.balance > 0 ? '<p style="margin-top:14px"><button class="link-btn" id="balok">Mark balance paid (received another way)</button></p>' : '') + '</div>' +
        '<div class="card"><h2>Update status</h2><div class="field"><label for="st">Status</label><select id="st">' + Object.keys(BF.statusLabel).map(function (k) { return '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + BF.statusLabel[k] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="tk">Courier tracking number</label><input id="tk" placeholder="Add when shipped" value="' + E(o.tracking) + '"></div><button class="btn full" id="save">Save and notify customer</button></div>' +
        '<div class="card"><h2>Internal notes</h2><div class="field" style="margin:0"><label for="nt">Only you can see this</label><textarea id="nt" placeholder="Add a note…">' + E(o.notes) + '</textarea></div><p class="hint" style="margin-top:8px">Saved automatically.</p></div></div></div>';
      function upd(fn, msg, hist) { var c = BF.order(o.id); fn(c); if (hist) c.history.push({ d: new Date().toISOString().slice(0, 10), s: hist }); BF.saveOrder(c); BF.toast(msg); draw(); refreshBadge(); }
      var a = $('#appr'); if (a) a.addEventListener('click', function () { upd(function (c) { c.payment.status = 'verified'; if (c.status === 'new') c.status = 'in_progress'; }, 'Receipt approved. The order is now in progress.', 'Payment verified'); });
      var r = $('#rej'); if (r) r.addEventListener('click', function () { upd(function (c) { c.payment.status = 'rejected'; }, 'Receipt rejected.', 'Receipt rejected'); });
      var b = $('#balok'); if (b) b.addEventListener('click', function () { upd(function (c) { c.payment.balanceStatus = 'paid'; }, 'Balance marked as paid.', 'Balance paid'); });
      $('#save').addEventListener('click', function () {
        var ns = $('#st').value, tk = $('#tk').value.trim();
        if (ns === 'shipped' && !tk && !confirm('No tracking number added. Mark as shipped anyway?')) return;
        if ((ns === 'shipped' || ns === 'delivered') && o.payment.balance > 0 && o.payment.balanceStatus !== 'paid' && !confirm('The balance of ' + F(o.payment.balance) + ' is still unpaid. Continue anyway?')) return;
        upd(function (c) { c.status = ns; c.tracking = tk; }, 'Saved. The customer will see the new status on their order page.', 'Status: ' + BF.statusLabel[ns]);
      });
      $('#nt').addEventListener('change', function () { var c = BF.order(o.id); c.notes = this.value; BF.saveOrder(c); BF.toast('Note saved'); });
    }
    function refreshBadge() { var n = BF.orders().filter(function (x) { return x.status === 'new'; }).length, bd = $('.a-side nav .badge-count'); if (bd) { if (n) bd.textContent = n; else bd.remove(); } }
    draw();
  };

  /* ---------- Products ---------- */
  A['admin-products'] = function () {
    actions.innerHTML = '<a class="btn" href="product-edit.html?new=1">Add product</a> ';
    body.innerHTML = '<div class="table-card"><table><thead><tr><th>Product</th><th>Category</th><th>Price (PKR)</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>' +
      BF.products(true).map(function (p) { return '<tr><td><div class="pr"><img src="' + BF.img(p.images[0]) + '" alt=""><b style="font-weight:500">' + E(p.name) + '</b></div></td><td>' + E(p.category) + '</td><td>' + BF.num(p.price) + '</td><td>' + E(p.stock) + '</td><td>' + (p.visible ? tag('Visible', 'ok') : tag('Hidden', 'warn')) + '</td><td><a class="btn ghost sm" href="product-edit.html?id=' + E(p.id) + '">Edit</a></td></tr>'; }).join('') + '</tbody></table></div>';
  };

  A['admin-product'] = function () {
    var isNew = !!BF.qs('new'), p = isNew ? { id: '', name: '', desc: '', category: 'Bouquets', price: 0, sizes: [{ name: 'Standard', price: 0 }], images: [], stock: 'Made to order', visible: true } : JSON.parse(JSON.stringify(BF.product(BF.qs('id')) || 'null'));
    if (!p) { body.innerHTML = '<div class="card"><h2>Product not found</h2><a class="btn" style="margin-top:14px" href="products.html">Back to products</a></div>'; return; }
    $('#a-title').textContent = isNew ? 'Add product' : 'Edit product';
    var cats = ['Bouquets', 'Single flowers', 'Trees & more', 'Jewellery'], main = 0;
    function draw() {
      body.innerHTML = '<p class="crumbs"><a href="products.html">Products</a> / ' + E(p.name || 'New product') + '</p><div class="a-cols"><div>' +
        '<div class="card"><h2>Product details</h2><div class="field"><label for="pn">Product name</label><input id="pn" value="' + E(p.name) + '"></div>' +
        '<div class="field"><label for="pd">Description</label><textarea id="pd">' + E(p.desc) + '</textarea></div>' +
        '<div class="row2"><div class="field"><label for="pc">Category</label><select id="pc">' + cats.map(function (c) { return '<option' + (c === p.category ? ' selected' : '') + '>' + E(c) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="pp">Base price (PKR)</label><input id="pp" type="number" min="0" step="50" value="' + (p.price || '') + '"></div></div>' +
        '<div class="field" style="margin:0"><label for="ps">Stock</label><input id="ps" value="' + E(p.stock) + '" placeholder="Made to order, or e.g. 4 in stock"></div></div>' +
        '<div class="card"><h2>Sizes and prices</h2>' + p.sizes.map(function (s, i) { return '<div class="price-edit"><input data-sn="' + i + '" value="' + E(s.name) + '" aria-label="Size name" style="width:55%"><span class="u">PKR</span><input data-sp="' + i + '" type="number" min="0" step="50" value="' + s.price + '" aria-label="Price"><button class="link-btn red" data-rs="' + i + '" aria-label="Remove size">✕</button></div>'; }).join('') + '<p style="margin-top:10px"><button class="link-btn red" id="adds">+ Add size</button></p></div></div>' +
        '<div><div class="card"><h2>Photos</h2>' + (p.images.length ? '<img src="' + BF.img(p.images[main]) + '" alt="" style="border-radius:12px;width:100%;aspect-ratio:1/0.7;object-fit:cover">' : '<p class="muted">No photos yet. Add at least one.</p>') +
        '<div class="photos-grid">' + p.images.map(function (im, i) { return '<div style="position:relative"><button data-pi="' + i + '" style="border:' + (i === main ? '2px solid var(--green)' : '2px solid transparent') + ';padding:0;border-radius:10px;background:none;cursor:pointer" aria-label="Show photo ' + (i + 1) + '"><img src="' + BF.img(im) + '" alt=""></button><button data-rp="' + i + '" aria-label="Remove photo ' + (i + 1) + '" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:0;background:var(--rose);color:#fff;cursor:pointer;font-size:12px">×</button></div>'; }).join('') +
        '<button id="addp" aria-label="Add photo" style="width:80px;height:80px;border:1px solid var(--coral);border-radius:8px;background:#fff;color:var(--rose);font-size:26px;cursor:pointer">+</button></div><input type="file" id="pf" accept="image/*" multiple hidden></div>' +
        '<div class="card"><h2>Visibility</h2><p><button class="tag ' + (p.visible ? 'ok' : 'warn') + '" id="vis" style="border:0;cursor:pointer" aria-pressed="' + p.visible + '">' + (p.visible ? 'Visible in shop' : 'Hidden from shop') + '</button></p>' +
        '<p class="hint" style="margin:8px 0 16px">Click to switch. Hidden products are not shown in the shop.</p><p class="err hidden" id="perr" role="alert"></p>' +
        '<button class="btn full" id="save" style="margin-bottom:12px">Save changes</button>' + (isNew ? '' : '<button class="btn ghost full" id="del">Delete product</button>') + '</div></div></div>';
    }
    function grab() {
      p.name = $('#pn').value; p.desc = $('#pd').value; p.category = $('#pc').value; p.price = +$('#pp').value; p.stock = $('#ps').value;
      $$('[data-sn]').forEach(function (e) { p.sizes[+e.dataset.sn].name = e.value; }); $$('[data-sp]').forEach(function (e) { p.sizes[+e.dataset.sp].price = +e.value; });
    }
    body.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.rs != null) { grab(); if (p.sizes.length > 1) { p.sizes.splice(+t.dataset.rs, 1); draw(); } else BF.toast('A product needs at least one size.'); }
      else if (t.id === 'adds') { grab(); p.sizes.push({ name: 'New size', price: p.price || 0 }); draw(); }
      else if (t.dataset.pi != null) { grab(); main = +t.dataset.pi; draw(); }
      else if (t.dataset.rp != null) { grab(); p.images.splice(+t.dataset.rp, 1); main = 0; draw(); }
      else if (t.id === 'addp') $('#pf').click();
      else if (t.id === 'vis') { grab(); p.visible = !p.visible; draw(); }
      else if (t.id === 'del') { if (confirm('Delete "' + p.name + '"? This cannot be undone.')) { BF.saveProducts(BF.products(true).filter(function (x) { return x.id !== p.id; })); location.href = 'products.html'; } }
      else if (t.id === 'save') {
        grab(); var er = $('#perr');
        if (!p.name.trim()) return setNote(er, 'Please enter a product name.');
        if (!(p.price > 0)) return setNote(er, 'Please enter a base price above zero.');
        if (p.sizes.some(function (s) { return !s.name.trim() || !(s.price > 0); })) return setNote(er, 'Every size needs a name and a price above zero.');
        if (!p.images.length) p.images = ['assets/images/craft-closeup.png'];
        var list = BF.products(true);
        if (isNew) { p.id = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5); p.order = list.length + 1; list.push(p); }
        else list = list.map(function (x) { return x.id === p.id ? Object.assign({}, x, p) : x; });
        BF.saveProducts(list); BF.toast('Product saved.'); setTimeout(function () { location.href = 'products.html'; }, 600);
      }
    });
    body.addEventListener('change', function (e) {
      if (e.target.id === 'pf') { grab(); Promise.all(Array.prototype.slice.call(e.target.files).map(function (f) { return BF.readImage(f, 800).catch(function (x) { BF.toast(x.message); return null; }); })).then(function (r) { r.forEach(function (x) { if (x) p.images.push(x); }); draw(); }); }
    });
    draw();
  };

  /* ---------- Pricing & options ---------- */
  A['admin-pricing'] = function () {
    actions.innerHTML = '<button class="btn" id="saveall">Save all</button> ';
    var pr = BF.pricing();
    function row(label, id, val, unit) { return '<div class="price-edit"><label for="' + id + '" style="margin:0;font-weight:400">' + E(label) + '</label><span class="u">' + unit + '</span><input id="' + id + '" type="number" min="0" step="50" value="' + val + '"></div>'; }
    body.innerHTML = '<p class="muted" style="margin-bottom:24px">Everything the website uses to calculate a custom order price. Change a value and the customer price updates automatically.</p><div class="a-cols"><div>' +
      '<div class="card"><h2>Flower prices (each)</h2>' + pr.flowers.map(function (f, i) { return row(f.name, 'fl' + i, f.price, 'PKR'); }).join('') + '</div>' +
      '<div class="card"><h2>Trees and jewellery (each)</h2>' + pr.trees.concat(pr.jewellery).map(function (f, i) { return row(f.name, 'tj' + i, f.price, 'PKR'); }).join('') + '</div>' +
      '<div class="card"><h2>Bead options</h2>' + pr.beads.map(function (b, i) { return row(b.name, 'bd' + i, b.extra, '+ PKR per flower'); }).join('') + '</div>' +
      '<div class="card"><h2>Colours</h2><div class="swatch-row" id="cols"></div><div class="row-actions" style="margin-top:16px"><input id="cn" placeholder="Colour name" aria-label="Colour name" style="border:1px solid var(--line);border-radius:8px;padding:8px 12px"><input id="chx" type="color" value="#e8a99c" aria-label="Pick colour" style="width:44px;height:38px;border:1px solid var(--line);border-radius:8px;padding:2px;background:#fff"><button class="link-btn red" id="addc">+ Add colour</button></div></div></div>' +
      '<div><div class="card"><h2>Fees and payment</h2>' + row('Wrapping & packaging', 'wr', pr.wrapping, 'PKR') + row('Urgent order fee', 'ur', pr.urgent, 'PKR') + row('Lahore delivery (' + BF.settings().lahoreCourier + ')', 'lh', pr.lahore, 'PKR') + row('Other city (' + BF.settings().otherCourier + ')', 'ot', pr.other, 'PKR') + row('International (from)', 'in', pr.international, 'PKR') + row('Advance payment', 'ad', pr.advance, '%') + '</div>' +
      '<div class="card"><h2>Live price preview</h2><p class="muted" id="pv-d" style="font-size:14px;margin-bottom:8px"></p><div id="pv"></div></div></div></div>';
    var cols = pr.colours.slice();
    function drawCols() { $('#cols').innerHTML = cols.map(function (c, i) { return '<div class="s" style="background:' + E(c.hex) + '" title="' + E(c.name) + '"><button data-rc="' + i + '" aria-label="Remove ' + E(c.name) + '">×</button></div>'; }).join(''); }
    function val(id) { return Math.max(0, +$('#' + id).value || 0); }
    function preview() {
      var l = val('fl0'), s = val('fl1'), fl = 2 * l + s, wr = val('wr'), beadX = val('bd0') * 3;
      $('#pv-d').textContent = '2 ' + pr.flowers[0].name + ' + 1 ' + pr.flowers[1].name + ', ' + pr.beads[0].name.toLowerCase();
      $('#pv').innerHTML = '<div class="sline"><span>Flowers</span><b>' + F(fl) + '</b></div><div class="sline"><span>Wrapping</span><b>' + F(wr) + '</b></div>' + (beadX ? '<div class="sline"><span>Beads</span><b>' + F(beadX) + '</b></div>' : '') + '<div class="sline total"><span>Customer sees</span><span>' + F(fl + wr + beadX) + '</span></div>';
    }
    drawCols(); preview();
    body.addEventListener('input', function (e) { if (e.target.type === 'number') preview(); });
    body.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.rc != null) { if (cols.length > 1) { cols.splice(+t.dataset.rc, 1); drawCols(); } else BF.toast('Keep at least one colour.'); }
      if (t.id === 'addc') { var n = $('#cn').value.trim(); if (!n) return BF.toast('Give the colour a name first.'); if (cols.some(function (c) { return c.name.toLowerCase() === n.toLowerCase(); })) return BF.toast('That colour already exists.'); cols.push({ name: n, hex: $('#chx').value }); $('#cn').value = ''; drawCols(); }
    });
    $('#saveall').addEventListener('click', function () {
      var p = BF.pricing();
      p.flowers.forEach(function (f, i) { f.price = val('fl' + i); });
      p.trees.concat(p.jewellery).forEach(function (f, i) { f.price = val('tj' + i); });
      p.beads.forEach(function (b, i) { b.extra = val('bd' + i); });
      p.wrapping = val('wr'); p.urgent = val('ur'); p.lahore = val('lh'); p.other = val('ot'); p.international = val('in'); p.advance = Math.min(100, Math.max(1, val('ad') || 50)); p.colours = cols;
      BF.set('pricing', p); BF.toast('Pricing saved. Customers now see the new prices.');
    });
  };

  /* ---------- Reviews ---------- */
  A['admin-reviews'] = function () {
    var f = 'all';
    body.innerHTML = '<div class="toolbar"><div class="chips" id="rch">' + [['all', 'All'], ['pending', 'Waiting for approval'], ['published', 'Published']].map(function (x) { return '<button class="chip' + (x[0] === 'all' ? ' on' : '') + '" data-f="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div><div id="rl"></div>';
    function draw() {
      var l = BF.reviews().filter(function (r) { return f === 'all' || r.status === f; });
      $('#rl').innerHTML = l.length ? l.map(function (r) {
        return '<div class="rv"><img src="' + BF.img(r.image) + '" alt=""><div class="t"><div class="stars">' + '★'.repeat(r.rating) + '</div><p style="margin:6px 0">“' + E(r.text) + '”</p><small class="muted">' + E(r.name) + ' • ' + E(r.product) + '</small></div>' +
          (r.status === 'published' ? tag('Published', 'ok') : tag('Waiting for approval', 'warn')) +
          '<div class="acts"><button class="btn sm" data-a="' + (r.status === 'published' ? 'un' : 'ok') + '" data-id="' + E(r.id) + '">' + (r.status === 'published' ? 'Unpublish' : 'Approve') + '</button><button class="btn ghost sm" data-a="del" data-id="' + E(r.id) + '">Delete</button></div></div>';
      }).join('') : '<p class="muted">No reviews here yet.</p>';
    }
    $('#rch').addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; f = b.dataset.f; $$('#rch .chip').forEach(function (c) { c.classList.toggle('on', c === b); }); draw(); });
    $('#rl').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; var l = BF.reviews();
      if (b.dataset.a === 'del') { if (!confirm('Delete this review? This cannot be undone.')) return; l = l.filter(function (r) { return r.id !== b.dataset.id; }); BF.toast('Review deleted.'); }
      else { l.forEach(function (r) { if (r.id === b.dataset.id) r.status = b.dataset.a === 'ok' ? 'published' : 'pending'; }); BF.toast(b.dataset.a === 'ok' ? 'Review published.' : 'Review unpublished.'); }
      BF.set('reviews', l); draw();
    });
    draw();
  };

  /* ---------- Settings ---------- */
  A['admin-settings'] = function () {
    var s = BF.settings();
    actions.innerHTML = '<button class="btn" id="sv">Save changes</button> ';
    function fld(l, id, v) { return '<div class="field"><label for="' + id + '">' + l + '</label><input id="' + id + '" value="' + E(v) + '"></div>'; }
    body.innerHTML = '<div class="a-cols" style="grid-template-columns:1fr 1fr"><div>' +
      '<div class="card"><h2>Shop information</h2>' + fld('Shop name', 'sn', s.shopName) + fld('Contact email', 'se', s.email) + fld('Phone', 'sp', s.phone) + fld('City', 'sc', s.city) + '</div>' +
      '<div class="card"><h2>Bank &amp; payment details</h2>' + fld('Account title', 'at', s.accountTitle) + fld('Bank name and account number', 'bk', s.bank) + fld('JazzCash / Easypaisa number', 'wl', s.wallet) + '<p class="hint">Customers see these details when they pay.</p></div></div><div>' +
      '<div class="card"><h2>Delivery</h2>' + fld('Lahore courier', 'lc', s.lahoreCourier) + fld('Other cities and international', 'oc', s.otherCourier) + fld('Usual preparation time', 'pt', s.prep) + '</div>' +
      '<div class="card"><h2>Email notifications</h2>' + [['order', 'New order received'], ['receipt', 'Payment receipt uploaded'], ['review', 'New review submitted']].map(function (n) { return '<label class="toggle" style="font-weight:400;font-size:15px"><input type="checkbox" data-n="' + n[0] + '"' + (s.notify[n[0]] ? ' checked' : '') + '> ' + n[1] + '</label>'; }).join('') + '<p class="hint" style="margin-top:8px">Saved as your preference. This prototype does not send real emails.</p></div>' +
      '<div class="card"><h2>Change password</h2><div class="field"><label for="cp">Current password</label><input id="cp" type="password" autocomplete="current-password"></div><div class="field"><label for="np">New password</label><input id="np" type="password" placeholder="At least 8 characters" autocomplete="new-password"></div><p class="err hidden" id="pe" role="alert"></p><button class="btn ghost" id="up">Update password</button></div></div></div>';
    $('#sv').addEventListener('click', function () {
      var st = BF.settings();
      st.shopName = $('#sn').value.trim() || st.shopName; st.email = $('#se').value.trim(); st.phone = $('#sp').value.trim(); st.city = $('#sc').value.trim();
      st.accountTitle = $('#at').value.trim(); st.bank = $('#bk').value.trim(); st.wallet = $('#wl').value.trim();
      st.lahoreCourier = $('#lc').value.trim() || st.lahoreCourier; st.otherCourier = $('#oc').value.trim() || st.otherCourier; st.prep = $('#pt').value.trim() || st.prep;
      $$('[data-n]').forEach(function (c) { st.notify[c.dataset.n] = c.checked; });
      BF.set('settings', st); BF.toast('Settings saved.');
    });
    $('#up').addEventListener('click', function () {
      var st = BF.settings(), er = $('#pe');
      if ($('#cp').value !== st.adminPass) return setNote(er, 'Your current password is not right.');
      if ($('#np').value.length < 8) return setNote(er, 'Your new password needs at least 8 characters.');
      st.adminPass = $('#np').value; BF.set('settings', st); er.classList.add('hidden'); $('#cp').value = ''; $('#np').value = ''; BF.toast('Password updated.');
    });
  };

  if (A[key]) A[key]();
})();
