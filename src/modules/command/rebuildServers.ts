import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
} from "discord.js";
import {getServers, setServers} from "@/modules/server/serverModel";

export const rebuildServers = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: MessageFlags.Ephemeral
	})

	const servers = await getServers();
	const guildId = interaction.guildId

	for (let i = 0; i < servers.length; i++) {
		const server = servers[i];
		if (server.guildId !== guildId) {
			continue;
		}

		const channel = await interaction.guild!.channels.fetch(server.channelId)
		if (!channel?.isSendable()) {
			console.warn(`Cannot rebuild server ${server.id}: channel ${server.channelId} is not sendable`)
			continue
		}

		try {
			const oldMessage = await channel.messages.fetch(server.messageId)
			await oldMessage.delete()
		} catch (e) {}

		const message = await channel.send({embeds: [new EmbedBuilder().setTitle(server.name)]})
		server.messageId = message.id;

		servers[i] = server;
	}

	await setServers(servers);

	await interaction.editReply('Rebuild.')
}
