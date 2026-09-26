const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const createRoom = (username, userId) =>
  request("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ username, userId }),
  });

export const getRoom = (roomId) =>
  request(`/api/rooms/${encodeURIComponent(roomId)}`);
