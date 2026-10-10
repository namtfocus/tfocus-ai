export function calculateQuote({ basePackagePrice, ownedItems = [], sourcedItems = [] }) {
  const inventoryRental = 0; // Owned items are included free of charge
  const sourcedCost = sourcedItems.reduce((acc, item) => acc + (item.cost || 0), 0);
  const total = basePackagePrice + inventoryRental + sourcedCost;

  return {
    basePackagePrice,
    inventoryRental,
    sourcedCost,
    total,
    mode: sourcedItems.length > 0 ? "ASSIST" : "AUTO"
  };
}
