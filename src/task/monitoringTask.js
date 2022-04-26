import cron from 'node-cron'
import {getStatusSmart} from 'jka-core'
import {MessageEmbed} from 'discord.js'
import {client} from '../client.js'
import Monitoring from '../model/Monitoring.js'
import fs from 'fs'
import path from 'path'

const mapUrl = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './src/mapUrl.json')))

export const task = cron.schedule('*/10 * * * * *', async () => {
    await update()
}, {
    scheduled: false
})

async function update() {
    try {
        const mons = await Monitoring.find({})
        for (const mon of mons) {
            try {
                const guild = client.guilds.cache.get(mon.guildId)
                const channel = await guild.channels.fetch(mon.channelId)
                const message = await channel.messages.fetch(mon.messageId)
                let jkaResponse

                try {
                    jkaResponse = await getStatusSmart(mon.address)
                } catch (e) {
                    const embed = new MessageEmbed().setTitle(`\uD83D\uDEAB ${mon.name}`)
                    await message.edit({embeds: [embed]})
                    continue
                }

                if (jkaResponse.clients.length === 0) {
                    const emoteOnline = guild.emojis.cache?.find((emoji) => emoji.name === "greendot") === "undefined" ? "\uD83D\uDFE2" : guild.emojis.cache?.find((emoji) => emoji.name === "greendot")

                    const embed = new MessageEmbed()
                        .setTitle(`${emoteOnline} **0/${jkaResponse.cvars.sv_maxclients}** | **${jkaResponse.cvars.g_gametype}** | **${await normalizeJkaString(jkaResponse.cvars.sv_hostname)}**`)
                        .setFooter({text: `/connect ${mon.address}${mon.password === "null" ? `` : `;password ${mon.password}`}`})
                        .setTimestamp(Date.now())
                        .setColor([10, 70, 10])

                        await message.edit({embeds: [embed]})
                        continue
                }

                let players = ``
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
                    players+= `${await normalizeJkaString(clientName)} (score: ${client.score})\n`
                }

                const embed = new MessageEmbed()
                    .setAuthor({name: await normalizeJkaString(jkaResponse.cvars.sv_hostname)})
                    .setTitle(mon.address)
                    .addField("Map", jkaResponse.cvars.mapname, true)
                    .addField("Gametype", jkaResponse.cvars.g_gametype, true)
                    .addField("Fraglimit", jkaResponse.cvars.fraglimit.toString(), true)
                    .addField("Timelimit", jkaResponse.cvars.timelimit.toString(), true)
                    .addField(`:white_check_mark: Online ${jkaResponse.clients.length}/${jkaResponse.cvars.sv_maxclients}`, players, false)
                    .setFooter({text: `/connect ${mon.address}${mon.password === "null" ? `` : `;password ${mon.password}`}`})
                    .setTimestamp(Date.now())
                    .setColor([10, 160, 10])
                    .setThumbnail(mapUrl[jkaResponse.cvars.mapname] === undefined ? mapUrl.default : mapUrl[jkaResponse.cvars.mapname])

                await message.edit({embeds: [embed]})
            } catch (e) {
                console.error(e)
            }
        }
    } catch (e) {
        console.error(e)
    }
}

async function normalizeJkaString(string) {
    return string.replaceAll(/\^\d/g, "")
}