import {Client, IntentsBitField, Partials} from 'discord.js'
import mongoose from 'mongoose'

const TOKEN = process.env.DISCORD_TOKEN

export class DiscordClient {
    constructor () {
        this.login(TOKEN)
        this.mongooseConnect()
    }

    public client = new Client({
        partials: [Partials.Message, Partials.Channel, Partials.Reaction],
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMessages,
            // IntentsBitField.Flags.GuildMessageReactions,
            // IntentsBitField.Flags.GuildMembers,
            // IntentsBitField.Flags.GuildPresences,
            IntentsBitField.Flags.GuildVoiceStates,
            IntentsBitField.Flags.MessageContent,
        ],
    })

    private login(token: string) {
        this.client.login(token)
            .catch((e) => console.error(e))
    }

    private async mongooseConnect() {
        //url: `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`
        await mongoose.connect(process.env.MONGODB_URL)
    }
}
