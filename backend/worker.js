/**
 * Boot-Up private order API (Cloudflare Workers + D1).
 * Not active until a Worker, D1 binding and secrets are configured.
 * No receipts are uploaded: customers still share proof directly through WhatsApp.
 */
const json = (data, status=200, headers={}) => new Response(JSON.stringify(data), {
 status, headers: {'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}
});
const enc = new TextEncoder();
const hex = bytes => Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const safe = (x,n=200) => String(x??'').trim().slice(0,n);
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s+'T00:00:00Z'));
const refKey = s => safe(s,80).toUpperCase().replace(/[^A-Z0-9]/g,'');
const allowedOrigin = (request,env) => {
 const origin=request.headers.get('origin');
 const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 return origin && allowed.includes(origin) ? origin : null;
};
const headersFor = origin => origin ? {'access-control-allow-origin':origin,'vary':'Origin',
 'access-control-allow-methods':'GET,POST,PATCH,OPTIONS','access-control-allow-headers':'content-type,authorization'} : {};
async function hash(value) {return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))));}
async function hmac(secret,value) {
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value))));
}
async function validSession(request,env) {
 const token=(request.headers.get('authorization')||'').replace(/^Bearer /i,'');
 const [expiry,signature]=token.split('.');
 if(!/^\d{10,13}$/.test(expiry||'')||!signature||!env.SESSION_SECRET||Number(expiry)<Date.now())return false;
 const expected=await hmac(env.SESSION_SECRET,expiry);
 // Compare with constant-time byte loop.
 if(signature.length!==expected.length)return false;
 let diff=0;for(let i=0;i<expected.length;i++)diff|=signature.charCodeAt(i)^expected.charCodeAt(i);
 return diff===0;
}
async function parseBody(request) {
 if(Number(request.headers.get('content-length')||0)>25000)throw Error('Request too large');
 const raw=await request.text();
 if(raw.length>25000)throw Error('Request too large');
 return JSON.parse(raw);
}
async function checkTurnstile(token,request,env) {
 if(!env.TURNSTILE_SECRET)return false; // fail closed: no public submissions without anti-bot verification
 const form=new FormData();form.set('secret',env.TURNSTILE_SECRET);form.set('response',safe(token,4096));
 const ip=request.headers.get('CF-Connecting-IP');if(ip)form.set('remoteip',ip);
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form});
 const data=await response.json();return data.success===true;
}
async function rateLimit(request,env) {
 const ip=request.headers.get('CF-Connecting-IP')||'unknown';
 const key=await hash(ip+':orders');
 const now=Math.floor(Date.now()/1000),window=Math.floor(now/3600);
 await env.DB.prepare('INSERT INTO rate_limits(key,window_start,hits) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN window_start=excluded.window_start THEN hits+1 ELSE 1 END,window_start=excluded.window_start').bind(key,window).run();
 const row=await env.DB.prepare('SELECT hits FROM rate_limits WHERE key=?').bind(key).first();
 return (row?.hits||0)<=12;
}
function validate(o) {
 if(!o||typeof o!=='object'||Array.isArray(o))return 'Invalid order';
 if(safe(o.name,91).length<2||String(o.name||'').length>90)return 'Enter a valid name';
 if(!/^\+?[\d ()-]{7,25}$/.test(safe(o.phone,26)))return 'Enter a valid phone number';
 if(!isDate(o.pickupDate)||new Date(o.pickupDate+'T00:00:00Z').getUTCDay()!==5)return 'Select a Friday collection date';
 if(o.pickupDate<=new Date().toLocaleDateString('en-CA',{timeZone:'America/Jamaica'}))return 'Choose a future Friday';
 if(o.pickupTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(o.pickupTime))return 'Invalid collection time';
 if(!['bank','cash'].includes(o.payment))return 'Invalid payment method';
 if(o.payment==='bank' && (!/^[A-Za-z0-9][A-Za-z0-9 /._-]{4,79}$/.test(safe(o.transferReference,81))||String(o.transferReference).length>80))return 'Enter a valid bank reference';
 if(!Array.isArray(o.items)||o.items.length<1||o.items.length>50)return 'Invalid cart';
 if(o.items.some(i=>!i||!/^[-a-z0-9]{1,60}$/.test(i.id)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>99))return 'Invalid item';
 if(!Number.isSafeInteger(o.totalJmd)||o.totalJmd<1||o.totalJmd>10000000)return 'Invalid total';
 if(!['No known food allergies','Food allergy declared','Prefer to discuss with café'].includes(o.allergy))return 'Please provide allergy declaration';
 return null;
}
export default {async fetch(request,env) {
 const origin=allowedOrigin(request,env),cors=headersFor(origin);
 const url=new URL(request.url);
 if(request.method==='OPTIONS')return new Response(null,{status:origin?204:403,headers:cors});
 if(url.pathname==='/health' && request.method==='GET')return json({ok:true,configured:!!(env.DB&&env.TURNSTILE_SECRET&&env.ADMIN_PASSWORD&&env.SESSION_SECRET)},200,cors);
 if(!origin)return json({error:'Origin not allowed'},403,cors);
 if(!env.DB||!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return json({error:'Backend is not configured'},503,cors);
 try {
  if(url.pathname==='/api/admin/login' && request.method==='POST') {
   if(!await rateLimit(request,env))return json({error:'Too many attempts'},429,cors);
   const body=await parseBody(request);
   const actual=await hash(safe(body.password,256)),expected=await hash(env.ADMIN_PASSWORD);
   if(actual!==expected)return json({error:'Invalid credentials'},401,cors);
   const expiry=String(Date.now()+30*60*1000);
   return json({token:expiry+'.'+await hmac(env.SESSION_SECRET,expiry),expiresAt:Number(expiry)},200,cors);
  }
  if(url.pathname==='/api/orders' && request.method==='POST') {
   if(!await rateLimit(request,env))return json({error:'Too many requests; contact the café on WhatsApp'},429,cors);
   const body=await parseBody(request),error=validate(body);
   if(error)return json({error},400,cors);
   if(!await checkTurnstile(body.turnstileToken,request,env))return json({error:'Security check failed. Please try again.'},403,cors);
   const id='BU-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+hex(crypto.getRandomValues(new Uint8Array(5))).toUpperCase();
   const key=body.payment==='bank'?refKey(body.transferReference):null;
   const duplicate=key?await env.DB.prepare('SELECT id FROM orders WHERE reference_key=? LIMIT 1').bind(key).first():null;
   await env.DB.prepare(`INSERT INTO orders (id,customer_name,customer_phone,pickup_date,pickup_time,payment_method,transfer_reference,reference_key,total_jmd,items_json,allergy,allergy_details,notes,payment_status,flagged_duplicate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id,safe(body.name,90),safe(body.phone,25),body.pickupDate,safe(body.pickupTime,5)||null,body.payment,body.payment==='bank'?safe(body.transferReference,80):null,key,body.totalJmd,JSON.stringify(body.items).slice(0,10000),body.allergy,safe(body.allergyDescription,1000),safe(body.notes,1000),body.payment==='bank'?'pending':'cash_due',duplicate?1:0).run();
   return json({id,status:body.payment==='bank'?'pending_verification':'cash_due',message:'Order registered. You must still press Send in WhatsApp; café acceptance is not automatic.'},201,cors);
  }
  if(url.pathname==='/api/admin/orders' && request.method==='GET') {
   if(!await validSession(request,env))return json({error:'Unauthorized'},401,cors);
   const rows=await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100').all();
   return json({orders:rows.results},200,cors);
  }
  const match=url.pathname.match(/^\/api\/admin\/orders\/(BU-[A-Z0-9-]+)$/);
  if(match && request.method==='PATCH') {
   if(!await validSession(request,env))return json({error:'Unauthorized'},401,cors);
   const body=await parseBody(request);
   if(body.paymentStatus && !['pending','verified','rejected','cash_due'].includes(body.paymentStatus))return json({error:'Invalid payment status'},400,cors);
   if(body.orderStatus && !['requested','accepted','preparing','completed','cancelled'].includes(body.orderStatus))return json({error:'Invalid order status'},400,cors);
   if(!body.paymentStatus&&!body.orderStatus)return json({error:'No changes'},400,cors);
   const row=await env.DB.prepare('SELECT payment_method,payment_status FROM orders WHERE id=?').bind(match[1]).first();
   if(!row)return json({error:'Not found'},404,cors);
   if(body.paymentStatus==='verified'&&row.payment_method!=='bank')return json({error:'Cash orders cannot be marked bank verified'},400,cors);
   await env.DB.prepare('UPDATE orders SET payment_status=COALESCE(?,payment_status),order_status=COALESCE(?,order_status),verified_at=CASE WHEN ?=\'verified\' THEN datetime(\'now\') ELSE verified_at END WHERE id=?')
    .bind(body.paymentStatus||null,body.orderStatus||null,body.paymentStatus||null,match[1]).run();
   return json({ok:true},200,cors);
  }
  return json({error:'Not found'},404,cors);
 } catch(e) {return json({error:e instanceof SyntaxError?'Invalid JSON':'Unable to process request'},400,cors);}
}};
