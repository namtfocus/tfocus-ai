import { ConceptCatalog } from "./modules/catalog.mjs";
import { BookingService } from "./modules/booking.mjs";
import { handoffToHuman } from "./modules/handoff.mjs";
import { PricingEngine } from "./modules/pricing.mjs";
import { MODES, STATES, transition } from "./domain/state.mjs";

const humanSignals = ["gặp nhân viên", "người thật", "tư vấn viên", "khiếu nại", "bực mình", "hoàn tiền", "thanh toán lỗi"];
const categoryAliases = {
  birthday: "birthday", sinhnhat: "birthday", "sinh nhật": "birthday",
  "nàng thơ": "feminine", feminine: "feminine", beauty: "beauty", couple: "couple",
  profile: "profile", pregnancy: "pregnancy", "mang thai": "pregnancy", graduation: "graduation", "tốt nghiệp": "graduation"
};

export class TFocusOrchestrator {
  constructor({ store, catalog = new ConceptCatalog(), pricing = new PricingEngine(), booking = new BookingService(store), defaultMode = MODES.ASSIST } = {}) {
    this.store = store;
    this.catalog = catalog;
    this.pricing = pricing;
    this.booking = booking;
    this.defaultMode = defaultMode;
  }

  setMode(conversationId, mode) {
    if (!Object.values(MODES).includes(mode)) throw new Error(`Unsupported mode: ${mode}`);
    const conversation = this.store.getConversation(conversationId);
    conversation.mode = mode;
    this.store.auditEvent({ type: "mode_changed", conversationId, mode });
    return conversation;
  }

  handleMessage({ conversationId, text, customerId = null }) {
    const conversation = this.store.getConversation(conversationId);
    conversation.customerId = customerId ?? conversation.customerId;
    conversation.updatedAt = new Date().toISOString();
    const normalized = String(text ?? "").trim().toLowerCase();

    if (humanSignals.some((signal) => normalized.includes(signal))) {
      return handoffToHuman(this.store, { conversationId, reason: "human_signal_or_risk", priority: /bực|khiếu nại|lỗi/.test(normalized) ? "urgent" : "normal" });
    }
    if (conversation.mode === MODES.HUMAN) return { success: true, status: "human_mode", state: conversation.state };

    const categoryId = Object.entries(categoryAliases).find(([alias]) => normalized.includes(alias))?.[1];
    if (categoryId) {
      conversation.categoryId = categoryId;
      const next = transition(conversation.state, "category_identified") ?? STATES.SEND_CONCEPT_OPTIONS;
      conversation.state = next;
      const concepts = this.catalog.getConcepts({ categoryId, limit: 10 });
      conversation.state = STATES.WAIT_CONCEPT_SELECTION;
      this.store.auditEvent({ type: "gallery_sent", conversationId, categoryId, count: concepts.length });
      return {
        success: true,
        intent: "concept_discovery",
        state: conversation.state,
        categoryId,
        albumUrl: this.catalog.getCategories().find((category) => category.id === categoryId)?.albumUrl ?? "",
        concepts: concepts.map((concept) => ({ code: concept.code, name: concept.name, description: concept.description, images: concept.images.slice(0, 10) }))
      };
    }

    const code = text?.match(/\b(?:BD|CP|NT|BE|PR|PG|GR)-\d{3}\b/i)?.[0];
    if (code) {
      const concept = this.catalog.getConcept(code);
      if (!concept) return { success: false, state: conversation.state, message: "Chưa tìm thấy mã concept này trong catalog; cần nhân viên kiểm tra giúp bạn ạ." };
      conversation.conceptCode = concept.code;
      conversation.state = STATES.ANALYZE_SELECTION;
      const quote = this.pricing.calculateConceptQuote({ concept, applyPromotions: false });
      const quoteId = this.store.id("quote");
      const storedQuote = { id: quoteId, conversationId, ...quote, createdAt: new Date().toISOString() };
      this.store.quotes.set(quoteId, storedQuote);
      conversation.quoteId = quoteId;
      conversation.state = STATES.QUOTE_SENT;
      this.store.auditEvent({ type: "quote_created", conversationId, quoteId, conceptCode: concept.code });
      return { success: true, intent: "concept_selected", state: conversation.state, concept, quote: storedQuote, mode: conversation.mode };
    }

    if (/giá|bao nhiêu|price/.test(normalized) && !conversation.conceptCode) {
      conversation.state = STATES.DISCOVER_CONCEPT;
      return { success: true, intent: "ask_concept", state: conversation.state, message: "Dạ mình đang muốn chụp concept theo phong cách/thể loại nào nè? Sốp xem đúng mẫu rồi báo giá chuẩn cho mình nha 😚" };
    }

    if (/đồng ý|chốt|ok|đặt lịch/.test(normalized) && conversation.quoteId) {
      conversation.state = STATES.ASK_DATE;
      return { success: true, intent: "ask_date", state: conversation.state, message: "Dạ mình dự định chụp ngày nào nè, sốp kiểm tra lịch trống cho mình nha 😚" };
    }

    conversation.state = conversation.state === STATES.NEW_LEAD ? STATES.DISCOVER_CONCEPT : conversation.state;
    return { success: true, intent: "general_sales", state: conversation.state, message: "Dạ mình muốn chụp dịp nào và thích phong cách như thế nào ạ?" };
  }

  tool(name, args = {}) {
    switch (name) {
      case "get_categories": return { success: true, data: this.catalog.getCategories() };
      case "get_concepts": return { success: true, data: this.catalog.getConcepts(args) };
      case "get_concept": return { success: true, data: this.catalog.getConcept(args.code) };
      case "get_concept_images": return { success: true, data: this.catalog.getImages(args.code) };
      case "calculate_quote": {
        const concept = this.catalog.getConcept(args.conceptCode);
        return { success: true, data: this.pricing.calculateConceptQuote({ concept, addOns: args.addOns, slotStart: args.slotStart, applyPromotions: args.applyPromotions !== false }) };
      }
      case "check_promotions": return { success: true, data: this.pricing.checkPromotions(args) };
      case "get_available_slots": return { success: true, data: this.booking.getAvailableSlots(args) };
      case "create_booking_hold": return this.booking.createHold(args);
      case "create_payment_request": return this.booking.createPaymentRequest(args);
      case "payment_evidence_received": return this.booking.receivePaymentEvidence(args);
      case "confirm_payment_manual": return this.booking.confirmPayment(args);
      case "create_booking": return this.booking.createBooking(args);
      case "handoff_to_human": return handoffToHuman(this.store, args);
      default: return { success: false, error: `Unknown TFocus tool: ${name}` };
    }
  }
}
