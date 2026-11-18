import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('.');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const p=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
    if(!p.startsWith(root+sep)){res.writeHead(403).end();return;}
    const data=await readFile(p);
    res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream'});
    res.end(data);
  }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try{
  browser=await chromium.launch({headless:true});
  for(const [width,height] of [[320,568],[360,640],[375,667],[390,844],[414,896],[430,932],[844,390]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    const page=await context.newPage();
    // Test the offline-friendly font fallback and never send test details externally.
    await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.locator('.product-card').first().waitFor();
    async function fits(selectors,label){
      const result=await page.evaluate(sels=>{
        const bad=[];
        const vw=document.documentElement.clientWidth;
        if(document.documentElement.scrollWidth>vw+1)bad.push('document '+document.documentElement.scrollWidth+' > '+vw);
        for(const sel of sels){
          for(const el of document.querySelectorAll(sel)){
            if(!el.getClientRects().length)continue;
            const r=el.getBoundingClientRect();
            if(r.left < -1 || r.right > vw+1)bad.push(sel+': '+Math.round(r.left)+'..'+Math.round(r.right)+' / '+vw);
            if(el.matches('.product-body,.combo-card,.bank-panel,.dialog-body,.dialog-footer,.checkout-form,.field-input,.order-actions,.cart-item-info') && el.scrollWidth>el.clientWidth+2)bad.push(sel+' inner overflow '+el.scrollWidth+' / '+el.clientWidth);
          }
        }
        return bad;
      },selectors);
      assert.deepEqual(result,[],width+'x'+height+' '+label+': '+result.join('; '));
    }
    await fits(['.header-content','.brand','.cart-trigger','.hero-copy','.hero-art','.section-top','.product-card','.product-body','.product-bottom','.add-button','.combo-card','.combo-bottom','.combo-card button','.menu-controls','.filter-chip','.mobile-cart','#mobile-cart-summary','#mobile-cart-items','#mobile-cart-total'],'menu');
    await page.locator('button[data-open="wings5"]').click();
    await page.locator('#customize-form').waitFor();
    await fits(['.dialog','.dialog-header','.dialog-body','.dialog-footer','.choice','.field-input','#add-custom'],'customisation');
    await page.locator('input[name="flavour"]').first().check();
    await page.locator('#add-custom').click();
    if(width<=750){
      assert.equal(await page.locator('#mobile-cart-items').textContent(),'1 item');
      assert.equal(await page.locator('#mobile-cart-total').textContent(),'J$800');
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      await fits(['.mobile-cart','#mobile-cart-summary','#mobile-cart-items','#mobile-cart-total'],'cart bar at page footer');
      const geometry=await page.evaluate(()=>{
        const bar=document.querySelector('#mobile-cart').getBoundingClientRect();
        const v=window.visualViewport;
        const children=[...document.querySelectorAll('#mobile-cart-items,#mobile-cart-total')].map(el=>el.getBoundingClientRect());
        return {viewport:v.width,scrollX:window.scrollX,barLeft:bar.left,barRight:bar.right,childrenFit:children.every(r=>r.left>=bar.left-1&&r.right<=bar.right+1&&r.bottom<=bar.bottom+1)};
      });
      assert.ok(geometry.viewport<=width+1 && geometry.scrollX===0 && geometry.barLeft>=0 && geometry.barRight<=width+1 && geometry.childrenFit,JSON.stringify(geometry));
      await page.locator('#mobile-cart').click();
    }else await page.locator('#cart-btn').click();
    await fits(['.dialog','.cart-item','.cart-item-info','.cart-line-actions button','#go-checkout'],'cart');
    await page.locator('#go-checkout').click();
    await page.locator('#customer-name').fill('Layout Test');
    await page.locator('#customer-phone').fill('8765550100');
    await page.locator('input[name="allergy"]').first().check();
    await page.locator('#payment').selectOption('Bank transfer');
    await page.locator('#bank-panel').waitFor();
    await fits(['.dialog','.dialog-body','.dialog-footer','.checkout-form','.form-section','.field-input','.bank-panel','.bank-panel dd','.order-actions','#review-order'],'bank checkout');
    await page.locator('#review-order').click();
    assert.match(await page.locator('#checkout-error').textContent(),/receipt/i);
    await page.locator('#receipt-file').setInputFiles({name:'a-very-long-payment-receipt-filename-01234567890123456789012345678901234567890123456789.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n%%EOF')});
    await fits(['.bank-panel','.field-input','#receipt-status'],'receipt filename');
    await page.locator('#review-order').click();
    await page.locator('#send-whatsapp').waitFor();
    await fits(['.dialog','.dialog-body','.dialog-footer','.order-preview','.alert','.order-actions','#send-whatsapp'],'bank review');
    assert.match(await page.locator('.order-preview').textContent(),/Bank transfer/);
    await page.locator('#back-to-checkout').click();
    await page.locator('#payment').selectOption('Cash on delivery / collection (COD)');
    assert.equal(await page.locator('#bank-panel').isVisible(),false);
    await page.locator('#review-order').click();
    assert.match(await page.locator('.order-preview').textContent(),/Cash on delivery/);
    await fits(['.dialog','.dialog-body','.dialog-footer','.order-preview','.order-actions','#send-whatsapp'],'COD review');
    // Browser resize approximates a short visual viewport; all actions must remain reachable.
    if(width<=430){
      await page.setViewportSize({width,height:340});
      await page.locator('#back-to-checkout').scrollIntoViewIfNeeded();
      await page.locator('#back-to-checkout').click();
      await page.locator('#review-order').scrollIntoViewIfNeeded();
      await fits(['.dialog','.dialog-body','.dialog-footer','.checkout-form','.field-input','#review-order'],'short viewport');
    }
    assert.deepEqual(errors,[],width+'x'+height+' page errors');
    console.log('PASS '+width+'x'+height+' menu, customisation, cart, bank receipt and COD');
    await context.close();
  }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
