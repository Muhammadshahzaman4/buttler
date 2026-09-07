const CART_KEY='zestwear-cart';
const WISH_KEY='zestwear-wishlist';
const STORE_WHATSAPP=''; // Add Zestwear WhatsApp number, e.g. 923001234567
let cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]');
let wishlist=JSON.parse(localStorage.getItem(WISH_KEY)||'[]');
const money=n=>`Rs. ${Number(n).toLocaleString('en-PK')}`;
const total=()=>cart.reduce((s,p)=>s+p.price*p.qty,0);
const save=()=>{localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart()};
const saveWish=()=>localStorage.setItem(WISH_KEY,JSON.stringify(wishlist));
function renderCart(){
 const count=cart.reduce((s,p)=>s+p.qty,0);document.querySelectorAll('.cart-btn b').forEach(x=>x.textContent=count);
 const items=document.querySelector('#cart-items');if(items)items.innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-item"><div><b>${p.name}</b><small>${money(p.price)} × ${p.qty}</small></div><div class="qty"><button data-minus="${i}">−</button><span>${p.qty}</span><button data-plus="${i}">+</button><button class="remove" data-remove="${i}">×</button></div></div>`).join(''):'<p class="empty-cart">Your cart is empty.</p>';
 const ct=document.querySelector('#cart-total');if(ct)ct.textContent=money(total());
}
function openCart(){document.querySelector('#cart-overlay').classList.add('show');document.body.classList.add('no-scroll')}
function closeCart(){document.querySelector('#cart-overlay').classList.remove('show');if(!document.querySelector('#checkout-modal')?.classList.contains('show'))document.body.classList.remove('no-scroll')}
function addToCart(name,price){const found=cart.find(p=>p.name===name);found?found.qty++:cart.push({name,price,qty:1});save();openCart()}
function toggleWish(name,button){wishlist.includes(name)?wishlist=wishlist.filter(x=>x!==name):wishlist.push(name);saveWish();button.textContent=wishlist.includes(name)?'♥':'♡';button.classList.toggle('liked',wishlist.includes(name));}
function openCheckout(){if(!cart.length){alert('Your cart is empty.');return}document.querySelector('#checkout-total').textContent=money(total());document.querySelector('#checkout-modal').classList.add('show');document.body.classList.add('no-scroll')}
function closeCheckout(){document.querySelector('#checkout-modal').classList.remove('show');if(!document.querySelector('#cart-overlay').classList.contains('show'))document.body.classList.remove('no-scroll')}
function submitOrder(e){
 e.preventDefault();const form=e.target,name=form.name.value.trim(),phone=form.phone.value.trim(),address=form.address.value.trim(),city=form.city.value.trim();
 if(!name||!phone||!address||!city){alert('Please complete all required delivery details.');return}
 const lines=cart.map(p=>`• ${p.name} × ${p.qty} — ${money(p.price*p.qty)}`).join('\n');
 const orderId='ZW-'+Date.now().toString().slice(-6);
 const message=`*New Zestwear COD Order*\n\nOrder ID: ${orderId}\nCustomer: ${name}\nPhone: ${phone}\nAddress: ${address}\nCity: ${city}\n\nOrder:\n${lines}\n\n*Total: ${money(total())}*\nPayment: Cash on Delivery`;
 const target=STORE_WHATSAPP?`https://wa.me/${STORE_WHATSAPP.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`:`https://wa.me/?text=${encodeURIComponent(message)}`;
 window.open(target,'_blank','noopener');localStorage.removeItem(CART_KEY);cart=[];closeCheckout();closeCart();renderCart();showSuccess(orderId,name);
}
function showSuccess(orderId,name){const el=document.querySelector('#success-modal');el.querySelector('.success-order').textContent=orderId;el.querySelector('.success-name').textContent=name;el.classList.add('show');document.body.classList.add('no-scroll')}
function closeSuccess(){document.querySelector('#success-modal').classList.remove('show');document.body.classList.remove('no-scroll')}
function setupSearch(){const search=document.querySelector('.nav-actions button[aria-label="Search"]');if(!search)return;search.addEventListener('click',()=>{const q=prompt('Search Zestwear products:');if(!q)return;const term=q.toLowerCase();let found=0;document.querySelectorAll('.product-card').forEach(card=>{const match=card.innerText.toLowerCase().includes(term);card.style.display=match?'':'none';if(match)found++});document.querySelector('#shop')?.scrollIntoView({behavior:'smooth'});if(!found)alert('No matching products found.')})}

document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.product-card').forEach(card=>{
  const name=card.querySelector('h3')?.textContent.trim(),raw=card.querySelector('.product-info strong')?.textContent.replace(/[^0-9]/g,'');if(!name||!raw)return;
  const heart=card.querySelector('.heart');if(heart){heart.onclick=()=>toggleWish(name,heart);heart.textContent=wishlist.includes(name)?'♥':'♡';heart.classList.toggle('liked',wishlist.includes(name))}
  const btn=document.createElement('button');btn.className='add-cart';btn.textContent='Add to Cart';btn.onclick=()=>addToCart(name,Number(raw));card.appendChild(btn);
  card.addEventListener('click',e=>{if(e.target.closest('button'))return;card.classList.toggle('selected-product')});
 });
 const overlay=document.createElement('div');overlay.id='cart-overlay';overlay.innerHTML=`<div class="cart-backdrop"></div><aside class="cart-panel"><div class="cart-head"><div><p class="eyebrow">YOUR BAG</p><h2>Shopping cart</h2></div><button id="cart-close" class="cart-close">×</button></div><div id="cart-items"></div><div class="cart-foot"><div class="cart-total"><span>Total</span><strong id="cart-total">Rs. 0</strong></div><button id="checkout" class="btn btn-dark checkout">Checkout →</button><p class="secure-note">Cash on Delivery available · Free delivery on orders over Rs. 5,000</p></div></aside>`;document.body.appendChild(overlay);
 const modal=document.createElement('div');modal.id='checkout-modal';modal.innerHTML=`<div class="checkout-backdrop"></div><section class="checkout-card"><div class="checkout-head"><div><p class="eyebrow">ORDER DETAILS</p><h2>Checkout</h2></div><button id="checkout-close" class="cart-close">×</button></div><div class="cod-box"><strong>💵 Cash on Delivery</strong><span>Pay when your order arrives.</span></div><form id="order-form"><label>Customer name *<input name="name" type="text" placeholder="Your full name" autocomplete="name" required></label><label>Phone number *<input name="phone" type="tel" placeholder="03XX XXXXXXX" autocomplete="tel" required></label><label>Delivery address *<textarea name="address" placeholder="House, street, area" rows="3" autocomplete="street-address" required></textarea></label><label>City *<input name="city" type="text" placeholder="Your city" autocomplete="address-level2" required></label><div class="checkout-summary"><span>Order total</span><strong id="checkout-total">Rs. 0</strong></div><button class="btn btn-dark place-order" type="submit">Place Order on WhatsApp →</button><p class="checkout-note">Your order details will open in WhatsApp. Please send the message to confirm your COD order.</p></form></section></div>`;document.body.appendChild(modal);
 const success=document.createElement('div');success.id='success-modal';success.innerHTML=`<div class="checkout-backdrop"></div><section class="success-card"><div class="success-icon">✓</div><p class="eyebrow">ORDER RECEIVED</p><h2>Thank you, <span class="success-name"></span>!</h2><p>Your COD order <strong class="success-order"></strong> is ready for WhatsApp confirmation.</p><button class="btn btn-dark" id="success-close">Continue shopping →</button></section>`;document.body.appendChild(success);
 document.querySelector('.cart-btn').addEventListener('click',openCart);document.querySelector('#cart-close').addEventListener('click',closeCart);document.querySelector('.cart-backdrop').addEventListener('click',closeCart);document.querySelector('#checkout').addEventListener('click',openCheckout);document.querySelector('#checkout-close').addEventListener('click',closeCheckout);document.querySelector('.checkout-backdrop').addEventListener('click',closeCheckout);document.querySelector('#order-form').addEventListener('submit',submitOrder);document.querySelector('#success-close').addEventListener('click',closeSuccess);document.querySelector('#success-modal .checkout-backdrop').addEventListener('click',closeSuccess);
 document.querySelector('#cart-items').addEventListener('click',e=>{const b=e.target;if(b.dataset.plus!==undefined)cart[b.dataset.plus].qty++;if(b.dataset.minus!==undefined){cart[b.dataset.minus].qty--;if(cart[b.dataset.minus].qty<=0)cart.splice(b.dataset.minus,1)}if(b.dataset.remove!==undefined)cart.splice(b.dataset.remove,1);save()});
 document.querySelector('main form')?.addEventListener('submit',e=>e.preventDefault());setupSearch();renderCart();
});