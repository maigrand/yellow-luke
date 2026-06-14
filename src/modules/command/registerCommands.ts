import 'dotenv/config'
import {ChannelType, PermissionsBitField, REST, Routes, SlashCommandBuilder} from 'discord.js'

const TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.CLIENT_ID

if (!TOKEN || !CLIENT_ID) {
	throw new Error('DISCORD_TOKEN and CLIENT_ID must be set')
}

const commands = [
	new SlashCommandBuilder()
		.setName('madd')
		.setDescription('Monitoring add')
		.addChannelOption(option =>
			option
				.setName('destination')
				.setDescription('Channel')
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('address')
				.setDescription('address')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('name')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('password')
				.setDescription('password'))
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
	new SlashCommandBuilder()
		.setName('mlist')
		.setDescription('list servers')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
	new SlashCommandBuilder()
		.setName('medit')
		.setDescription('edit server')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('server name')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('address')
				.setDescription('address'))
		.addStringOption(option =>
			option
				.setName('password')
				.setDescription('password'))
		.addNumberOption(option =>
			option
				.setName('index')
				.setDescription('server position'))
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
	new SlashCommandBuilder()
		.setName('mdel')
		.setDescription('delete server')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('server name')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
	new SlashCommandBuilder()
		.setName('mrebuild')
		.setDescription('rebuild lists')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
]

const rest = new REST({version: '10'}).setToken(TOKEN)

export const registerSlashCommands = async() => {
	try {
		console.log('Started refreshing application [/] commands.')

		await rest.put(Routes.applicationCommands(CLIENT_ID), {body: commands})

		console.log('Successfully reloaded application [/] commands.')
	} catch (error) {
		console.error(error)
		throw error
	}
}
