import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlagsBitField,
	TextChannel
} from "discord.js";
import {getServers} from "@/modules/server/serverModel";

export const listServers = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: [MessageFlagsBitField.Flags.Ephemeral]
	})

	const servers = await getServers();
	let output = '';
	const emb = new EmbedBuilder();

	for (const server of servers) {
		const textChannel = interaction.guild.channels.cache.get(server.channelId) as TextChannel
		const pass = server.password === 'null' ? '' : `:${server.password}`
		const out = `${textChannel.toString()} ${server.index}) ${server.name} ${server.address}${pass} (${server.id})\n`
		output += out
	}

	emb.setTitle('Server list')
	emb.setDescription(output === '' ? 'Empty' : output)

	await interaction.editReply({embeds: [emb]})
}
