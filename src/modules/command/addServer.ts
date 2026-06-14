import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
} from "discord.js";
import {getServers, ServerModel, setServers} from "@/modules/server/serverModel";

export const addServer = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: MessageFlags.Ephemeral
	})

	const selectedChannel = interaction.options.getChannel('destination', true)
	const channel = await interaction.guild!.channels.fetch(selectedChannel.id)
	if (!channel?.isSendable()) {
		await interaction.editReply('Выбранный канал не поддерживает отправку сообщений.')
		return
	}
	const address = interaction.options.getString('address', true)
	const name = interaction.options.getString('name', true)
	const password = interaction.options.getString('password') ?? 'null'

	const guildId = interaction.guildId!
	const channelId = channel.id
	const message = await channel.send({embeds: [new EmbedBuilder().setTitle(name)]})
	const messageId = message.id

	const servers = await getServers();
	const nextId = servers.reduce((maxId, server) => Math.max(maxId, server.id), -1) + 1;

	const server: ServerModel = {
		id: nextId,
		guildId,
		channelId,
		messageId,
		address: address.includes(':') ? address : `${address}:29070`,
		name,
		password,
		index: servers.length,
	}

	servers.push(server);
	await setServers(servers);
	await interaction.editReply(`Сервер: ${name} добавлен в ${channel} (${address})`);
}
