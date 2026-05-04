// bot.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { parsePrediction } = require('./parser');
const { upsertPrediction, markMissingPredictions } = require('./sheets');
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

// const bot = new TelegramBot(token, { polling: true });

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: false,
});

async function startBot() {
  await bot.deleteWebHook();
  await bot.startPolling({
    interval: 1000,
    params: { timeout: 10 },
  });
}

startBot();

const IST_OFFSET_MS = 330 * 60 * 1000; // IST is UTC+5:30

function buildISTFreezeTime(match) {
  const [year, month, day] = match.date.split('-').map(Number);
  const [hours, minutes] = match.freezeTime.split(':').map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes) - IST_OFFSET_MS;
  return new Date(utcMs);
}

function isFreezeTimePassed(match) {
  const now = Date.now();
  const freezeTime = buildISTFreezeTime(match).getTime();
  return now > freezeTime;
}

const processedFreezeMatches = new Set();

async function processFreezeMissingPredictions() {
  const todayFixtures = getTodayFixtures();
  for (const match of todayFixtures) {
    if (processedFreezeMatches.has(match.id)) {
      continue;
    }
    if (!isFreezeTimePassed(match)) {
      continue;
    }

    try {
      await markMissingPredictions(match.teamA, match.teamB, 'NA');
      processedFreezeMatches.add(match.id);
    } catch (error) {
      console.error('Error marking missing predictions for match:', match.id, error);
    }
  }
}

setImmediate(() => {
  processFreezeMissingPredictions().catch((error) => {
    console.error('Error during initial freeze processing:', error);
  });
});

setInterval(() => {
  processFreezeMissingPredictions().catch((error) => {
    console.error('Error during scheduled freeze processing:', error);
  });
}, 60 * 1000);

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

  const userId = String(msg.from.id);
  const username = msg.from.username || '';
  const firstName = msg.from.first_name || '';
  const lastName = msg.from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  const player = USER_MAPPING[userId] || USER_MAPPING[username] || USER_MAPPING[fullName];
  if (!player) {
    console.log('Unmapped user:', {
      userId,
      username,
      fullName,
      message: msg.text,
      lookupKeys: [userId, username, fullName].filter(Boolean),
    });
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
    await upsertPrediction(match.teamA, match.teamB, player, prediction);
    console.log('Prediction saved:', { matchKey: `${match.teamA}_VS_${match.teamB}`.toUpperCase(), player, prediction });
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