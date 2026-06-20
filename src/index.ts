import 'dotenv/config'
import {Client, Events, GatewayIntentBits} from "discord.js";
import {serverTask} from "@/modules/server/serverTask";
import {commandModule} from "@/modules/command";

const LOGIN_RETRY_DELAYS_MS = [5_000, 10_000, 20_000, 30_000]

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const loginWithRetry = async (client: Client) => {
	let attempt = 0
	while (true) {
		try {
			await client.login(process.env.DISCORD_TOKEN)
			return
		} catch (error) {
			const delay = LOGIN_RETRY_DELAYS_MS[Math.min(attempt, LOGIN_RETRY_DELAYS_MS.length - 1)]
			console.error(`Discord login failed (attempt ${attempt + 1}), retrying in ${delay}ms`, error)
			attempt++
			await sleep(delay)
		}
	}
}

const start = async () => {
	process.on('unhandledRejection', (reason) => {
		console.error('Unhandled promise rejection:', reason)
	})
	process.on('uncaughtException', (error) => {
		console.error('Uncaught exception:', error)
	})

	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildExpressions,
		],
	})

	client.once(Events.ClientReady, (readyClient) => {
		const d = new Date()
		console.log(`${d.toUTCString()} ready ${readyClient.user.tag}`)

		serverTask(client);
	})

	client.on(Events.Error, (error) => {
		console.error('Discord client error:', error)
	})
	client.on(Events.ShardError, (error) => {
		console.error('Discord shard error:', error)
	})

	await commandModule(client);
	await loginWithRetry(client)
}

start()
	.catch((e) => console.error(e))
