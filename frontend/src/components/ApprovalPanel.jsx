import React from "react";

export default function ApprovalPanel({ requests, canApprove, onResolve }) {
  if (!canApprove && !requests.length) {
    return null;
  }

  return (
    <section className="panel request-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">CONTROL REQUESTS</span>
          <h3>
            Pending approvals <span>{requests.length}</span>
          </h3>
        </div>
      </div>

      {!requests.length ? (
        <div className="empty-state">No pending requests.</div>
      ) : (
        requests.map((request) => (
          <div className="request-row" key={request.requestId}>
            <div>
              <strong>{request.username}</strong>
              <p>
                wants to <b>{request.action.replace("_", " ").toLowerCase()}</b>
              </p>
            </div>

            {canApprove && request.status === "PENDING" && (
              <div className="request-actions">
                <button onClick={() => onResolve(request.requestId, true)}>
                  Approve
                </button>
                <button onClick={() => onResolve(request.requestId, false)}>
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </section>
  );
}
