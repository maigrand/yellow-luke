import {ChatInputCommandInteraction, MessageFlags} from "discord.js";
import {getServers, setServers} from "@/modules/server/serverModel";

export const editServer = async (interaction: ChatInputCommandInteraction) => {
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

	const address = interaction.options.getString('address')
	const password = interaction.options.getString('password')
	const index = interaction.options.getNumber('index')

	if (address) {
		server.address = address
	}
	if (password) {
		server.password = password
	}
	if (index !== null) {
		server.index = index
	}

	const serverIndex = servers.findIndex((srv) => srv.id === server.id);
	servers[serverIndex] = server;
	await setServers(servers);

	await interaction.editReply(`Сервер: ${name} изменён. ${server.address} ${server.password} ${server.index}`);
}
