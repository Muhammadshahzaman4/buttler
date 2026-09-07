const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
const productMoney = (amount, currency='PKR') => `${currency === 'PKR' ? 'Rs. ' : currency + ' '}${Number(amount).toLocaleString('en-PK')}`;

function getHandle() {
  return new URLSearchParams(location.search).get('handle') || location.pathname.split('/').filter(Boolean).pop();
}

function selectedVariant(product, selections) {
  return product.variants.nodes.find(variant => variant.selectedOptions.every(option => selections[option.name] === option.value)) || null;
}

function renderProduct(product) {
  const root = document.querySelector('#product-detail');
  const images = product.images.nodes.length ? product.images.nodes : (product.featuredImage ? [product.featuredImage] : []);
  const firstVariant = product.variants.nodes.find(v => v.availableForSale) || product.variants.nodes[0];
  const selections = Object.fromEntries((firstVariant?.selectedOptions || []).map(o => [o.name, o.value]));
  let currentImage = firstVariant?.image?.url || product.featuredImage?.url || images[0]?.url || '';

  root.innerHTML = `
    <div class="product-gallery">
      <div class="product-thumbs">${images.map((image, index) => `<button class="product-thumb ${index === 0 ? 'active' : ''}" data-image="${esc(image.url)}"><img src="${esc(image.url)}" alt="${esc(image.altText || product.title)}" loading="${index ? 'lazy' : 'eager'}"></button>`).join('')}</div>
      <div class="product-main-image"><img id="product-main-img" src="${esc(currentImage)}" alt="${esc(product.featuredImage?.altText || product.title)}"></div>
    </div>
    <div class="product-info-panel">
      <p class="eyebrow">${esc(product.productType || 'ZESTWEAR')}</p>
      <h1>${esc(product.title)}</h1>
      <div class="product-price" id="product-price">${productMoney(firstVariant?.price?.amount || product.priceRange?.minVariantPrice?.amount || 0, firstVariant?.price?.currencyCode || 'PKR')}</div>
      <div class="product-rating">★ 4.8 <span>· 124 reviews</span></div>
      <div class="product-divider"></div>
      ${product.options.map(option => `<div class="option-group" data-option="${esc(option.name)}"><div class="option-label"><strong>${esc(option.name)}</strong><span id="selected-${esc(option.name).replace(/\s+/g,'-')}">${esc(selections[option.name] || '')}</span></div><div class="option-values">${option.optionValues.map(value => `<button class="option-value ${selections[option.name] === value.name ? 'selected' : ''}" data-option-name="${esc(option.name)}" data-option-value="${esc(value.name)}" ${!product.variants.nodes.some(v => v.availableForSale && v.selectedOptions.find(o => o.name === option.name)?.value === value.name) ? 'disabled' : ''}>${esc(value.name)}</button>`).join('')}</div></div>`).join('')}
      <div class="size-help">Free delivery on orders over Rs. 5,000</div>
      <button id="product-add" class="product-add-btn" ${!firstVariant?.availableForSale ? 'disabled' : ''}>${firstVariant?.availableForSale ? 'Add to cart' : 'Sold out'}</button>
      <div class="product-details"><details open><summary>Description</summary><div>${product.descriptionHtml || `<p>${esc(product.title)} — premium Zestwear essential.</p>`}</div></details><details><summary>Shipping & returns</summary><p>Cash on Delivery is available. Delivery and return terms can be updated in your Shopify store policies.</p></details></div>
    </div>`;
  root.hidden = false;
  document.querySelector('#product-loading').hidden = true;
  document.title = `Zestwear — ${product.title}`;

  const mainImage = document.querySelector('#product-main-img');
  document.querySelectorAll('.product-thumb').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.product-thumb').forEach(item => item.classList.remove('active'));
    button.classList.add('active'); mainImage.src = button.dataset.image;
  }));

  function refreshVariant() {
    const variant = selectedVariant(product, selections);
    if (!variant) return;
    document.querySelector('#product-price').textContent = productMoney(variant.price.amount, variant.price.currencyCode);
    const button = document.querySelector('#product-add');
    button.disabled = !variant.availableForSale;
    button.textContent = variant.availableForSale ? 'Add to cart' : 'Sold out';
    if (variant.image?.url) mainImage.src = variant.image.url;
    product.options.forEach(option => { const label = document.querySelector(`#selected-${option.name.replace(/\s+/g,'-')}`); if(label) label.textContent = selections[option.name] || ''; });
  }

  document.querySelectorAll('.option-value').forEach(button => button.addEventListener('click', () => {
    selections[button.dataset.optionName] = button.dataset.optionValue;
    document.querySelectorAll(`.option-value[data-option-name="${CSS.escape(button.dataset.optionName)}"]`).forEach(item => item.classList.remove('selected'));
    button.classList.add('selected'); refreshVariant();
  }));

  document.querySelector('#product-add').addEventListener('click', () => {
    const variant = selectedVariant(product, selections) || firstVariant;
    if (!variant?.availableForSale) return;
    const existing = JSON.parse(localStorage.getItem('zestwear-cart') || '[]');
    const key = variant.id;
    const found = existing.find(item => item.variantId === key);
    const item = { variantId: key, name: product.title + (variant.title && variant.title !== 'Default Title' ? ` — ${variant.title}` : ''), price: Number(variant.price.amount), qty: 1, image: variant.image?.url || product.featuredImage?.url || '' };
    if (found) found.qty += 1; else existing.push(item);
    localStorage.setItem('zestwear-cart', JSON.stringify(existing));
    window.location.href = 'index.html#shop';
  });
}

(async () => {
  try {
    const handle = getHandle();
    if (!handle || handle === 'product.html') throw new Error('Missing product handle');
    const product = await getShopifyProduct(handle);
    if (!product) throw new Error('Product not found');
    renderProduct(product);
  } catch (error) {
    console.error(error);
    document.querySelector('#product-loading').hidden = true;
    document.querySelector('#product-error').hidden = false;
  }
})();
