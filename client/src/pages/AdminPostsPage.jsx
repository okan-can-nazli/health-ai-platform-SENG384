import { useEffect, useState } from "react";
import {
  getAdminPosts,
  deleteAdminPost
} from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function AdminPostsPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({
    city: "",
    domain: "",
    status: ""
  });

  async function loadPosts(currentFilters = filters) {
    try {
      const result = await getAdminPosts(token, currentFilters);
      setPosts(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function handleChange(event) {
    setFilters((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  }

  async function handleFilter(event) {
    event.preventDefault();
    await loadPosts(filters);
  }

  async function handleDelete(postId) {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    try {
      await deleteAdminPost(token, postId);
      await loadPosts(filters);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>Admin - Posts</h1>

        <form onSubmit={handleFilter} className="form grid-form">
          <input name="city" placeholder="City" value={filters.city} onChange={handleChange} />
          <input name="domain" placeholder="Domain" value={filters.domain} onChange={handleChange} />
          <input name="status" placeholder="Status" value={filters.status} onChange={handleChange} />
          <button type="submit">Apply Filters</button>
        </form>

        <div className="post-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <p><strong>Title:</strong> {post.title}</p>
              <p><strong>Owner:</strong> {post.owner_name}</p>
              <p><strong>Owner Email:</strong> {post.owner_email}</p>
              <p><strong>Domain:</strong> {post.working_domain}</p>
              <p><strong>City:</strong> {post.city}</p>
              <p><strong>Status:</strong> {post.status}</p>

              <div className="button-row">
                <button onClick={() => handleDelete(post.id)}>Delete Post</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPostsPage;
