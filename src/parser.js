// parser.js
const { CURRENT_MATCH } = require('./config');

function parsePrediction(text, matchTeams = []) {
  const normalized = text.toUpperCase().replace(/\s+/g, '');

  // Only allow letters and optional + after the team code
  if (!/^[A-Z+]+$/.test(normalized)) {
    return null;
  }

  const validPredictions = [
    `${matchTeams[0]}`,
    `${matchTeams[0]}+`,
    `${matchTeams[1]}`,
    `${matchTeams[1]}+`
  ];

  if (validPredictions.includes(normalized)) {
    return normalized;
  }

  return null;
}

module.exports = { parsePrediction };