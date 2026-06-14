import {registerSlashCommands} from "@/modules/command/registerCommands";
import {Client, Events, MessageFlags, PermissionsBitField} from "discord.js";
import {addServer} from "@/modules/command/addServer";
import {listServers} from "@/modules/command/listServers";
import {deleteServer} from "@/modules/command/deleteServer";
import {editServer} from "@/modules/command/editServer";
import {rebuildServers} from "@/modules/command/rebuildServers";

export const commandModule = async (client: Client) => {
	await registerSlashCommands();

	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isChatInputCommand()) {
			return;
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
