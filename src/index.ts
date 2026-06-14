import 'dotenv/config'
import {Client, Events, GatewayIntentBits} from "discord.js";
import {serverTask} from "@/modules/server/serverTask";
import {commandModule} from "@/modules/command";

const start = async () => {
	try {
		const client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildEmojisAndStickers,
			],
		})

		client.once(Events.ClientReady, (readyClient) => {
			const d = new Date()
			console.log(`${d.toUTCString()} ready ${readyClient.user.tag}`)
		})

		await commandModule(client);
		await client.login(process.env.DISCORD_TOKEN)
		await serverTask(client);
	} catch (e) {
		throw e;
	}
}

start()
	.catch((e) => console.error(e))
