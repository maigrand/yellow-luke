import cron from 'node-cron'
import {getStatusSmart} from 'jka-core'
import {MessageEmbed} from 'discord.js'
import {client} from '../client.js'
import Monitoring from '../model/Monitoring.js'

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
                const jkaResponse = await getStatusSmart(mon.address)

                let embed = new MessageEmbed()
                if (jkaResponse.clients.length === 0) {
                    const emoteOnline = guild.emojis.cache?.find((emoji) => emoji.name === "greendot") === "undefined" ? "\uD83D\uDFE2" : guild.emojis.cache?.find((emoji) => emoji.name === "greendot")

                    embed
                        .setTitle(`${emoteOnline} **0/${jkaResponse.cvars.sv_maxclients}** | **${jkaResponse.cvars.g_gametype}** | **${await normalizeJkaString(jkaResponse.cvars.sv_hostname)}**`)
                        .setFooter({text: `/connect ${mon.address}${mon.password === "undefined" ? undefined : `;${mon.password}`}`,})
                        .setTimestamp(Date.now())
                } else {
                    embed
                        .setAuthor({name: await normalizeJkaString(jkaResponse.cvars.sv_hostname)})
                        .setTitle(mon.address)
                        .addField("Map", jkaResponse.cvars.mapname, true)
                        .addField("Gametype", jkaResponse.cvars.g_gametype, true)
                        .addField("Fraglimit", jkaResponse.cvars.fraglimit.toString(), true)
                        .addField("Timelimit", jkaResponse.cvars.timelimit.toString(), true)
                        .setTimestamp(Date.now())
                }

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