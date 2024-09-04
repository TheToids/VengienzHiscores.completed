//create embed like jsons
require('dotenv').config();
const { getWebhookIdAndTokenFromLink, getRole, retryPromise, findParentObject, formatForCanvas, formatNumberForMetrics, sortData, sortObjectByScore } = require('./Utility.js');
const globalJson = require('./Global.json');
const sharp = require('sharp');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const url = require('url');
const { WOMClient, Metric, METRICS, formatNumber } = require('@wise-old-man/utils');
const client = new WOMClient({
    apiKey: `${process.env.API_KEY}`,
    userAgent: 'Toids'
});
const group_id = 1219;
const { EmbedBuilder, WebhookClient, AttachmentBuilder } = require('discord.js');
require('dotenv').config();

const petSVG = async (amount) => {
    const textSVG = `
<svg width="100" height="50"> 
  <text x="10%" y="90%" font-family="Arial" font-size="20" fill="black" text-anchor="middle" font-weight="bold">${amount}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const metricSVG = async (metric) => {
    const textSVG = `
<svg width="260" height="50"> 
  <text x="150" y="30" font-family="Arial" font-size="20" fill="black" text-anchor="middle" font-weight="bold">${metric}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const metricPNG = async (file) => {
    return sharp(path.join('./Assets/Metrics', file))
        .toFormat('png')
        .resize(50, 50)
        .toBuffer();
}

const rolePNG = async (file) => {
    return sharp(path.join('./Assets/Roles', file))
        .toFormat('png')
        .resize(50, 50)
        .toBuffer();
}

const helmPNG = async (file) => {
    return sharp(path.join('./Assets/Helms', file))
        .toFormat('png')
        .resize(18, 18)
        .toBuffer();
}

const petPNG = async (file) => {
    return sharp(path.join('./Assets/Pets/transformed', file))
        .toFormat('png')
        .resize(80, 50)
        .toBuffer();
}

const headerSVG = async (field) => {
    const textSVG = `
<svg width="170" height="40"> 
  <text x="0" y="20" font-family="Arial" font-size="20" fill="black" text-anchor="start" font-weight="bold">${field}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const playerSVG = async (field) => {
    const textSVG = `
<svg width="170" height="40"> 
  <text x="0" y="20" font-family="Arial" font-size="20" fill="black" text-anchor="start" >${field}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const playerRankSVG = async (field) => {
    const textSVG = `
<svg width="85" height="40"> 
  <text x="0" y="20" font-family="Arial" font-size="20" fill="black" text-anchor="start" >${field}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const petCount = async (count) => {

    const textSVG = `
        <svg width="100" height="100"> 
          <text x="0" y="20" font-family="Arial" font-size="10" fill="black" text-anchor="start" font-weight="bold">${count}</text>
        </svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const compositeCanvas = async (element) => {
    try {
        let playerCount = 0, startPos = 220, playerData = [];
        const canvas = sharp('./Assets/Canvas/canvas.png');

        if (element === 'pets') {
            const sortedPets = await sortData(globalJson.petOwners)
            for (const player in sortedPets) {
                rowCounter = 0, colCounter = 0;
                playerData = [];
                const petCanvas = sharp('./Assets/Canvas/canvasPets.png');
                const metric = await metricSVG(player)
                const roleImg = await rolePNG(sortedPets[player].role);
                const helmImg = sortedPets[player].type ? await helmPNG(sortedPets[player].type) : false;
                const petAmt = await petSVG(sortedPets[player].amt);

                playerData.push(
                    {
                        input: metric,
                        left: 150,
                        top: 20,
                    },
                    {
                        input: roleImg,
                        left: 170,
                        top: 20,
                    },
                    {
                        input: petAmt,
                        left: 300,
                        top: 75
                    }
                );
                if (sortedPets[player].type) {
                    playerData.push({
                        input: helmImg,
                        left: 380,
                        top: 20,
                    }
                    );
                }
                for (const pet in globalJson.petOwners[player].icons) {
                    const petFile = globalJson.petOwners[player].icons[pet] === 0 ? await petPNG(`fade_${pet}`) : await petPNG(pet);
                    const petCounted = await petCount(globalJson.petOwners[player].icons[pet]);
                    playerData.push(
                        {
                            input: petFile,
                            left: 95 + (rowCounter * 50),
                            top: 135 + (colCounter * 50)
                        },
                        {
                            input: petCounted,
                            left: 112 + (rowCounter * 50),
                            top: 135 + (colCounter * 50)
                        })
                    rowCounter++;
                    if (rowCounter > 7) {
                        rowCounter = 0;
                        colCounter++;
                    }
                }
                //console.log(`./Assets/Embeds/${player}.png`)
                await petCanvas.composite(playerData).toFile(`./Assets/Embeds/${player}.png`);
            }
        }
        else if (element === 'collection_log') {
            const communityMember = await headerSVG('Username'), score = await headerSVG('Score'), rank = await headerSVG('Rank');
            const metric = await metricSVG('Collection Log');
            const metricImg = await rolePNG(`coordinator.png`);
            const sortedClog = await sortData(globalJson.collection_log)
            for (const player in sortedClog) {
                const helmImg = sortedClog[player].type === 'IRONMAN' ? await helmPNG('Ironman.png') : false;
                const playerScore = await playerSVG(formatNumberForMetrics(sortedClog[player].amt));
                const role = await getRole(player) + '.png';
                const playerRole = await sharp(path.join('./Assets/Roles', role)).resize(18, 18).toBuffer();
                const playerName = await playerSVG(player);
                const playerRank = sortedClog[player].rank === '-' ? await playerRankSVG('-') : await playerRankSVG(formatNumberForMetrics(sortedClog[player].rank));
                const playerRankData = await sharp(playerRank).metadata();
                playerData.push(
                    {
                        input: playerRole,
                        left: 98,
                        top: startPos + (playerCount * 30) + 2
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
                if (helmImg) {
                    playerData.push(
                        {
                            input: helmImg,
                            left: 415 + (playerRankData.width) - 10,
                            top: startPos + (playerCount * 30) + 5
                        }
                    )
                }
                playerCount++;
            }
            playerData.push(
                {
                    input: metric,
                    left: 150,
                    top: 20,
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
            await canvas.composite(playerData).toFile(`./Assets/Embeds/${element}.png`);
        }
        else {
            const communityMember = await headerSVG('Username'), score = await headerSVG('Score'), rank = await headerSVG('Rank');
            const metric = await metricSVG(globalJson.metricFiles[element]);
            const metricImg = await metricPNG(`${element}.png`);
            const sortedPlayersInMetric = sortObjectByScore(globalJson.metrics[element]);
            
            for (let i = 0; i < sortedPlayersInMetric.length; i++) {
                const player = sortedPlayersInMetric[i][0];
                const playerInfo = sortedPlayersInMetric[i][1]; // Renamed to avoid conflict
                const helmImg = playerInfo.type === 'regular' ? false : await helmPNG(`${playerInfo.type}.png`);
                const role = await getRole(player) + '.png';
                const playerRole = await sharp(path.join('./Assets/Roles', role)).resize(18, 18).toBuffer();
                const playerName = await playerSVG(player);
                const playerScore = await playerSVG(formatNumberForMetrics(playerInfo.score));
                const playerRank = await playerRankSVG(formatNumberForMetrics(playerInfo.rank));
                const playerRankData = await sharp(playerRank).metadata();
                playerData.push(
                    {
                        input: playerRole,
                        left: 98,
                        top: startPos + (i * 30) + 2
                    },
                    {
                        input: playerName,
                        left: 120,
                        top: startPos + (i * 30)
                    },
                    {
                        input: playerScore,
                        left: 295,
                        top: startPos + (i * 30)
                    },
                    {
                        input: playerRank,
                        left: 415,
                        top: startPos + (i * 30)
                    });

                if (helmImg) {
                    playerData.push(
                        {
                            input: helmImg,
                            left: 415 + (playerRankData.width) - 10,
                            top: startPos + (i * 30) + 5
                        }
                    )
                }
            }
            playerData.push(
                {
                    input: metric,
                    left: 150,
                    top: 20,
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
            );
            await canvas.composite(playerData).toFile(`./Assets/Embeds/${element}.png`);
        }

    } catch (error) {
        console.error(error);
    }

}

const startIteratingCanvas = async () => {
    for (const metric in globalJson.metrics) {
        await compositeCanvas(metric);
    }
    await compositeCanvas('collection_log');
    await compositeCanvas('pets');
}


const buildMetricObj = async (metric) => { //metrics
    try {
        const hiscores = await retryPromise(() => client.groups.getGroupHiscores(group_id, metric, { limit: 10 }));

        hiscores.forEach(element => {

            const name = element.player.displayName;
            let score = 'skill';
            if (element.data.type === 'skill') { score = element.data.experience; }
            else if (element.data.type === 'boss') { score = element.data.kills; }
            else if (element.data.type === 'activity') { score = element.data.score; }
            else if (element.data.type === 'computed') { score = element.data.value; }
            else { console.log('invalid metrtic type, exp/score/kills'); }

            const playerData = {
                type: element.player.type,
                rank: element.data.rank,
                score: score,
                role: globalJson.roleFiles[getRole(name)]
            };
            delete globalJson.metrics[metric].cat;
            globalJson.metrics[metric][name] = playerData;
        });
    } catch (error) {
        console.error(error)
    }
}

const startIteratingMetrics = async () => {
    const metricDir = './Assets/Metrics/'
    const files = await fs.promises.readdir(metricDir);
    globalJson["metrics"] = {};

    for (const file of files) {
        const metricName = path.parse(file).name;
        globalJson["metrics"][metricName] = {};
        await buildMetricObj(metricName);
    }
    await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}


const buildPetOwnerObj = async (petOwner) => { //petOwners
    try {
        if (petOwner === "SuperVegeto") return;
        let petObtained = 0, petCount = 0;
        const url = `https://api.collectionlog.net/collectionlog/user/${petOwner}`
        const response = await retryPromise(() => axios.get(url));
        const allPets = response.data.collectionLog.tabs.Other['All Pets'].items;
        const accountType = response.data.collectionLog.accountType.toLowerCase();
        globalJson.petOwners[petOwner].icons = {};
        for (const pet in allPets) {
            if (allPets[pet].obtained) { petObtained++; }
            let petFile = globalJson.petFiles[allPets[pet].id];
            globalJson.petOwners[petOwner].icons[petFile] = allPets[pet].quantity;
            petCount++;

        }

        globalJson.petOwners[petOwner].onSite = true;
        globalJson.petOwners[petOwner].amt = petObtained;
        globalJson.petOwners[petOwner].type = accountType === 'normal' ? "" : globalJson.helmFiles[accountType];
        globalJson.petOwners[petOwner].role = globalJson.roleFiles[await getRole(petOwner)];
        globalJson.petOwners[petOwner].obtainable = petCount;
    } catch (error) {
        console.error(error);
    }
}
const startIteratingPets = async () => {
    for (const petOwner in globalJson.petOwners) {
        await buildPetOwnerObj(petOwner);
    }
    await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}


const buildClogObj = async (clogOwner) => { //clog
    try {
        if (clogOwner === "osleeb") return;
        const url = `https://api.collectionlog.net/collectionlog/user/${clogOwner}`;
        const urlRank = `https://api.collectionlog.net/hiscores/rank/${clogOwner}`;
        const response = await retryPromise(() => axios.get(url));
        const responseRank = await retryPromise(() => axios.get(urlRank));

        globalJson.collection_log[clogOwner] = {};
        globalJson.collection_log[clogOwner].onSite = true;
        globalJson.collection_log[clogOwner].amt = response.data.collectionLog.uniqueObtained;
        globalJson.collection_log[clogOwner].type = response.data.collectionLog.accountType;
        globalJson.collection_log[clogOwner].role = await getRole(clogOwner) + '.png';
        globalJson.collection_log[clogOwner].rank = responseRank.data.rank;
    } catch (error) {
        console.error(error);
    }
}

const startIteratingClogs = async () => {
    for (const clogOwner in globalJson.collection_log) {
        await buildClogObj(clogOwner);
    }
    await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const shipment = async () => {
    await startIteratingMetrics()
    await startIteratingPets()
    await startIteratingClogs()
    await startIteratingCanvas();
}

module.exports = {
shipment
};

const updateForNewPets = async () => {
    await startIteratingMetrics()
    await startIteratingPets()
    await startIteratingClogs()
    await startIteratingCanvas();
}
updateForNewPets()



