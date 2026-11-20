import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PRODUCTS,COMBOS,ALL_ITEMS,JUICE_SIZES,MILK_SIZES,priceFor,calculateTotal,PAYMENT,receiptError,BUSINESS,BOTTLED_FLAVOURS } from '../catalog.js';

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
 const hashes=new Set();
 for(const item of [...PRODUCTS,...COMBOS]) {
    // External licensed replacement photos always retain an existing local fallback.
    const path=item.fallbackImage || item.image;
    if(item.fallbackImage)assert.match(item.image,/^https:\/\//,item.id+' needs an HTTPS photo');
    assert.match(path,/^\.\/assets\/menu\/[\w-]+\.(?:webp|jpe?g)$/i,item.id+' needs a locally hosted image/fallback');
    const bytes=readFileSync(new URL('../'+path.slice(2),import.meta.url));
   assert.ok(bytes.length>1000,item.id+' image is missing or empty');
   if(/\.jpe?g$/i.test(path)){
     assert.equal(bytes[0],0xff,item.id+' invalid JPEG');
     assert.equal(bytes[1],0xd8,item.id+' invalid JPEG');
   }else{
     assert.equal(bytes.toString('ascii',8,12),'WEBP',item.id+' invalid WebP');
   }
   if(['sunrise','berry','green','tropical','corn','milk'].includes(item.id)){
     const hash=createHash('sha256').update(bytes).digest('hex');
     assert.ok(!hashes.has(hash),item.id+' must have its own photograph');
     hashes.add(hash);
   }
 }
});

test('checkout supports cash and the configured transfer account',()=>{
 assert.equal(BUSINESS.bankTransferEnabled,true);
 assert.equal(BUSINESS.bankName,'Scotiabank');
 assert.equal(BUSINESS.accountType,'Savings');
 assert.notEqual(PAYMENT.CASH,PAYMENT.BANK);
});
test('transfer receipt accepts supported files and rejects invalid or oversized ones',()=>{
 assert.ok(receiptError(null));
 assert.ok(receiptError({name:'receipt.png',type:'image/png',size:0}));
 assert.ok(receiptError({name:'receipt.exe',type:'application/octet-stream',size:1}));
 assert.ok(receiptError({name:'receipt.pdf',type:'text/html',size:10}));
 assert.ok(receiptError({name:'receipt.png',type:'image/png',size:10*1024*1024+1}));
 assert.equal(receiptError({name:'receipt.png',type:'image/png',size:100}),'');
 assert.equal(receiptError({name:'receipt.pdf',type:'application/pdf',size:100}),'');
 assert.equal(receiptError({name:'receipt.HEIC',type:'',size:100}),'');
});

test('natural bottled juice flavours and sweetener have no invented price',()=>{
  assert.deepEqual([...BOTTLED_FLAVOURS],['Mango','Cucumber','Guava','Beet','Plum']);
  const item=PRODUCTS.find(p=>p.id==='bottled-juices');
  assert.equal(item.available,false);
  assert.equal(item.price,null);
  assert.match(item.description,/agave/i);
  assert.equal(BUSINESS.preorderWeekday,5);
});
