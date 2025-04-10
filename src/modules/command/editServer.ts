import {ChatInputCommandInteraction, MessageFlagsBitField} from "discord.js";
import {getServers, setServers} from "@/modules/server/serverModel";

export const editServer = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		flags: [MessageFlagsBitField.Flags.Ephemeral]
	})

	const servers = await getServers();

	const name = interaction.options.getString('name')
	const server = servers.find((srv) => srv.name === name && srv.guildId === interaction.guildId)

	const address = interaction.options.getString('address')
	const password = interaction.options.getString('password')
	const index = interaction.options.getNumber('index')

	if (address) {
		server.address = address
	}
	if (password) {
		server.password = password
	}
	if (index) {
		server.index = index
	}

	const serverIndex = servers.findIndex((srv) => srv.id === server.id);
	servers[serverIndex] = server;
	await setServers(servers);

	await interaction.editReply(`Сервер: ${name} изменён. ${server.address} ${server.password} ${server.index}`);
}
