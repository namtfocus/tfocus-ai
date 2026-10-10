import crypto from "node:crypto";

export class MemoryStore {
  constructor() {
    this.conversations = new Map();
    this.quotes = new Map();
    this.bookingHolds = new Map();
    this.bookings = new Map();
    this.audit = [];
  }

  id(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  getConversation(id) {
    if (!this.conversations.has(id)) {
      this.conversations.set(id, {
        id,
        state: "NEW_LEAD",
        mode: "ASSIST",
        customerId: null,
        categoryId: null,
        conceptCode: null,
        quoteId: null,
        bookingHoldId: null,
        bookingId: null,
        updatedAt: new Date().toISOString()
      });
    }
    return this.conversations.get(id);
  }

  auditEvent(event) {
    this.audit.push({ ...event, at: new Date().toISOString() });
  }
}
