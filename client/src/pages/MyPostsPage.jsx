import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPosts, updatePostStatus } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function MyPostsPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);

  async function loadMyPosts() {
    try {
      const result = await getPosts(token, { mine: true });
      setPosts(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadMyPosts();
  }, []);

  async function handleStatusChange(postId, status) {
    try {
      await updatePostStatus(token, postId, { status });
      await loadMyPosts();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>My Posts</h1>

        <div className="post-list">
          {posts.length === 0 ? (
            <p>You have no posts yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-card">
                <h3>{post.title}</h3>
                <p><strong>Status:</strong> {post.status}</p>
                <p><strong>Domain:</strong> {post.workingDomain}</p>
                <p><strong>Expertise:</strong> {post.expertiseRequired}</p>
                <div className="button-row">
                  <Link to={`/posts/${post.id}`}>View</Link>
                  <button onClick={() => handleStatusChange(post.id, "active")}>
                    Mark Active
                  </button>
                  <button onClick={() => handleStatusChange(post.id, "partner_found")}>
                    Partner Found
                  </button>
                  <button onClick={() => handleStatusChange(post.id, "expired")}>
                    Expire
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MyPostsPage;
