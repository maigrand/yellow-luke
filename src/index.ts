import 'dotenv/config'
import {DiscordClient} from './client'
import {Events, PermissionsBitField} from 'discord.js'
import {addServer, deleteServer, editServer, listServers, rebuildServers} from './commands'
import {task} from './task/monitoringTask'

const start = async () => {
    try {
        const discordClient = new DiscordClient()
        const client = discordClient.client

        client.once(Events.ClientReady, async (e) => {
            const d = new Date()
            console.log(`${d.toUTCString()} ready ${client.user.tag}`)
        })

        //recursive function for update "monitoring messages"
        task(discordClient)

        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) {
                return
            }

            const memberPermissions = interaction.memberPermissions
            if (!memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
                return
            }

            if (interaction.commandName === 'madd') {
                await addServer(discordClient, interaction)
            } else if (interaction.commandName === 'mlist') {
                await listServers(discordClient, interaction)
            } else if (interaction.commandName === 'medit') {
                await editServer(discordClient, interaction)
            } else if (interaction.commandName === 'mdel') {
                await deleteServer(discordClient, interaction)
            } else if (interaction.commandName === 'mrebuild') {
                await rebuildServers(discordClient, interaction)
            }

        })

    } catch (e) {
        throw e
    }
}

process.on('unhandledRejection', (e) => {
    console.error(e)
    process.exit(1)
})

start()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
