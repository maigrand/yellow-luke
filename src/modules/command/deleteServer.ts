import {
	ChatInputCommandInteraction,
	MessageFlagsBitField,
	TextChannel
} from "discord.js";
import {getServers, setServers} from "@/modules/server/serverModel";

export const deleteServer = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: [MessageFlagsBitField.Flags.Ephemeral]
	})

	const servers = await getServers();

	const name = interaction.options.getString('name')
	const server = servers.find((srv) => srv.name === name && srv.guildId === interaction.guildId)
	const textChannel = await interaction.guild.channels.fetch(server.channelId) as TextChannel

	const message = await textChannel.messages.fetch(server.messageId);
	await message.delete();

	servers.splice(servers.indexOf(server), 1);
	await setServers(servers);

	await interaction.editReply(`Сервер: ${name} удален из ${textChannel} (${server.address})`);
}
