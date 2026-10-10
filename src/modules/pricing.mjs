import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const promotionsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/promotions.json");

export class PricingEngine {
  constructor({ promotionsFile = promotionsPath } = {}) {
    this.promotionsFile = promotionsFile;
  }

  checkPromotions({ slotStart, now = new Date() } = {}) {
    const { promotions } = JSON.parse(fs.readFileSync(this.promotionsFile, "utf8"));
    const date = slotStart ? new Date(slotStart) : now;
    const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];
    const minutes = date.getHours() * 60 + date.getMinutes();
    return promotions.filter((promotion) => {
      if (!promotion.active || !promotion.days.includes(day)) return false;
      const [sh, sm] = promotion.startTime.split(":").map(Number);
      const [eh, em] = promotion.endTime.split(":").map(Number);
      return minutes >= sh * 60 + sm && minutes <= eh * 60 + em;
    });
  }

  calculateConceptQuote({ concept, addOns = [], slotStart, applyPromotions = true }) {
    if (!concept?.code || !Number.isFinite(concept.basePrice)) {
      throw new Error("A valid catalog concept is required");
    }
    const addOnTotal = addOns.reduce((sum, item) => sum + item.amount, 0);
    const promotions = applyPromotions ? this.checkPromotions({ slotStart }) : [];
    const discount = promotions.reduce((sum, promotion) => sum + (promotion.discountType === "fixed" ? promotion.discountValue : 0), 0);
    const finalPrice = Math.max(0, concept.basePrice + addOnTotal - discount);
    return {
      type: "TFOCUS_CONCEPT",
      conceptCode: concept.code,
      basePrice: concept.basePrice,
      addOns,
      addOnTotal,
      promotions,
      discount,
      finalPrice,
      currency: "VND",
      status: "DRAFT"
    };
  }

  calculateExternalQuote({ baseShootPrice, purchaseItems = [], rentalItems = [], addOns = [], discount = 0 }) {
    const unresolved = [...purchaseItems, ...rentalItems].filter((item) => !["OWNED", "SOURCED", "APPROVED_ALTERNATIVE"].includes(item.status));
    if (unresolved.length) {
      return { quoteAllowed: false, status: "BLOCKED_UNRESOLVED_ITEMS", unresolved };
    }
    const purchaseCost = purchaseItems.filter((item) => item.status !== "OWNED").reduce((sum, item) => sum + item.cost, 0);
    const rentalCost = rentalItems.reduce((sum, item) => sum + item.cost, 0);
    const addOnTotal = addOns.reduce((sum, item) => sum + item.amount, 0);
    return {
      quoteAllowed: true,
      type: "TFocus_EXTERNAL",
      basePrice: baseShootPrice,
      purchaseCost,
      purchaseCustomerCharge: Math.round(purchaseCost * 0.8),
      rentalCost,
      addOnTotal,
      discount,
      finalPrice: baseShootPrice + Math.round(purchaseCost * 0.8) + rentalCost + addOnTotal - discount,
      currency: "VND",
      status: "DRAFT"
    };
  }
}
