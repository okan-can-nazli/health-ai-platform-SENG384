import { useEffect, useState } from "react";
import {
  getAdminUsers,
  updateAdminUserStatus
} from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: "",
    active: ""
  });

  async function loadUsers(currentFilters = filters) {
    try {
      const result = await getAdminUsers(token, currentFilters);
      setUsers(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleChange(event) {
    setFilters((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  }

  async function handleFilter(event) {
    event.preventDefault();
    await loadUsers(filters);
  }

  async function handleStatus(userId, isActive) {
    try {
      await updateAdminUserStatus(token, userId, { isActive });
      await loadUsers(filters);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>Admin - Users</h1>

        <form onSubmit={handleFilter} className="form grid-form">
          <input
            name="role"
            placeholder="Role"
            value={filters.role}
            onChange={handleChange}
          />
          <select name="active" value={filters.active} onChange={handleChange}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button type="submit">Apply Filters</button>
        </form>

        <div className="post-list">
          {users.map((user) => (
            <div key={user.id} className="post-card">
              <p><strong>Name:</strong> {user.full_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Institution:</strong> {user.institution || "-"}</p>
              <p><strong>City:</strong> {user.city || "-"}</p>
              <p><strong>Country:</strong> {user.country || "-"}</p>
              <p><strong>Email Verified:</strong> {user.is_email_verified ? "Yes" : "No"}</p>
              <p><strong>Active:</strong> {user.is_active ? "Yes" : "No"}</p>
              <p><strong>Profile Completeness:</strong> {user.profile_completeness}%</p>

              <div className="button-row">
                <button onClick={() => handleStatus(user.id, true)}>Activate</button>
                <button onClick={() => handleStatus(user.id, false)}>Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminUsersPage;
