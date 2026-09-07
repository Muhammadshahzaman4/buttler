const CART_KEY='zestwear-cart';
let cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]');

function money(n){return `Rs. ${n.toLocaleString('en-PK')}`}
function save(){localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart()}
function renderCart(){
  const count=cart.reduce((s,p)=>s+p.qty,0), total=cart.reduce((s,p)=>s+p.price*p.qty,0);
  document.querySelectorAll('.cart-btn b').forEach(x=>x.textContent=count);
  const items=document.querySelector('#cart-items'); if(!items)return;
  items.innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-item"><div><b>${p.name}</b><small>${money(p.price)} × ${p.qty}</small></div><div class="qty"><button data-minus="${i}">−</button><span>${p.qty}</span><button data-plus="${i}">+</button><button class="remove" data-remove="${i}">×</button></div></div>`).join(''):'<p class="empty-cart">Your cart is empty.</p>';
  document.querySelector('#cart-total').textContent=money(total);
}
function openCart(){document.querySelector('#cart-overlay').classList.add('show');document.body.classList.add('no-scroll')}
function closeCart(){document.querySelector('#cart-overlay').classList.remove('show');document.body.classList.remove('no-scroll')}
function addToCart(name,price){
  const found=cart.find(p=>p.name===name); found?found.qty++:cart.push({name,price,qty:1});
  save(); openCart();
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.product-card').forEach(card=>{
    const name=card.querySelector('h3')?.textContent.trim();
    const raw=card.querySelector('.product-info strong')?.textContent.replace(/[^0-9]/g,'');
    if(!name||!raw)return;
    const btn=document.createElement('button');btn.className='add-cart';btn.textContent='Add to Cart';
    btn.onclick=()=>addToCart(name,Number(raw));card.appendChild(btn);
  });

  const overlay=document.createElement('div');overlay.id='cart-overlay';overlay.innerHTML=`<div class="cart-backdrop"></div><aside class="cart-panel"><div class="cart-head"><div><p class="eyebrow">YOUR BAG</p><h2>Shopping cart</h2></div><button id="cart-close" class="cart-close">×</button></div><div id="cart-items"></div><div class="cart-foot"><div class="cart-total"><span>Total</span><strong id="cart-total">Rs. 0</strong></div><button id="checkout" class="btn btn-dark checkout">Checkout →</button><p class="secure-note">Demo checkout · Connect your payment system later</p></div></aside>`;
  document.body.appendChild(overlay);
  document.querySelector('.cart-btn').addEventListener('click',openCart);
  document.querySelector('#cart-close').addEventListener('click',closeCart);
  document.querySelector('.cart-backdrop').addEventListener('click',closeCart);
  document.querySelector('#checkout').addEventListener('click',()=>alert(cart.length?'Checkout is ready for payment integration.':'Your cart is empty.'));
  document.querySelector('#cart-items').addEventListener('click',e=>{
    const b=e.target;if(b.dataset.plus!==undefined)cart[b.dataset.plus].qty++;if(b.dataset.minus!==undefined){cart[b.dataset.minus].qty--;if(cart[b.dataset.minus].qty<=0)cart.splice(b.dataset.minus,1)}if(b.dataset.remove!==undefined)cart.splice(b.dataset.remove,1);save();
  });
  document.querySelector('form')?.addEventListener('submit',e=>e.preventDefault());
  renderCart();
});