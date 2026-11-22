import { BUSINESS, CATEGORIES, PRODUCTS, COMBOS, ALL_ITEMS, WING_FLAVOURS, SIDES, WRAPS, money, priceFor, calculateTotal, PAYMENT, receiptError } from './catalog.js?v=9';
import { todayInJamaica, nextFridayAfter, isFridayPreorder, formatFriday, formatPreferredTime } from './schedule.js?v=9';

const $ = selector => document.querySelector(selector);
const html = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const CART_KEY = 'bootup_cart_v1';
const findItem = id => ALL_ITEMS.find(p => p.id === id);
const getQty = n => Math.min(30, Math.max(1, Number.parseInt(n,10) || 1));
const safeRead = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(x => x && findItem(x.id) && findItem(x.id).available !== false && Number.isFinite(Number(x.quantity))).map(x => ({
      id:x.id, quantity:getQty(x.quantity), options:typeof x.options === 'object' && x.options && !Array.isArray(x.options) ? x.options : {}
    })).slice(0,40) : [];
  } catch { return []; }
};
let cart = safeRead();
let filter = 'all';
let activeProductId = null;
let editingIndex = -1;
let previewMessage = '';
let checkoutDraft = null;
let receiptFile = null;
let draftRef = '';
let toastTimer;
let focusReturn = null;

function persist() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* private browsing / quota */ }
  updateCartBadge();
}
function updateCartBadge() {
  const count = cart.reduce((sum,x)=>sum+x.quantity,0);
  $('#cart-count').textContent = String(count);
  const items=String(count)+(count===1?' item':' items');
  const total=money(calculateTotal(cart));
  // Retain compatibility with older cached HTML during service-worker updates.
  if($('#mobile-cart-items') && $('#mobile-cart-total')){
    $('#mobile-cart-items').textContent=items;
    $('#mobile-cart-total').textContent=total;
  }else $('#mobile-cart-summary').textContent=items+' · '+total;
  $('#mobile-cart').setAttribute('aria-label','Open cart, '+items+', '+total);
}
const icons = {
  bag:'<path d="M4 7h16l1 14H3L4 7Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
  bank:'<path d="m3 9 9-5 9 5H3Zm2 11h14M7 10v7m5-7v7m5-7v7"/>',
  clip:'<path d="m8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9"/>',
  chat:'<path d="M21 11.5a9 9 0 0 1-9 9 9 9 0 0 1-4-.9L3 21l1.4-5a9 9 0 1 1 16.6-4.5Z"/><path d="M8 12h8"/>',
  edit:'<path d="m14 5 5 5M4 20l4-1 12-12-4-4L4 15l0 5Z"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>'
};
const uiIcon = name => `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]||''}</svg>`;
const categoryPhotos={all:'wings5',wings:'wings10',wraps:'wrap-chicken',sides:'corn',juices:'sunrise',milk:'milk-unconfigured',bottled:'bottled-juices'};
const itemPhoto = item => {
  if(!item?.image) return '';
  // A composition of separate actual menu assets keeps the bottle consistent in both wrap combos.
  if(item.includesSunrise){
    const wings=findItem(item.wings===10?'wings10':'wings5');
    const wrap=findItem(item.wings===10?'wrap-chicken':'wrap-chickpea');
    const juice=findItem('sunrise');
    return `<div class="meal-photo-composition" aria-hidden="true">${[wings,wrap,juice].map(x=>`<img src="${html(x.image)}" alt="" loading="lazy" decoding="async" />`).join('')}</div>`;
  }
  return `<img src="${html(item.image)}" alt="" loading="lazy" decoding="async" ${item.fallbackImage ? `onerror="this.onerror=null;this.src='${html(item.fallbackImage)}'"` : ''} />`;
};
function imageMarkup(p, className='product-visual') {
  return `<div class="${className} accent-${html(p.accent || 'pink')}${p.category==='juices'||p.category==='milk'||p.category==='bottled'||p.id==='corn'?' photo-full':''}">${itemPhoto(p)}</div>`;
}
function renderCategories() {
  $('#category-tabs').innerHTML = CATEGORIES.map(cat=>`<button class="filter-chip ${cat.id===filter?'active':''}" data-filter="${cat.id}" type="button" aria-pressed="${cat.id===filter}"><span class="filter-photo" aria-hidden="true">${itemPhoto(findItem(categoryPhotos[cat.id]))}</span><span class="filter-label">${html(cat.title)}</span></button>`).join('');
}
function renderProducts() {
  const shown = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p=>p.category===filter);
  $('#product-grid').innerHTML = shown.map(p=>`<article class="product-card" tabindex="${p.available===false?'-1':'0'}" role="${p.available===false?'group':'button'}" data-open="${html(p.id)}" aria-label="${html(p.name)} — ${p.price==null?'Price to be confirmed':money(p.price)}">
      ${imageMarkup(p)}
      ${p.featured?'<span class="product-tag">FAN FAVOURITE</span>':''}
      <div class="product-body"><span class="product-category">${html(CATEGORIES.find(c=>c.id===p.category)?.title || '')}</span><h3 class="product-title">${html(p.name)}</h3>
      <p class="product-description">${html(p.description)}</p>
      <div class="product-bottom"><span class="product-price">${p.sizes ? `<small>From</small>` : ''}${p.price==null?'<small>Price pending</small>':money(p.price)}</span>
      <button type="button" class="add-button" data-open="${html(p.id)}" ${p.available===false?'disabled':''}>${p.available===false?(p.id==='bottled-juices'?'Price pending':'Coming soon'):'Customise +'}</button></div></div></article>`).join('');
}
function renderCombos() {
  $('#combo-grid').innerHTML = COMBOS.map((p,i)=>`<article class="combo-card"><span class="combo-no">POWER COMBO 0${i+1}</span>
  <h3 class="combo-name">${html(p.name)}</h3><div class="combo-photo">${itemPhoto(p)}</div>
  <div class="combo-bottom"><span class="combo-price">${money(p.price)}</span><button type="button" data-open="${p.id}">Build combo +</button></div></article>`).join('');
}
function showToast(message) {
  const el = $('#toast'); clearTimeout(toastTimer); el.textContent=message; el.classList.add('visible');
  toastTimer=setTimeout(()=>el.classList.remove('visible'),2800);
}
// Use the visible viewport when the mobile keyboard or browser chrome changes height.
function syncDialogViewport(){
  const root=$('#dialog-root'),viewport=window.visualViewport;
  if(!root)return;
  if(viewport && window.matchMedia('(max-width: 750px)').matches && Math.abs(viewport.scale-1)<0.01){
    root.style.setProperty('--visible-height',Math.round(viewport.height)+'px');
    root.style.setProperty('--visible-top',Math.round(viewport.offsetTop)+'px');
    root.classList.toggle('compact-viewport',viewport.height<460);
    // A class assignment when opening a dialog resets compact-viewport; sync again after rendering.
  }else{
    root.style.removeProperty('--visible-height');root.style.removeProperty('--visible-top');
    root.classList.remove('compact-viewport');
  }
}
window.visualViewport?.addEventListener('resize',syncDialogViewport);
window.visualViewport?.addEventListener('scroll',syncDialogViewport);
window.addEventListener('resize',syncDialogViewport);
function openDialog(title, body, footer='', drawer=false) {
  focusReturn = document.activeElement;
  $('#overlay').hidden=false;
  document.body.classList.add('locked');
  $('#dialog-root').className='dialog-root'+(drawer?' has-drawer':'');
  $('#dialog-root').innerHTML=`<section class="dialog ${drawer?'drawer':''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <div class="dialog-header"><h2 id="dialog-title">${title}</h2><button class="close-button" id="close-dialog" aria-label="Close dialog" type="button">×</button></div>
    <div class="dialog-body">${body}</div>${footer?`<div class="dialog-footer">${footer}</div>`:''}</section>`;
  syncDialogViewport();
  $('#close-dialog')?.focus({preventScroll:true});
}
function closeDialog() {
  checkoutDraft=null; receiptFile=null; draftRef=''; previewMessage='';
  $('#overlay').hidden=true; $('#dialog-root').innerHTML=''; $('#dialog-root').className='dialog-root';
  document.body.classList.remove('locked'); activeProductId=null; editingIndex=-1;
  if(focusReturn && focusReturn.isConnected) focusReturn.focus();
}
function textField(label, name, placeholder='') {
  return `<label class="field-title" for="${name}">${html(label)}</label><textarea class="field-input" id="${name}" name="${name}" rows="2" maxlength="350" placeholder="${html(placeholder)}"></textarea>`;
}
function radioChoices(name, values, selected) {
  return `<div class="option-grid">${values.map(v=>`<label class="choice"><input type="radio" name="${name}" value="${html(v)}" ${selected===v?'checked':''}/><span>${html(v)}</span></label>`).join('')}</div>`;
}
function checkedIngredients(item, options) {
  return `<div class="option-grid">${item.ingredients.map(i=>`<label class="choice"><input type="checkbox" name="ingredient" value="${html(i)}" ${!options.removed?.includes(i)?'checked':''}/><span>${html(i)}</span></label>`).join('')}</div><p class="muted-help">Uncheck ingredients you would like removed. Requests are subject to the café's confirmation.</p>`;
}
function openProduct(id, index=-1) {
  const product = findItem(id);
  if(!product || product.available===false) return;
  activeProductId=id; editingIndex=index;
  const saved = index>=0 ? cart[index] : null;
  const o=saved?.options || {};
  const isCombo=product.category==='combos';
  let optionsHTML='';
  if(product.flavours || isCombo) optionsHTML+=`<span class="field-title">Choose your wing flavour <span style="color:#ff9fba">*</span></span>${radioChoices('flavour', WING_FLAVOURS, o.flavour)}`;
  if(product.sizes) optionsHTML+=`<span class="field-title">Choose a size</span>${radioChoices('size', Object.keys(product.sizes), o.size || 'Small')}`;
  if(product.ingredients) optionsHTML+=`<span class="field-title">Keep these ingredients</span>${checkedIngredients(product,o)}`;
  if(product.category==='juices') optionsHTML+=`<span class="field-title">Preparation preferences</span><div class="option-grid"><label class="choice"><input type="checkbox" name="noIce" ${o.noIce?'checked':''}/>No ice requested</label><label class="choice"><input type="checkbox" name="noSugar" ${o.noSugar?'checked':''}/>No added sugar requested</label></div>`;
  if(isCombo && product.pickSide) optionsHTML+=`<label class="field-title" for="combo-side">Choose your side *</label><select id="combo-side" name="side" class="field-input"><option value="">Select a side</option>${SIDES.map(s=>`<option ${o.side===s?'selected':''}>${html(s)}</option>`).join('')}</select>`;
  if(isCombo && product.pickWrap) optionsHTML+=`<label class="field-title" for="combo-wrap">Choose your wrap *</label><select id="combo-wrap" name="wrap" class="field-input"><option value="">Select a wrap</option>${WRAPS.map(w=>`<option ${o.wrap===w?'selected':''}>${html(w)}</option>`).join('')}</select><p class="muted-help">Describe wrap ingredient removals in the instructions below.</p>`;
  if(isCombo && product.includesSunrise) optionsHTML+=`<p class="alert">Includes <strong>Sunrise Energy</strong> (Orange, Pineapple, Coconut). The included drink size has not been confirmed by the café; it will be clarified before acceptance.</p>`;
  optionsHTML+=textField('Special preparation requests','specials','Tell us what to add, remove or change. Unpriced extras require confirmation.');
  const content=`<div class="dialog-product-image${product.category==='juices'||product.category==='milk'||product.category==='bottled'||product.id==='corn'?' photo-full':''}">${itemPhoto(product)}</div>
  <p class="dialog-description">${html(product.description || 'A flavour-packed Boot-Up Café combo.')}</p>
  <form id="customize-form" novalidate>${optionsHTML}<div class="subsection"><span class="field-title">Quantity</span><div class="qty-picker"><button type="button" data-product-qty="-1" aria-label="Decrease quantity">−</button><strong id="product-qty">${saved?.quantity || 1}</strong><button type="button" data-product-qty="1" aria-label="Increase quantity">+</button></div></div>
  <p class="validation-error" id="customize-error" role="alert"></p></form>`;
  const footer=`<div class="modal-price-row"><span class="dialog-price" id="customize-price">${money(priceFor(product,o)*(saved?.quantity||1))}</span><button type="button" id="add-custom" class="button button-primary">${index>=0?'Save changes':'Add to cart'} ↗</button></div>`;
  openDialog(html(product.name),content,footer);
}
function customizeValue() {
  const form=$('#customize-form');
  const get = name => form.querySelector('[name="'+name+'"]:checked')?.value || '';
  const v={specials:(form.elements.namedItem('specials')?.value||'').trim().slice(0,350)};
  if(form.querySelector('[name="flavour"]')) v.flavour=get('flavour');
  if(form.querySelector('[name="size"]')) v.size=get('size')||'Small';
  if(form.querySelector('[name="ingredient"]')) v.removed=Array.from(form.querySelectorAll('[name="ingredient"]:not(:checked)')).map(el=>el.value);
  if(form.querySelector('[name="noIce"]')) v.noIce=Boolean(form.elements.namedItem('noIce').checked);
  if(form.querySelector('[name="noSugar"]')) v.noSugar=Boolean(form.elements.namedItem('noSugar').checked);
  if(form.elements.namedItem('side')) v.side=form.elements.namedItem('side').value;
  if(form.elements.namedItem('wrap')) v.wrap=form.elements.namedItem('wrap').value;
  if(findItem(activeProductId)?.includesSunrise) v.sunriseSize=BUSINESS.includedComboJuiceSize || 'To be confirmed by café';
  return v;
}
function updateCustomizePrice() {
  if(!$('#customize-form') || !activeProductId) return;
  const item=findItem(activeProductId), opts=customizeValue();
  $('#customize-price').textContent=money(priceFor(item,opts)*getQty($('#product-qty').textContent));
}
function saveCustomized() {
  if(!activeProductId) return;
  const item=findItem(activeProductId), opts=customizeValue(), qty=getQty($('#product-qty').textContent);
  if((item.flavours || item.category==='combos') && !opts.flavour) {$('#customize-error').textContent='Please choose your wing flavour.';return;}
  if(item.pickSide && !opts.side) {$('#customize-error').textContent='Please choose your combo side.';return;}
  if(item.pickWrap && !opts.wrap) {$('#customize-error').textContent='Please choose your combo wrap.';return;}
  const line={id:item.id,quantity:qty,options:opts};
  if(editingIndex>=0) cart.splice(editingIndex,1,line);
  else {
    const existing=cart.find(x=>x.id===line.id && JSON.stringify(x.options)===JSON.stringify(line.options));
    if(existing) existing.quantity=getQty(existing.quantity+qty);
    else cart.push(line);
  }
  persist();closeDialog();showToast('Added to your Boot-Up order!');
}
function optionSummary(options) {
  const out=[];
  if(options.flavour) out.push(options.flavour);
  if(options.size) out.push(options.size);
  if(options.side) out.push('Side: '+options.side);
  if(options.wrap) out.push('Wrap: '+options.wrap);
  if(options.sunriseSize) out.push('Sunrise size: '+options.sunriseSize);
  if(options.removed?.length) out.push('Remove: '+options.removed.join(', '));
  if(options.noIce) out.push('No ice requested');
  if(options.noSugar) out.push('No added sugar requested');
  if(options.specials) out.push('Request: '+options.specials);
  return out.join(' · ');
}
function cartHTML() {
  if(!cart.length) return `<div class="empty-state"><div class="empty-cart-icon">${uiIcon('bag')}</div><h3>Your bag is feeling empty</h3><p>It's time to power up your day with some flavour.</p><button class="button button-primary" type="button" id="continue-shopping">Explore the menu ↗</button></div>`;
  return `<div class="cart-items">${cart.map((line,i)=>{
      const item=findItem(line.id);
      return `<div class="cart-item"><div class="cart-item-icon">${itemPhoto(item)}</div><div class="cart-item-info"><strong>${html(item.name)}</strong><small>${html(optionSummary(line.options)) || 'Standard preparation'}</small><b>${money(priceFor(item,line.options)*line.quantity)}</b><div class="cart-line-actions"><button data-adjust="${i}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${line.quantity}</span><button data-adjust="${i}" data-delta="1" aria-label="Increase quantity">+</button><button data-edit="${i}" aria-label="Edit item">${uiIcon('edit')}</button><button data-remove="${i}" class="remove-line" aria-label="Remove item">${uiIcon('trash')}</button></div></div></div>`;
  }).join('')}</div><div class="cart-summary"><div class="summary-row"><span>Subtotal</span><strong>${money(calculateTotal(cart))}</strong></div><div class="summary-row total"><span>Order total</span><strong>${money(calculateTotal(cart))}</strong></div><p class="muted-help">No delivery or additional charges have been included. Special requests and availability require café confirmation.</p></div>`;
}
function openCart() {
  checkoutDraft=null; receiptFile=null; draftRef=''; previewMessage='';
  const footer=cart.length?`<button class="button button-primary full-width" id="go-checkout" type="button">Continue to checkout ↗</button>`:'';
  openDialog('Your flavour bag',cartHTML(),footer,true);
}
function paymentOptions() {
  return '<option value="">Choose payment method</option><option value="'+PAYMENT.CASH+'">'+PAYMENT.CASH+'</option>'+(BUSINESS.bankTransferEnabled?'<option value="'+PAYMENT.BANK+'">'+PAYMENT.BANK+'</option>':'');
}
function bankPanel() {
  return `<section id="bank-panel" class="bank-panel" hidden aria-label="Bank transfer instructions">
    <h3>${uiIcon('bank')} Bank transfer details</h3>
    <dl><dt>Bank</dt><dd>${html(BUSINESS.bankName)}</dd><dt>Account holder</dt><dd>${html(BUSINESS.accountName)}</dd><dt>Account number</dt><dd>${html(BUSINESS.accountNumber)} <button type="button" class="bank-copy" id="copy-account">Copy</button></dd><dt>Branch</dt><dd>${html(BUSINESS.branch)}</dd><dt>Account type</dt><dd>${html(BUSINESS.accountType)}</dd></dl>
    <div class="summary-row total"><span>Menu total</span><strong>${money(calculateTotal(cart))}</strong></div>
    <p class="muted-help">Confirm availability and the final amount with the café before transferring. <a href="https://wa.me/${BUSINESS.whatsapp}" target="_blank" rel="noopener noreferrer">Contact Boot-Up ↗</a></p>
    <label for="transfer-reference" class="field-title">Bank transaction reference <span class="required">*</span></label>
    <input class="field-input" id="transfer-reference" name="transferReference" type="text" maxlength="80" autocomplete="off" placeholder="Enter the reference shown by your bank" disabled />
    <p class="muted-help">Enter the reference exactly as shown on your bank confirmation. A reference or receipt alone does not confirm payment.</p>
    <label for="receipt-file" class="field-title">Attach proof of payment <span class="required">*</span></label>
    <input type="file" class="field-input" id="receipt-file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" disabled />
    <p class="muted-help">Select a transfer screenshot or PDF (up to 10 MB). The file stays on your device until you share it. Hide unrelated balances or transactions before sharing.</p>
    <div id="receipt-status" class="muted-help" role="status" aria-live="polite"></div>
    <button type="button" class="bank-copy" id="remove-receipt" hidden>Remove attachment</button>
  </section>`;
}
function syncPayment() {
  const bank=$('#payment')?.value===PAYMENT.BANK;
  const panel=$('#bank-panel'),input=$('#receipt-file'),referenceInput=$('#transfer-reference');
  if(!panel||!input)return;
  panel.hidden=!bank;input.disabled=!bank;if(referenceInput)referenceInput.disabled=!bank;
  if(!bank){receiptFile=null;input.value='';}
  $('#receipt-status').textContent=receiptFile?'Selected: '+receiptFile.name:'No receipt selected.';
  $('#remove-receipt').hidden=!receiptFile;
}
function checkoutHTML() {
  return `<div class="checkout-progress"><b>1. YOUR DETAILS</b> → 2. WHATSAPP ORDER</div>
  <div class="alert">Your order is <strong>not yet submitted</strong>. After reviewing it, you must send the prepared message in WhatsApp for the café to receive it.</div>
  <form id="checkout-form" class="checkout-form" novalidate>
  <div class="form-field"><label for="customer-name">Name for the order <span class="required">*</span></label><input class="field-input" id="customer-name" name="customerName" required autocomplete="name" maxlength="90" placeholder="Your name" /></div>
  <div class="form-field"><label for="customer-phone">WhatsApp / telephone number <span class="required">*</span></label><input class="field-input" id="customer-phone" name="customerPhone" required type="tel" inputmode="tel" autocomplete="tel" maxlength="25" placeholder="876-xxx-xxxx" /></div>
  <fieldset class="form-section"><legend>Food allergies <span class="required">*</span></legend><div class="option-grid">
  <label class="choice"><input type="radio" name="allergy" value="No known food allergies" required />No known allergies</label>
  <label class="choice"><input type="radio" name="allergy" value="Food allergy declared" required />I have a food allergy</label>
  <label class="choice"><input type="radio" name="allergy" value="Prefer not to disclose" required />Prefer not to disclose</label></div>
  <div id="allergy-detail" hidden><label class="field-title" for="allergy-description">Describe your allergy *</label><textarea id="allergy-description" name="allergyDescription" class="field-input" rows="2" maxlength="400" placeholder="Ingredients or foods you must avoid"></textarea></div>
  <p class="muted-help">Allergen requests require café review. Cross-contact cannot be ruled out without explicit confirmation.</p></fieldset>
  <div class="schedule-card" aria-label="Friday pre-order schedule">
      <span class="schedule-eyebrow">FRIDAY COLLECTIONS • PRE-ORDER ONLY</span>
      <p>Choose a Friday <strong>at least one day ahead</strong>. Same-day orders and other weekdays are not available.</p>
      <div class="next-friday-note">Earliest eligible Friday: <strong>${formatFriday(nextFridayAfter(todayInJamaica()))}</strong></div>
      <div class="form-field"><label for="pickup-date">Choose your Friday <span class="required">*</span></label>
      <input type="date" id="pickup-date" name="pickupDate" class="field-input" required min="${nextFridayAfter(todayInJamaica())}" step="7" aria-describedby="date-hint" />
      <p id="date-hint" class="muted-help">Tap the calendar to choose an upcoming Friday. Dates are based on Jamaica time.</p></div>
      <div class="form-field"><label for="pickup-time">Preferred collection time (optional)</label>
      <input type="time" id="pickup-time" name="pickupTime" class="field-input" aria-describedby="pickup-time-hint" />
      <p id="pickup-time-hint" class="muted-help">This is a request, not a confirmed appointment. The café will confirm your time on WhatsApp.</p></div>
    </div>
  <div class="form-field"><label for="payment">Payment method <span class="required">*</span></label><select id="payment" name="payment" class="field-input" required>${paymentOptions()}</select><p class="muted-help">Cash is paid when receiving your order. Collection or delivery arrangements require café confirmation.</p></div>
  ${bankPanel()}
  <div class="form-field"><label for="order-notes">General order instructions</label><textarea id="order-notes" name="notes" class="field-input" maxlength="450" placeholder="Additional helpful details (optional)"></textarea></div>
  <div class="summary-row total"><span>Order total</span><strong>${money(calculateTotal(cart))}</strong></div>
  <p class="validation-error" id="checkout-error" role="alert"></p>
  </form>`;
}
function openCheckout() {
  if(!cart.length) return openCart();
  openDialog('Finalise your order',checkoutHTML(),`<div class="order-actions"><button class="button button-outline" id="back-to-cart" type="button">← Back to bag</button><button class="button button-primary" id="review-order" type="button">Review WhatsApp order ↗</button></div>`,true);
  restoreCheckout();
}
function restoreCheckout() {
  if(checkoutDraft){
    const form=$('#checkout-form');
    for(const [key,value] of Object.entries(checkoutDraft)){
      if(key==='allergy'){for(const el of form.querySelectorAll('[name="allergy"]'))el.checked=el.value===value;}
      else if(form.elements.namedItem(key))form.elements.namedItem(key).value=value;
    }
    $('#allergy-detail').hidden=checkoutDraft.allergy!=='Food allergy declared';
  }
  syncPayment();
}
function reference() {
  const date=new Date();
  const ymd=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('');
  const bits=new Uint8Array(4);
  if(globalThis.crypto?.getRandomValues) crypto.getRandomValues(bits);
  else for(let i=0;i<4;i++) bits[i]=Math.floor(Math.random()*256);
  return 'BU-'+ymd+'-'+Array.from(bits,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
}
function buildMessage(details) {
  const lines=[`BOOT-UP CAFÉ — ORDER REQUEST`,`Draft reference: ${draftRef || (draftRef=reference())}`,`Name: ${details.name}`,`Phone: ${details.phone}`,'', 'MY ORDER'];
  cart.forEach((line,i)=>{
    const item=findItem(line.id);
    lines.push(`${i+1}. ${line.quantity} × ${item.name} — ${money(priceFor(item,line.options)*line.quantity)}`);
    const summary=optionSummary(line.options);
    if(summary) lines.push('   '+summary);
  });
  lines.push('',`TOTAL: ${money(calculateTotal(cart))}`,`Requested collection date: ${formatFriday(details.pickupDate)}`,`Preferred collection time: ${details.pickupTime?formatPreferredTime(details.pickupTime)+' (subject to café confirmation)':'To be confirmed by café'}`,`Payment: ${details.payment}`,'',`⚠️ ALLERGY DECLARATION: ${details.allergy}`);
  if(details.payment===PAYMENT.BANK) { lines.push(`Bank transaction reference: ${details.transferReference}`); lines.push('PAYMENT STATUS: PENDING VERIFICATION — receipt supplied by customer; café must confirm funds in its bank account.'); }
  else lines.push('PAYMENT STATUS: Cash due when receiving the order.');
  if(details.allergyDescription) lines.push(`ALLERGY DETAILS: ${details.allergyDescription}`);
  if(details.notes) lines.push(`Other instructions: ${details.notes}`);
  lines.push('','This is an order request. Please confirm availability, pickup time, allergy requirements, payment details and final acceptance.','Sent from the Boot-Up Café digital menu.');
  return lines.join('\n');
}
function reviewCheckout() {
  const form=$('#checkout-form');if(!form)return;
  const fd=new FormData(form),name=(fd.get('customerName')||'').trim(),phone=(fd.get('customerPhone')||'').trim();
  const allergy=fd.get('allergy'), allergyDescription=(fd.get('allergyDescription')||'').trim();
  const error=$('#checkout-error');
  if(name.length<2){error.textContent='Please enter the name for your order.';$('#customer-name').focus();return;}
  if(phone.replace(/\D/g,'').length<7){error.textContent='Please enter a valid telephone number.';$('#customer-phone').focus();return;}
  if(!allergy){error.textContent='Please choose your allergy declaration.';form.querySelector('[name="allergy"]').focus();return;}
  if(allergy==='Food allergy declared' && !allergyDescription){error.textContent='Please describe your allergy so the café can review it.';$('#allergy-description').focus();return;}
  const pickupDate = String(fd.get('pickupDate') || '');
  const pickupTime = String(fd.get('pickupTime') || '');
  if(!isFridayPreorder(pickupDate)){
    error.textContent='Please choose an upcoming Friday at least one day in advance. Same-day orders are not accepted.';
    $('#pickup-date').focus();return;
  }
  if(pickupTime && !formatPreferredTime(pickupTime)){
    error.textContent='Please enter a valid preferred collection time.';$('#pickup-time').focus();return;
  }
  const payment=fd.get('payment');
  if(![PAYMENT.CASH,PAYMENT.BANK].includes(payment)){error.textContent='Please choose your payment method.';$('#payment').focus();return;}
  if(payment===PAYMENT.BANK){
    const transferReference=String(fd.get('transferReference')||'').trim();
    if(transferReference.length<5 || transferReference.length>80 || !/^[A-Za-z0-9][A-Za-z0-9 /._-]*$/.test(transferReference)){error.textContent='Enter the bank transaction reference shown on your receipt (5–80 characters).';$('#transfer-reference').focus();return;}
    const issue=receiptError(receiptFile);
    if(issue){error.textContent=issue;$('#receipt-file').focus();return;}
  } else receiptFile=null;
  error.textContent='';
  checkoutDraft=Object.fromEntries(fd.entries());
  previewMessage=buildMessage({
    name,phone,allergy,allergyDescription,pickupDate,pickupTime,transferReference:String(fd.get('transferReference')||'').trim(),payment:fd.get('payment'),notes:(fd.get('notes')||'').trim()
  });
  const url='https://wa.me/'+BUSINESS.whatsapp+'?text='+encodeURIComponent(previewMessage);
  const body=`<div class="checkout-progress"><b>2. REVIEW YOUR REQUEST</b> → SEND IN WHATSAPP</div>
    <div class="alert warning"><strong>Important:</strong> This is an unsent draft, not a verified payment. Opening WhatsApp does not send it automatically. Tap Send inside WhatsApp and wait for the café to confirm acceptance.</div>
    <pre class="order-preview">${html(previewMessage)}</pre>
    ${payment===PAYMENT.BANK?`<div class="alert success"><strong>Receipt selected:</strong> ${html(receiptFile.name)}<br />Not yet sent or verified. Share the receipt and order in WhatsApp; choose Boot-Up Café (+1 876 304 0394) as the recipient. If file sharing is unavailable, open the café chat and attach the same receipt there manually.</div>`:'<div class="alert">Cash on delivery / collection selected. No receipt required.</div>'}`;
  const shareData=payment===PAYMENT.BANK?{files:[receiptFile],text:previewMessage}:null;
  const canShare=shareData&&supportsReceiptShare(shareData);
  const footer=`${canShare?'<button class="button button-primary full-width" id="share-receipt-order" type="button">Share order + receipt via WhatsApp</button>':''}
    <a class="button ${canShare?'button-outline':'button-primary'} full-width" id="send-whatsapp" href="${html(url)}" target="_blank" rel="noopener noreferrer">${payment===PAYMENT.BANK?'Open café chat & attach receipt manually ↗':'Open WhatsApp & send order ↗'}</a>
    <div class="order-actions"><button class="button button-outline" id="copy-order" type="button">Copy order</button><button class="button button-outline" id="back-to-checkout" type="button">← Edit details</button></div>`;
  openDialog('Review your order',body,footer,true);
}
function supportsReceiptShare(data){
  try{return !!(navigator.share && navigator.canShare && navigator.canShare(data));}catch{return false;}
}
async function shareReceiptOrder(){
  if(!receiptFile||!previewMessage)return;
  const data={files:[receiptFile],text:previewMessage};
  if(!supportsReceiptShare(data)){showToast('Open the café chat and attach your receipt manually.');return;}
  try{
    await navigator.share(data);
    showToast('Check WhatsApp: send both the order and receipt to Boot-Up Café.');
  }catch(e){if(e?.name!=='AbortError')showToast('File sharing unavailable. Use the café chat and attach manually.');}
}
function siteURL(){return new URL('./',location.href.split('#')[0]).href;}
function openQR(){
  const url=siteURL();const qr='https://api.qrserver.com/v1/create-qr-code/?size=480x480&margin=15&data='+encodeURIComponent(url);
  const body=`<div class="qr-card" id="print-qr"><div class="qr-brand-icon"><img src="./assets/bootup-icon.svg" alt="" width="50" height="50" /></div><h3>BOOT-UP CAFÉ</h3><p>SCAN TO ORDER</p><img src="${html(qr)}" alt="QR code to open the Boot-Up Café menu" /><p class="qr-url">${html(url)}</p></div>
  <p class="muted-help" style="text-align:center">This QR code opens the current website address. Print it from the final production site, not a preview page. The QR image requires an internet connection.</p>
  <div class="qr-actions"><button class="button button-outline" id="copy-site" type="button">Copy menu link</button><button class="button button-primary" id="print-qr-btn" type="button">Print QR sign</button></div>`;
  openDialog('Scan to order',body);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text);showToast('Copied to clipboard!');}
  catch {showToast('Clipboard unavailable on this device.');}
}
async function shareSite() {
  const data={title:'BOOT-UP CAFÉ',text:'Fuel your day with flavour! Browse and order.',url:siteURL()};
  try {if(navigator.share)await navigator.share(data);else await copyText(data.url);}
  catch(e){if(e?.name!=='AbortError')showToast('Share unavailable on this device.');}
}
function click(event) {
  const target=event.target.closest('button, a, article[data-open]');
  if(!target) return;
  if(target.closest('#close-dialog')){closeDialog();return;}
  if(target.closest('#share-btn')){shareSite();return;}
  if(target.closest('#qr-btn') || target.closest('#footer-qr')){openQR();return;}
  if(target.closest('#cart-btn') || target.closest('#mobile-cart')){openCart();return;}
  if(target.dataset.filter){filter=target.dataset.filter;renderCategories();renderProducts();return;}
  if(target.dataset.open){
    const item=findItem(target.dataset.open);
    if(item?.available!==false) openProduct(target.dataset.open);
    return;
  }
  if(target.hasAttribute('data-product-qty')) {
    $('#product-qty').textContent=String(getQty(Number($('#product-qty').textContent)+Number(target.dataset.productQty)));
    updateCustomizePrice();return;
  }
  if(target.id==='add-custom'){saveCustomized();return;}
  if(target.dataset.adjust!==undefined){
    const index=Number(target.dataset.adjust),delta=Number(target.dataset.delta);
    if(cart[index]){cart[index].quantity=Math.max(0,Math.min(30,cart[index].quantity+delta));if(cart[index].quantity===0)cart.splice(index,1);persist();openCart();}
    return;
  }
  if(target.dataset.remove!==undefined){cart.splice(Number(target.dataset.remove),1);persist();openCart();return;}
  if(target.dataset.edit!==undefined){const index=Number(target.dataset.edit);if(cart[index])openProduct(cart[index].id,index);return;}
  if(target.id==='continue-shopping'){closeDialog();location.hash='#menu';return;}
  if(target.id==='go-checkout'){openCheckout();return;}
  if(target.id==='back-to-cart'){openCart();return;}
  if(target.id==='review-order'){reviewCheckout();return;}
  if(target.id==='back-to-checkout'){openCheckout();return;}
  if(target.id==='copy-account'){copyText(BUSINESS.accountNumber);return;}
  if(target.id==='remove-receipt'){receiptFile=null;$('#receipt-file').value='';syncPayment();return;}
  if(target.id==='share-receipt-order'){shareReceiptOrder();return;}
  if(target.id==='copy-order'){copyText(previewMessage);return;}
  if(target.id==='copy-site'){copyText(siteURL());return;}
  if(target.id==='print-qr-btn'){window.print();return;}
}
document.addEventListener('click',click);
document.addEventListener('change',event=>{
  if(event.target.closest('#customize-form'))updateCustomizePrice();
  if(event.target.id==='payment'){syncPayment();$('#checkout-error').textContent='';}
  if(event.target.id==='pickup-date'){
    const chosen=event.target.value;
    const valid=isFridayPreorder(chosen);
    const hint=$('#date-hint');
    if(hint) hint.textContent=!chosen?'Tap the calendar to choose an upcoming Friday.':valid?formatFriday(chosen)+' selected — café confirmation required.':'Please select a future Friday, not today or a different weekday.';
    if(chosen && !valid)event.target.value='';
    if($('#checkout-error'))$('#checkout-error').textContent='';
  }
  if(event.target.id==='receipt-file'){
    const next=event.target.files?.[0];
    if(!next)return;
    const issue=receiptError(next);
    if(issue){receiptFile=null;event.target.value='';}else receiptFile=next;
    syncPayment();$('#checkout-error').textContent=issue;
  }
  if(event.target.name==='allergy') {
    const details=$('#allergy-detail');
    if(details) details.hidden=event.target.value!=='Food allergy declared';
  }
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && !$('#overlay').hidden)closeDialog();
  if((event.key==='Enter'||event.key===' ') && event.target.matches('article[data-open]')){event.preventDefault();openProduct(event.target.dataset.open);}
  if(event.key==='Tab' && !$('#overlay').hidden) {
    const dialog=$('.dialog'); if(!dialog) return;
    const tabbable=Array.from(dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')).filter(el=>el.getClientRects().length);
    if(!tabbable.length)return;
    if(event.shiftKey && document.activeElement===tabbable[0]){event.preventDefault();tabbable.at(-1).focus();}
    else if(!event.shiftKey && document.activeElement===tabbable.at(-1)){event.preventDefault();tabbable[0].focus();}
  }
});
$('#overlay').addEventListener('click',closeDialog);
$('#year').textContent=String(new Date().getFullYear());
renderCategories();renderProducts();renderCombos();updateCartBadge();
if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('./sw.js?v=9').catch(()=>{});
