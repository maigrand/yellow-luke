import {ServerModel} from "./serverModel";
import {TGetStatusSmartResponse} from "jka-core";
import {normalizeJkaString, validateNickname} from "./serverUtil";
import mapUrl from '@@/mapUrl.json'
import {GuildEmoji} from "discord.js";

const intColorNormal = 696330
const intColorOffline = 3276800
const intColorEmpty = 673290

export const getOfflineServerEmbed = (
	server: ServerModel
) => {
	const date = new Date();
	return {
		embeds: [
			{
				title: `\uD83D\uDEAB ${server.name}`,
				footer: {
					text: `/connect ${server.address}${server.password === "null" ? `` : `;password ${server.password}`}`
				},
				timestamp: date.toISOString(),
				color: `${intColorOffline}`
			}
		]
	}
}

export const getEmptyServerEmbed = (
	server: ServerModel,
	jkaResponse: TGetStatusSmartResponse,
	emoteOnline: string | GuildEmoji,
) => {
	const date = new Date();
	return {
		embeds: [
			{
				title: `${emoteOnline} **0/${jkaResponse.cvars.sv_maxclients}** | **${jkaResponse.cvars.g_gametype}** | **${normalizeJkaString(jkaResponse.cvars.sv_hostname)}**`,
				footer: {
					text: `/connect ${server.address}${server.password === "null" ? `` : `;password ${server.password}`}`
				},
				timestamp: date.toISOString(),
				color: `${intColorEmpty}`
			}
		]
	}
}

export const getServerEmbed = (
	server: ServerModel,
	jkaResponse: TGetStatusSmartResponse,
) => {
	const date = new Date();

	let players = 'N) Sc | Ping | Name\n'
	let playerIndex = 1
	for (const client of jkaResponse.clients) {
		let clientName = validateNickname(client.name)
		//Discord hack with '⠀' (unicode space char) https://www.compart.com/en/unicode/U+2800
		players += `${playerIndex})⠀${client.score} | ${client.ping} | ${normalizeJkaString(clientName)}\n`;
		playerIndex++;
	}

	return {
		embeds: [
			{
				author: {
					name: `${normalizeJkaString(jkaResponse.cvars.sv_hostname)}`
				},
				title: `${server.address}`,
				fields: [
					{
						name: "Map",
						value: `${jkaResponse.cvars.mapname.toLowerCase()}`,
						inline: true
					},
					{
						name: "Gametype",
						value: `${jkaResponse.cvars.g_gametype}`,
						inline: true
					},
					{
						name: "Fraglimit",
						value: `${jkaResponse.cvars.fraglimit.toString()}`,
						inline: true
					},
					{
						name: "Timelimit",
						value: `${jkaResponse.cvars.timelimit.toString()}`,
						inline: true
					},
					{
						name: `:white_check_mark: Online ${jkaResponse.clients.length}/${jkaResponse.cvars.sv_maxclients}`,
						value: `${players}`,
						inline: false
					},
				],
				footer: {
					text: `/connect ${server.address}${server.password === "null" ? `` : `;password ${server.password}`}`
				},
				timestamp: date.toISOString(),
				color: `${intColorNormal}`,
				thumbnail: {
					url: `${mapUrl[jkaResponse.cvars.mapname.toLowerCase()] === undefined ? mapUrl.default : mapUrl[jkaResponse.cvars.mapname]}`
				}
			}
		]
	}
}
