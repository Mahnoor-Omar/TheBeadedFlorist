/* Storefront page logic – each page registers a function keyed by body[data-page] */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var E = BF.esc, F = BF.fmt, R = BF.ROOT;
  var P = {};

  function fdate(iso, long) {
    var d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-GB', long ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function pcard(p) {
    return '<a class="pcard" href="' + R + 'product.html?id=' + E(p.id) + '"><div class="ph"><img src="' + BF.img(p.images[0]) + '" alt="' + E(p.name) + '" loading="lazy"></div>' +
      '<h3>' + E(p.name) + '</h3><div class="price">' + F(p.price) + '</div><span class="more">View details →</span></a>';
  }
  function rcard(r) {
    return '<article class="rcard"><img src="' + BF.img(r.image) + '" alt="' + E(r.product) + '" loading="lazy"><div class="b"><div class="stars" aria-label="' + r.rating + ' out of 5">' + '★'.repeat(r.rating) + '</div>' +
      '<q>' + E(r.text) + '</q><div class="by">' + E(r.name) + ' • ' + E(r.product) + '</div></div></article>';
  }
  function sumLines(rows) { return rows.map(function (r) { return '<div class="sline"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join(''); }
  function setNote(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }

  /* ---------------- Home ---------------- */
  P.home = function () {
    var ids = ['pink-lily-bouquet', 'sunflower-bouquet', 'single-beaded-rose', 'beaded-tree'];
    var pop = ids.map(BF.product).filter(function (p) { return p && p.visible; });
    if (pop.length < 4) pop = BF.products().slice(0, 4);
    $('#popular').innerHTML = pop.map(pcard).join('');
    $('#home-reviews').innerHTML = BF.reviews('published').slice(0, 3).map(rcard).join('');
  };

  /* ---------------- Shop ---------------- */
  P.shop = function () {
    var cats = ['All', 'Bouquets', 'Single flowers', 'Jewellery', 'Trees & more'], cur = 'All';
    var chips = $('#chips'), grid = $('#grid'), sort = $('#sort');
    chips.innerHTML = cats.map(function (c) { return '<button class="chip' + (c === 'All' ? ' on' : '') + '" data-c="' + E(c) + '">' + E(c) + '</button>'; }).join('');
    function draw() {
      var l = BF.products().filter(function (p) { return cur === 'All' || p.category === cur; });
      var s = sort.value;
      if (s === 'low') l.sort(function (a, b) { return a.price - b.price; });
      else if (s === 'high') l.sort(function (a, b) { return b.price - a.price; });
      else if (s === 'name') l.sort(function (a, b) { return a.name.localeCompare(b.name); });
      grid.innerHTML = l.length ? l.map(pcard).join('') : '<p class="muted">No designs in this category yet. <a href="custom-order.html"><u>Design a custom order</u></a>.</p>';
    }
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return; cur = b.dataset.c;
      $$('.chip', chips).forEach(function (x) { x.classList.toggle('on', x === b); }); draw();
    });
    sort.addEventListener('change', draw); draw();
  };

  /* ---------------- Product detail ---------------- */
  P.product = function () {
    var p = BF.product(BF.qs('id'));
    var box = $('#pd');
    if (!p || !p.visible) { $('#crumb-p').textContent = 'Not found'; box.innerHTML = '<div class="card"><h2>We could not find that design</h2><p class="muted" style="margin:10px 0 18px">It may have been removed or hidden.</p><a class="btn" href="shop.html">Back to the shop</a></div>'; return; }
    document.title = p.name + ' – The Beaded Florist'; $('#crumb-p').textContent = p.name;
    var si = p.sizes.findIndex(function (s) { return s.price === p.price; }); if (si < 0) si = Math.min(1, p.sizes.length - 1);
    var qty = 1, img = 0;
    function draw() {
      var s = p.sizes[si];
      box.innerHTML =
        '<div><div class="main-img"><img id="mainimg" src="' + BF.img(p.images[img]) + '" alt="' + E(p.name) + '"></div>' +
        '<div class="thumbs">' + p.images.slice(0, 4).map(function (im, i) { return '<button class="' + (i === img ? 'on' : '') + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + BF.img(im) + '" alt=""></button>'; }).join('') + '</div></div>' +
        '<div><h1>' + E(p.name) + '</h1><div class="price-row"><span class="price">' + F(s.price) + '</span><span class="muted" style="font-size:13px">' + (p.sizes.length > 1 ? E(s.name) + ' size • price updates with size' : 'One size') + '</span></div>' +
        (p.sizes.length > 1 ? '<label>Size</label><div class="opts" role="radiogroup">' + p.sizes.map(function (z, i) { return '<button class="opt' + (i === si ? ' on' : '') + '" role="radio" aria-checked="' + (i === si) + '" data-s="' + i + '">' + E(z.name) + ' &nbsp;' + F(z.price).replace('PKR ', 'PKR ') + '</button>'; }).join('') + '</div>' : '') +
        '<p class="muted">' + E(p.desc) + '</p>' +
        '<div class="tags"><span class="tag">Lasts for decades</span><span class="tag">Handmade in Lahore</span><span class="tag">Ready in ' + E(BF.settings().prep.replace('–', '–')) + '</span></div>' +
        '<div class="row-actions"><div class="qty"><button data-q="-1" aria-label="Less">−</button><span id="q">' + qty + '</span><button data-q="1" aria-label="More">+</button></div>' +
        '<button class="btn" id="add">Add to cart</button><a class="btn ghost" href="custom-order.html?base=' + E(p.id) + '">Customise this design</a></div>' +
        '<div class="acc"><details open><summary>Care instructions</summary><p>Keep away from heavy moisture and harsh sunlight. Dust gently with a soft, dry brush. Handle by the stem and store in a dry place.</p></details>' +
        '<details><summary>What are French beaded flowers?</summary><p>French beaded flowers are made by threading glass seed beads onto wire to form petals and leaves, which are then twisted together into a flower. Every piece is made by hand.</p></details>' +
        '<details><summary>Delivery &amp; payment</summary><p>We deliver in Lahore with ' + E(BF.settings().lahoreCourier) + ' and to other cities and abroad with ' + E(BF.settings().otherCourier) + '. Pay a ' + BF.pricing().advance + '% advance or the full amount by bank transfer or JazzCash / Easypaisa, then upload your receipt.</p></details></div></div>';
    }
    box.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.i != null) { img = +t.dataset.i; draw(); }
      else if (t.dataset.s != null) { si = +t.dataset.s; draw(); }
      else if (t.dataset.q) { qty = Math.max(1, Math.min(10, qty + +t.dataset.q)); draw(); }
      else if (t.id === 'add') {
        var s = p.sizes[si];
        BF.addToCart({ productId: p.id, name: p.name, meta: p.sizes.length > 1 ? s.name : 'Ready-made', qty: qty, price: s.price, image: p.images[0], readyMade: true });
        BF.toast(p.name + ' added to your cart');
      }
    });
    draw();
    var rv = BF.reviews('published').filter(function (r) { return r.product === p.name; }).slice(0, 3);
    $('#pd-reviews').innerHTML = rv.length ? rv.map(rcard).join('') : '<p class="muted">No reviews for this design yet. <a href="reviews.html"><u>Be the first to share one</u></a>.</p>';
    $('#also').innerHTML = BF.products().filter(function (x) { return x.id !== p.id; }).slice(0, 4).map(pcard).join('');
  };

  /* ---------------- Reviews ---------------- */
  P.reviews = function () {
    var l = BF.reviews('published');
    var avg = l.length ? (l.reduce(function (n, r) { return n + r.rating; }, 0) / l.length) : 0;
    $('#score').innerHTML = '<div class="n">' + (l.length ? avg.toFixed(1) : '–') + '</div><div><div class="stars">' + '★'.repeat(Math.round(avg)) + '</div><p class="muted">Average rating from ' + l.length + ' customer reviews</p></div>';
    $('#rgrid').innerHTML = l.length ? l.map(rcard).join('') : '<p class="muted">No reviews yet.</p>';
    var sel = $('#rp'); sel.innerHTML = BF.products(true).map(function (p) { return '<option>' + E(p.name) + '</option>'; }).join('');
    var u = BF.user(); if (u) $('#rn').value = u.name;
    $('#rform').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#rn').value.trim(), text = $('#rt').value.trim(), prod = sel.value;
      if (!name || text.length < 10) { setNote($('#rerr'), 'Please add your name and a few words about your order (at least 10 characters).'); return; }
      var pr = BF.products(true).filter(function (p) { return p.name === prod; })[0];
      BF.addReview({ id: BF.uid(), name: name, product: prod, image: pr ? pr.images[0] : 'assets/images/hands-beading.png', rating: +$('#rr').value, text: text, status: 'pending', date: today() });
      this.reset(); $('#rerr').classList.add('hidden');
      BF.toast('Thank you! Your review will appear once the shop owner approves it.');
    });
  };

  /* ---------------- About / contact ---------------- */
  P.about = function () {
    var s = BF.settings();
    $('#loc').textContent = s.city; $('#dlv').textContent = s.lahoreCourier + ' in Lahore, ' + s.otherCourier + ' for other cities and international';
    $('#cform').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#cn').value.trim(), m = $('#cm').value.trim(), em = $('#ce').value.trim();
      var er = $('#cerr');
      if (!n || !/^\S+@\S+\.\S+$/.test(em) || !m) { setNote(er, 'Please fill in your name, a valid email and a message.'); return; }
      var l = BF.get('messages', []); l.push({ id: BF.uid(), name: n, email: em, message: m, date: today() }); BF.set('messages', l);
      this.reset(); er.classList.add('hidden'); BF.toast('Message sent. We will reply by email.');
    });
  };

  /* ---------------- Custom order ---------------- */
  P.custom = function () {
    var pr = BF.pricing(), step = 1, editId = BF.qs('edit'), base = BF.qs('base');
    var types = [{ id: 'bouquet', n: 'Bouquet', d: 'Several flowers together' }, { id: 'single', n: 'Single flower', d: 'One beaded flower' }, { id: 'tree', n: 'Beaded tree', d: 'Tree or pebble tree' }, { id: 'jewellery', n: 'Jewellery', d: 'Necklace, bracelet, earrings' }];
    var steps = ['Choose flowers', 'Colours & beads', 'Inspiration & delivery', 'Review'];
    var d = { type: 'bouquet', items: {}, colours: [], bead: 'glass', packaging: '', photos: [], notes: '', needed: '', urgent: false };
    if (editId) { var ci = BF.cart().filter(function (i) { return i.id === editId && i.custom; })[0]; if (ci) d = JSON.parse(JSON.stringify(ci.custom.draft)); else editId = null; }
    else if (base) {
      var bp = BF.product(base);
      if (bp) {
        d.type = { 'Bouquets': 'bouquet', 'Single flowers': 'single', 'Trees & more': 'tree', 'Jewellery': 'jewellery' }[bp.category] || 'bouquet';
        var hit = BF.catalogFor(d.type).filter(function (c) { return bp.name.toLowerCase().indexOf(c.name.toLowerCase().split(' ')[0]) > -1; })[0];
        if (hit) d.items[hit.id] = 1;
      }
    }
    var area = $('#co'), err = '';

    function titleFor() { return step === 4 ? ['Review your design', 'Check everything, then add it to your cart. No waiting for a quote.'] : ['Design your custom order', ['', 'Choose what you want. The price updates as you go.', 'Pick the colours and the type of beads.', 'Show us what you have in mind and tell us when you need it.'][step]]; }
    function itemName(id) { var c = BF.catalogFor(d.type).filter(function (x) { return x.id === id; })[0]; return c ? c.name : id; }
    function summaryText() { return Object.keys(d.items).filter(function (k) { return d.items[k]; }).map(function (k) { return d.items[k] + ' × ' + itemName(k); }).join(', '); }
    function priceBox() {
      var c = BF.priceCustom(d), rows = c.lines.map(function (l) { return [E(l.label), F(l.amount)]; });
      if (!rows.length) rows.push(['No items chosen yet', '–']);
      if (step >= 2 || c.beadCost) { /* show wrapping after items */ }
      if (c.wrap) rows.push(['Bouquet wrapping &amp; packaging', F(c.wrap)]);
      if (step >= 2) rows.push(['Beads: ' + E(c.bead.name.toLowerCase()), c.beadCost ? F(c.beadCost) : 'Included']);
      if (step >= 3) rows.push(['Urgent order', c.urgent ? F(c.urgent) : 'Not selected']);
      return '<h3>' + (step === 4 ? 'Price breakdown' : 'Your price') + '</h3><span class="tag" style="margin-bottom:10px">Updates automatically</span>' + sumLines(rows) +
        '<div class="sline total"><span>Subtotal</span><span class="big">' + F(c.total) + '</span></div><p class="hint" style="margin-top:8px">Delivery is added at checkout, based on your city.</p>';
    }
    function stepper() {
      return '<ol class="stepper" style="list-style:none;padding:0">' + steps.map(function (s, i) {
        var cls = i + 1 === step ? 'on' : i + 1 < step ? 'done' : '';
        return (i ? '<li class="bar" aria-hidden="true"></li>' : '') + '<li class="s ' + cls + '"' + (i + 1 === step ? ' aria-current="step"' : '') + '><span class="c">' + (i + 1 < step ? '✓' : i + 1) + '</span>' + s + '</li>';
      }).join('') + '</ol>';
    }
    function body() {
      var c = BF.priceCustom(d);
      if (step === 1) {
        var cat = BF.catalogFor(d.type);
        return '<h2>What would you like?</h2><div class="tiles">' + types.map(function (t) { return '<button class="tile' + (d.type === t.id ? ' on' : '') + '" data-type="' + t.id + '"><b>' + t.n + '</b><small>' + t.d + '</small></button>'; }).join('') + '</div>' +
          '<h2 style="margin-bottom:16px">' + (d.type === 'tree' ? 'Choose your tree' : d.type === 'jewellery' ? 'Choose your piece' : 'Choose your flowers') + '</h2>' +
          cat.map(function (it) {
            var q = d.items[it.id] || 0;
            return '<div class="item-row"><img src="' + BF.img(it.image) + '" alt=""><div class="t"><h4>' + E(it.name) + '</h4><small>' + F(it.price) + ' each</small></div>' +
              '<div class="stepbtn"><button data-m="' + it.id + '" aria-label="Fewer ' + E(it.name) + '">−</button><span>' + q + '</span><button class="plus" data-p="' + it.id + '" aria-label="More ' + E(it.name) + '">+</button></div></div>';
          }).join('') + (err ? '<p class="err" role="alert">' + err + '</p>' : '') + '<button class="btn" data-next style="margin-top:6px">Next: Colours &amp; beads</button>';
      }
      if (step === 2) {
        return '<h2>Pick your colours</h2><div class="swatches">' + pr.colours.map(function (cl) { return '<button class="sw' + (d.colours.indexOf(cl.name) > -1 ? ' on' : '') + '" data-col="' + E(cl.name) + '" aria-pressed="' + (d.colours.indexOf(cl.name) > -1) + '"><i style="background:' + E(cl.hex) + '"></i>' + E(cl.name) + '</button>'; }).join('') + '</div>' +
          '<p class="hint">' + (d.colours.length ? 'Selected: ' + E(d.colours.join(', ')) + '. ' : 'Choose at least one colour. ') + 'You can pick more than one. Colours are included in the price.</p>' +
          '<h2 style="margin:30px 0 4px">Bead type</h2><div class="tiles three">' + pr.beads.map(function (b) { return '<button class="tile' + (d.bead === b.id ? ' on' : '') + '" data-bead="' + b.id + '"><b>' + E(b.name) + '</b><small>' + (b.extra ? '+ PKR ' + b.extra + ' per ' + (d.type === 'jewellery' || d.type === 'tree' ? 'piece' : 'flower') : E(b.note)) + '</small></button>'; }).join('') + '</div>' +
          '<h2 style="margin-bottom:10px">Packaging or colour requests</h2><div class="field"><label for="pk">Anything to avoid or special packaging? (optional)</label><textarea id="pk" placeholder="e.g. neutral colours only for the wrapping">' + E(d.packaging) + '</textarea></div>' +
          (err ? '<p class="err" role="alert">' + err + '</p>' : '') + '<div class="row-actions"><button class="btn ghost" data-back>Back</button><button class="btn" data-next>Next: Inspiration &amp; delivery</button></div>';
      }
      if (step === 3) {
        var min = d.urgent ? addDays(5) : addDays(10);
        return '<h2>Upload an inspiration picture</h2><div class="drop" id="drop" tabindex="0" role="button" aria-label="Upload inspiration pictures"><div class="ico">⬆</div><b>Drag and drop a photo here, or click to upload</b><small>JPG or PNG. You can add more than one picture.</small><input type="file" id="file" accept="image/*" multiple hidden></div>' +
          '<div class="previews">' + d.photos.map(function (ph, i) { return '<div><img src="' + BF.img(ph) + '" alt="Inspiration ' + (i + 1) + '"><button data-rm="' + i + '" aria-label="Remove picture ' + (i + 1) + '">×</button></div>'; }).join('') + '</div>' +
          '<div class="field"><label for="nt">What should we add, remove or swap?</label><textarea id="nt" placeholder="e.g. match the colours to my dress photo">' + E(d.notes) + '</textarea></div>' +
          '<h2 style="margin:26px 0 12px">Delivery</h2><div class="field" style="max-width:280px;display:inline-block;vertical-align:top"><label for="nd">Needed by (date)</label><input type="date" id="nd" min="' + min + '" value="' + E(d.needed) + '"></div><span class="hint" style="margin-left:16px">Usually ready in ' + E(BF.settings().prep) + '</span>' +
          '<div style="margin:6px 0 24px"><label class="toggle" style="font-weight:400;font-size:15px"><input type="checkbox" id="urg" ' + (d.urgent ? 'checked' : '') + ' style="appearance:auto;width:18px;height:18px"> Urgent order (+ ' + F(pr.urgent) + ')</label></div>' +
          (err ? '<p class="err" role="alert">' + err + '</p>' : '') + '<div class="row-actions"><button class="btn ghost" data-back>Back</button><button class="btn" data-next>Next: Review</button></div>';
      }
      var tn = types.filter(function (t) { return t.id === d.type; })[0].n;
      return '<h2 style="margin-bottom:14px">Your design</h2><div class="review-table">' + [
        ['Type', tn], ['Items', summaryText()], ['Colours', d.colours.join(', ')], ['Beads', c.bead.name],
        ['Inspiration', d.photos.length ? d.photos.length + ' photo' + (d.photos.length > 1 ? 's' : '') + ' uploaded' : 'None'], ['Notes', d.notes || '–'],
        ['Needed by', d.needed ? fdate(d.needed, true) : 'Not specified'], ['Packaging request', d.packaging || '–']
      ].map(function (r) { return '<div class="r"><span>' + r[0] + '</span><span>' + E(r[1]) + '</span></div>'; }).join('') + '</div>' +
        '<p style="margin:16px 0"><button class="link-btn" data-edit>Edit design</button></p>' +
        '<div class="notice" style="margin-bottom:24px">ℹ️ &nbsp;The price is calculated automatically from the options you chose. Delivery is added at checkout, and you pay when you place the order.</div>' +
        '<div class="row-actions"><button class="btn ghost" data-back>Back</button><button class="btn" data-add>' + (editId ? 'Update cart' : 'Add to cart') + '</button></div>';
    }
    function draw(keepScroll) {
      var t = titleFor();
      $('#co-title').textContent = t[0]; $('#co-sub').textContent = t[1];
      area.innerHTML = stepper() + '<div class="cols" style="padding-bottom:0"><div id="form">' + body() + '</div><aside class="summary" id="price" aria-live="polite">' + priceBox() + '</aside></div>';
      if (!keepScroll) window.scrollTo({ top: 0 });
    }
    function drawPrice() { $('#price').innerHTML = priceBox(); }
    function capture() {
      var a = $('#pk'), b = $('#nt'), c = $('#nd'), u = $('#urg');
      if (a) d.packaging = a.value; if (b) d.notes = b.value; if (c) d.needed = c.value; if (u) d.urgent = u.checked;
    }
    function go(n) { capture(); step = n; err = ''; draw(); }
    function validate() {
      if (step === 1 && !BF.priceCustom(d).count) return 'Please choose at least one item to continue.';
      if (step === 2 && !d.colours.length) return 'Please choose at least one colour.';
      if (step === 3 && d.needed && d.needed < (d.urgent ? addDays(5) : addDays(10))) return 'Please pick a date that is ' + (d.urgent ? '5' : '10') + ' or more days from today, or leave it empty.';
      return '';
    }
    area.addEventListener('click', function (e) {
      if (e.target.id === 'file') return;
      var t = e.target.closest('button, .drop'); if (!t) return;
      var cat = BF.catalogFor(d.type);
      if (t.dataset.type) { d.type = t.dataset.type; d.items = {}; err = ''; draw(true); }
      else if (t.dataset.p) {
        var id = t.dataset.p;
        if (d.type === 'single') d.items = {};
        d.items[id] = Math.min(20, (d.items[id] || 0) + 1); if (d.type === 'single') d.items[id] = 1; err = ''; draw(true);
      }
      else if (t.dataset.m) { var k = t.dataset.m; d.items[k] = Math.max(0, (d.items[k] || 0) - 1); draw(true); }
      else if (t.dataset.col) { var i = d.colours.indexOf(t.dataset.col); if (i > -1) d.colours.splice(i, 1); else d.colours.push(t.dataset.col); err = ''; capture(); draw(true); }
      else if (t.dataset.bead) { capture(); d.bead = t.dataset.bead; draw(true); }
      else if (t.dataset.rm) { capture(); d.photos.splice(+t.dataset.rm, 1); draw(true); }
      else if (t.id === 'drop' || t.classList.contains('drop')) { $('#file').click(); }
      else if (t.hasAttribute('data-next')) { capture(); err = validate(); if (err) draw(true); else go(step + 1); }
      else if (t.hasAttribute('data-back')) go(step - 1);
      else if (t.hasAttribute('data-edit')) go(1);
      else if (t.hasAttribute('data-add')) {
        var c = BF.priceCustom(d), first = Object.keys(d.items).filter(function (k) { return d.items[k]; })[0];
        var it = BF.catalogFor(d.type).filter(function (x) { return x.id === first; })[0];
        var tn = types.filter(function (x) { return x.id === d.type; })[0].n;
        var item = { id: editId || BF.uid(), custom: { draft: JSON.parse(JSON.stringify(d)), packaging: d.packaging, notes: d.notes, needed: d.needed, photos: d.photos.slice() },
          name: 'Custom ' + (d.type === 'bouquet' ? 'bouquet' : d.type === 'single' ? 'flower' : d.type === 'tree' ? 'tree' : 'jewellery'), qty: 1, price: c.total, image: it ? it.image : 'assets/images/pastel-bouquet.png',
          meta: summaryText() + ' • ' + d.colours.join(', ') + ' • ' + c.bead.name + (d.needed ? ' • Needed by ' + fdate(d.needed) : '') };
        var cart = BF.cart();
        if (editId) cart = cart.map(function (x) { return x.id === editId ? item : x; }); else cart.push(item);
        BF.saveCart(cart); location.href = 'cart.html';
      }
    });
    area.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'drop') { e.preventDefault(); $('#file').click(); } });
    area.addEventListener('change', function (e) {
      if (e.target.id === 'file') addFiles(e.target.files);
      else if (e.target.id === 'urg') { capture(); draw(true); }
    });
    area.addEventListener('dragover', function (e) { var z = e.target.closest('.drop'); if (z) { e.preventDefault(); z.classList.add('over'); } });
    area.addEventListener('dragleave', function (e) { var z = e.target.closest('.drop'); if (z) z.classList.remove('over'); });
    area.addEventListener('drop', function (e) { var z = e.target.closest('.drop'); if (z) { e.preventDefault(); addFiles(e.dataTransfer.files); } });
    function addFiles(files) {
      capture();
      var list = Array.prototype.slice.call(files).slice(0, 4 - d.photos.length);
      Promise.all(list.map(function (f) { return BF.readImage(f, 700).catch(function (x) { BF.toast(x.message); return null; }); })).then(function (r) {
        r.forEach(function (x) { if (x) d.photos.push(x); }); draw(true);
      });
    }
    area.addEventListener('input', function (e) { if (e.target.id === 'nd') { d.needed = e.target.value; } });
    draw(true);
  };

  /* ---------------- Cart ---------------- */
  P.cart = function () {
    var box = $('#cart-items'), side = $('#cart-side');
    function draw() {
      var c = BF.cart(), n = BF.cartCount();
      $('#cart-count').textContent = n + (n === 1 ? ' item' : ' items');
      if (!c.length) {
        box.innerHTML = '<div class="card" style="text-align:center;padding:50px 20px"><h2>Your cart is empty</h2><p class="muted" style="margin:10px 0 22px">Browse the shop or design your own bouquet.</p><div class="row-actions" style="justify-content:center"><a class="btn" href="shop.html">Shop flowers</a><a class="btn ghost" href="custom-order.html">Design a custom order</a></div></div>';
      } else {
        box.innerHTML = c.map(function (i) {
          return '<div class="cart-item"><img src="' + BF.img(i.image) + '" alt=""><div class="info"><h3>' + E(i.name) + '</h3><div class="meta">' +
            (i.custom ? E(i.meta) : 'Ready-made • Ships in ' + E(BF.settings().prep.replace(' days', '')) + ' days' + (i.meta && i.meta !== 'Ready-made' ? ' • ' + E(i.meta) : '')) + '</div>' +
            (i.custom ? '<a class="link-btn" href="custom-order.html?edit=' + E(i.id) + '">Edit design</a> &nbsp; ' : '<div class="qty" style="margin-bottom:8px"><button data-id="' + E(i.id) + '" data-q="-1" aria-label="Less">−</button><span>' + i.qty + '</span><button data-id="' + E(i.id) + '" data-q="1" aria-label="More">+</button></div><br>') +
            '<button class="link-btn red" data-rm="' + E(i.id) + '">Remove</button></div><div class="pr">' + F(i.price * i.qty) + (i.custom ? '<div class="muted" style="font-weight:400;font-size:13px;margin-top:4px">Qty 1</div>' : '') + '</div></div>';
        }).join('') + '<a class="btn ghost" href="shop.html">Continue shopping</a>';
      }
      var t = BF.cartTotal();
      side.innerHTML = '<h3>Order summary</h3>' + sumLines([['Items (' + n + ')', F(t)], ['Delivery', 'Calculated at checkout']]) +
        '<div class="sline total"><span>Subtotal</span><span class="big">' + F(t) + '</span></div>' +
        '<a class="btn full' + (c.length ? '' : ' disabled') + '" id="go" style="margin-top:16px;' + (c.length ? '' : 'opacity:.5;pointer-events:none') + '" href="checkout.html">Proceed to checkout</a>' +
        '<p class="hint" style="margin-top:12px">You can pay a ' + BF.pricing().advance + '% advance or the full amount at the next step.</p>';
      BF.updateBadge();
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var c = BF.cart();
      if (b.dataset.rm) { c = c.filter(function (i) { return i.id !== b.dataset.rm; }); BF.saveCart(c); draw(); }
      else if (b.dataset.q) { c.forEach(function (i) { if (i.id === b.dataset.id) i.qty = Math.max(1, Math.min(10, i.qty + +b.dataset.q)); }); BF.saveCart(c); draw(); }
    });
    draw();
  };

  /* ---------------- Checkout ---------------- */
  P.checkout = function () {
    if (!BF.cart().length) { location.replace('cart.html'); return; }
    var u = BF.user(), saved = BF.sget('checkout', null), opts = BF.deliveryOptions();
    var cur = (saved && saved.delivery) || 'lahore', cu = (saved && saved.customer) || (u ? { name: u.name, phone: u.phone, email: u.email, address: u.address, city: u.city, postal: u.postal } : {});
    if (u) $('#acct-note').innerHTML = 'Signed in as <b>' + E(u.email) + '</b>. Your saved details are filled in below.';
    else $('#acct-note').innerHTML = 'Have an account? <a href="sign-in.html?next=checkout.html">Sign in</a> to use your saved details. Or continue as a guest.';
    ['name', 'phone', 'email', 'address', 'city', 'postal'].forEach(function (k) { var el = $('#f-' + k); if (el && cu[k]) el.value = cu[k]; });
    $('#areas').innerHTML = opts.map(function (o) {
      return '<label class="radio-card' + (o.id === cur ? ' on' : '') + '"><input type="radio" name="area" value="' + o.id + '"' + (o.id === cur ? ' checked' : '') + '><span><b>' + E(o.label) + '</b><small>' + (o.id === 'intl' ? E(o.note) : F(o.fee) + ' • ' + E(o.note)) + '</small></span></label>';
    }).join('');
    function sum() {
      var o = opts.filter(function (x) { return x.id === cur; })[0], items = BF.cartTotal();
      $('#sum').innerHTML = '<h3>Order summary</h3>' + BF.cart().map(function (i) { return '<div class="sitem"><img src="' + BF.img(i.image) + '" alt=""><div class="t">' + E(i.name) + '<small>Qty ' + i.qty + '</small></div><b style="font-weight:500">' + F(i.price * i.qty) + '</b></div>'; }).join('') +
        '<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:8px">' + sumLines([['Items', F(items)], ['Delivery (' + E(o.short) + ')', F(o.fee)]]) + '</div><div class="sline total"><span>Total</span><span class="big">' + F(items + o.fee) + '</span></div>';
    }
    $('#areas').addEventListener('change', function (e) { cur = e.target.value; $$('.radio-card', $('#areas')).forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); sum(); });
    $('#cform').addEventListener('submit', function (e) {
      e.preventDefault();
      var c = {}; ['name', 'phone', 'email', 'address', 'city', 'postal'].forEach(function (k) { c[k] = $('#f-' + k).value.trim(); });
      var er = $('#cerr');
      if (!c.name || !c.phone || !c.address || !c.city) return setNote(er, 'Please fill in your name, phone number, address and city.');
      if (!/^\S+@\S+\.\S+$/.test(c.email)) return setNote(er, 'Please enter a valid email so we can send order updates.');
      if (!/^[+\d][\d\s-]{6,}$/.test(c.phone)) return setNote(er, 'Please enter a valid phone number, like 0300 1234567.');
      BF.sset('checkout', { customer: c, delivery: cur }); location.href = 'payment.html';
    });
    sum();
  };

  /* ---------------- Payment ---------------- */
  P.payment = function () {
    var ck = BF.sget('checkout', null);
    if (!BF.cart().length || !ck) { location.replace(BF.cart().length ? 'checkout.html' : 'cart.html'); return; }
    var pr = BF.pricing(), s = BF.settings(), o = BF.deliveryOptions().filter(function (x) { return x.id === ck.delivery; })[0];
    var items = BF.cartTotal(), total = items + o.fee, adv = Math.round(total * pr.advance / 100);
    var plan = 'advance', method = 'Bank transfer', receipt = null;
    function opt(group, val, title, sub, on) { return '<label class="radio-card' + (on ? ' on' : '') + '"><input type="radio" name="' + group + '" value="' + val + '"' + (on ? ' checked' : '') + '><span><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span></label>'; }
    function draw() {
      $('#plans').innerHTML = opt('plan', 'advance', 'Pay ' + pr.advance + '% advance: ' + F(adv), 'Pay the remaining ' + F(total - adv) + ' before your order ships', plan === 'advance') + opt('plan', 'full', 'Pay in full: ' + F(total), '', plan === 'full');
      $('#methods').innerHTML = opt('method', 'Bank transfer', 'Bank transfer', 'Details shown below', method === 'Bank transfer') + opt('method', 'JazzCash / Easypaisa', 'JazzCash / Easypaisa', '', method === 'JazzCash / Easypaisa');
      $('#bank').innerHTML = '<span class="eyebrow">Send payment to</span>' + (method === 'Bank transfer'
        ? '<div class="r"><span>Account title</span><b>' + E(s.accountTitle) + '</b></div><div class="r"><span>Bank &amp; account no.</span><b>' + E(s.bank) + '</b></div>'
        : '<div class="r"><span>Account title</span><b>' + E(s.accountTitle) + '</b></div><div class="r"><span>Mobile number</span><b>' + E(s.wallet) + '</b></div>') + '<div class="r"><span>Amount to send</span><b>' + F(plan === 'full' ? total : adv) + '</b></div>';
    }
    $('#sum').innerHTML = '<h3>Order summary</h3>' + BF.cart().map(function (i) { return '<div class="sitem"><img src="' + BF.img(i.image) + '" alt=""><div class="t">' + E(i.name) + '<small>Qty ' + i.qty + '</small></div><b style="font-weight:500">' + F(i.price * i.qty) + '</b></div>'; }).join('') +
      '<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:8px">' + sumLines([['Items', F(items)], ['Delivery (' + E(o.short) + ')', F(o.fee)]]) + '</div><div class="sline total"><span>Total</span><span class="big">' + F(total) + '</span></div>';
    $('#plans').addEventListener('change', function (e) { plan = e.target.value; draw(); });
    $('#methods').addEventListener('change', function (e) { method = e.target.value; draw(); });
    var drop = $('#drop'), file = $('#file');
    function take(f) {
      BF.readImage(f, 900).then(function (r) { receipt = r; $('#rprev').innerHTML = '<div><img src="' + r + '" alt="Receipt preview"><button type="button" id="rrm" aria-label="Remove receipt">×</button></div>'; $('#rerr').classList.add('hidden'); })
        .catch(function (x) { setNote($('#rerr'), x.message); });
    }
    drop.addEventListener('click', function (e) { if (e.target !== file) file.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    file.addEventListener('change', function () { if (file.files[0]) take(file.files[0]); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) take(e.dataTransfer.files[0]); });
    $('#rprev').addEventListener('click', function (e) { if (e.target.id === 'rrm') { receipt = null; this.innerHTML = ''; file.value = ''; } });
    $('#place').addEventListener('click', function () {
      if (!receipt) return setNote($('#rerr'), 'Please upload a screenshot or photo of your payment receipt to place your order.');
      var paid = plan === 'full' ? total : adv, u = BF.user();
      var order = {
        id: BF.nextOrderId(), date: today(), userEmail: u ? u.email : '', customer: ck.customer,
        items: BF.cart().map(function (i) { return { name: i.name, meta: i.custom ? i.meta : (i.meta || 'Ready-made'), qty: i.qty, price: i.price, image: i.image, custom: i.custom ? { packaging: i.custom.packaging, notes: i.custom.notes, needed: i.custom.needed, photos: i.custom.photos } : null }; }),
        itemsTotal: items, delivery: { area: o.id, label: o.short, fee: o.fee }, total: total,
        payment: { plan: plan, method: method, paidNow: paid, balance: total - paid, receipt: receipt, status: 'receipt_uploaded', balanceStatus: total - paid ? 'due' : 'paid', balanceReceipt: null },
        status: 'new', tracking: '', notes: '', history: [{ d: today(), s: 'Order placed' }]
      };
      var l = BF.orders(); l.unshift(order);
      if (!BF.set('orders', l)) return;
      var t = BF.sget('track', []); t.push(order.id); BF.sset('track', t);
      BF.saveCart([]); sessionStorage.removeItem('bf_checkout');
      location.href = 'order-confirmed.html?id=' + order.id;
    });
    draw();
  };

  /* ---------------- Order confirmed ---------------- */
  P.confirmed = function () {
    var o = BF.order(BF.qs('id') || '');
    if (!o) { $('#conf').innerHTML = '<h1>We could not find that order</h1><p class="muted" style="margin:14px 0 22px">Use your order ID and email to look it up.</p><a class="btn" href="track-order.html">Track an order</a>'; return; }
    $('#oid').textContent = 'Order ID: ' + o.id;
    $('#oitems').innerHTML = o.items.map(function (i) { return '<div class="sitem"><img src="' + BF.img(i.image) + '" alt="" style="width:54px;height:54px"><div class="t"><b style="font-weight:500">' + E(i.name) + '</b><small>' + (i.meta === 'Ready-made' || !i.meta ? 'Qty ' + i.qty : E(i.meta)) + '</small></div><span>' + F(i.price * i.qty) + '</span></div>'; }).join('');
    $('#otot').innerHTML = '<div style="border-top:1px solid var(--line);margin-top:8px;padding-top:6px">' + sumLines([['Delivery (' + E(o.delivery.label) + ')', F(o.delivery.fee)]]) + '<div class="sline total" style="border:0;margin:0;padding-top:8px"><span>Total</span><span class="big">' + F(o.total) + '</span></div>' +
      sumLines([[o.payment.plan === 'full' ? 'Paid now (in full)' : 'Paid now (' + BF.pricing().advance + '% advance)', F(o.payment.paidNow)], ['Balance due before shipping', F(o.payment.balance)]]) + '</div>';
    $('#trk').href = 'order-status.html?id=' + o.id;
    var t = BF.sget('track', []); if (t.indexOf(o.id) < 0) { t.push(o.id); BF.sset('track', t); }
  };

  /* ---------------- Track order ---------------- */
  P.track = function () {
    $('#tform').addEventListener('submit', function (e) {
      e.preventDefault();
      var o = BF.order($('#t-id').value), em = $('#t-em').value.trim().toLowerCase();
      if (!o || o.customer.email.toLowerCase() !== em) return setNote($('#terr'), 'We could not find an order with that ID and email. Check both and try again.');
      var t = BF.sget('track', []); if (t.indexOf(o.id) < 0) t.push(o.id); BF.sset('track', t);
      location.href = 'order-status.html?id=' + o.id;
    });
  };

  /* ---------------- Order status ---------------- */
  P.status = function () {
    var o = BF.order(BF.qs('id') || ''), box = $('#st'), u = BF.user();
    var ok = o && ((u && o.userEmail && o.userEmail.toLowerCase() === u.email.toLowerCase()) || BF.sget('track', []).indexOf(o.id) > -1);
    if (!ok) { box.innerHTML = '<div class="card" style="max-width:520px"><h2>We need to check it is your order</h2><p class="muted" style="margin:10px 0 20px">Enter your order ID and email to see where your order is, or sign in to see all your orders.</p><div class="row-actions"><a class="btn" href="track-order.html">Track an order</a><a class="btn ghost" href="sign-in.html?next=my-orders.html">Sign in</a></div></div>'; $('#st-title').textContent = 'Order status'; return; }
    $('#st-title').textContent = 'Order ' + o.id; $('#st-sub').textContent = 'Placed on ' + fdate(o.date, true);
    $('#crumb-id').textContent = o.id;
    var st = o.status, pay = o.payment, rank = { new: 0, in_progress: 1, ready: 2, shipped: 3, delivered: 4 }[st];
    var steps = [
      { t: 'Order placed', s: fdate(o.date), c: 'done' },
      { t: pay.status === 'verified' ? 'Payment verified' : pay.status === 'rejected' ? 'Receipt could not be verified' : 'Payment check', s: pay.status === 'verified' ? '' : pay.status === 'rejected' ? 'Please contact us or place a new payment' : 'We are checking your receipt', c: pay.status === 'verified' ? 'done' : 'now' },
      { t: 'Being made', s: st === 'in_progress' ? 'In progress' : '', c: rank > 1 ? 'done' : st === 'in_progress' ? 'now' : '' },
      { t: 'Ready & packed', s: st === 'ready' ? 'Packed and waiting for courier' : '', c: rank > 2 ? 'done' : st === 'ready' ? 'now' : '' },
      { t: o.tracking ? 'Shipped' : 'Shipped (tracking no. will appear here)', s: o.tracking ? 'Tracking no. ' + o.tracking : '', c: rank > 3 ? 'done' : st === 'shipped' ? 'now' : '' },
      { t: 'Delivered', s: '', c: st === 'delivered' ? 'done' : '' }
    ];
    if (pay.status !== 'verified' && st !== 'new') steps[1].c = 'done';
    var bal = pay.balance, bs = pay.balanceStatus;
    var balBlock = bal <= 0 || bs === 'paid' ? '<p class="hint" style="margin-top:10px">Paid in full. Thank you!</p>' :
      bs === 'pending' ? '<p class="hint" style="margin-top:10px">We have your balance receipt and will verify it shortly.</p>' :
      '<button class="btn full" id="paybal" style="margin-top:14px">Pay balance</button><p class="hint" style="margin-top:12px">Pay the balance before your order ships.</p>';
    var paidNow = pay.balanceStatus === 'paid' ? o.total : pay.paidNow, balance = pay.balanceStatus === 'paid' ? 0 : bal;
    box.innerHTML = '<div class="cols" style="grid-template-columns:1fr 380px"><div>' +
      '<div class="card" style="margin-bottom:24px"><h3 style="font-size:32px">Order progress</h3><ol class="timeline">' + steps.map(function (s) { return '<li class="' + s.c + '"><span class="dot">' + (s.c === 'done' ? '✓' : '') + '</span><span><b>' + E(s.t) + '</b>' + (s.s ? '<small>' + E(s.s) + '</small>' : '') + '</span></li>'; }).join('') + '</ol></div>' +
      '<div class="card"><h3 style="font-size:32px;margin-bottom:12px">Items in this order</h3>' + o.items.map(function (i) { return '<div class="sitem"><img src="' + BF.img(i.image) + '" alt="" style="width:50px;height:50px"><div class="t"><b style="font-weight:500">' + E(i.name) + '</b><small>' + (i.meta === 'Ready-made' || !i.meta ? 'Qty ' + i.qty : E(i.meta)) + '</small></div><span style="font-size:14px">' + F(i.price * i.qty) + '</span></div>'; }).join('') + '</div></div>' +
      '<div><div class="card" style="margin-bottom:24px;padding:24px"><h3 style="font-size:30px;margin-bottom:8px">Balance to pay</h3>' + sumLines([['Total', F(o.total)], ['Paid (' + (pay.plan === 'full' ? 'in full' : BF.pricing().advance + '% advance') + ')', F(paidNow)]]) +
      '<div class="sline total"><span>Balance</span><span class="big">' + F(balance) + '</span></div>' + balBlock + '<div id="balpanel" class="hidden" style="margin-top:16px"></div></div>' +
      '<div class="card" style="padding:24px"><h3 style="font-size:30px;margin-bottom:8px">Delivering to</h3><p class="muted" style="font-size:14px">' + E(o.customer.address) + ', ' + E(o.customer.city) + '. ' + E(o.delivery.label) + (o.delivery.area === 'lahore' ? ', 1–2 days after ready.' : o.delivery.area === 'other' ? ', 3–5 days after ready.' : '.') + '</p></div></div></div>';
    var pb = $('#paybal');
    if (pb) pb.addEventListener('click', function () {
      var s = BF.settings(), panel = $('#balpanel'); panel.classList.remove('hidden'); pb.classList.add('hidden');
      panel.innerHTML = '<div class="bank" style="margin:0 0 14px"><span class="eyebrow">Send ' + F(bal) + ' to</span><div class="r"><span>Account title</span><b>' + E(s.accountTitle) + '</b></div><div class="r"><span>Bank &amp; account no.</span><b>' + E(s.bank) + '</b></div><div class="r"><span>JazzCash / Easypaisa</span><b>' + E(s.wallet) + '</b></div></div>' +
        '<div class="field"><label for="balfile">Upload your receipt</label><input type="file" id="balfile" accept="image/*"></div><p class="err hidden" id="balerr" role="alert"></p><button class="btn full" id="balsend">Send receipt</button>';
      $('#balsend').addEventListener('click', function () {
        var f = $('#balfile').files[0]; if (!f) return setNote($('#balerr'), 'Please choose your receipt image.');
        BF.readImage(f, 900).then(function (r) {
          var cur = BF.order(o.id); cur.payment.balanceReceipt = r; cur.payment.balanceStatus = 'pending'; cur.history.push({ d: today(), s: 'Balance receipt uploaded' }); BF.saveOrder(cur);
          BF.toast('Receipt sent. We will verify it shortly.'); P.status();
        }).catch(function (x) { setNote($('#balerr'), x.message); });
      });
    });
  };

  /* ---------------- Auth ---------------- */
  P.signin = function () {
    var next = BF.qs('next') || 'my-orders.html';
    if (BF.user()) { location.replace(next); return; }
    $('#sform').addEventListener('submit', function (e) {
      e.preventDefault();
      if (BF.adminLogin($('#s-em').value, $('#s-pw').value)) { location.href = 'admin/dashboard.html'; return; }
      var u = BF.signIn($('#s-em').value, $('#s-pw').value);
      if (!u) return setNote($('#serr'), 'That email and password do not match. Check them and try again.');
      location.href = next;
    });
    $('#forgot').addEventListener('click', function (e) { e.preventDefault(); BF.toast('Password reset is not enabled in this prototype. Use the demo account below.'); });
    var l = $('#to-create'); if (l) l.href = 'create-account.html?next=' + encodeURIComponent(next);
  };
  P.signup = function () {
    var next = BF.qs('next') || 'my-orders.html';
    $('#cform').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = { name: $('#c-n').value.trim(), email: $('#c-e').value.trim(), phone: $('#c-p').value.trim(), password: $('#c-pw').value }, er = $('#cerr');
      if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email) || !d.phone) return setNote(er, 'Please enter your name, a valid email and your phone number.');
      if (d.password.length < 8) return setNote(er, 'Your password needs at least 8 characters.');
      var r = BF.register(d); if (r.error) return setNote(er, r.error);
      location.href = next;
    });
  };
  function acctGuard() { if (!BF.user()) { location.replace('sign-in.html?next=' + encodeURIComponent(location.pathname.split('/').pop())); return false; } return true; }
  function acctSide(active) {
    $('#side').innerHTML = '<h3>My account</h3><a href="my-orders.html"' + (active === 'orders' ? ' class="on"' : '') + '>My orders</a><a href="profile.html"' + (active === 'profile' ? ' class="on"' : '') + '>Profile &amp; addresses</a><a href="#" id="so">Sign out</a>';
    $('#so').addEventListener('click', function (e) { e.preventDefault(); BF.signOut(); location.href = 'index.html'; });
  }
  P.orders = function () {
    if (!acctGuard()) return; acctSide('orders');
    var u = BF.user(), l = BF.orders().filter(function (o) { return o.userEmail && o.userEmail.toLowerCase() === u.email.toLowerCase(); });
    $('#olist').innerHTML = l.length ? l.map(function (o) {
      return '<div class="order-row"><img src="' + BF.img(o.items[0].image) + '" alt=""><div class="i"><h3>' + E(o.id) + '</h3><div class="muted" style="font-size:14px">' + fdate(o.date, true) + ' • ' + F(o.total) + '</div><span class="tag" style="margin-top:6px">' + E(BF.customerStatusLabel(o)) + '</span></div><a class="btn ghost" href="order-status.html?id=' + o.id + '">' + (o.status === 'delivered' ? 'View order' : 'Track order') + '</a></div>';
    }).join('') : '<div class="card"><p class="muted" style="margin-bottom:16px">You have not placed an order yet.</p><a class="btn" href="shop.html">Shop flowers</a></div>';
  };
  P.profile = function () {
    if (!acctGuard()) return; acctSide('profile');
    var u = BF.user();
    ['name', 'phone', 'email', 'address', 'city', 'postal'].forEach(function (k) { $('#p-' + k).value = u[k] || ''; });
    $('#pform').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {}; ['name', 'phone', 'email', 'address', 'city', 'postal'].forEach(function (k) { d[k] = $('#p-' + k).value.trim(); });
      if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email)) return setNote($('#perr'), 'Please enter your name and a valid email.');
      var users = BF.users();
      if (d.email.toLowerCase() !== u.email.toLowerCase() && users.some(function (x) { return x.email.toLowerCase() === d.email.toLowerCase(); })) return setNote($('#perr'), 'That email is already used by another account.');
      var old = u.email;
      users = users.map(function (x) { return x.email === old ? Object.assign({}, x, d) : x; }); BF.set('users', users); BF.set('session', d.email);
      if (old !== d.email) BF.set('orders', BF.orders().map(function (o) { if (o.userEmail === old) o.userEmail = d.email; return o; }));
      $('#perr').classList.add('hidden'); BF.toast('Your details have been saved.');
    });
  };

  var run = P[document.body.dataset.page];
  if (run) run();
})();
