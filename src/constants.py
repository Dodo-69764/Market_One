"""
Central place to store per‑site CSS selectors so maintenance is trivial.
Extend/modify whenever a site’s HTML changes.
"""

SELECTORS = {
    "daraz.pk": {
        "card":  'div[data-qa-locator="product-item"], div.gridItem--Yd0sa',
        "name":  'div.title--wFj93 a, img[alt]',
        "price": 'span.currency-value, div.price--NVB62',
    },
    "aliexpress.com": {
        "card":  'div.manhattan--container',
        "name":  'a[data-e2e="product-name"]',
        "price": 'div.manhattan--price-sale',
    },
    "temu.com": {
        "card":  'div[data-testid="search-card"]',
        "name":  'div[data-test="product-title"]',
        "price": 'span[data-test="product-price"]',
    },
}
