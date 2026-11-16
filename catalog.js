// Prices transcribed from the supplied REBOOT poster and handwritten Boot-Up notes.
// No extra charges, opening hours, banking information or unconfirmed flavours are invented.
export const BUSINESS = Object.freeze({
  name: 'BOOT-UP CAFÉ',
  whatsapp: '18763040394',
  currency: 'JMD',
  bankTransferEnabled: false,
  bankName: '',
  accountName: '',
  accountNumber: '',
  branch: '',
  hours: '',
  address: '',
  includedComboJuiceSize: null // owner must confirm size for advertised Sunrise Energy combos
});

export const CATEGORIES = [
  { id: 'all', title: 'Everything', icon: '✦' },
  { id: 'wings', title: 'Wings', icon: '🍗' },
  { id: 'wraps', title: 'Wraps', icon: '🌯' },
  { id: 'sides', title: 'Sides', icon: '🍌' },
  { id: 'juices', title: 'Blended juices', icon: '🥭' },
  { id: 'milk', title: 'Milk-based', icon: '🥛' }
];

export const WING_FLAVOURS = ['Honey Garlic', 'Buffalo', 'BBQ', 'Sweet Chili'];
export const SIDES = ['Fried Plantain', 'Corn on the Cob'];
export const WRAPS = ['Chicken Wrap', 'Chickpea Wrap', 'Ackee Wrap'];
export const JUICE_SIZES = Object.freeze({ Small: 350, Large: 550 });
export const MILK_SIZES = Object.freeze({ Small: 850, Large: 1150 });

const img = (id, w = 800) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + w + '&q=80';

export const PRODUCTS = [
  {id:'wings5', category:'wings', name:'5 Piece Wings', price:800, emoji:'🍗', accent:'pink', featured:true,
    image:'./assets/menu/wings-5.webp', description:'Five juicy wings. Pick your flavour and dig in.', flavours:WING_FLAVOURS},
  {id:'wings10', category:'wings', name:'10 Piece Wings', price:1550, emoji:'🍗', accent:'orange',
    image:'./assets/menu/wings-10.webp', description:'Double the wings, double the flavour.', flavours:WING_FLAVOURS},
  {id:'wrap-chicken', category:'wraps', name:'Chicken Wrap', price:1000, emoji:'🌯', accent:'orange',
    image:'./assets/menu/chicken-wrap.webp', description:'Chicken, lettuce, tomato, onion, sweet pepper & cheese.',
    ingredients:['Chicken','Lettuce','Tomato','Onion','Sweet pepper','Cheese']},
  {id:'wrap-chickpea', category:'wraps', name:'Chickpea Wrap', price:900, emoji:'🫓', accent:'green',
    image:'./assets/menu/chickpea-wrap.webp', description:'Chickpea, lettuce, tomato, onion & sweet pepper. No cheese.',
    ingredients:['Chickpea','Lettuce','Tomato','Onion','Sweet pepper']},
  {id:'wrap-ackee', category:'wraps', name:'Ackee Wrap', price:900, emoji:'🌯', accent:'gold',
    image:'./assets/menu/ackee-wrap.webp', description:'Ackee, lettuce, tomato, onion & sweet pepper. No cheese.',
    ingredients:['Ackee','Lettuce','Tomato','Onion','Sweet pepper']},
  {id:'plantain', category:'sides', name:'Fried Plantain', price:250, emoji:'🍌', accent:'gold',
    image:'./assets/menu/fried-plantain.webp', description:'Golden, sweet and deliciously satisfying.'},
  {id:'corn', category:'sides', name:'Corn on the Cob', price:250, emoji:'🌽', accent:'green',
    image:'https://images.unsplash.com/photo-1653886764193-db9e5a93d215?auto=format&fit=crop&w=900&q=85', description:'A comforting, flavourful side.'},
  {id:'sunrise', category:'juices', name:'Sunrise Energy', price:350, sizes:JUICE_SIZES, emoji:'🍊', accent:'orange',
    image:'./assets/menu/sunrise-energy.webp', description:'Orange • Pineapple • Coconut',
    ingredients:['Orange','Pineapple','Coconut']},
  {id:'berry', category:'juices', name:'Berry Power', price:350, sizes:JUICE_SIZES, emoji:'🍓', accent:'pink',
    image:'./assets/menu/berry-power.webp', description:'Strawberry • Blueberry • Lemon',
    ingredients:['Strawberry','Blueberry','Lemon']},
  {id:'green', category:'juices', name:'Green Fuel', price:350, sizes:JUICE_SIZES, emoji:'🥒', accent:'green',
    image:'./assets/menu/green-fuel.webp', description:'Cucumber • Green Apple • Ginger • Pineapple',
    ingredients:['Cucumber','Green Apple','Ginger','Pineapple']},
  {id:'tropical', category:'juices', name:'Tropical Boot-Up', price:350, sizes:JUICE_SIZES, emoji:'🥭', accent:'gold',
    image:'./assets/menu/tropical-bootup.webp', description:'Mango • Pineapple • Banana',
    ingredients:['Mango','Pineapple','Banana']},
  {id:'milk-unconfigured', category:'milk', name:'Milk-Based Blended Drinks', price:850, sizes:MILK_SIZES,
    emoji:'🥛', accent:'blue', image:'./assets/menu/milk-blended.webp', available:false,
    description:'Small J$850 • Large J$1,150. Flavours to be confirmed by the café.'}
];

export const COMBOS = [
  {id:'combo10side', name:'10 PC Wings + Side', price:1850, emoji:'🍗', accent:'pink', image:'./assets/menu/combo-10-side.webp',
    wings:10, pickSide:true, pickWrap:false, includesSunrise:false},
  {id:'combo5side', name:'5 PC Wings + Side', price:1050, emoji:'🍗', accent:'orange', image:'./assets/menu/combo-5-side.webp',
    wings:5, pickSide:true, pickWrap:false, includesSunrise:false},
  {id:'combo10wrap', name:'10 PC Wings + Wrap + Sunrise Energy', price:2550, emoji:'🌯', accent:'blue', image:'./assets/menu/combo-10-wrap.webp',
    wings:10, pickSide:false, pickWrap:true, includesSunrise:true},
  {id:'combo5wrap', name:'5 PC Wings + Wrap + Sunrise Energy', price:1800, emoji:'🥭', accent:'green', image:'./assets/menu/combo-5-wrap.webp',
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
