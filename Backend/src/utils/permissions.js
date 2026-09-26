const ROLES = Object.freeze({
  HOST: "HOST",
  MODERATOR: "MODERATOR",
  PARTICIPANT: "PARTICIPANT",
});

const canControlPlayback = (role) =>
  role === ROLES.HOST || role === ROLES.MODERATOR;

const canManageRoles = (role) => role === ROLES.HOST;

const canManageParticipants = (role) => role === ROLES.HOST;

const canApproveRequests = (role) =>
  role === ROLES.HOST || role === ROLES.MODERATOR;

module.exports = {
  ROLES,
  canControlPlayback,
  canManageRoles,
  canManageParticipants,
  canApproveRequests,
};
