# Yellow-Luke
This is a Discord bot written in TypeScript that provides monitoring functionality for the game "Jedi Knight: Jedi Academy."
The bot is designed to monitor a list of Jedi Academy servers and send notifications to Discord with a certain frequency.
The bot supports commands to add, edit, list, delete, and rebuild servers that the bot monitors.

# Installation
1. Clone the repository.
2. Run `npm install` to install the dependencies.
3. Create a Discord bot and invite it to your server (https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
4. Copy env.example to .env and fill in the required fields
5. This bot required mongodb server (https://www.mongodb.com/) (or just run via docker)
6. Copy mapUrl.json.example to mapUrl.json in src directory and fill in the required fields
7. Run `npm start register-commands` to register commands
8. Run `npm start dev` to start the bot

## or run via docker (see docker-compose.yml)

# Libraries
* discord.js: A powerful library for interacting with the Discord API.
* mongoose: A MongoDB library for TypeScript that provides a simple API for working with MongoDB.
* node-fetch: A library that provides a simple API for making HTTP requests.
* axios: A promise-based HTTP client for Node.js that can be used to make HTTP requests from Node.js or the browser.
* dotenv: A zero-dependency module that loads environment variables from a .env file.