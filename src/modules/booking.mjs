import { STATES } from "../domain/state.mjs";

export class BookingService {
  constructor(store, { holdMinutes = 30 } = {}) {
    this.store = store;
    this.holdMinutes = holdMinutes;
  }

  getAvailableSlots({ requestedSlots = [], blockedSlots = [] } = {}) {
    const blocked = new Set(blockedSlots);
    for (const hold of this.store.bookingHolds.values()) {
      if (hold.expiresAt > Date.now() && hold.status === "HELD") blocked.add(hold.slot);
    }
    for (const booking of this.store.bookings.values()) {
      if (booking.status !== "CANCELLED") blocked.add(booking.slot);
    }
    return requestedSlots.map((slot) => ({ slot, available: !blocked.has(slot) }));
  }

  createHold({ conversationId, customerId, slot, quoteId }) {
    const availability = this.getAvailableSlots({ requestedSlots: [slot] })[0];
    if (!availability?.available) {
      return { success: false, status: "CONFLICT", state: STATES.HUMAN_HANDOFF };
    }
    const id = this.store.id("hold");
    const hold = {
      id, conversationId, customerId, slot, quoteId,
      status: "HELD",
      expiresAt: Date.now() + this.holdMinutes * 60_000,
      createdAt: new Date().toISOString()
    };
    this.store.bookingHolds.set(id, hold);
    this.store.auditEvent({ type: "booking_hold_created", holdId: id, slot, conversationId });
    return { success: true, data: hold };
  }

  createPaymentRequest({ holdId, amount, instructions = null }) {
    const hold = this.store.bookingHolds.get(holdId);
    if (!hold || hold.status !== "HELD" || hold.expiresAt <= Date.now()) {
      return { success: false, error: "Booking hold is missing or expired" };
    }
    return {
      success: true,
      status: "PAYMENT_PENDING",
      holdId,
      amount,
      instructions: instructions ?? "Thông tin cọc sẽ được cấu hình bởi TFocus Studio.",
      paymentCode: `TF-${hold.id.slice(-8).toUpperCase()}`
    };
  }

  receivePaymentEvidence({ holdId, mediaId, extracted = {} }) {
    const hold = this.store.bookingHolds.get(holdId);
    if (!hold || hold.status !== "HELD") return { success: false, error: "Active hold not found" };
    hold.payment = { status: "PAYMENT_EVIDENCE_RECEIVED", mediaId, extracted };
    this.store.auditEvent({ type: "payment_evidence_received", holdId, mediaId });
    return { success: true, status: "PAYMENT_EVIDENCE_RECEIVED", requiresHumanConfirmation: true };
  }

  confirmPayment({ holdId, confirmedBy }) {
    const hold = this.store.bookingHolds.get(holdId);
    if (!hold?.payment || hold.payment.status !== "PAYMENT_EVIDENCE_RECEIVED") {
      return { success: false, error: "Payment evidence is required before confirmation" };
    }
    hold.payment = { ...hold.payment, status: "PAYMENT_VERIFIED", confirmedBy, confirmedAt: new Date().toISOString() };
    this.store.auditEvent({ type: "payment_verified", holdId, confirmedBy });
    return { success: true, status: "PAYMENT_VERIFIED", hold };
  }

  createBooking({ holdId, customer, concept, idempotencyKey }) {
    const existing = [...this.store.bookings.values()].find((booking) => booking.idempotencyKey === idempotencyKey);
    if (existing) return { success: true, deduplicated: true, data: existing };
    const hold = this.store.bookingHolds.get(holdId);
    if (!hold || hold.status !== "HELD" || hold.payment?.status !== "PAYMENT_VERIFIED") {
      return { success: false, error: "Verified payment and active hold are required" };
    }
    const id = this.store.id("booking");
    const booking = {
      id, idempotencyKey, holdId, customer, concept,
      slot: hold.slot, status: "BOOKED", createdAt: new Date().toISOString()
    };
    hold.status = "CONVERTED";
    this.store.bookings.set(id, booking);
    this.store.auditEvent({ type: "booking_created", bookingId: id, idempotencyKey });
    return { success: true, data: booking };
  }
}
