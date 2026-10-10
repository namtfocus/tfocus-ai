export function handoffToHuman(store, { conversationId, reason, priority = "normal" }) {
  const conversation = store.getConversation(conversationId);
  conversation.mode = "HUMAN";
  conversation.state = "HUMAN_HANDOFF";
  conversation.handoff = { reason, priority, at: new Date().toISOString() };
  store.auditEvent({ type: "human_handoff", conversationId, reason, priority });
  return {
    success: true,
    status: "transferred",
    conversationId,
    assignedQueue: priority === "urgent" ? "priority-support" : "general-inbox",
    messageForCustomer: "Dạ em xin phép chuyển cuộc trò chuyện đến chuyên viên hỗ trợ để hỗ trợ mình tốt nhất ạ."
  };
}
