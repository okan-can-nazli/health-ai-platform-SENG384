import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function AllPostsPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({
    domain: "",
    expertise: "",
    city: "",
    country: "",
    stage: "",
    status: ""
  });

  async function loadPosts() {
    try {
      const result = await getPosts(token, filters);
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
    await loadPosts();
  }

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>All Posts</h1>

        <form onSubmit={handleFilter} className="form grid-form">
          <input name="domain" placeholder="Domain" value={filters.domain} onChange={handleChange} />
          <input name="expertise" placeholder="Expertise" value={filters.expertise} onChange={handleChange} />
          <input name="city" placeholder="City" value={filters.city} onChange={handleChange} />
          <input name="country" placeholder="Country" value={filters.country} onChange={handleChange} />
          <input name="stage" placeholder="Project Stage" value={filters.stage} onChange={handleChange} />
          <input name="status" placeholder="Status" value={filters.status} onChange={handleChange} />
          <button type="submit">Apply Filters</button>
        </form>

        <div className="post-list">
          {posts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-card">
                <h3>{post.title}</h3>
                <p><strong>Domain:</strong> {post.workingDomain}</p>
                <p><strong>Expertise:</strong> {post.expertiseRequired}</p>
                <p><strong>City:</strong> {post.city}</p>
                <p><strong>Country:</strong> {post.country}</p>
                <p><strong>Status:</strong> {post.status}</p>
                <Link to={`/posts/${post.id}`}>View Details</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AllPostsPage;
