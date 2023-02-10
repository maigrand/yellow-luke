import 'dotenv/config'
import {EmbedBuilder, Events, AttachmentBuilder} from 'discord.js'
import {DiscordClient} from './client'
import nodeHtmlToImage from 'node-html-to-image'
import fs from 'fs'

const start = async () => {
    try {
        const discordClient = new DiscordClient()
        const client = discordClient.client

        client.once(Events.ClientReady, async (e) => {
            const d = new Date()
            console.log(`${d.toUTCString()} ready ${client.user.tag}`)
            await htmlToImage()
        })

        client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot) {
                return
            }
            if (message.author.id !== '154437997989855232') {
                return
            }

            if (message.content === '!!ping') {
                const image = await htmlToImage() as Buffer

                const attachment = new AttachmentBuilder(image, {
                    name: 'image.png',
                })

                const emb = new EmbedBuilder()
                emb.setAuthor({
                    name: 'Some name',
                    iconURL: 'https://i.imgur.com/AfFp7pu.png',
                    url: 'https://discord.js.org'
                })
                emb.setTitle('rujka')
                emb.addFields([
                    {
                        name: 'Map',
                        value: 'de_dust2',
                        inline: true,
                    },
                    {
                        name: 'Gametype',
                        value: 'competitive',
                        inline: true,
                    },
                    {
                        name: 'Fraglimit',
                        value: '30',
                        inline: true,
                    },
                    {
                        name: 'Timelimit',
                        value: '15',
                        inline: true,
                    },
                    {
                        name: '* Online 4/32',
                        value: ' ',
                        inline: false,
                    }
                ])
                emb.setImage('attachment://image.png')

                await message.channel.send({ embeds: [emb], files: [attachment] })
            }
        })
    } catch (e) {
        throw e
    }
}

async function htmlToImage() {

    let pl = []

    for (let i = 0; i < 16; i++) {
        pl.push({
            index: i,
            name: 'player' + i,
            score: 100,
            ping: 10,
        })
    }

    const htmlTemplate = await fs.promises.readFile('./htmlplayers.html', 'utf8')

    const image = await nodeHtmlToImage({
        html: htmlTemplate,
        content: {
            players: pl,
        }
    })

    nodeHtmlToImage({
        output: './tempimage.png',
        html: htmlTemplate,
        content: {
            players: pl,
        }
    })
        .then(() => console.log('The image was created successfully!'))

    return image
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
