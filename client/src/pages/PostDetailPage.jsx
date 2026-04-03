import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPostById, createMeetingRequest } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function PostDetailPage() {
  const { token, user } = useAuth();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [proposedTimeSlots, setProposedTimeSlots] = useState("");
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPost() {
    try {
      const result = await getPostById(token, id);
      setPost(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadPost();
  }, [id]);

  async function handleMeetingRequest(event) {
    event.preventDefault();
    setMessage("");

    try {
      const result = await createMeetingRequest(token, {
        postId: id,
        requestMessage,
        proposedTimeSlots,
        ndaAccepted
      });

      setMessage(result.message);
      setRequestMessage("");
      setProposedTimeSlots("");
      setNdaAccepted(false);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to send meeting request."
      );
    }
  }

  if (!post) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  const isOwnPost = post.userId === user?.id;

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>{post.title}</h1>
        <p><strong>Status:</strong> {post.status}</p>
        <p><strong>Working Domain:</strong> {post.workingDomain}</p>
        <p><strong>Expertise Required:</strong> {post.expertiseRequired}</p>
        <p><strong>Short Explanation:</strong> {post.shortExplanation}</p>
        <p><strong>Desired Technical Expertise:</strong> {post.desiredTechnicalExpertise || "-"}</p>
        <p><strong>Needed Healthcare Expertise:</strong> {post.neededHealthcareExpertise || "-"}</p>
        <p><strong>High Level Idea:</strong> {post.highLevelIdea || "-"}</p>
        <p><strong>Commitment:</strong> {post.levelOfCommitmentRequired}</p>
        <p><strong>Collaboration Type:</strong> {post.estimatedCollaborationType || "-"}</p>
        <p><strong>Confidentiality:</strong> {post.confidentialityLevel}</p>
        <p><strong>Project Stage:</strong> {post.projectStage}</p>
        <p><strong>Country:</strong> {post.country}</p>
        <p><strong>City:</strong> {post.city}</p>
        <p><strong>Expiry Date:</strong> {post.expiryDate || "-"}</p>
        <p><strong>Auto Close:</strong> {post.autoClose ? "Yes" : "No"}</p>

        {!isOwnPost && (
          <>
            <h2>Send Meeting Request</h2>
            <form onSubmit={handleMeetingRequest} className="form">
              <textarea
                placeholder="Short message"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
              <textarea
                placeholder="Proposed time slots"
                value={proposedTimeSlots}
                onChange={(e) => setProposedTimeSlots(e.target.value)}
                required
              />
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={ndaAccepted}
                  onChange={(e) => setNdaAccepted(e.target.checked)}
                />
                I accept the NDA before meeting.
              </label>
              <button type="submit">Send Meeting Request</button>
            </form>
            {message && <p>{message}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default PostDetailPage;
