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
    image:img('photo-1602253057119-44d745d9b860'), description:'Five juicy wings. Pick your flavour and dig in.', flavours:WING_FLAVOURS},
  {id:'wings10', category:'wings', name:'10 Piece Wings', price:1550, emoji:'🍗', accent:'orange',
    image:img('photo-1602253057119-44d745d9b860'), description:'Double the wings, double the flavour.', flavours:WING_FLAVOURS},
  {id:'wrap-chicken', category:'wraps', name:'Chicken Wrap', price:1000, emoji:'🌯', accent:'orange',
    image:img('photo-1632660346941-023cc64e1252'), description:'Chicken, lettuce, tomato, onion, sweet pepper & cheese.',
    ingredients:['Chicken','Lettuce','Tomato','Onion','Sweet pepper','Cheese']},
  {id:'wrap-chickpea', category:'wraps', name:'Chickpea Wrap', price:900, emoji:'🫓', accent:'green',
    image:'', description:'Chickpea, lettuce, tomato, onion & sweet pepper. No cheese.',
    ingredients:['Chickpea','Lettuce','Tomato','Onion','Sweet pepper']},
  {id:'wrap-ackee', category:'wraps', name:'Ackee Wrap', price:900, emoji:'🌯', accent:'gold',
    image:'', description:'Ackee, lettuce, tomato, onion & sweet pepper. No cheese.',
    ingredients:['Ackee','Lettuce','Tomato','Onion','Sweet pepper']},
  {id:'plantain', category:'sides', name:'Fried Plantain', price:250, emoji:'🍌', accent:'gold',
    image:'', description:'Golden, sweet and deliciously satisfying.'},
  {id:'corn', category:'sides', name:'Corn on the Cob', price:250, emoji:'🌽', accent:'green',
    image:'', description:'A comforting, flavourful side.'},
  {id:'sunrise', category:'juices', name:'Sunrise Energy', price:350, sizes:JUICE_SIZES, emoji:'🍊', accent:'orange',
    image:img('photo-1600271886742-f049cd451bba'), description:'Orange • Pineapple • Coconut',
    ingredients:['Orange','Pineapple','Coconut']},
  {id:'berry', category:'juices', name:'Berry Power', price:350, sizes:JUICE_SIZES, emoji:'🍓', accent:'pink',
    image:img('photo-1505252585461-04db1eb84625'), description:'Strawberry • Blueberry • Lemon',
    ingredients:['Strawberry','Blueberry','Lemon']},
  {id:'green', category:'juices', name:'Green Fuel', price:350, sizes:JUICE_SIZES, emoji:'🥒', accent:'green',
    image:img('photo-1610970881699-44a5587cabec'), description:'Cucumber • Green Apple • Ginger • Pineapple',
    ingredients:['Cucumber','Green Apple','Ginger','Pineapple']},
  {id:'tropical', category:'juices', name:'Tropical Boot-Up', price:350, sizes:JUICE_SIZES, emoji:'🥭', accent:'gold',
    image:img('photo-1622597467836-f3285f2131b8'), description:'Mango • Pineapple • Banana',
    ingredients:['Mango','Pineapple','Banana']},
  {id:'milk-unconfigured', category:'milk', name:'Milk-Based Blended Drinks', price:850, sizes:MILK_SIZES,
    emoji:'🥛', accent:'blue', image:'', available:false,
    description:'Small J$850 • Large J$1,150. Flavours to be confirmed by the café.'}
];

export const COMBOS = [
  {id:'combo10side', name:'10 PC Wings + Side', price:1850, emoji:'🍗', accent:'pink',
    wings:10, pickSide:true, pickWrap:false, includesSunrise:false},
  {id:'combo5side', name:'5 PC Wings + Side', price:1050, emoji:'🍗', accent:'orange',
    wings:5, pickSide:true, pickWrap:false, includesSunrise:false},
  {id:'combo10wrap', name:'10 PC Wings + Wrap + Sunrise Energy', price:2550, emoji:'🌯', accent:'blue',
    wings:10, pickSide:false, pickWrap:true, includesSunrise:true},
  {id:'combo5wrap', name:'5 PC Wings + Wrap + Sunrise Energy', price:1800, emoji:'🥭', accent:'green',
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
