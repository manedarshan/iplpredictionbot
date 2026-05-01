// bot.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { parsePrediction } = require('./parser');
const { upsertPrediction } = require('./sheets');
const { getTodayFixtures } = require('./config');
let USER_MAPPING = {};

try {
  USER_MAPPING = JSON.parse(process.env.USER_MAPPING_JSON || "{}");
} catch (err) {
  console.error("Invalid USER_MAPPING_JSON", err);
}

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error('BOT_TOKEN is required in .env');
}

const bot = new TelegramBot(token, { polling: true });

function buildLocalDateTime(match) {
  const [year, month, day] = match.date.split('-').map(Number);
  const [hours, minutes] = match.freezeTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function isFreezeTimePassed(match) {
  const now = new Date();
  const freezeTime = buildLocalDateTime(match);
  return now > freezeTime;
}

function getCandidateMatch(msgText) {
  const todayFixtures = getTodayFixtures();
  const candidates = [];

  for (const match of todayFixtures) {
    const prediction = parsePrediction(msgText, [match.teamA, match.teamB]);
    if (prediction) {
      candidates.push({ match, prediction });
    }
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  return null;
}

bot.on('message', async (msg) => {
  console.log('Incoming message:', msg.text);

  if (!msg.text) return;

  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  const user = USER_MAPPING[fullName];
  if (!user) {
    console.log('User not mapped:', fullName);
    return;
  }

  const candidate = getCandidateMatch(msg.text);
  if (!candidate) {
    console.log('No valid match or ambiguous prediction for:', msg.text);
    return;
  }

  const { match, prediction } = candidate;
  if (isFreezeTimePassed(match)) {
    console.log('Freeze time passed for match:', match.id);
    return;
  }

  try {
    await upsertPrediction(match.teamA, match.teamB, user, prediction);
    console.log('Prediction saved:', { matchKey: `${match.teamA}_VS_${match.teamB}`.toUpperCase(), user, prediction });
    bot.sendMessage(msg.chat.id, `Prediction recorded: ${prediction}`);
  } catch (error) {
    console.error('Error saving prediction:', error);
    bot.sendMessage(msg.chat.id, 'Error recording prediction. Please try again.');
  }
});

console.log('Bot is running...');

bot.on('polling_error', (error) => {
  console.log('Polling error:', error);
});