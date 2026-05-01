// sheets.js
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'IPL';
const HEADER_START_COL = 6; // F
const HEADER_END_COL = 37; // AK
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache = {
  headers: null,
  matchKeyRows: null,
  updatedAt: 0,
};

async function authenticateGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function columnToLetter(column) {
  let temp = '';
  while (column > 0) {
    let rem = (column - 1) % 26;
    temp = String.fromCharCode(65 + rem) + temp;
    column = Math.floor((column - 1) / 26);
  }
  return temp;
}

async function refreshCacheIfNeeded(sheets, spreadsheetId) {
  const now = Date.now();
  if (cache.headers && cache.matchKeyRows && now - cache.updatedAt < CACHE_TTL_MS) {
    return;
  }

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!F1:AK1`,
  });

  const headerRow = headerResponse.data.values ? headerResponse.data.values[0] : [];
  cache.headers = {};
  for (let i = 0; i < headerRow.length; i++) {
    const header = headerRow[i];
    if (header) {
      cache.headers[header.toString().trim()] = HEADER_START_COL + i;
    }
  }

  const keyResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!HR:HR`,
  });

  const keyRows = keyResponse.data.values || [];
  cache.matchKeyRows = {};
  for (let row = 2; row <= keyRows.length; row++) {
    const value = keyRows[row - 1] && keyRows[row - 1][0];
    if (value) {
      cache.matchKeyRows[value.toString().trim().toUpperCase()] = row;
    }
  }

  cache.updatedAt = now;
}

async function upsertPrediction(teamA, teamB, playerName, prediction) {
  const sheets = await authenticateGoogleSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  await refreshCacheIfNeeded(sheets, spreadsheetId);

  const matchKey = `${teamA}_VS_${teamB}`.toUpperCase();
  const rowIndex = cache.matchKeyRows[matchKey];
  if (!rowIndex) {
    console.error('Match not found for matchKey:', matchKey);
    return;
  }

  const columnIndex = cache.headers[playerName];
  if (!columnIndex) {
    console.error('Player column not found for:', playerName);
    return;
  }

  if (columnIndex < HEADER_START_COL || columnIndex > HEADER_END_COL) {
    console.error('Player column index out of allowed range:', columnIndex, playerName);
    return;
  }

  const columnLetter = columnToLetter(columnIndex);
  const range = `${SHEET_NAME}!${columnLetter}${rowIndex}`;

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: { values: [[prediction]] },
    });
    console.log('Updated prediction cell:', { matchKey, playerName, rowIndex, columnIndex, range });
  } catch (error) {
    console.error('Failed to update prediction cell:', { matchKey, playerName, rowIndex, columnIndex, range, error });
  }
}

module.exports = { upsertPrediction };