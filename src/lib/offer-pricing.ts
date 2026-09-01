export function toAmount(value: string | number | null | undefined) {
  return Math.max(0, Number(value) || 0);
}

export function discountAmountFromLegacy({
  price,
  oldPrice,
  discountAmount,
}: {
  price: string | number | null | undefined;
  oldPrice?: string | number | null;
  discountAmount?: string | number | null;
}) {
  const explicit = toAmount(discountAmount);
  if (explicit > 0) return String(explicit);

  const currentPrice = toAmount(price);
  const previousPrice = toAmount(oldPrice);
  return previousPrice > currentPrice ? String(previousPrice - currentPrice) : "";
}

export function originalPriceFromOffer({
  price,
  oldPrice,
  discountAmount,
}: {
  price: string | number | null | undefined;
  oldPrice?: string | number | null;
  discountAmount?: string | number | null;
}) {
  const previousPrice = toAmount(oldPrice);
  if (previousPrice > 0) return String(previousPrice);

  const salePrice = toAmount(price);
  const amount = toAmount(discountAmount);
  return String(salePrice + amount);
}

export function offerPreview(price: string | number, discountAmount: string | number) {
  const originalPrice = toAmount(price);
  const amount = Math.min(toAmount(discountAmount), originalPrice);
  const salePrice = Math.max(0, originalPrice - amount);
  const oldPrice = originalPrice > 0 && amount > 0 ? originalPrice : 0;
  const percent = originalPrice > 0 && amount > 0 ? (amount / originalPrice) * 100 : 0;

  return {
    originalPrice,
    salePrice,
    discountAmount: amount,
    oldPrice,
    percent,
    hasOffer: originalPrice > salePrice && amount > 0,
  };
}

export function formatBanglaMoney(value: number) {
  if (!value) return "৳০";
  return `৳${value.toLocaleString("bn-BD", { maximumFractionDigits: 2 })}`;
}
