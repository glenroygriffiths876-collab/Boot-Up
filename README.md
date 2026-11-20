# ⚡ BOOT-UP CAFÉ

Poster-inspired, mobile-first digital menu and WhatsApp ordering application for Boot-Up Café in Jamaica.

**Repository:** https://github.com/glenroygriffiths876-collab/Boot-Up

## What works now

- Responsive neon-pink/navy menu inspired by the supplied REBOOT poster, rebranded **BOOT-UP CAFÉ**.
- Wings, wraps, sides, four original blended juices and four combos. Natural bottled juice flavours (Mango, Cucumber, Guava, Beet, Plum; sweetened with agave) are displayed separately until prices are confirmed.
- Corrected price list: regular blended juices **J$350 small / J$550 large**; milk-based drinks **J$850 small / J$1,150 large**.
- Ingredient removal requests, wing flavours, juice sizes, preparation notes, combo side/wrap choices.
- Multi-item cart with quantity changes, edit, removal, fixed combo prices and local persistence.
- Name, phone, active allergy declaration and optional detailed allergy notes at checkout.
- Readable, price-accurate WhatsApp order request addressed to **+1 876 304 0394**.
- Branded QR ordering sign generated for the website's actual current URL, with a print view.
- Responsive app icon, web app manifest and a lightweight offline shell.
- Automated Node menu tests and GitHub Pages deployment workflow.

### Important: an order is only a REQUEST

This static app **does not send a WhatsApp message automatically**. On checkout it opens the WhatsApp composer with a filled-in summary. **The customer must press Send inside WhatsApp.** The café must then accept the order, confirm stock, assess allergy requests, confirm collection time and verify payment.

A **draft reference** is generated on the customer device. It is not a centrally registered order number and should not be treated as proof of payment or order acceptance.

### Payment receipts

Checkout offers cash on delivery/collection or bank transfer. Transfer customers see the café-provided bank details and must select a receipt (image or PDF, up to 10 MB) before review. The receipt remains in memory on the device, never uploaded to GitHub Pages or localStorage. Where supported, the device share sheet can share the order and receipt; customers must select WhatsApp and the café recipient, check both are present and tap Send. Otherwise the direct café chat opens with the order text and customers attach the receipt manually. Staff verify payment separately. No delivery availability or fees are assumed.


### Unconfirmed menu information

- Milk-based blended drinks: prices are visible, but flavours are not supplied. Ordering is disabled until the owner configures each flavour.
- Two wrap-and-juice combos: the included **Sunrise Energy** drink size is unspecified. Checkout explicitly labels it **To be confirmed by café**.
- Added ingredients: no additional prices have been supplied. All additions are requests needing confirmation.
- **Friday pre-orders only**: checkout requires a future Friday in Jamaica local time, with no same-day booking. Preferred collection time is optional and always subject to café confirmation. Delivery, physical address and business opening hours remain unconfirmed.

## Launch on GitHub Pages

1. Open [repository Settings → Pages](https://github.com/glenroygriffiths876-collab/Boot-Up/settings/pages).
2. Under **Build and deployment**, select **GitHub Actions** as the source if it is not already selected.
3. Open the repository's **Actions** tab and run **Test and publish Boot-Up Café** (or push any commit to `main`).
4. When deployment succeeds, visit **https://glenroygriffiths876-collab.github.io/Boot-Up/**.
5. Open the live site and generate the **final QR code** from the deployed site—not from a localhost or preview URL.
6. Test a real order message on the café's WhatsApp account before using the QR sign publicly.

The above URL is the **expected GitHub Pages address**, not a verified deployed URL until the Pages deployment workflow completes.

## Run locally

This is a dependency-free, standards-based HTML/CSS/JavaScript site.

```bash
npm run check
python3 -m http.server 8080
```

Open **http://localhost:8080**.

JavaScript imports require a local HTTP server rather than opening the HTML file with a `file://` URL.

## Editing menu details

- `catalog.js` — menu items, prices, flavours, combo rules and public settings.
- `schedule.js` — Jamaica-local Friday-only booking date validation and formatting.
- `main.js` — interactive ordering, WhatsApp message, checkout and QR handling.
- `styles.css` — poster-inspired responsive branding.
- `assets/bootup-icon.svg` — logo and app icon.
- `.github/workflows/deploy.yml` — validation and publishing.
- `tests/catalog.test.js` — price and cart checks.

To update the public WhatsApp number, edit `BUSINESS.whatsapp` in `catalog.js` using full country code without `+`, spaces or dashes.

Current number: `18763040394`.

All prices are stored as integer Jamaican dollars. Keep combo totals fixed unless the business confirms changes.

Illustrative corn and milkshake-cup photographs are externally hosted, with existing local image fallbacks; all other product media remains locally hosted. The buttered corn is by [freefoodphotos.com](https://www.freefoodphotos.com/imagelibrary/vegetables/slides/buttery_sweet_corn.html) under CC BY 3.0 and the takeaway-cup milkshake photograph is by [Meraj Kazi on Pexels](https://www.pexels.com/photo/strawberry-shake-in-disposable-plastic-cap-11299731/). These are illustrative images and are not photographs of the café's own products. External images need internet access and fall back to previous local versions when unreachable. Photo failure falls back to distinctive illustrated category icons. The QR image is generated by `api.qrserver.com` and requires internet access. No personal order details are sent to the QR service.

## Security and privacy

- Cart details are stored only in this browser's localStorage.
- Customer names, telephone numbers and allergy declarations are **not** written to localStorage or uploaded to GitHub Pages.
- Sensitive order details become visible to WhatsApp / Meta once the customer sends the message.
- Café-provided payment instructions are public; customer receipts are not retained by this static site.
- Never put backend service-role tokens, customer records or payment receipts in this public repository.
- Configure an authenticated backend and lawful retention/deletion policies before enabling a central order system.

## Testing checklist

Run `npm run check` with Node 20+ and test the site manually at widths 320, 375, 430, 768, 1024 and 1440 px. Check category filters, item customization, edits, cart totals, allergen validation, WhatsApp composer content, keyboard navigation and QR scan/print from the deployed URL.

The customer must always see a clear difference between **draft**, **sent by them on WhatsApp**, and **confirmed by the café**.

---

Built for **BOOT-UP CAFÉ** — *Fuel your day with flavor!*

## Food photography upgrade — November 2026

The product-photo experience now uses **15 optimized, locally hosted WebP food images**, based on original visual assets created for this project. The chickpea wrap, ackee wrap, fried plantain, wings, drinks and combos now use photographic/composite food art instead of emoji placeholders. The corn-on-the-cob card uses a free-to-use Unsplash food photograph by [Tim Mossholder](https://unsplash.com/photos/grilled-corn-on-the-cob-on-a-grill-wK5yQGZmK8U).

These assets are **illustrative product concepts, not photographs of Boot-Up's actual prepared meals**. Confirm food presentation and ingredients with the business before marketing them as representative of actual servings.

The source code keeps all product IDs, prices, checkout logic and WhatsApp number unchanged. The service-worker cache version was advanced to v3 so installed users can receive the updated images.

## Owner feedback update — 20 November 2026

- The corn product card now shows a buttery, golden cob rather than the previously dark roasted example (licensed photo with local fallback).
- The milk-based preview shows a takeaway cup and straw, not a bottle; its flavours remain unconfirmed so the existing order restriction is retained.
- Natural **bottled** juices are listed as a distinct group: **mango, cucumber, guava, beet, plum**, all **sweetened with agave**. They cannot be added to the priced cart until the café confirms pricing; no price was invented.
- The ordering flow now uses a date input with next Friday as its earliest selectable date, a seven-day interval, explicit Jamaica-time validation of Friday-only advance ordering, and an optional preferred pickup time. The WhatsApp draft identifies the selected Friday and optional time as requests that staff must confirm.
- The updated service-worker cache invalidates the previous mobile shell. Tested rules are in `tests/schedule.test.js`.
