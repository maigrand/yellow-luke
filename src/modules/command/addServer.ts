import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlagsBitField,
	TextChannel
} from "discord.js";
import {getServers, ServerModel, setServers} from "@/modules/server/serverModel";

export const addServer = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: [MessageFlagsBitField.Flags.Ephemeral]
	})

	const channel = interaction.options.getChannel('destination') as TextChannel
	const address = interaction.options.getString('address')
	const name = interaction.options.getString('name')
	const password = interaction.options.getString('password') === null ? 'null' : interaction.options.getString('password')

	const guildId = interaction.guildId
	const channelId = channel.id
	const message = await channel.send({embeds: [new EmbedBuilder().setTitle(name)]})
	const messageId = message.id

	const servers = await getServers();

	const server: ServerModel = {
		id: servers.length,
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
