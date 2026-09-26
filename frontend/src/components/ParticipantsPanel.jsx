import React from "react";

export default function ParticipantsPanel({
  participants,
  myUserId,
  myRole,
  onAssignRole,
  onRemove,
  onTransferHost,
}) {
  return (
    <section className="panel participants-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ROOM</span>
          <h3>
            Participants <span>{participants.length}</span>
          </h3>
        </div>
      </div>

      <div className="participant-list">
        {participants.map((participant) => {
          const isMe = participant.userId === myUserId;
          const isHost = participant.role === "HOST";

          return (
            <div className="participant-row" key={participant.userId}>
              <div
                className={`avatar ${isHost ? "host-avatar" : ""}`}
              >
                {participant.username.slice(0, 1).toUpperCase()}
              </div>

              <div className="participant-main">
                <strong>
                  {participant.username}
                  {isMe ? " (you)" : ""}
                </strong>
                <span
                  className={`role-text ${participant.role.toLowerCase()}`}
                >
                  {participant.role}
                </span>
              </div>

              {myRole === "HOST" && !isMe && !isHost && (
                <div className="participant-actions">
                  <select
                    value={participant.role}
                    onChange={(event) =>
                      onAssignRole(participant.userId, event.target.value)
                    }
                    aria-label={`Role for ${participant.username}`}
                  >
                    <option value="PARTICIPANT">Participant</option>
                    <option value="MODERATOR">Moderator</option>
                  </select>

                  <button
                    title="Remove participant"
                    onClick={() => onRemove(participant.userId)}
                  >
                    ×
                  </button>

                  <button
                    title="Transfer host"
                    onClick={() => onTransferHost(participant.userId)}
                  >
                    Make host
                  </button>
                </div>
              )}

              {isHost && <span className="host-crown">HOST</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
