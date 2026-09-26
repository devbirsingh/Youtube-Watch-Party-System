const STORAGE_KEY = "watch-party-user";

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
};

export const saveUser = (user) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

export const getOrCreateUserId = () =>
  getStoredUser()?.userId || crypto.randomUUID();
