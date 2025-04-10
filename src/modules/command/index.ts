import {registerSlashCommands} from "@/modules/command/registerCommands";
import {Client, Events, PermissionsBitField} from "discord.js";
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
		if (!memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
			return;
		}

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
	})
}
