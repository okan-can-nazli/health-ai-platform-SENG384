import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const authApi = axios.create({
  baseURL: API_BASE_URL
});

export async function registerUser(payload) {
  const response = await authApi.post("/auth/register", payload);
  return response.data;
}

export async function verifyEmail(payload) {
  const response = await authApi.post("/auth/verify-email", payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await authApi.post("/auth/login", payload);
  return response.data;
}

export async function getCurrentUser(token) {
  const response = await authApi.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function createPost(token, payload) {
  const response = await authApi.post("/posts", payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function getPosts(token, params = {}) {
  const response = await authApi.get("/posts", {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params
  });

  return response.data;
}

export async function getPostById(token, id) {
  const response = await authApi.get(`/posts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function updatePost(token, id, payload) {
  const response = await authApi.put(`/posts/${id}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function updatePostStatus(token, id, payload) {
  const response = await authApi.patch(`/posts/${id}/status`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function createMeetingRequest(token, payload) {
  const response = await authApi.post("/meetings", payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function getMeetingRequests(token, params = {}) {
  const response = await authApi.get("/meetings", {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params
  });

  return response.data;
}

export async function updateMeetingRequestStatus(token, id, payload) {
  const response = await authApi.patch(`/meetings/${id}/status`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function getNotifications(token) {
  const response = await authApi.get("/notifications", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function markNotificationAsRead(token, id) {
  const response = await authApi.patch(
    `/notifications/${id}/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
}

export async function getAdminUsers(token, params = {}) {
  const response = await authApi.get("/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params
  });

  return response.data;
}

export async function updateAdminUserStatus(token, id, payload) {
  const response = await authApi.patch(`/admin/users/${id}/status`, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function getAdminPosts(token, params = {}) {
  const response = await authApi.get("/admin/posts", {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params
  });

  return response.data;
}

export async function deleteAdminPost(token, id) {
  const response = await authApi.delete(`/admin/posts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

export async function getAdminLogs(token, params = {}) {
  const response = await authApi.get("/admin/logs", {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params
  });

  return response.data;
}

export function getAdminLogsCsvUrl() {
  return "http://localhost:5000/api/admin/logs/export/csv";
}
