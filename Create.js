//create embed like jsons
require('dotenv').config();
const { getWebhookIdAndTokenFromLink, getRole, getRankByName, retryPromise, findParentObject, formatForCanvas, formatNumberForMetrics, sortData, sortDataWithPetOrdering, sortDataWithRank, sortObjectByScore } = require('./Utility.js');
const globalJson = require('./Global.json');
const sharp = require('sharp');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const url = require('url');
const { WOMClient, Metric, METRICS, formatNumber } = require('@wise-old-man/utils');
const client = new WOMClient({
    apiKey: `${process.env.API_KEY}`,
    userAgent: 'Toid'
});
const group_id = 1219;
const { EmbedBuilder, WebhookClient, AttachmentBuilder } = require('discord.js');
const { json } = require('stream/consumers');
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

const titleHelmPNG = async (file) => {
    return sharp(path.join('./Assets/Helms', file))
        .toFormat('png')
        .resize(40, 40)
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
                const helmImg = sortedPets[player].type ? await titleHelmPNG(sortedPets[player].type) : false;
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
                    //const petCounted = await petCount(globalJson.petOwners[player].icons[pet]);
                    playerData.push(
                        {
                            input: petFile,
                            left: 95 + (rowCounter * 50),
                            top: 135 + (colCounter * 50)
                            // },
                            // {
                            //     input: petCounted,
                            //     left: 112 + (rowCounter * 50),
                            //     top: 135 + (colCounter * 50)
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
            const sortedClog = await sortDataWithRank(globalJson.collection_log)
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
        // if (metric !== 'overall') {
        //     console.log(`Skipping metric: ${metric}`);
        //     continue; 
        // }
        await compositeCanvas(metric);
    }
    //await compositeCanvas('pets');
}


// const testIronHiscores = async (name) => {
//     const hiscoresLite = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${name}`
//     const ironsRealHiscoresData = await retryPromise(() => axios.get(hiscoresLite));
//     METRICS.forEach(async element => {
//         const result = await getRankByName(ironsRealHiscoresData.data, element)
//         console.log(result, element)
//     });

// }

// testIronHiscores("diebels")

const buildMetricObj = async (metric) => { //metrics
    try {
        const hiscores = await retryPromise(() => client.groups.getGroupHiscores(group_id, metric, { limit: 15 }), 3, 60100, "wiseoldman");
        for (const element of hiscores) {
            const playerCap = globalJson.metrics[metric];
            if (Object.keys(playerCap).length >= 10){
                continue; //if the metric has more than 10 players, skip it
            }
            // 2 issues, ironsRealHiscoresData is delayed in the promise stack, globalJson.metrics[metric] length is not being checked properly
            // console.log(Object.keys(playerCap).length, metric, element.player.displayName);
            const name = element.player.displayName;
            const hiscoresLite = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${name}`
            const updatedAt = element.player.updatedAt;
            const typeData = element.player.type;
            let scoreData = 'skill';
            let rankData;
            let ironsRealHiscoresData;

            if (new Date(updatedAt).getTime() < Date.now() - (Date.UTC(1970, 0, 3))) {
                console.log(`Skipping, ${name}, needs updated or removed for metric ${metric}`);
                continue;
            }

            //somehow skipping occasionally, found in overall metric data
            if (typeData !== 'regular' && element.data.type !== 'computed') {
                ironsRealHiscoresData = await retryPromise(() => axios.get(hiscoresLite, { headers: { 'User-Agent': 'Hobby project for osrs community vengienz. Fetches difference of ironman ranks for our in-game clan.' } }), 5, 180000, "jagex");
                rankData = await getRankByName(ironsRealHiscoresData.data, metric);
                rankData === null ? console.log(`Rank data for ${name} in metric ${metric} is null.`) : console.log(`Rank data for ${name} in metric ${metric} is: ${rankData}`);
            }
            else {
                rankData = element.data.rank;
            }

            if (element.data.type === 'skill') { scoreData = element.data.experience; }
            else if (element.data.type === 'boss') { scoreData = element.data.kills; }
            else if (element.data.type === 'activity') { scoreData = element.data.score; }
            else if (element.data.type === 'computed') { scoreData = element.data.value; }
            else { console.log('invalid metric type, exp/score/kills'); }

            const playerData = {
                type: typeData,
                rank: rankData,
                score: scoreData,
                role: globalJson.roleFiles[getRole(name)]
            };
            delete globalJson.metrics[metric].cat;
            globalJson.metrics[metric][name] = playerData;
        }
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
        // if (metricName !== 'overall') {
        //     console.log(`Skipping metric: ${metricName}`);
        //     continue; 
        // }
        globalJson["metrics"][metricName] = {};
        await buildMetricObj(metricName);
    }
    await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const buildPetOwnerObj = async (petOwner) => { //petOwners
    try {
        const petOwnersToExempt = ["K1ERZ", "nicnad", "Yurus", "7J"];
        if (petOwnersToExempt.includes(petOwner)) return;

        let petObtained = 0, petCount = 0;
        const url = `https://templeosrs.com/api/pets/pet_count.php?player=${petOwner}`
        const urlForAccType = `https://api.wiseoldman.net/v2/players/search?username=${petOwner}`
        const response = await retryPromise(() => axios.get(url), 5, 60100, "templeosrs");
        const responseForAccType = await retryPromise(() => axios.get(urlForAccType), 5, 60100, "wiseoldman");
        const allPets = response.data.data["1"].pets;
        const accountType = responseForAccType.data[0].type;
        globalJson.petOwners[petOwner].icons = {};

        for (const pet in allPets) {
            if (allPets[pet] > 0) { petObtained++; }
            let petFile = globalJson.petFiles[petCount][1];

            globalJson.petOwners[petOwner].icons[petFile] = allPets[pet];
            petCount++;

        }
        globalJson.petOwners[petOwner].onSite = true;
        globalJson.petOwners[petOwner].amt = petObtained;
        globalJson.petOwners[petOwner].type = accountType === 'normal' ? " " : globalJson.helmFiles[accountType];
        globalJson.petOwners[petOwner].role = globalJson.roleFiles[await getRole(petOwner)];
        globalJson.petOwners[petOwner].obtainable = petCount;

        globalJson.petOwners[petOwner].icons = await sortDataWithPetOrdering(globalJson.petOwners[petOwner].icons);

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

const updateForNewContent = async () => {
    //await startIteratingMetrics();
    //await startIteratingPets();
    //await startIteratingCanvas(); // reminder: requires active scope iteration of metrics and pets
}
//updateForNewContent()
//startIteratingMetrics();
//startIteratingCanvas();

//const skippable = [`Deadman Points`, 'Bounty Hunter (Legacy) - Hunter', 'Bounty Hunter (Legacy) - Rogue'];
//might eventually be functional thru osrs api
// const testingMetrics = async () => {
//     let comparedMetrics = {};
//     let indexReboot = 0;
//     const skippable = [`Deadman Points`, 'Bounty Hunter (Legacy) - Hunter', 'Bounty Hunter (Legacy) - Rogue'];
//     const hiscoresLite = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=toids`
//     const ironsRealHiscoresData = await retryPromise(() => axios.get(hiscoresLite));

//     function testingFunction(i){
//         if (skippable.includes(ironsRealHiscoresData.data.activities[i].name)) {
//             return testingFunction(i + 1);
//         }
//         return i;
//     }

//     METRICS.forEach(async (element, index) => {
//         //console.log(indexReboot)
//         if (ironsRealHiscoresData.data.skills[index]) {
//             comparedMetrics[`${element}`] = ironsRealHiscoresData.data.skills[index].name;
//         }
//         else if (ironsRealHiscoresData.data.activities[indexReboot]) {

//             indexReboot = testingFunction(indexReboot);
//             comparedMetrics[`${element}`] = ironsRealHiscoresData.data.activities[indexReboot].name;
//             indexReboot += 1;
//         }
//     });
//     console.log(JSON.stringify(comparedMetrics));




//     //rankData = await getRankByName(ironsRealHiscoresData.data, metric)
// }

// testingMetrics()



const shipment = async () => {
    await startIteratingMetrics()
    await startIteratingPets()
    console.log("Metrics and Pets iteration complete.");
    await startIteratingCanvas();

}
//startIteratingMetrics();
//startIteratingPets();
//startIteratingCanvas();
//shipment();

module.exports = {
    shipment
};




