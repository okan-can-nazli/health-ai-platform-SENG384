import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>Dashboard</h1>
        <p><strong>Welcome:</strong> {user?.full_name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Institution:</strong> {user?.institution || "-"}</p>
        <p><strong>Expertise:</strong> {user?.expertise || "-"}</p>
        <p><strong>City:</strong> {user?.city || "-"}</p>
        <p><strong>Country:</strong> {user?.country || "-"}</p>
        <p><strong>Email Verified:</strong> {user?.is_email_verified ? "Yes" : "No"}</p>
        <p><strong>Profile Completeness:</strong> {user?.profile_completeness}%</p>

        <div className="button-row">
          {!isAdmin && (
            <>
              <button><Link to="/posts/new">Create Post</Link></button>
              <button><Link to="/posts">All Posts</Link></button>
              <button><Link to="/my-posts">My Posts</Link></button>
              <button><Link to="/meetings">Meeting Requests</Link></button>
            </>
          )}

          <button><Link to="/notifications">Notifications</Link></button>

          {isAdmin && (
            <>
              <button><Link to="/admin/users">Admin Users</Link></button>
              <button><Link to="/admin/posts">Admin Posts</Link></button>
              <button><Link to="/admin/logs">Admin Logs</Link></button>
            </>
          )}

          <button onClick={logout}>Logout</button>
          
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
