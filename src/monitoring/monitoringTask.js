import cron from 'node-cron'
import {getStatusSmart} from "jka-core";
import {MessageEmbed} from "discord.js";
import {client} from "../client.js";
import Monitoring from "../model/Monitoring.js";
import {normalizeJkaString} from "./monitoringMessageUtil.js";

export const task = cron.schedule('* * * * *', async () => {
    await update()
}, {
    scheduled: false
})

async function update() {
    const mons = await Monitoring.find({});
    //console.log('mons: ', mons)
    for (const mon of mons) {
        //console.log('mon: ', mon)
        const guild = client.guilds.cache.get(mon.guildId);
        const channel = await guild.channels.fetch(mon.channelId);
        const message = await channel.messages.fetch(mon.messageId);
        const jkaResponse = await getStatusSmart(mon.address);
        //console.log("jkaResponse:", jkaResponse);

        let embed = new MessageEmbed();
        if (jkaResponse.clients.length === 0) {
            const emoteOnline = guild.emojis.cache.find((emoji) => emoji.name === "greendot") === "undefined" ? "\uD83D\uDFE2" : guild.emojis.cache.find((emoji) => emoji.name === "greendot");

            embed
                .setTitle(`${emoteOnline} **0/${jkaResponse.cvars.sv_maxclients}** | **${jkaResponse.cvars.g_gametype}** | **${await normalizeJkaString(jkaResponse.cvars.sv_hostname)}**`)
                .setFooter({text: `/connect ${mon.address}${mon.password === "undefined" ? undefined : `;${mon.password}`}`,})
                .setTimestamp(Date.now());

            await message.edit({embeds: [embed]})
            continue
        }

        embed
            .setAuthor({name: await normalizeJkaString(jkaResponse.cvars.sv_hostname)})
            .setTitle(mon.address)
            .addField("Map", jkaResponse.cvars.mapname, true)
            .addField("Gametype", jkaResponse.cvars.g_gametype, true)
            .addField("Fraglimit", jkaResponse.cvars.fraglimit.toString(), true)
            .addField("Timelimit", jkaResponse.cvars.timelimit.toString(), true);
        //.addField("Players", jkaResponse.clients)

        await message.edit({embeds: [embed]});
        // console.log('message:', message)
    }
}