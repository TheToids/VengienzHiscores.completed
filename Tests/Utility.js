require('dotenv').config();
const { getWebhookIdAndTokenFromLink, getRole, retryPromise, findParentObject } = require('../Utility.js');
const fs = require('fs');
const puppeteer = require('puppeteer');
const Jimp = require('jimp');
const { createCanvas } = require('canvas');
const svgpath = require('svgpath');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const url = require('url');
const { WOMClient, Metric, METRICS } = require('@wise-old-man/utils');
const client = new WOMClient({
    apiKey: `${process.env.API_KEY}`,
    userAgent: 'Toids'
});
const { EmbedBuilder, WebhookClient, AttachmentBuilder } = require('discord.js');
const canvasPath = './Assets/Canvas/canvas.png';
const templateScoreboard = {
    'KaiserBruno': {
        'role': 'Owner.png',
        'name': 'KaiserBruno',
        'score': '999999',
        'rank': '1'
    },
    'Toids': {
        'role': 'Admiral.png',
        'name': 'Toids',
        'score': '99999',
        'rank': '500'
    },
    'J Chin': {
        'role': 'Colonel.png',
        'name': 'J Chin',
        'score': '25000',
        'rank': '6900'
    },
    'EasyFro': {
        'role': 'Administrator.png',
        'name': 'EasyFro',
        'score': '1000',
        'rank': '10000'
    },
    'AnnoyingName': {
        'role': 'Red_Topaz.png',
        'name': 'AnnoyingName',
        'score': '1',
        'rank': '999999'
    },
    'PlaceHolder': {
        'role': 'Minion.png',
        'name': 'PlaceHolder',
        'score': '0',
        'rank': '0'
    },
    'PlaceHolder2': {
        'role': 'Minion.png',
        'name': 'PlaceHolder',
        'score': '0',
        'rank': '0'
    },
    'PlaceHolder3': {
        'role': 'Minion.png',
        'name': 'PlaceHolder',
        'score': '0',
        'rank': '0'
    },
    'PlaceHolder4': {
        'role': 'Minion.png',
        'name': 'PlaceHolder',
        'score': '0',
        'rank': '0'
    },
    'PlaceHolder5': {
        'role': 'Minion.png',
        'name': 'PlaceHolder',
        'score': '0',
        'rank': '0'
    }
};
const templateMetric = 'Deranged Archaeologist';
const templateMetricFile = 'deranged_archaeologist.png'


function formatText(filename) {
    // Remove the file extension
    let nameWithoutExtension = filename.split('.').slice(0, -1).join('.');

    // Replace underscores with spaces
    let nameWithSpaces = nameWithoutExtension.replace(/_/g, ' ');

    // Capitalize the first letter of each word
    let formattedName = nameWithSpaces.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return formattedName;
}

function createFileObject(directory) {
    const files = fs.readdirSync(directory);
    const fileObject = {};

    files.forEach(file => {
        const fileNameWithoutExt = path.parse(file).name.toLowerCase();

        fileObject[fileNameWithoutExt] = formatText(file);
    });

    return fileObject;
}
/*
// Usage
const directory = './Assets/Pets/transformed'; // replace with your directory
const fileObject = createFileObject(directory);
console.log(JSON.stringify(fileObject, null, 2));

*/

const webhookDetails = getWebhookIdAndTokenFromLink(process.env.WEBHOOK_URL);
const webhookClient = new WebhookClient({ id: webhookDetails.id, token: webhookDetails.token });
const testSend = async () => {
    try {
        let imageName = './Assets/Canvas/canvas.png';
        const file = new AttachmentBuilder(imageName);
        const message = await webhookClient.send({
            username: 'Vengienz Hiscores',
            avatarURL: 'https://i.imgur.com/K0Bz4ZN.png',
            files: [file]
        });
        //console.log('Embed sent successfully');
        console.log(file)
    } catch (error) {
        console.log(error)
    }
}
//testSend();
//300x50








const rolePath = path.join(__dirname, '../Assets/Roles');
const metricPath = path.join(__dirname, '../Assets/Metrics');


const metricSVG = async () => {
    const textSVG = `
<svg width="260" height="50"> 
  <text x="150" y="30" font-family="Arial" font-size="20" fill="black" text-anchor="middle" >${templateMetric}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

//170x20
const playerSVG = async (playerData) => {
    const textSVG = `
<svg width="170" height="40"> 
  <text x="0" y="20" font-family="Arial" font-size="20" fill="black" text-anchor="start" >${playerData}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const titleSVG = async (playerData) => {
    const textSVG = `
<svg width="170" height="40"> 
  <text x="0" y="20" font-family="Arial" font-size="20" fill="black" text-anchor="start" font-weight="bold">${playerData}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const metricPng = async () => {
    return sharp(path.join(metricPath, templateMetricFile))
        .toFormat('png')
        .resize(50, 50)
        .toBuffer();
}



const testCanvas = async () => {
    let playerCount = 0;
    let startPos = 220;
    let playerData = [];
    const metric = await metricSVG();
    const communityMember = await titleSVG('Username');
    const score = await titleSVG('Score');
    const rank = await titleSVG('Rank');
    const metricImg = await metricPng();
    const canvas = sharp(canvasPath);
    /*const canvasBuffer = await canvas.composite([{
        input: metric,
        left: 150,
        top: 30,
        }])
        .toBuffer();
      */
    for (const player in templateScoreboard) {
        console.log(path.join(rolePath, templateScoreboard[player].role))
        const playerRole = await sharp(path.join(rolePath, templateScoreboard[player].role)).toBuffer();
        const playerName = await playerSVG(templateScoreboard[player].name);
        const playerScore = await playerSVG(templateScoreboard[player].score);
        const playerRank = await playerSVG(templateScoreboard[player].rank);
        playerData.push(
            {
                input: playerRole,
                left: 105,
                top: startPos + (playerCount * 30) + 6
            },
            {
                input: playerName,
                left: 120,
                top: startPos + (playerCount * 30)
            },
            {
                input: playerScore,
                left: 295,
                top: startPos + (playerCount * 30)
            },
            {
                input: playerRank,
                left: 415,
                top: startPos + (playerCount * 30)
            });
        playerCount++;
    }
    playerData.push(
        {
            input: metric,
            left: 150,
            top: 30,
        },
        {
            input: metricImg,
            left: 275,
            top: 100,
        }
    );

    playerData.push(
        {
            input: communityMember,
            left: 105,
            top: 190,
        },
        {
            input: score,
            left: 295,
            top: 190,
        },
        {
            input: rank,
            left: 415,
            top: 190,
        }
    )
    await canvas.composite(playerData).toFile('testcanvas2.png');

}

function capitalizeWords(str) {
    let temp = str.replace('_', ' ');
    return temp.replace(/\b(?<!')\w/g, function (char) {
        return char.toUpperCase();
    });
}

const createPetsTextSVG = async (directoryPath) => {
    try {
        // Helper function to capitalize words

        const files = await fs.promises.readdir(directoryPath);
        //return console.log(JSON.stringify(files, null, 2));
        for (const file of files) {
            //console.log(file)
            const fileName = path.parse(file).name;
            const fileUp = capitalizeWords(fileName).trim();
            //console.log(fileUp)
            const textSVG = `
<svg width="85" height="50"> 
  <text x="50%" y="91%" font-family="Arial" font-size="10" fill="black" text-anchor="middle" font-weight="bold" dy=".3em">${fileUp}</text>
</svg>`;
            const textBuffer = await sharp(Buffer.from(textSVG))
                .toBuffer();

            // Read the base image into a buffer
            const baseImageBuffer = await fs.promises.readFile(path.join(directoryPath, file));

            // Create a transparent canvas
            const transparentCanvas = sharp({
                create: {
                    width: 85,
                    height: 50,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            }).png();

            // Composite the base image onto the transparent canvas
            const withBaseImage = await transparentCanvas
                .composite([{ input: baseImageBuffer }])
                .toBuffer();

            // Composite the SVG buffer onto the canvas with the base image
            const finalImage = await sharp(withBaseImage)
                .composite([{ input: textBuffer, gravity: 'south' }])
                .png() // Ensure the output is in PNG format
                .toBuffer();

            // Write the final image to the file

            const outputPath = path.join(`./Assets/Pets/test/faded/`, `fade_${fileUp}.png`);
            //console.log(`Output image with text overlay saved as '${outputPath}'`);
            await fs.promises.writeFile(outputPath, finalImage);
            //console.log(`Output image with text overlay saved as '${outputPath}'`);

        };
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};




const createPetsTextSVGNormal = async (directoryPath) => {
    try {
        // Helper function to capitalize words

        const files = await fs.promises.readdir(directoryPath);
        //return console.log(JSON.stringify(files, null, 2));
        for (const file of files) {
            //console.log(file)
            const fileName = path.parse(file).name;
            const fileUp = capitalizeWords(fileName).trim();
            //console.log(fileUp)
            const textSVG = `
<svg width="85" height="50"> 
  <text x="50%" y="91%" font-family="Arial" font-size="10" fill="black" text-anchor="middle" font-weight="bold" dy=".3em">${fileUp}</text>
</svg>`;
            const textBuffer = await sharp(Buffer.from(textSVG))
                .toBuffer();

            // Read the base image into a buffer
            const baseImageBuffer = await fs.promises.readFile(path.join(directoryPath, file));

            // Create a transparent canvas
            const transparentCanvas = sharp({
                create: {
                    width: 85,
                    height: 50,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            }).png();

            // Composite the base image onto the transparent canvas
            const withBaseImage = await transparentCanvas
                .composite([{ input: baseImageBuffer }])
                .toBuffer();

            // Composite the SVG buffer onto the canvas with the base image
            const finalImage = await sharp(withBaseImage)
                .composite([{ input: textBuffer, gravity: 'south' }])
                .png() // Ensure the output is in PNG format
                .toBuffer();

            // Write the final image to the file

            const outputPath = path.join(`./Assets/Pets/test/not_faded/`, `${fileUp}.png`);
            //console.log(`Output image with text overlay saved as '${outputPath}'`);
            await fs.promises.writeFile(outputPath, finalImage);
            //console.log(`Output image with text overlay saved as '${outputPath}'`);

        };
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};





const makeThemTransparent = async (directoryPath) => {
    const files = await fs.promises.readdir(directoryPath);
    for (const file of files) {
        // check if file is a .png
        if (path.extname(file) === '.png') {
            try {
                const image = await Jimp.read(path.join(directoryPath, file));
                // iterate over all pixels
                image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                    // get the current pixel color
                    let rgba = Jimp.intToRGBA(image.getPixelColor(x, y));
                    // adjust the opacity
                    rgba.a = Math.floor(rgba.a * 0.30); // reduce opacity by 50%
                    // set the new pixel color
                    image.setPixelColor(Jimp.rgbaToInt(rgba.r, rgba.g, rgba.b, rgba.a), x, y);
                });
                // write the new image to file
                let newFilePath = path.join('./Assets/Pets/test/faded/test/' + file);
                await image.writeAsync(newFilePath);
            } catch (err) {
                console.error(err);
            }
        }
    }
}



const Discord = require('discord.js');
const { Client, GatewayIntentBits  } = require('discord.js');

const clientVeng = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers ] 
});

const testFunct = async () => {
    clientVeng.on('messageCreate', async message => {
        if (message.content === '!toid') {
            let role = message.guild.roles.cache.find(role => role.name === "Clan Member");
            if (!role) return message.channel.send('No "clan member" role found.');

            await message.guild.members.fetch();

            let members = message.guild.members.cache.filter(member => member.roles.cache.find(r => r.name === "Clan Member"));
            console.log(members)
            let memberList = members.map(m => m.displayName);

            let chunks = [];
            for (let i = 0; i < memberList.length; i += 50) {
                chunks.push(memberList.slice(i, i + 50));
            }

            for (let chunk of chunks) {
                message.channel.send(`${chunk.join('\n')}`);
            }
        }
    });
    clientVeng.login(process.env.VENG_TOKEN);
}
//testFunct();


const renameBackToWebp = async () => {
    const files = await fs.promises.readdir('C:/Users/Cody/Documents/Temp/Metrics')
    for(const file of files) {
        fs.renameSync(`C:/Users/Cody/Documents/Temp/Metrics/${path.parse(file).name}.png`,`C:/Users/Cody/Documents/Temp/Metrics/${path.parse(file).name}.webp`);
    }
}
//renameBackToWebp()


const newPetsFunction = async () => {
    await createPetsTextSVGNormal('./Assets/Pets/test/normal/')
    await makeThemTransparent('./Assets/Pets/test/normal');
    await createPetsTextSVG('./Assets/Pets/test/faded/test/')
}
// move file to Assets\Pets\transformed
await newPetsFunction()
