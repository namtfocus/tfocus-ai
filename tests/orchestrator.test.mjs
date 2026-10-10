import test from "node:test";
import assert from "node:assert/strict";
import { MemoryStore } from "../src/domain/store.mjs";
import { STATES } from "../src/domain/state.mjs";
import { TFocusOrchestrator } from "../src/orchestrator.mjs";
import { BookingService } from "../src/modules/booking.mjs";
import { PricingEngine } from "../src/modules/pricing.mjs";

function createSystem() {
  const store = new MemoryStore();
  return { store, orchestrator: new TFocusOrchestrator({ store }), booking: new BookingService(store) };
}

test("hỏi giá chưa có concept phải hỏi thể loại, không quote", () => {
  const { orchestrator } = createSystem();
  const result = orchestrator.handleMessage({ conversationId: "c1", text: "Giá bao nhiêu vậy shop?" });
  assert.equal(result.state, STATES.DISCOVER_CONCEPT);
  assert.equal(result.intent, "ask_concept");
});

test("birthday gửi gallery và concept code", () => {
  const { orchestrator } = createSystem();
  const result = orchestrator.handleMessage({ conversationId: "c2", text: "Em muốn chụp birthday tông trắng" });
  assert.equal(result.state, STATES.WAIT_CONCEPT_SELECTION);
  assert.equal(result.categoryId, "birthday");
  assert.ok(result.concepts.some((item) => item.code === "BD-001"));
});

test("chọn concept lấy giá từ catalog và lưu quote", () => {
  const { orchestrator, store } = createSystem();
  const result = orchestrator.handleMessage({ conversationId: "c3", text: "Em thích BD-001" });
  assert.equal(result.state, STATES.QUOTE_SENT);
  assert.equal(result.quote.finalPrice, 1500000);
  assert.equal(store.quotes.size, 1);
});

test("external quote bị chặn khi còn unresolved", () => {
  const pricing = new PricingEngine();
  const result = pricing.calculateExternalQuote({ baseShootPrice: 1500000, purchaseItems: [{ name: "dress", cost: 400000, status: "UNRESOLVED" }] });
  assert.equal(result.quoteAllowed, false);
  assert.equal(result.status, "BLOCKED_UNRESOLVED_ITEMS");
});

test("payment evidence không tự verified và booking cần manual confirmation", () => {
  const { booking } = createSystem();
  const hold = booking.createHold({ conversationId: "c4", customerId: "u1", slot: "2026-10-01T15:00:00+07:00", quoteId: "q1" });
  assert.equal(hold.success, true);
  const evidence = booking.receivePaymentEvidence({ holdId: hold.data.id, mediaId: "media-1" });
  assert.equal(evidence.status, "PAYMENT_EVIDENCE_RECEIVED");
  const blocked = booking.createBooking({ holdId: hold.data.id, customer: { id: "u1" }, concept: "BD-001", idempotencyKey: "booking-1" });
  assert.equal(blocked.success, false);
  booking.confirmPayment({ holdId: hold.data.id, confirmedBy: "staff-1" });
  const bookingResult = booking.createBooking({ holdId: hold.data.id, customer: { id: "u1" }, concept: "BD-001", idempotencyKey: "booking-1" });
  assert.equal(bookingResult.success, true);
  const duplicate = booking.createBooking({ holdId: hold.data.id, customer: { id: "u1" }, concept: "BD-001", idempotencyKey: "booking-1" });
  assert.equal(duplicate.deduplicated, true);
});

test("human signal chuyển conversation sang HUMAN", () => {
  const { orchestrator, store } = createSystem();
  const result = orchestrator.handleMessage({ conversationId: "c5", text: "Cho tôi gặp nhân viên" });
  assert.equal(result.status, "transferred");
  assert.equal(store.getConversation("c5").state, STATES.HUMAN_HANDOFF);
  assert.equal(store.getConversation("c5").mode, "HUMAN");
});
