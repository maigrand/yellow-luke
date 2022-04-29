import {getStatusSmart} from 'jka-core'
import {client} from '../client.js'
import fetch from 'node-fetch'
import Monitoring from '../model/Monitoring.js'
import fs from 'fs'
import path from 'path'

const mapUrl = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './src/mapUrl.json')))
const intColorNormal = 696330
const intColorEmpty = 673290
const intColorOffline = 3276800

export const task = () => {
    update()
}

async function update() {
    try {
        const mons = await Monitoring.find({})
        for (const mon of mons) {
            try {
                let jkaResponse

                try {
                    jkaResponse = await getStatusSmart(mon.address)
                } catch (e) {
                    await sendMessageViaRestServerOffline(mon)
                    continue
                }

                if (jkaResponse.clients.length === 0) {
                    const guild = client.guilds.cache.get(mon.guildId)
                    const emoteOnline = guild.emojis.cache?.find((emoji) => emoji.name === "greendot") === "undefined" ? "\uD83D\uDFE2" : guild.emojis.cache?.find((emoji) => emoji.name === "greendot")
                    await sendMessageViaRestServerEmpty(mon, jkaResponse, emoteOnline)
                    continue
                }

                let players = ``
                let playerIndex = 1
                for (const client of jkaResponse.clients) {
                    let clientName = client.name
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
                    players+= `${playerIndex}) ${await normalizeJkaString(clientName)} (score: ${client.score})\n`
                    playerIndex++
                }

                await sendMessageViaRest(mon, jkaResponse, players)
            } catch (e) {
                console.error(e)
            }
        }
        update()
    } catch (e) {
        console.error(e)
    }
}

async function sendMessageViaRestServerOffline(mon) {
    const date = new Date();
    const body = {
        embeds: [
            {
                title: `\uD83D\uDEAB ${mon.name}`,
                timestamp: date.toISOString(),
                color: `${intColorOffline}`
            }
        ]
    }
    const res = await fetch(`https://discord.com/api/v10/channels/${mon.channelId}/messages/${mon.messageId}`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    const payload = await res.json()
    if (res.status === 429) {
        await delay(payload.retry_after * 1000 + 500)
        return sendMessageViaRestServerOffline(mon)
    }
}

async function sendMessageViaRestServerEmpty(mon, jkaResponse, emoteOnline) {
    const date = new Date();
    const body = {
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
    const res = await fetch(`https://discord.com/api/v10/channels/${mon.channelId}/messages/${mon.messageId}`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    const payload = await res.json()
    if (res.status === 429) {
        await delay(payload.retry_after * 1000 + 500)
        return sendMessageViaRestServerEmpty(mon, jkaResponse, emoteOnline)
    }
}

async function sendMessageViaRest(mon, jkaResponse, players) {
    const date = new Date();
    const body = {
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
    const res = await fetch(`https://discord.com/api/v10/channels/${mon.channelId}/messages/${mon.messageId}`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    const payload = await res.json()
    if (res.status === 429) {
        await delay(payload.retry_after * 1000 + 500)
        return sendMessageViaRest(mon, jkaResponse, players)
    }
}

async function delay(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}

async function normalizeJkaString(string) {
    return string.replaceAll(/\^\d/g, "")
}