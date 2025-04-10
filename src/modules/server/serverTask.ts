import {Client, GuildEmoji} from "discord.js";
import {getServers, ServerModel} from "./serverModel";
import {getStatusSmart, TGetStatusSmartResponse} from "jka-core";
import {getEmptyServerEmbed, getOfflineServerEmbed, getServerEmbed} from "./serverEmbed";
import axios, {AxiosError} from "axios";

let nextUpdatedAt = new Date(Date.now() - 1);
let currentServerId: number | null = null;
let isTaskActive = false;

export const serverTask = async (client: Client) => {
	await update(client);
	setInterval(async () => {
		if (isTaskActive) {
			return;
		}
		await update(client);
	}, 60000)
}

const update = async (client: Client) => {
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

			const emoji = client.emojis.cache?.find((emoji) => emoji.name === 'greendot')
			const emoteOnline = emoji === undefined ? "\uD83D\uDFE2" : emoji

			if (new Date().getTime() < nextUpdatedAt.getTime()) {
				return;
			}
			const isAllowRequest = await discordRequest(server, emoteOnline, jkaResponse);
			if (!isAllowRequest) {
				currentServerId = server.id;
			}
		}
		isTaskActive = false;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

const discordRequest = async (
	server: ServerModel,
	emoteOnline: string | GuildEmoji,
	jkaResponse?: TGetStatusSmartResponse,
) => {
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
