import { useEffect, useState } from "react";
import { getAdminLogs, getAdminLogsCsvUrl } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function AdminLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    dateFrom: "",
    dateTo: ""
  });

  async function loadLogs(currentFilters = filters) {
    try {
      const result = await getAdminLogs(token, currentFilters);
      setLogs(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function handleChange(event) {
    setFilters((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  }

  async function handleFilter(event) {
    event.preventDefault();
    await loadLogs(filters);
  }

  async function handleCsvExport() {
    try {
      const response = await fetch("http://localhost:5000/api/admin/logs/export/csv", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "activity_logs.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>Admin - Activity Logs</h1>

        <form onSubmit={handleFilter} className="form grid-form">
          <input name="userId" placeholder="User ID" value={filters.userId} onChange={handleChange} />
          <input name="action" placeholder="Action" value={filters.action} onChange={handleChange} />
          <input name="dateFrom" type="date" value={filters.dateFrom} onChange={handleChange} />
          <input name="dateTo" type="date" value={filters.dateTo} onChange={handleChange} />
          <button type="submit">Apply Filters</button>
        </form>

        <div className="button-row">
          <button onClick={handleCsvExport}>Export CSV</button>
        </div>

        <div className="post-list">
          {logs.map((log) => (
            <div key={log.id} className="post-card">
              <p><strong>Action:</strong> {log.action_type}</p>
              <p><strong>User ID:</strong> {log.user_id || "-"}</p>
              <p><strong>Role:</strong> {log.role || "-"}</p>
              <p><strong>Target:</strong> {log.target_entity || "-"}</p>
              <p><strong>Status:</strong> {log.result_status}</p>
              <p><strong>IP:</strong> {log.ip_address || "-"}</p>
              <p><strong>Details:</strong> {log.details || "-"}</p>
              <p><strong>Created:</strong> {String(log.created_at)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminLogsPage;
