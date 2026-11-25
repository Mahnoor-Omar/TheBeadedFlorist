/* Navbar + footer shared by every storefront page */
(function () {
  var R = BF.ROOT, page = document.body.dataset.page || '';
  var links = [
    ['index.html', 'Home', 'home'], ['shop.html', 'Shop', 'shop'], ['custom-order.html', 'Custom Order', 'custom'],
    ['reviews.html', 'Reviews', 'reviews'], ['care-craft.html', 'Care & Craft', 'care'], ['about.html', 'About', 'about'],
    ['track-order.html', 'Track Order', 'track']
  ];
  var u = BF.user();
  var nav = document.getElementById('nav');
  if (nav) {
    nav.outerHTML =
      '<header class="nav"><div class="wrap">' +
      '<a class="brand" href="' + R + 'index.html"><img src="' + R + 'assets/images/logo.png" alt=""><span>The Beaded Florist</span></a>' +
      '<nav class="nav-links" id="navlinks" aria-label="Main">' +
      links.map(function (l) { return '<a href="' + R + l[0] + '"' + (page === l[2] || (page === 'product' && l[2] === 'shop') ? ' class="active" aria-current="page"' : '') + '>' + l[1].replace('&', '&amp;') + '</a>'; }).join('') +
      '</nav><div class="nav-right">' +
      (u ? '<a class="btn ghost" href="' + R + 'my-orders.html">My account</a>' : '<a class="btn ghost" href="' + R + 'sign-in.html">Sign in</a>') +
      '<a class="btn" href="' + R + 'cart.html" aria-label="Cart">Cart <span class="badge-count" data-cart-count>0</span></a>' +
      '<button class="menu-btn" aria-label="Menu" aria-expanded="false" id="menubtn">☰</button>' +
      '</div></div></header>';
    document.getElementById('menubtn').addEventListener('click', function () {
      var o = document.getElementById('navlinks').classList.toggle('open'); this.setAttribute('aria-expanded', o);
    });
  }
  var f = document.getElementById('footer');
  if (f) {
    var s = BF.settings();
    f.outerHTML =
      '<footer class="footer"><div class="wrap"><div><div class="brand-f">' + BF.esc(s.shopName) + '</div>' +
      '<p class="tagline">Handcrafted flowers • Made to last</p></div>' +
      '<div class="cols4">' +
      '<div><h5>EXPLORE</h5><a href="' + R + 'shop.html">Shop</a><a href="' + R + 'custom-order.html">Custom Order</a><a href="' + R + 'reviews.html">Reviews</a><a href="' + R + 'track-order.html">Track Order</a></div>' +
      '<div><h5>LEARN</h5><a href="' + R + 'care-craft.html">Care &amp; Craft</a><a href="' + R + 'about.html">About</a></div>' +
      '<div><h5>ACCOUNT</h5><a href="' + R + (u ? 'my-orders.html">My account' : 'sign-in.html">Sign in') + '</a><a href="' + R + 'my-orders.html">My orders</a></div>' +
      '<div><h5>CONTACT</h5><a href="' + R + 'about.html#contact">Contact us</a><ul><li>' + BF.esc(s.city) + '</li></ul></div>' +
      '</div><p class="copy">© 2026 The Beaded Florist – HCI project prototype, Kinnaird College for Women University · <a style="display:inline" href="' + R + 'admin/login.html">Owner login</a></p></div></footer>';
  }
  BF.updateBadge();
})();
