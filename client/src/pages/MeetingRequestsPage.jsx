import { useEffect, useState } from "react";
import {
  getMeetingRequests,
  updateMeetingRequestStatus
} from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function MeetingRequestsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [type, setType] = useState("all");

  async function loadRequests(currentType = type) {
    try {
      const result = await getMeetingRequests(token, { type: currentType });
      setRequests(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadRequests(type);
  }, [type]);

  async function handleUpdateStatus(id, status) {
    let payload = { status };

    if (status === "scheduled") {
      const selectedTimeSlot = window.prompt("Enter selected time slot:");
      if (!selectedTimeSlot) return;
      payload.selectedTimeSlot = selectedTimeSlot;
    }

    try {
      await updateMeetingRequestStatus(token, id, payload);
      await loadRequests(type);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>Meeting Requests</h1>

        <div className="button-row">
          <button onClick={() => setType("all")}>All</button>
          <button onClick={() => setType("incoming")}>Incoming</button>
          <button onClick={() => setType("outgoing")}>Outgoing</button>
        </div>

        <div className="post-list">
          {requests.length === 0 ? (
            <p>No meeting requests found.</p>
          ) : (
            requests.map((request) => {
              const isOwner = request.postOwnerId === user?.id;

              return (
                <div key={request.id} className="post-card">
                  <p><strong>Status:</strong> {request.status}</p>
                  <p><strong>Post ID:</strong> {request.postId}</p>
                  <p><strong>Requester ID:</strong> {request.requesterId}</p>
                  <p><strong>Post Owner ID:</strong> {request.postOwnerId}</p>
                  <p><strong>Message:</strong> {request.requestMessage || "-"}</p>
                  <p><strong>Proposed Time Slots:</strong> {request.proposedTimeSlots}</p>
                  <p><strong>Selected Time Slot:</strong> {request.selectedTimeSlot || "-"}</p>

                  <div className="button-row">
                    {isOwner && (
                      <>
                        <button onClick={() => handleUpdateStatus(request.id, "accepted")}>
                          Accept
                        </button>
                        <button onClick={() => handleUpdateStatus(request.id, "declined")}>
                          Decline
                        </button>
                        <button onClick={() => handleUpdateStatus(request.id, "scheduled")}>
                          Schedule
                        </button>
                      </>
                    )}
                    <button onClick={() => handleUpdateStatus(request.id, "cancelled")}>
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingRequestsPage;
