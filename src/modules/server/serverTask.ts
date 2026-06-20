import {Client, GuildEmoji, TextChannel} from "discord.js";
import {getServers, ServerModel} from "./serverModel";
import {getStatusSmart, TGetStatusSmartResponse} from "jka-core";
import {getEmptyServerEmbed, getOfflineServerEmbed, getServerEmbed} from "./serverEmbed";
import axios, {AxiosError} from "axios";
import {
	getTextChannelPlayersConfigs,
	setTextChannelPlayersLastName
} from "@/modules/textChannelPlayers/textChannelPlayersModel";
import {renderTemplate} from "@/modules/textChannelPlayers/pluralize";

const TASK_INTERVAL_TIMEOUT_MS = 1000

let nextUpdatedAt = new Date(Date.now() - 1);
let currentServerId: number | null = null;
let isTaskActive = false;

export const serverTask = async (client: Client) => {
	let emoteOnline: GuildEmoji | string = "\uD83D\uDFE2"
	const emojiGuildId = process.env.EMOJI_GUILD_ID
	if (emojiGuildId) {
		try {
			const guild = await client.guilds.fetch(emojiGuildId)
			const emojis = await guild.emojis?.fetch()
			emoteOnline = emojis?.find((emoji) => emoji.name === 'greendot') ?? emoteOnline
		} catch (error) {
			console.warn(`Could not load greendot emoji from guild ${emojiGuildId}`, error)
		}
	}

	const emojiApplication = client.emojis?.cache?.find((emoji) => emoji.name === 'greendot')
	if (emojiApplication) {
		emoteOnline = emojiApplication
	}

	await update(client, emoteOnline);
	setInterval(async () => {
		if (isTaskActive) {
			return;
		}
		try {
			await update(client, emoteOnline);
		} catch (error) {
			console.error('Server update task failed', error)
		}
	}, TASK_INTERVAL_TIMEOUT_MS)
}

const update = async (
	client: Client,
	emoteOnline: GuildEmoji | string,
) => {
	if (new Date().getTime() < nextUpdatedAt.getTime()) {
		return;
	}
	isTaskActive = true;
	try {
		const servers = await getServers();
		if (currentServerId !== null && !servers.some((server) => server.id === currentServerId)) {
			currentServerId = null;
		}
		const playersByServerId = new Map<number, number>();
		for (const server of servers) {
			if (currentServerId !== null && currentServerId !== server.id) {
				continue;
			}
			currentServerId = null;
			let jkaResponse: TGetStatusSmartResponse | undefined = undefined;

			try {
				jkaResponse = await getStatusSmart(server.address)
			} catch (e) {}

			if (jkaResponse) {
				playersByServerId.set(server.id, jkaResponse.clients.length);
			}

			if (new Date().getTime() < nextUpdatedAt.getTime()) {
				return;
			}
			const isAllowRequest = await discordRequest(server, emoteOnline, jkaResponse);
			if (!isAllowRequest) {
				currentServerId = server.id;
				break;
			}
		}
		await updateTextChannelPlayers(client, servers, playersByServerId)
		nextUpdatedAt = new Date(Date.now() + 30000);
	} catch (e) {
		console.error(e);
		nextUpdatedAt = new Date(Date.now() + 30000);
	} finally {
		isTaskActive = false;
	}
}

const updateTextChannelPlayers = async (
	client: Client,
	servers: ServerModel[],
	playersByServerId: Map<number, number>,
) => {
	const configs = await getTextChannelPlayersConfigs()
	for (const config of configs) {
		if (!config.enabled || !config.channelId) {
			continue
		}

		let players = 0
		for (const server of servers) {
			if (server.guildId !== config.guildId) {
				continue
			}
			if (config.serverIds?.length && !config.serverIds.includes(server.id)) {
				continue
			}
			players += playersByServerId.get(server.id) ?? 0
		}

		const nextName = renderTemplate(config.template, players).slice(0, 100)
		if (nextName === '' || nextName === config.lastName) {
			continue
		}

		try {
			const channel = await client.channels.fetch(config.channelId)
			if (!(channel instanceof TextChannel) || channel.guildId !== config.guildId) {
				console.warn(`Text channel players config for guild ${config.guildId} points to an invalid channel ${config.channelId}`)
				continue
			}
			if (channel.name === nextName) {
				await setTextChannelPlayersLastName(config.guildId, nextName)
				continue
			}
			await channel.setName(nextName, 'Update active players count')
			await setTextChannelPlayersLastName(config.guildId, nextName)
		} catch (error) {
			const code = (error as { code?: unknown })?.code
			const message = (error as { message?: string })?.message
			const detail = code ?? message ?? 'unknown error'
			console.warn(`Could not update text channel players name for guild ${config.guildId}: ${detail}`)
		}
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
				return false;
			}
			const detail = e.code ?? e.response?.status ?? 'unknown'
			console.warn(`Discord request failed for server ${server.id} (${server.address}): ${detail}`)
			return true;
		} else {
			throw e;
		}
	}
}
