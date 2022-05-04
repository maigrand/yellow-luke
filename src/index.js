import mongoose from 'mongoose'
import {client} from './client.js'
import {task} from './task/monitoringTask.js'
import {SlashCommandBuilder} from '@discordjs/builders'
import {REST} from '@discordjs/rest'
import {Routes} from 'discord-api-types/v9'
import Monitoring from './model/Monitoring.js'
import {MessageEmbed} from 'discord.js'

async function start() {
    if (process.argv[2] === '--register') {
        await registerCommands()
        process.exit()
    } else if (process.argv[2] === '--clear') {
        await clearCommands()
        process.exit()
    }

    try {
        await mongoose.connect(process.env.MONGO_URL)
        await client.login(process.env.DISCORD_TOKEN)

        client.once("ready", async (e) => {
            console.log(`${client.user.tag}`)
        })

        task()

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return
            if (interaction.user.id !== "154437997989855232") return

            const {commandName} = interaction

            if (commandName === 'madd') {
                const channel = interaction.options.getChannel('destination')
                const address = interaction.options.getString('address')
                const name = interaction.options.getString('name')
                const password = interaction.options.getString('password') === null ? "null" : interaction.options.getString('password')

                const guildId = interaction.guildId
                const channelId = channel.id
                const message = await channel.send({embeds: [new MessageEmbed().setTitle(name)]})
                const messageId = message.id

                const mon = new Monitoring({
                    guildId,
                    channelId,
                    messageId,
                    address,
                    name,
                    password
                })

                await mon.save()
                await interaction.reply('Added.')
            }
        })

        client.on('rateLimit', (data) => {
            console.log('rateLimitData: ', data)
        })

        client.on('debug', (info) => {
            console.log('debugInfo: ', info)
        })

        client.on('error', (error) => {
            console.log('errorInfo: ', error)
        })

        client.on('warn', (warn) => {
            console.log('warnInfo: ', warn)
        })

        client.on('messageUpdate', async (oldMsg, newMsg) => {
            try {
                if (newMsg.author.bot) {
                    return
                }

                const guild = client.guilds.cache.get(newMsg.guildId)
                const channel = await guild.channels.fetch(newMsg.channelId)
                const logChannel = await guild.channels.fetch(process.env.LOG_TEXT_CHANNEL_ID)
                const embed = new MessageEmbed()

                embed.setTitle("Edited message")
                embed.setAuthor({name: newMsg.author.username, iconURL: newMsg.author.avatarURL()})
                embed.setColor([255, 165, 0])
                embed.setTimestamp(Date.now())
                embed.addField("Channel", channel.toString(), false)
                embed.addField("Old Content", oldMsg.content === '' || oldMsg.content === undefined ? "Empty" : oldMsg.content, false)
                embed.addField("New Content", newMsg.content, false)

                await logChannel.send({embeds: [embed]})
            } catch (e) {
                console.error(e)
            }
        })

        client.on('messageDelete', async (msg) => {
            try {
                if (msg.author.bot) {
                    return
                }

                const guild = client.guilds.cache.get(msg.guildId)
                const channel = await guild.channels.fetch(msg.channelId)
                const logChannel = await guild.channels.fetch(process.env.LOG_TEXT_CHANNEL_ID)
                const embed = new MessageEmbed()

                embed.setTitle("Removed message")
                embed.setAuthor({name: msg.author.username, iconURL: msg.author.avatarURL()})
                embed.setColor([255, 165, 0])
                embed.setTimestamp(Date.now())
                embed.addField("Channel", channel.toString(), false)
                embed.addField("Content", msg.content, false)

                await logChannel.send({embeds: [embed]})
            } catch (e) {
                console.error(e)
            }
        })

    } catch (e) {
        console.log("Main Error", e.message)
        process.exit(1)
    }
}

async function registerCommands() {
    const commands = [
        new SlashCommandBuilder()
            .setName('madd')
            .setDescription('Monitoring add')
            .addChannelOption(option =>
                option.setName("destination")
                    .setDescription("Channel")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("address")
                    .setDescription("address")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("name")
                    .setDescription("name")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("password")
                    .setDescription("password")),
        new SlashCommandBuilder().setName('medit').setDescription('Monitoring edit'),
        new SlashCommandBuilder().setName('mrem').setDescription('Monitoring remove'),
    ].map(command => command.toJSON())

    try {
        const rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN)
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {body: []})
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {body: commands})
        console.log("Successfully registered application commands.")
    } catch (e) {
        console.error(e)
    }
}

async function clearCommands() {
    try {
        let rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN)
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {body: []})
        console.log("Successfully cleared application commands.")
    } catch (e) {
        console.error(e)
    }
}

process.on('unhandledRejection', (e) => {
    console.error(e)
});

start().catch((e) => console.error(e))
