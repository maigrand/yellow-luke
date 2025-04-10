import 'dotenv/config'
import {Client, Events, IntentsBitField, Partials} from "discord.js";
import {serverTask} from "@/modules/server/serverTask";
import {commandModule} from "@/modules/command";

const start = async () => {
	try {
		const client = new Client({
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

		await client.login(process.env.DISCORD_TOKEN)

		client.on(Events.ClientReady, async () => {
			const d = new Date()
			console.log(`${d.toUTCString()} ready ${client.user.tag}`)
		})

		await serverTask(client);
		await commandModule(client);
	} catch (e) {
		throw e;
	}
}

start()
	.catch((e) => console.error(e))
