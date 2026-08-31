export function formatPrice(price: number, listingType: "sale" | "rent") {
  if (listingType === "rent") {
    return `₹${price.toLocaleString("en-IN")}/mo`;
  }
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(price % 10000000 === 0 ? 0 : 2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)} L`;
  }
  return `₹${price.toLocaleString("en-IN")}`;
}

export function propertyTypeLabel(type: string) {
  const map: Record<string, string> = {
    apartment: "Apartment",
    villa: "Villa",
    independent_house: "Independent House",
    plot: "Plot / Land",
    commercial: "Commercial",
  };
  return map[type] || type;
}
