import {
	ChatInputCommandInteraction,
	MessageFlags,
} from "discord.js";
import {getServers, setServers} from "@/modules/server/serverModel";

export const deleteServer = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: MessageFlags.Ephemeral
	})

	const servers = await getServers();

	const name = interaction.options.getString('name', true)
	const server = servers.find((srv) => srv.name === name && srv.guildId === interaction.guildId)
	if (!server) {
		await interaction.editReply(`Сервер "${name}" не найден.`)
		return
	}
	const textChannel = await interaction.guild!.channels.fetch(server.channelId)
	if (!textChannel?.isTextBased()) {
		await interaction.editReply('Канал сервера не найден или не является текстовым.')
		return
	}

	const message = await textChannel.messages.fetch(server.messageId);
	await message.delete();

	servers.splice(servers.indexOf(server), 1);
	await setServers(servers);

	await interaction.editReply(`Сервер: ${name} удален из ${textChannel} (${server.address})`);
}
