import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import NonAdminRoute from "./components/NonAdminRoute";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreatePostPage from "./pages/CreatePostPage";
import AllPostsPage from "./pages/AllPostsPage";
import MyPostsPage from "./pages/MyPostsPage";
import PostDetailPage from "./pages/PostDetailPage";
import MeetingRequestsPage from "./pages/MeetingRequestsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminPostsPage from "./pages/AdminPostsPage";
import AdminLogsPage from "./pages/AdminLogsPage";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/posts"
            element={
              <NonAdminRoute>
                <AllPostsPage />
              </NonAdminRoute>
            }
          />

          <Route
            path="/posts/new"
            element={
              <NonAdminRoute>
                <CreatePostPage />
              </NonAdminRoute>
            }
          />

          <Route
            path="/posts/:id"
            element={
              <NonAdminRoute>
                <PostDetailPage />
              </NonAdminRoute>
            }
          />

          <Route
            path="/my-posts"
            element={
              <NonAdminRoute>
                <MyPostsPage />
              </NonAdminRoute>
            }
          />

          <Route
            path="/meetings"
            element={
              <NonAdminRoute>
                <MeetingRequestsPage />
              </NonAdminRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/posts"
            element={
              <AdminRoute>
                <AdminPostsPage />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/logs"
            element={
              <AdminRoute>
                <AdminLogsPage />
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
