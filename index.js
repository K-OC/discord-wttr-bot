require('dotenv').config();
const fs = require('fs');
const schedule = require('node-schedule');
const { Client, Intents } = require('discord.js');
const axios = require('axios');

const logFilePath = './weather_bot_log.txt';

// Function to log data
function logRequest(user, request, response) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - User: ${user}, Request: ${request}, Response: ${response}\n`;
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
}

// Function to clear log file
function clearLogFile() {
    fs.writeFileSync(logFilePath, '', 'utf8');
}

// Schedule to clear log file every 30 days
schedule.scheduleJob('0 0 1 */1 *', () => {  // This cron expression represents the first day of every month
    clearLogFile();
});


const bot = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

bot.once("ready", () => {
  console.log("Bot is online!");
});

bot.on("messageCreate", async (message) => {
  if (message.content.startsWith("/weather")) {
    console.log("Weather command received");

    const requestContent = message.content;
    const user = message.author.tag;  // or message.author.id for user's unique ID


    // Extract the location and process it
    let location = message.content.substring("/weather".length).trim();
    // Remove all punctuation and convert to lowercase
    location = location
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase();

    console.log(`Processed location: ${location}`);

    if (!location) {
      console.log("No location provided");
      return message.reply("Please provide a location.");
    }

    try {
      const formattedLocation = location.replace(/ /g, "+");
      const apiURL = `http://wttr.in/${encodeURIComponent(
        formattedLocation
      )}?format=4`;
      const response = await axios.get(apiURL);

      // Create a link to the full forecast
      const forecastURL = `http://wttr.in/${formattedLocation}`;
      const formattedResponse = `${response.data.replace(
        /\+/g,
        " "
      )}\nFull forecast: <${forecastURL}>`;

      message.reply(formattedResponse);

        // Log request and response
        logRequest(user, requestContent, response.data);
    } catch (error) {
      console.error("Error fetching weather:", error);
      message.reply("Failed to retrieve weather data.");
      logRequest(user, requestContent, 'Failed to retrieve weather data.');

    }
  }
});

bot.login(
  process.env.API_KEY
);
