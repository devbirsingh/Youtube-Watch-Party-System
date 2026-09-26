import React from "react";
import ApprovalPanel from "./ApprovalPanel";
import ChatPanel from "./ChatPanel";
import ParticipantsPanel from "./ParticipantsPanel";

export default function RoomSidebar({ state, actions }) {
  return (
    <aside className="room-sidebar">
      <ParticipantsPanel
        participants={state.participants}
        myUserId={actions.userId}
        myRole={state.role}
        onAssignRole={actions.assignRole}
        onRemove={actions.removeParticipant}
        onTransferHost={actions.transferHost}
      />

      <ApprovalPanel
        requests={state.requests}
        canApprove={actions.canApprove}
        onResolve={actions.resolveRequest}
      />

      <ChatPanel
        messages={state.messages}
        currentUserId={actions.userId}
        onSend={actions.sendMessage}
      />
    </aside>
  );
}
