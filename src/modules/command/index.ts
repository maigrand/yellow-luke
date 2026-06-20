import {registerSlashCommands} from "@/modules/command/registerCommands";
import {Client, Events, MessageFlags, PermissionsBitField} from "discord.js";
import {addServer} from "@/modules/command/addServer";
import {listServers} from "@/modules/command/listServers";
import {deleteServer} from "@/modules/command/deleteServer";
import {editServer} from "@/modules/command/editServer";
import {rebuildServers} from "@/modules/command/rebuildServers";
import {textChannelPlayers, textChannelPlayersServersSelect, TEXT_CHANNEL_PLAYERS_SERVERS_CUSTOM_ID} from "@/modules/command/textChannelPlayers";
import {help} from "@/modules/command/help";

export const commandModule = async (client: Client) => {
	await registerSlashCommands();

	client.on(Events.InteractionCreate, async (interaction) => {
		if (interaction.isStringSelectMenu() && interaction.customId === TEXT_CHANNEL_PLAYERS_SERVERS_CUSTOM_ID) {
			if (!interaction.inGuild()) {
				return
			}
			try {
				await textChannelPlayersServersSelect(interaction)
			} catch (error) {
				console.error('Text channel players servers select failed', error);
				if (interaction.deferred || interaction.replied) {
					await interaction.editReply('Не удалось сохранить выбор серверов.')
				} else {
					await interaction.reply({
						content: 'Не удалось сохранить выбор серверов.',
						flags: MessageFlags.Ephemeral,
					})
				}
			}
			return
		}

		if (!interaction.isChatInputCommand()) {
			return
		}

		const memberPermissions = interaction.memberPermissions;
		if (!interaction.inGuild() || !memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
			await interaction.reply({
				content: 'Эта команда доступна только администраторам сервера.',
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			if (interaction.commandName === 'madd') {
				await addServer(interaction)
			} else if (interaction.commandName === 'mlist') {
				await listServers(interaction)
			} else if (interaction.commandName === 'medit') {
				await editServer(interaction)
			} else if (interaction.commandName === 'mdel') {
				await deleteServer(interaction)
			} else if (interaction.commandName === 'mrebuild') {
				await rebuildServers(interaction)
			} else if (interaction.commandName === 'mtextchannelplayers') {
				await textChannelPlayers(interaction)
			} else if (interaction.commandName === 'mhelp') {
				await help(interaction)
			}
		} catch (error) {
			console.error(`Command /${interaction.commandName} failed`, error);
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply('Не удалось выполнить команду.');
			} else {
				await interaction.reply({
					content: 'Не удалось выполнить команду.',
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	})
}
