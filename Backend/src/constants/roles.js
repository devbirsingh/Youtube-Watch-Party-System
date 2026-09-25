export const ROLES = {
  HOST: "HOST",
  MODERATOR: "MODERATOR",
  PARTICIPANT: "PARTICIPANT",
  VIEWER: "VIEWER",
};

// Roles allowed to control the YouTube player.
export const PLAYBACK_ROLES = [
  ROLES.HOST,
  ROLES.MODERATOR,
];

// Only Host can manage participants and roles.
export const HOST_ROLES = [
  ROLES.HOST,
];