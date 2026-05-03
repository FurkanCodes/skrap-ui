import type { Metadata } from "next";

type SearchParamValue = string | string[] | undefined;
type SearchParams = Promise<Record<string, SearchParamValue>>;

const DEFAULT_PRODUCT_NAME = "Dealvinci Test Item";
const DEFAULT_PRICE = "9999";
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_STOCK = "in_stock";

const STOCK_LABELS: Record<string, string> = {
  in_stock: "In stock",
  out_of_stock: "Out of stock",
  preorder: "Preorder",
  limited: "Limited stock",
};

function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: SearchParamValue, fallback: string): string {
  const text = firstParam(value)?.replace(/\s+/g, " ").trim();
  return text || fallback;
}

function cleanCurrency(value: SearchParamValue): string {
  const currency = cleanText(value, DEFAULT_CURRENCY).toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : DEFAULT_CURRENCY;
}

function cleanPrice(value: SearchParamValue): string {
  const raw = cleanText(value, DEFAULT_PRICE).replace(/[^\d.,]/g, "");
  const normalized =
    raw.includes(",") && !raw.includes(".") ? raw.replace(",", ".") : raw.replace(/,/g, "");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    return DEFAULT_PRICE;
  }
  return amount.toFixed(2).replace(/\.00$/, "");
}

function cleanStock(value: SearchParamValue): string {
  const stock = cleanText(value, DEFAULT_STOCK).toLowerCase();
  return STOCK_LABELS[stock] ? stock : DEFAULT_STOCK;
}

function includeNoise(value: SearchParamValue): boolean {
  return cleanText(value, "false").toLowerCase() === "true";
}

function formatPrice(amount: string, currency: string): string {
  const numeric = Number.parseFloat(amount);
  if (!Number.isFinite(numeric)) {
    return `${amount} ${currency}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount.includes(".") ? 2 : 0,
  }).format(numeric);
}

function getAvailabilityUrl(stock: string): string {
  return stock === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";
}

function buildProduct(searchParams: Record<string, SearchParamValue>) {
  const name = cleanText(searchParams.name, DEFAULT_PRODUCT_NAME);
  const price = cleanPrice(searchParams.price);
  const currency = cleanCurrency(searchParams.currency);
  const stock = cleanStock(searchParams.stock);
  const displayPrice = formatPrice(price, currency);
  const noisy = includeNoise(searchParams.include_noise);

  return {
    name,
    price,
    currency,
    stock,
    displayPrice,
    noisy,
    availability: getAvailabilityUrl(stock),
    stockLabel: STOCK_LABELS[stock],
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const product = buildProduct(await searchParams);

  return {
    title: `${product.name} | Dealvinci Test Product`,
    description: `Debug product page for Dealvinci tracking tests at ${product.displayPrice}.`,
    openGraph: {
      title: product.name,
      description: `${product.displayPrice}, ${product.stockLabel}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: product.name,
      description: `${product.displayPrice}, ${product.stockLabel}`,
    },
    other: {
      "product:price:amount": product.price,
      "product:price:currency": product.currency,
      "og:price:amount": product.price,
      "og:price:currency": product.currency,
      "twitter:data1": product.displayPrice,
      "twitter:label1": "Price",
    },
  };
}

export default async function TestProductPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const product = buildProduct(await searchParams);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: "Dealvinci debug product for end-to-end tracking tests.",
    sku: "dealvinci-debug-test-item",
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.availability,
      url: "https://dealvinci.com/debug/test-product",
    },
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <meta property="product:price:amount" content={product.price} />
      <meta property="product:price:currency" content={product.currency} />
      <meta property="og:price:amount" content={product.price} />
      <meta property="og:price:currency" content={product.currency} />
      <meta name="twitter:data1" content={product.displayPrice} />
      <meta itemProp="price" content={product.price} />
      <meta itemProp="priceCurrency" content={product.currency} />

      <section className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-7">
          <div className="inline-flex rounded-md border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
            Dealvinci debug product
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
              {product.name}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Stable synthetic product page for extension and backend tracker tests.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              data-testid="product-price"
              className="price text-4xl font-semibold tabular-nums"
              itemProp="price"
              content={product.price}
            >
              {product.displayPrice}
            </span>
            <span className="rounded-md bg-secondary px-3 py-1 text-sm text-secondary-foreground">
              {product.stockLabel}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="aspect-square rounded-md bg-[linear-gradient(135deg,oklch(0.94_0.02_228),oklch(0.98_0.006_255))] p-6">
            <div className="flex h-full flex-col justify-between rounded-md border border-border bg-background/75 p-5">
              <span className="text-sm text-muted-foreground">TEST SKU</span>
              <div>
                <p className="text-2xl font-semibold">{product.name}</p>
                <p className="mt-2 text-muted-foreground">{product.currency}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {product.noisy ? (
        <section className="mx-auto mt-12 grid max-w-5xl gap-4 text-sm text-muted-foreground md:grid-cols-3">
          <p className="rounded-md border border-border p-4">Old price: 12,345 USD</p>
          <p className="rounded-md border border-border p-4">Shipping estimate: 49 EUR</p>
          <p className="rounded-md border border-border p-4">Coupon preview: 250 TL</p>
        </section>
      ) : null}
    </main>
  );
}
