import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlagsBitField,
	TextChannel
} from "discord.js";
import {getServers, setServers} from "@/modules/server/serverModel";

export const rebuildServers = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: [MessageFlagsBitField.Flags.Ephemeral]
	})

	const servers = await getServers();
	const guildId = interaction.guildId

	for (let i = 0; i < servers.length; i++) {
		const server = servers[i];
		if (server.guildId !== guildId) {
			continue;
		}

		const channel = await interaction.guild.channels.fetch(server.channelId) as TextChannel

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
