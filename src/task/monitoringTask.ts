import {getStatusSmart, TGetStatusSmartResponse} from 'jka-core'
import {DiscordClient} from '../client'
import MonitoringModel from '../model/MonitoringModel'
import axios, {AxiosError} from 'axios'
import mapUrl from '../mapUrl.json'

const intColorNormal = 696330
const intColorEmpty = 673290
const intColorOffline = 3276800

export function task(discordClient: DiscordClient) {
    update(discordClient)
}

async function update(discordClient: DiscordClient) {
    try {
        const mons = await MonitoringModel.find({})
        for (const mon of mons) {
            try {
                let jkaResponse: TGetStatusSmartResponse

                try {
                    jkaResponse = await getStatusSmart(mon.address)
                } catch (e) {
                    await sendMessageViaRestServerOffline(mon)
                    continue
                }

                if (jkaResponse.clients.length === 0) {
                    //const guild = discordClient.client.guilds.cache.get(mon.guildId)
                    const emoji = discordClient.client.emojis.cache?.find((emoji) => emoji.name === 'greendot')
                    const emoteOnline = emoji === undefined ? "\uD83D\uDFE2" : emoji
                    await sendMessageViaRestServerEmpty(mon, jkaResponse, emoteOnline)
                    continue
                }

                let players = 'N) Sc | Ping | Name\n'
                let playerIndex = 1
                for (const client of jkaResponse.clients) {
                    let clientName = await validateNickname(client.name)
                    //Discord hack with '⠀' (unicode space char) https://www.compart.com/en/unicode/U+2800
                    players += `${playerIndex})⠀${client.score} | ${client.ping} | ${await normalizeJkaString(clientName)}\n`
                    playerIndex++
                }

                await sendMessageViaRest(mon, jkaResponse, players)

            } catch (e) {
                console.error(e)
            }
        }
        await delay(30000)
        update(discordClient)
    } catch (e) {
        console.error(e)
    }
}

async function sendMessageViaRestServerOffline(mon) {
    const date = new Date()
    const data = {
        embeds: [
            {
                title: `\uD83D\uDEAB ${mon.name}`,
                footer: {
                    text: `/connect ${mon.address}${mon.password === "null" ? `` : `;password ${mon.password}`}`
                },
                timestamp: date.toISOString(),
                color: `${intColorOffline}`
            }
        ]
    }

    try {
        await axios.request({
            url: `https://discord.com/api/v10/channels/${mon.channelId}/messages/${mon.messageId}`,
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        })
    } catch (e) {
        if (e instanceof AxiosError) {
            if (e.response?.status != null && e.resposne?.status === 429) {
                await delay (e.response.data.retry_after * 1000 + 500)
                return sendMessageViaRestServerOffline(mon)
            } else {
                throw e
            }
        } else {
            throw e
        }
    }
}

async function sendMessageViaRestServerEmpty(mon, jkaResponse, emoteOnline) {
    const date = new Date();
    const data = {
        embeds: [
            {
                title: `${emoteOnline} **0/${jkaResponse.cvars.sv_maxclients}** | **${jkaResponse.cvars.g_gametype}** | **${await normalizeJkaString(jkaResponse.cvars.sv_hostname)}**`,
                footer: {
                    text: `/connect ${mon.address}${mon.password === "null" ? `` : `;password ${mon.password}`}`
                },
                timestamp: date.toISOString(),
                color: `${intColorEmpty}`
            }
        ]
    }

    try {
        await axios.request({
            url: `https://discord.com/api/v10/channels/${mon.channelId}/messages/${mon.messageId}`,
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        })
    } catch (e) {
        if (e instanceof AxiosError) {
            if (e.response?.status != null && e.resposne?.status === 429) {
                await delay (e.response.data.retry_after * 1000 + 500)
                return sendMessageViaRestServerEmpty(mon, jkaResponse, emoteOnline)
            } else {
                throw e
            }
        } else {
            throw e
        }
    }
}

async function sendMessageViaRest(mon, jkaResponse, players) {
    const date = new Date();
    const data = {
        embeds: [
            {
                author: {
                    name: `${await normalizeJkaString(jkaResponse.cvars.sv_hostname)}`
                },
                title: `${mon.address}`,
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
                    text: `/connect ${mon.address}${mon.password === "null" ? `` : `;password ${mon.password}`}`
                },
                timestamp: date.toISOString(),
                color: `${intColorNormal}`,
                thumbnail: {
                    url: `${mapUrl[jkaResponse.cvars.mapname.toLowerCase()] === undefined ? mapUrl.default : mapUrl[jkaResponse.cvars.mapname]}`
                }
            }
        ]
    }

    try {
        await axios.request({
            url: `https://discord.com/api/v10/channels/${mon.channelId}/messages/${mon.messageId}`,
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data)
        })
    } catch (e) {
        if (e instanceof AxiosError) {
            if (e.response?.status != null && e.resposne?.status === 429) {
                await delay (e.response.data.retry_after * 1000 + 500)
                return sendMessageViaRest(mon, jkaResponse, players)
            } else {
                throw e
            }
        } else {
            throw e
        }
    }
}

async function delay(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}

async function validateNickname(nickname) {
    let clientName = nickname
    if (clientName.includes("*")) {
        clientName = clientName.replaceAll("*", "\\*")
    }
    if (clientName.includes("_")) {
        clientName = clientName.replaceAll("_", "\\_")
    }
    if (clientName.includes("\"")) {
        clientName = clientName.replaceAll("\"", "")
    }
    if (clientName.includes("|")) {
        clientName = clientName.replaceAll("|", "\\|")
    }
    if (clientName.includes("discord.gg")) {
        clientName = clientName.replaceAll(/.+/g, "discord.gg")
    }
    return clientName
}

async function normalizeJkaString(string) {
    return string.replaceAll(/\^\d/g, "")
}
