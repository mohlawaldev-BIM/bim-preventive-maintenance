// Global parsing state — tracks if a parse is in progress
const state = {
  isParsing: false,
  startedAt: null,
  filename: null,
  projectId: null,
  lastCompletedProjectId: null,
};

module.exports = state;