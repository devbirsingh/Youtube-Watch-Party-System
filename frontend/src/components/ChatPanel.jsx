import React, { useEffect, useRef, useState } from "react";

export default function ChatPanel({ messages, currentUserId, onSend }) {
  const [message, setMessage] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (event) => {
    event.preventDefault();
    const value = message.trim();

    if (!value) {
      return;
    }

    onSend(value);
    setMessage("");
  };

  return (
    <section className="panel chat-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ROOM</span>
          <h3>
            Chat <span>{messages.length}</span>
          </h3>
        </div>
      </div>

      <div className="chat-list">
        {!messages.length && (
          <div className="empty-state">
            No messages yet. Start the conversation.
          </div>
        )}

        {messages.map((item) => {
          const isMe = item.userId === currentUserId;

          return (
            <div
              className={`chat-row ${isMe ? "mine" : ""}`}
              key={item.messageId}
            >
              <div
                className={`avatar ${isMe ? "chat-avatar-me" : ""}`}
              >
                {item.username.slice(0, 1).toUpperCase()}
              </div>

              <div className="chat-bubble-wrap">
                <div className="chat-meta">
                  <strong>
                    {item.username}
                    {isMe ? " (you)" : ""}
                  </strong>
                  <span>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="chat-bubble">{item.message}</div>
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={500}
          placeholder="Type a message…"
          aria-label="Chat message"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </section>
  );
}
