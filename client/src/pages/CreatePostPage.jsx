import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function CreatePostPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    expertiseRequired: "",
    workingDomain: "",
    shortExplanation: "",
    desiredTechnicalExpertise: "",
    neededHealthcareExpertise: "",
    highLevelIdea: "",
    levelOfCommitmentRequired: "",
    estimatedCollaborationType: "",
    confidentialityLevel: "public_short_pitch",
    expiryDate: "",
    autoClose: false,
    projectStage: "",
    country: "",
    city: "",
    status: "draft"
  });

  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const result = await createPost(token, form);
      setMessage(result.message);
      navigate(`/posts/${result.data.id}`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create post.");
    }
  }

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>Create Post</h1>

        <form onSubmit={handleSubmit} className="form">
          <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
          <input name="expertiseRequired" placeholder="Expertise Required" value={form.expertiseRequired} onChange={handleChange} required />
          <input name="workingDomain" placeholder="Working Domain" value={form.workingDomain} onChange={handleChange} required />
          <textarea name="shortExplanation" placeholder="Short Explanation" value={form.shortExplanation} onChange={handleChange} required />
          <textarea name="desiredTechnicalExpertise" placeholder="Desired Technical Expertise" value={form.desiredTechnicalExpertise} onChange={handleChange} />
          <textarea name="neededHealthcareExpertise" placeholder="Needed Healthcare Expertise" value={form.neededHealthcareExpertise} onChange={handleChange} />
          <textarea name="highLevelIdea" placeholder="High Level Idea" value={form.highLevelIdea} onChange={handleChange} />
          <input name="levelOfCommitmentRequired" placeholder="Level of Commitment Required" value={form.levelOfCommitmentRequired} onChange={handleChange} required />
          <input name="estimatedCollaborationType" placeholder="Estimated Collaboration Type" value={form.estimatedCollaborationType} onChange={handleChange} />

          <select name="confidentialityLevel" value={form.confidentialityLevel} onChange={handleChange}>
            <option value="public_short_pitch">Public Short Pitch</option>
            <option value="details_in_meeting_only">Details Discussed in Meeting Only</option>
          </select>

          <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} />
          <input name="projectStage" placeholder="Project Stage" value={form.projectStage} onChange={handleChange} required />
          <input name="country" placeholder="Country" value={form.country} onChange={handleChange} required />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />

          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>

          <label className="checkbox-row">
            <input
              type="checkbox"
              name="autoClose"
              checked={form.autoClose}
              onChange={handleChange}
            />
            Auto Close
          </label>

          <button type="submit">Save Post</button>
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default CreatePostPage;
