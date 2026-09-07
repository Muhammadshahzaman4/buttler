const SHOPIFY_DOMAIN='zestwearstore.myshopify.com';
const SHOPIFY_API_VERSION='2026-07';
const SHOPIFY_ENDPOINT=`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const CART_KEY='zestwear-cart';
const WISH_KEY='zestwear-wishlist';
let cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
let wishlist=JSON.parse(localStorage.getItem(WISH_KEY)||'[]');
const money=n=>`Rs. ${Number(n).toLocaleString('en-PK')}`;
const total=()=>cart.reduce((s,p)=>s+p.price*p.qty,0);
const save=()=>{localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart()};
const saveWish=()=>localStorage.setItem(WISH_KEY,JSON.stringify(wishlist));

async function shopify(query,variables={}){
 const r=await fetch(SHOPIFY_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,variables})});
 const j=await r.json();
 if(j.errors)throw new Error(j.errors.map(e=>e.message).join(', '));
 return j.data;
}

async function loadShopifyProducts(){
 const grid=document.querySelector('.product-grid');
 if(!grid)return;
 const query=`query Products($first:Int!){products(first:$first,sortKey:CREATED_AT,reverse:true){nodes{id title handle description images(first:1){nodes{url altText}} variants(first:20){nodes{id title price{amount currencyCode} availableForSale selectedOptions{name value}}}}}}`;
 try{
  const data=await shopify(query,{first:24});
  const products=data.products.nodes||[];
  if(!products.length)return;
  grid.innerHTML=products.map((p,i)=>{
   const v=p.variants.nodes.find(x=>x.availableForSale)||p.variants.nodes[0];
   if(!v)return '';
   const img=p.images.nodes[0];
   const price=Number(v.price.amount);
   return `<article class="product-card shopify-product" data-product-id="${p.id}" data-variant-id="${v.id}" data-price="${price}">
    <div class="product-image shopify-image">${img?`<img src="${img.url}" alt="${img.altText||p.title}" loading="lazy">`:''}<button class="heart" aria-label="Wishlist">♡</button></div>
    <div class="product-info"><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(v.title==='Default Title'?(p.description||'Zestwear collection'):v.title)}</p></div><strong>${money(price)}</strong></div>
    <div class="rating">${p.variants.nodes.length>1?`${p.variants.nodes.length} options`:'Zestwear'}</div>
   </article>`;
  }).join('');
  setupProducts();
 }catch(err){console.warn('Shopify products could not be loaded:',err)}
}

function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setupProducts(){
 document.querySelectorAll('.product-card').forEach(card=>{
  if(card.dataset.cartReady)return;
  card.dataset.cartReady='1';
  const name=card.querySelector('h3')?.textContent.trim();
  const variantId=card.dataset.variantId;
  const raw=card.dataset.price||card.querySelector('.product-info strong')?.textContent.replace(/[^0-9.]/g,'');
  if(!name||!raw)return;
  const price=Number(raw);
  const heart=card.querySelector('.heart');
  if(heart){heart.onclick=e=>{e.stopPropagation();toggleWish(name,heart)};heart.textContent=wishlist.includes(name)?'♥':'♡';heart.classList.toggle('liked',wishlist.includes(name))}
  const btn=document.createElement('button');btn.className='add-cart';btn.textContent='Add to Cart';btn.onclick=e=>{e.stopPropagation();addToCart(name,price,variantId)};card.appendChild(btn);
 });
}

function renderCart(){
 const count=cart.reduce((s,p)=>s+p.qty,0);document.querySelectorAll('.cart-btn b').forEach(x=>x.textContent=count);
 const items=document.querySelector('#cart-items');
 if(items)items.innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-item"><div><b>${escapeHtml(p.name)}</b><small>${money(p.price)} × ${p.qty}</small></div><div class="qty"><button data-minus="${i}">−</button><span>${p.qty}</span><button data-plus="${i}">+</button><button class="remove" data-remove="${i}">×</button></div></div>`).join(''):'<p class="empty-cart">Your cart is empty.</p>';
 const ct=document.querySelector('#cart-total');if(ct)ct.textContent=money(total());
}
function openCart(){document.querySelector('#cart-overlay').classList.add('show');document.body.classList.add('no-scroll')}
function closeCart(){document.querySelector('#cart-overlay').classList.remove('show');if(!document.querySelector('#checkout-modal')?.classList.contains('show'))document.body.classList.remove('no-scroll')}
function addToCart(name,price,variantId){const found=cart.find(p=>p.name===name&&p.variantId===variantId);found?found.qty++:cart.push({name,price,qty:1,variantId:variantId||''});save();openCart()}
function toggleWish(name,button){wishlist.includes(name)?wishlist=wishlist.filter(x=>x!==name):wishlist.push(name);saveWish();button.textContent=wishlist.includes(name)?'♥':'♡';button.classList.toggle('liked',wishlist.includes(name))}

async function shopifyCheckout(){
 if(!cart.length){alert('Your cart is empty.');return}
 const valid=cart.filter(p=>p.variantId);
 if(!valid.length){alert('Please add a Shopify product to your cart first.');return}
 const lines=valid.map(p=>({merchandiseId:p.variantId,quantity:p.qty}));
 const mutation=`mutation CartCreate($input:CartInput){cartCreate(input:$input){cart{id checkoutUrl}userErrors{field message}}}`;
 try{
  const data=await shopify(mutation,{input:{lines}});
  const errors=data.cartCreate.userErrors||[];
  if(errors.length)throw new Error(errors.map(e=>e.message).join(', '));
  localStorage.removeItem(CART_KEY);cart=[];renderCart();closeCart();
  window.location.href=data.cartCreate.cart.checkoutUrl;
 }catch(err){alert(`Shopify checkout error: ${err.message}`)}
}

function setupSearch(){
 const search=document.querySelector('.nav-actions button[aria-label="Search"]');if(!search)return;
 search.addEventListener('click',()=>{const q=prompt('Search Zestwear products:');if(!q)return;const term=q.toLowerCase();let found=0;document.querySelectorAll('.product-card').forEach(card=>{const match=card.innerText.toLowerCase().includes(term);card.style.display=match?'':'none';if(match)found++});document.querySelector('#shop')?.scrollIntoView({behavior:'smooth'});if(!found)alert('No matching products found.')})
}

document.addEventListener('DOMContentLoaded',()=>{
 setupProducts();
 const overlay=document.createElement('div');overlay.id='cart-overlay';overlay.innerHTML=`<div class="cart-backdrop"></div><aside class="cart-panel"><div class="cart-head"><div><p class="eyebrow">YOUR BAG</p><h2>Shopping cart</h2></div><button id="cart-close" class="cart-close">×</button></div><div id="cart-items"></div><div class="cart-foot"><div class="cart-total"><span>Total</span><strong id="cart-total">Rs. 0</strong></div><button id="checkout" class="btn btn-dark checkout">Checkout with Shopify →</button><p class="secure-note">Secure checkout powered by Shopify · Shipping and payment options are shown at checkout.</p></div></aside>`;document.body.appendChild(overlay);
 document.querySelector('.cart-btn').addEventListener('click',openCart);document.querySelector('#cart-close').addEventListener('click',closeCart);document.querySelector('.cart-backdrop').addEventListener('click',closeCart);document.querySelector('#checkout').addEventListener('click',shopifyCheckout);
 document.querySelector('#cart-items').addEventListener('click',e=>{const b=e.target;if(b.dataset.plus!==undefined)cart[b.dataset.plus].qty++;if(b.dataset.minus!==undefined){cart[b.dataset.minus].qty--;if(cart[b.dataset.minus].qty<=0)cart.splice(b.dataset.minus,1)}if(b.dataset.remove!==undefined)cart.splice(b.dataset.remove,1);save()});
 document.querySelector('main form')?.addEventListener('submit',e=>e.preventDefault());setupSearch();renderCart();loadShopifyProducts();
});