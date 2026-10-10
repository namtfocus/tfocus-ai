import { MemoryStore } from "../domain/store.mjs";

export class DurableStore extends MemoryStore {
  constructor(persistence) {
    super();
    this.persistence = persistence;
  }

  getConversation(id) {
    const conversation = super.getConversation(id);
    const originalAudit = this.auditEvent.bind(this);
    if (!conversation.__durableWrapped) {
      conversation.__durableWrapped = true;
      this.auditEvent = (event) => {
        originalAudit(event);
        void this.persistence.audit(event).catch((error) => console.error("persistence audit failed", error));
      };
    }
    void this.persistence.upsertConversation(conversation).catch((error) => console.error("conversation persistence failed", error));
    return conversation;
  }
}
