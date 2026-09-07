// Zestwear Shopify Storefront API configuration.
// Storefront API supports public product reads without exposing an Admin API secret.
const SHOPIFY_STORE_DOMAIN = 'zestwearstore.myshopify.com';
// Paste a Storefront API public access token here if your shop requires one.
// Never put a Shopify Admin API access token in frontend code.
const SHOPIFY_STOREFRONT_TOKEN = '';
const SHOPIFY_API_VERSION = '2026-01';
const SHOPIFY_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

async function shopifyRequest(query, variables = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (SHOPIFY_STOREFRONT_TOKEN) headers['X-Shopify-Storefront-Access-Token'] = SHOPIFY_STOREFRONT_TOKEN;
  const response = await fetch(SHOPIFY_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query, variables }) });
  if (!response.ok) throw new Error(`Shopify request failed (${response.status})`);
  const payload = await response.json();
  if (payload.errors?.length) throw new Error(payload.errors.map(error => error.message).join('; '));
  return payload.data;
}

async function getShopifyProduct(handle) {
  const query = `query Product($handle: String!) {
    product(handle: $handle) {
      id title handle descriptionHtml productType vendor availableForSale
      featuredImage { url altText width height }
      images(first: 20) { nodes { id url altText width height } }
      options { name optionValues { name swatch { color image { previewImage { url } } } } }
      variants(first: 100) { nodes {
        id title availableForSale quantityAvailable
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        image { url altText width height }
        selectedOptions { name value }
      } }
    }
  }`;
  const data = await shopifyRequest(query, { handle });
  return data.product;
}
