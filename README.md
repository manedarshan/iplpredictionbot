# IPL Prediction Bot

A Telegram bot for IPL predictions built with Node.js, node-telegram-bot-api, and Google Sheets API.

## Features

- Reads messages from Telegram groups
- Parses cricket match predictions (e.g., MI, MI+, CSK, CSK+)
- Maps Telegram users to predefined player names
- Stores/updates predictions in Google Sheets
- Keeps the latest prediction per user per match

## Setup

1. Create a new bot with [BotFather](https://t.me/botfather) on Telegram and get your bot token.

2. Set up Google Sheets API:
   - Create a Google Sheet and note the Sheet ID.
   - Create a Service Account in Google Cloud Console.
   - Download the JSON key file and extract the client_email and private_key.

3. Set environment variables in .env:
   ```
   BOT_TOKEN=your_telegram_bot_token
   GOOGLE_SHEET_ID=your_sheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_email
   GOOGLE_PRIVATE_KEY=your_private_key
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Run the bot:
   ```bash
   npm start
   ```

## Google Sheets Structure

Sheet name: Predictions

Columns: match_id | user | prediction | timestamp

## Usage

- Add the bot to your Telegram group.
- Users send predictions like "MI+" or "CSK".
- Bot records the latest prediction before freeze time.
- At freeze time, any missing predictions are marked as `NA` in the sheet.