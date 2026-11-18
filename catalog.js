// Prices transcribed from the supplied REBOOT poster and handwritten Boot-Up notes.
// No extra charges, opening hours, banking information or unconfirmed flavours are invented.
export const BUSINESS = Object.freeze({
  name: 'BOOT-UP CAFÉ',
  whatsapp: '18763040394',
  currency: 'JMD',
  bankTransferEnabled: true,
  bankName: 'Scotiabank',
  accountName: 'Denise Lewin',
  accountNumber: '100414586',
  branch: 'Negril Branch',
  accountType: 'Savings',
  hours: '',
  address: '',
  includedComboJuiceSize: null // owner must confirm size for advertised Sunrise Energy combos
});

export const CATEGORIES = [
  { id: 'all', title: 'Everything' },
  { id: 'wings', title: 'Wings' },
  { id: 'wraps', title: 'Wraps' },
  { id: 'sides', title: 'Sides' },
  { id: 'juices', title: 'Blended juices' },
  { id: 'milk', title: 'Milk-based' }
];

export const WING_FLAVOURS = ['Honey Garlic', 'Buffalo', 'BBQ', 'Sweet Chili'];
export const SIDES = ['Fried Plantain', 'Corn on the Cob'];
export const WRAPS = ['Chicken Wrap', 'Chickpea Wrap', 'Ackee Wrap'];
export const JUICE_SIZES = Object.freeze({ Small: 350, Large: 550 });
export const MILK_SIZES = Object.freeze({ Small: 850, Large: 1150 });

export const PRODUCTS = [
  {id:'wings5', category:'wings', name:'5 Piece Wings', price:800, accent:'pink', featured:true,
    image:'./assets/menu/wings-5.webp', description:'Five juicy wings. Pick your flavour and dig in.', flavours:WING_FLAVOURS},
  {id:'wings10', category:'wings', name:'10 Piece Wings', price:1550, accent:'orange',
    image:'./assets/menu/wings-10.webp', description:'Double the wings, double the flavour.', flavours:WING_FLAVOURS},
  {id:'wrap-chicken', category:'wraps', name:'Chicken Wrap', price:1000, accent:'orange',
    image:'./assets/menu/chicken-wrap.webp', description:'Chicken, lettuce, tomato, onion, sweet pepper & cheese.',
    ingredients:['Chicken','Lettuce','Tomato','Onion','Sweet pepper','Cheese']},
  {id:'wrap-chickpea', category:'wraps', name:'Chickpea Wrap', price:900, accent:'green',
    image:'./assets/menu/chickpea-wrap.webp', description:'Chickpea, lettuce, tomato, onion & sweet pepper. No cheese.',
    ingredients:['Chickpea','Lettuce','Tomato','Onion','Sweet pepper']},
  {id:'wrap-ackee', category:'wraps', name:'Ackee Wrap', price:900, accent:'gold',
    image:'./assets/menu/ackee-wrap.webp', description:'Ackee, lettuce, tomato, onion & sweet pepper. No cheese.',
    ingredients:['Ackee','Lettuce','Tomato','Onion','Sweet pepper']},
  {id:'plantain', category:'sides', name:'Fried Plantain', price:250, accent:'gold',
    image:'./assets/menu/fried-plantain.webp', description:'Golden, sweet and deliciously satisfying.'},
  {id:'corn', category:'sides', name:'Corn on the Cob', price:250, accent:'green',
    image:'./assets/menu/corn-on-cob.jpg', description:'A comforting, flavourful side.'},
  {id:'sunrise', category:'juices', name:'Sunrise Energy', price:350, sizes:JUICE_SIZES, accent:'orange',
    image:'./assets/menu/sunrise-energy.jpg', description:'Orange • Pineapple • Coconut',
    ingredients:['Orange','Pineapple','Coconut']},
  {id:'berry', category:'juices', name:'Berry Power', price:350, sizes:JUICE_SIZES, accent:'pink',
    image:'./assets/menu/berry-power.jpg', description:'Strawberry • Blueberry • Lemon',
    ingredients:['Strawberry','Blueberry','Lemon']},
  {id:'green', category:'juices', name:'Green Fuel', price:350, sizes:JUICE_SIZES, accent:'green',
    image:'./assets/menu/green-fuel.jpg', description:'Cucumber • Green Apple • Ginger • Pineapple',
    ingredients:['Cucumber','Green Apple','Ginger','Pineapple']},
  {id:'tropical', category:'juices', name:'Tropical Boot-Up', price:350, sizes:JUICE_SIZES, accent:'gold',
    image:'./assets/menu/tropical-bootup.jpg', description:'Mango • Pineapple • Banana',
    ingredients:['Mango','Pineapple','Banana']},
  {id:'milk-unconfigured', category:'milk', name:'Milk-Based Blended Drinks', price:850, sizes:MILK_SIZES,
    emoji:'🥛', accent:'blue', image:'./assets/menu/milk-blended.jpg', available:false,
    description:'Small J$850 • Large J$1,150. Flavours to be confirmed by the café.'}
];

export const COMBOS = [
  {id:'combo10side', name:'10 PC Wings + Side', price:1850, accent:'pink', image:'./assets/menu/combo-10-side.webp',
    wings:10, pickSide:true, pickWrap:false, includesSunrise:false},
  {id:'combo5side', name:'5 PC Wings + Side', price:1050, accent:'orange', image:'./assets/menu/combo-5-side.webp',
    wings:5, pickSide:true, pickWrap:false, includesSunrise:false},
  {id:'combo10wrap', name:'10 PC Wings + Wrap + Sunrise Energy', price:2550, accent:'blue', image:'./assets/menu/combo-10-wrap.webp',
    wings:10, pickSide:false, pickWrap:true, includesSunrise:true},
  {id:'combo5wrap', name:'5 PC Wings + Wrap + Sunrise Energy', price:1800, accent:'green', image:'./assets/menu/combo-5-wrap.webp',
    wings:5, pickSide:false, pickWrap:true, includesSunrise:true}
];

export const ALL_ITEMS = [...PRODUCTS, ...COMBOS.map(c => ({...c, category:'combos'}))];
export const money = n => 'J$' + Number(n).toLocaleString('en-JM');
export function priceFor(item, options = {}) {
  return item.sizes ? item.sizes[options.size] ?? item.sizes.Small : item.price;
}
export function calculateTotal(cart) {
  return cart.reduce((sum, line) => {
    const item = ALL_ITEMS.find(p => p.id === line.id);
    if (!item || item.available === false) return sum;
    return sum + priceFor(item, line.options) * Math.max(0, Number(line.quantity) || 0);
  }, 0);
}

export const PAYMENT = Object.freeze({ CASH:'Cash on delivery / collection (COD)', BANK:'Bank transfer' });
export function receiptError(file) {
  if (!file || !file.size) return 'Please attach your transfer receipt or screenshot.';
  if (file.size > 10*1024*1024) return 'Your receipt must be 10 MB or smaller.';
  const ext = /\.(jpe?g|png|webp|pdf|heic|heif)$/i.test(file.name || '');
  const mime = /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/i.test(file.type || '');
  if (!ext || (file.type && !mime && file.type !== 'application/octet-stream')) return 'Choose a JPG, PNG, WebP, HEIC or PDF receipt.';
  return '';
}
