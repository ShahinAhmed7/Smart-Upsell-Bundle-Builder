(function () {
  var mount = document.getElementById("smart-upsell-widget");
  if (!mount || mount.dataset.smartUpsellReady === "true") return;
  mount.dataset.smartUpsellReady = "true";

  var shop = mount.dataset.shop || "";
  var productId = mount.dataset.productId || "";
  var productTitle = mount.dataset.productTitle || "";
  var productPrice = parseFloat(mount.dataset.productPrice || "0");
  var productImage = mount.dataset.productImage || "";

  var config = null;
  var allProducts = [];
  var selectedFBT = [];

  function loadConfig() {
    var url =
      "https://smart-upsell-bundle-builder-production.up.railway.app/api/settings-public?shop=" +
      encodeURIComponent(shop) +
      "&productId=" +
      encodeURIComponent(productId);

    return fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        config = data;
        if (data && data.settings) {
          mount.style.setProperty("--su-primary", data.settings.primaryColor || "#008060");
        }
        render();
      })
      .catch(function (err) {
        console.error("SmartUpsell: failed to load config", err);
      });
  }

  function money(cents) {
    var v = (Number(cents) / 100).toFixed(2);
    var fmt = window.Shopify && Shopify.money_format ? Shopify.money_format : "${{amount}}";
    return fmt.replace(/\{\{\s*amount\s*\}\}/g, v);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderFBT() {
    if (!config || !config.settings.enableFBT) return "";
    var items = (config.fbt && config.fbt.relatedProducts) || [];
    if (!items.length) return "";

    var html = '<div class="smart-upsell-widget">';
    html += '<h3 class="smart-upsell-widget__title">' + escapeHtml(config.settings.fbtTitle || "Frequently Bought Together") + "</h3>";
    html += '<div class="smart-upsell-widget__products">';

    items.slice(0, config.settings.fbtMaxProducts || 4).forEach(function (item) {
      var p = item.product || item;
      html +=
        '<div class="smart-upsell-widget__product" data-product-id="' +
        escapeHtml(p.id) +
        '" data-product-handle="' +
        escapeHtml(p.handle || "") +
        '">';
      if (p.featuredImage || p.image) {
        html += '<img class="smart-upsell-widget__product-image" src="' + escapeHtml(p.featuredImage || p.image) + '" alt="">';
      }
      html += '<p class="smart-upsell-widget__product-title">' + escapeHtml(p.title || "") + "</p>";
      if (p.priceRangeV2 || p.price) {
        var price = p.priceRangeV2 ? p.priceRangeV2.minVariantPrice.amount : p.price;
        html += '<span class="smart-upsell-widget__product-price">' + money(price * 100) + "</span>";
      }
      html += "</div>";
    });

    html += "</div>";
    html += '<button type="button" class="smart-upsell-widget__button" id="smart-upsell-fbt-btn">Add selected to cart</button>';
    html += "</div>";
    return html;
  }

  function renderBundles() {
    if (!config || !config.settings.enableBundles) return "";
    var bundles = (config.bundles || []).filter(function (b) {
      return b.type === "fixed" || b.type === "custom";
    });
    if (!bundles.length) return "";

    var html = '<div class="smart-upsell-widget">';
    html += '<h3 class="smart-upsell-widget__title">' + escapeHtml(config.settings.bundleTitle || "Bundles") + "</h3>";

    bundles.slice(0, 3).forEach(function (bundle) {
      var savings = bundle.discountValue || 0;
      html +=
        '<div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e1e3e5; border-radius: 8px;">';
      html += '<strong>' + escapeHtml(bundle.name) + "</strong>";
      if (savings > 0) {
        html += '<span class="smart-upsell-widget__savings">Save ' + savings + "%</span>";
      }
      if (bundle.description) {
        html += '<p style="font-size: 13px; color: #5c5f62; margin: 4px 0 0;">' + escapeHtml(bundle.description) + "</p>";
      }
      html += '<button type="button" class="smart-upsell-widget__button" data-bundle-id="' + bundle.id + '" style="margin-top: 8px;">View bundle</button>';
      html += "</div>";
    });

    html += "</div>";
    return html;
  }

  function renderVolumeDiscount() {
    if (!config || !config.settings.enableVolume) return "";
    var discounts = config.discounts || [];
    if (!discounts.length) return "";

    var discount = discounts[0];
    var tiers = discount.tiers || [];
    if (!tiers.length) return "";

    var currentQty = 1;
    var nextTier = null;
    for (var i = 0; i < tiers.length; i++) {
      if (currentQty < tiers[i].quantity) {
        nextTier = tiers[i];
        break;
      }
    }

    if (!nextTier) return "";

    var remaining = nextTier.quantity - currentQty;
    var progress = (currentQty / nextTier.quantity) * 100;

    var html = '<div class="smart-upsell-widget__volume">';
    html += '<p class="smart-upsell-widget__progress-text">';
    html +=
      "Add " +
      remaining +
      " more to get " +
      nextTier.discount +
      "% off!";
    html += "</p>";
    html += '<div class="smart-upsell-widget__progress"><div class="smart-upsell-widget__progress-bar" style="width: ' + progress + '%"></div></div>';
    html += "</div>";
    return html;
  }

  function render() {
    if (!config) return;
    var html = "";
    html += renderFBT();
    html += renderVolumeDiscount();
    html += renderBundles();

    if (!html) {
      mount.hidden = true;
      return;
    }

    mount.hidden = false;
    mount.innerHTML = html;

    // Bind FBT click events
    var fbtProducts = mount.querySelectorAll(".smart-upsell-widget__product");
    fbtProducts.forEach(function (el) {
      el.addEventListener("click", function () {
        el.classList.toggle("is-selected");
        var id = el.dataset.productId;
        if (selectedFBT.indexOf(id) > -1) {
          selectedFBT = selectedFBT.filter(function (x) { return x !== id; });
        } else {
          selectedFBT.push(id);
        }
      });
    });

    var fbtBtn = document.getElementById("smart-upsell-fbt-btn");
    if (fbtBtn) {
      fbtBtn.addEventListener("click", function () {
        if (!selectedFBT.length) {
          alert("Please select at least one product.");
          return;
        }
        // Redirect to cart with line items
        var params = selectedFBT.map(function (id) { return "id[]=" + encodeURIComponent(id); }).join("&");
        var qty = "?quantity=1&" + params;
        window.location.href = "/cart/add" + qty;
      });
    }
  }

  loadConfig();
})();
