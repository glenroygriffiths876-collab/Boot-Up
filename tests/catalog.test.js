import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS,COMBOS,ALL_ITEMS,JUICE_SIZES,MILK_SIZES,priceFor,calculateTotal } from '../catalog.js';

test('poster wing and wrap prices',()=>{
 assert.equal(PRODUCTS.find(p=>p.id==='wings5').price,800);
 assert.equal(PRODUCTS.find(p=>p.id==='wings10').price,1550);
 assert.equal(PRODUCTS.find(p=>p.id==='wrap-chicken').price,1000);
 assert.equal(PRODUCTS.find(p=>p.id==='wrap-chickpea').price,900);
 assert.equal(PRODUCTS.find(p=>p.id==='wrap-ackee').price,900);
});
test('handwritten corrected juice and milk prices',()=>{
 assert.deepEqual(JUICE_SIZES,{Small:350,Large:550});
 assert.deepEqual(MILK_SIZES,{Small:850,Large:1150});
 assert.equal(PRODUCTS.find(p=>p.id==='milk-unconfigured').available,false);
});
test('poster combos remain fixed prices',()=>{
 assert.deepEqual(COMBOS.map(x=>x.price),[1850,1050,2550,1800]);
 assert.equal(COMBOS.find(x=>x.id==='combo10wrap').includesSunrise,true);
});
test('cart tallies sizes, quantities, combos correctly',()=>{
 const cart=[
  {id:'wings5',quantity:2,options:{flavour:'BBQ'}},
  {id:'berry',quantity:1,options:{size:'Large'}},
  {id:'combo5wrap',quantity:1,options:{wrap:'Chicken Wrap',flavour:'Buffalo'}}
 ];
 assert.equal(calculateTotal(cart),800*2+550+1800);
 assert.equal(priceFor(ALL_ITEMS.find(x=>x.id==='green'),{size:'Small'}),350);
});
test('all configurable menu items have unique ids',()=>{
 assert.equal(new Set(ALL_ITEMS.map(x=>x.id)).size,ALL_ITEMS.length);
});

test('every advertised product and combo has a meaningful image source',()=>{
 assert.ok([...PRODUCTS,...COMBOS].every(p=>typeof p.image==='string' && p.image.length>8));
 const verify = [...PRODUCTS,...COMBOS].filter(p=>p.image.startsWith('./assets/'));
 for(const item of verify) {
   assert.ok(item.image.endsWith('.webp'),item.id+' should use an optimized food photograph');
 }
});
