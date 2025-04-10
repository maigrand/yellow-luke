import {Client, GuildEmoji} from "discord.js";
import {getServers, ServerModel} from "./serverModel";
import {getStatusSmart, TGetStatusSmartResponse} from "jka-core";
import {getEmptyServerEmbed, getOfflineServerEmbed, getServerEmbed} from "./serverEmbed";
import axios, {AxiosError} from "axios";

let nextUpdatedAt = new Date(Date.now() - 1);
let currentServerId: number | null = null;
let isTaskActive = false;

export const serverTask = async (client: Client) => {
	// hardcode emoji
	const oauthGuild = await client.guilds.fetch('218734959353921537')
	const guild = await oauthGuild.fetch();
	const emojis = await guild.emojis.fetch();
	const emoji = emojis.find((emoji) => emoji.name === 'greendot')
	const emoteOnline = emoji === undefined ? "\uD83D\uDFE2" : emoji

	await update(emoteOnline);
	setInterval(async () => {
		if (isTaskActive) {
			return;
		}
		await update(emoteOnline);
	}, 60000)
}

const update = async (
	emoteOnline: GuildEmoji | string,
) => {
	if (new Date().getTime() < nextUpdatedAt.getTime()) {
		return;
	}
	try {
		isTaskActive = true;
		const servers = await getServers();
		for (const server of servers) {
			if (currentServerId !== null && currentServerId !== server.id) {
				continue;
			}
			currentServerId = null;
			let jkaResponse: TGetStatusSmartResponse | undefined = undefined;

			try {
				jkaResponse = await getStatusSmart(server.address)
			} catch (e) {}

			if (new Date().getTime() < nextUpdatedAt.getTime()) {
				return;
			}
			const isAllowRequest = await discordRequest(server, emoteOnline, jkaResponse);
			if (!isAllowRequest) {
				currentServerId = server.id;
				break;
			}
		}
		isTaskActive = false;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

async function discordRequest(
	server: ServerModel,
	emoteOnline: string | GuildEmoji,
	jkaResponse?: TGetStatusSmartResponse,
) {
	let data: ReturnType<typeof getServerEmbed | typeof getEmptyServerEmbed | typeof getOfflineServerEmbed>;
	if (!jkaResponse) {
		data = getOfflineServerEmbed(server);
	} else if (jkaResponse?.clients.length === 0) {
		data = getEmptyServerEmbed(server, jkaResponse, emoteOnline)
	} else {
		data = getServerEmbed(server, jkaResponse);
	}

	try {
		await axios.request({
			url: `https://discord.com/api/v10/channels/${server.channelId}/messages/${server.messageId}`,
			method: 'PATCH',
			headers: {
				'Accept': 'application/json',
				'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
				'Content-Type': 'application/json'
			},
			data: JSON.stringify(data)
		})
		return true;
	} catch (e) {
		if (e instanceof AxiosError) {
			if (e.response?.status != null && e.response?.status === 429) {
				nextUpdatedAt = new Date(Date.now() + (e.response.data.retry_after * 1000 + 500));
			} else {
				nextUpdatedAt = new Date(Date.now() + 30000);
			}
			return false;
		} else {
			throw e;
		}
	}
}
