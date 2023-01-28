import {DiscordClient} from './client'
import {ChatInputCommandInteraction, EmbedBuilder, TextChannel} from 'discord.js'
import MonitoringModel from './model/MonitoringModel'

export async function addServer(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const channel = interaction.options.getChannel('destination') as TextChannel
    const address = interaction.options.getString('address')
    const name = interaction.options.getString('name')
    const password = interaction.options.getString('password') === null ? 'null' : interaction.options.getString('password')

    const guildId = interaction.guildId
    const channelId = channel.id
    const message = await channel.send({embeds: [new EmbedBuilder().setTitle(name)]})
    const messageId = message.id

    const mons = await MonitoringModel.find({guildId: guildId, channelId: channelId})

    const monitoringModel = new MonitoringModel({
        guildId,
        channelId,
        messageId,
        address: address.includes(':') ? address : `${address}:29070`,
        name,
        password,
        index: mons.length
    })

    await monitoringModel.save()
    await interaction.editReply("Added.")
}

export async function listServers(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const mons = await MonitoringModel.find({ guildId: interaction.guildId}).sort( {'channelId': 1, 'index': 1})
    let output = ''
    const emb = new EmbedBuilder()

    for (const mon of mons) {
        const textChannel = interaction.guild.channels.cache.get(mon.channelId) as TextChannel
        const pass = mon.password === 'null' ? '' : `:${mon.password}`
        const out = `${textChannel.toString()} ${mon.index}) ${mon.name} ${mon.address}${pass} (${mon.id})\n`
        output += out
    }

    emb.setTitle('Server list')
    emb.setDescription(output === '' ? 'Empty' : output)

    await interaction.editReply({embeds: [emb]})
}

export async function deleteServer(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const name = interaction.options.getString('name')
    const mon = await MonitoringModel.findOne({guildId: interaction.guildId, name: name})
    const channel = await interaction.guild.channels.fetch(mon.channelId) as TextChannel

    const message = await channel.messages.fetch(mon.messageId)
    await message.delete()

    await mon.remove()

    await interaction.editReply('Deleted.')
}

export async function editServer(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const name = interaction.options.getString('name')
    const mon = await MonitoringModel.findOne({guildId: interaction.guildId, name: name})

    const address = interaction.options.getString('address')
    const password = interaction.options.getString('password')
    const index = interaction.options.getNumber('index')

    if (address) {
        mon.address = address
    }
    if (password) {
        mon.password = password
    }
    if (index) {
        mon.index = index
    }

    await mon.save()

    await interaction.editReply('Edited.')
}

export async function rebuildServers(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const guildId = interaction.guildId

    const mons = await MonitoringModel.find({ guildId: guildId }).sort({ 'index': 1 })
    for (const mon of mons) {
        const channel = await interaction.guild.channels.fetch(mon.channelId) as TextChannel

        try {
            const oldMessage = await channel.messages.fetch(mon.messageId)
            await oldMessage.delete()
        } catch (e) {}

        const message = await channel.send({embeds: [new EmbedBuilder().setTitle(mon.name)]})
        mon.messageId = message.id
        await mon.save()
    }

    await interaction.editReply('Rebuild.')
}
