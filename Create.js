// Build data and constructs

// Primary imports
require('dotenv').config();
const globalJson = require('./Global.json');
const { getRankByName,  getRole, formatNumberForMetrics, retryPromise, sortData, sortObjectByScore, parsePetStructures } = require('./Utility.js');

// Secondary imports
const axios = require('axios');
const { AttachmentBuilder, EmbedBuilder, WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { WOMClient } = require('@wise-old-man/utils');
const { json } = require('stream/consumers');

// Declared file scope
const client = new WOMClient({
    apiKey: `${process.env.API_KEY}`,
    userAgent: 'Toid'
});
const group_id = 1219;

// Sharp functions
const helmPNG = async (file) => {
    return sharp(path.join('./Assets/Helms', file))
        .toFormat('png')
        .resize(18, 18)
        .toBuffer();
}

const metricPNG = async (file) => {
    return sharp(path.join('./Assets/Metrics', file))
        .toFormat('png')
        .resize(50, 50)
        .toBuffer();
}

const petPNG = async (file) => {
    return sharp(path.join('./Assets/Pets/Transformed', file))
        .toFormat('png')
        .resize(80, 50)
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

// SVG functions
const headerSVG = async (field) => {
    const textSVG = `
<svg width="170" height="40" shape-rendering="crispEdges"> 
  <text x="0" y="20" font-family="Arial" font-size="20" fill="black" text-anchor="start" font-weight="bold">${field}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const petSVG = async (amount) => {
    const textSVG = `
<svg width="100" height="50"> 
  <text x="10%" y="90%" font-family="Arial" font-size="20" fill="black" text-anchor="middle" font-weight="bold">${amount}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

const playerNameSVG = async (field) => {
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

const metricSVG = async (metric) => {
    const textSVG = `
<svg width="260" height="50"> 
  <text x="150" y="30" font-family="Arial" font-size="20" fill="black" text-anchor="middle" font-weight="bold">${metric}</text>
</svg>`;
    return sharp(Buffer.from(textSVG))
        .toFormat('png')
        .toBuffer();
}

// Builder functions
const buildCanvas = async (element) => {
    try {
        let playerCount = 0, startPos = 220, playerData = [];
        const canvas = sharp('./Assets/Canvas/canvas.png');

        if (element === 'pets') {
            const sortedPets = await sortData(globalJson.petsFetched)
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
                for (const pet in globalJson.petsFetched[player].icons) {
                    const petFile = globalJson.petsFetched[player].icons[pet] === 0 ? await petPNG(`fade_${pet}`) : await petPNG(pet);
                    playerData.push(
                        {
                            input: petFile,
                            left: 65 + (rowCounter * 50),
                            top: 151 + (colCounter * 50)
                        })
                    rowCounter++;
                    if (rowCounter > 8) {
                        rowCounter = 0;
                        colCounter++;
                    }
                }
                await petCanvas.composite(playerData).toFile(`./Assets/Embeds/${player}.png`);
            } 
        } else {
            const communityMember = await headerSVG('Username'), scoreHeader = await headerSVG('Score'), rankHeader = await headerSVG('Rank');
            const metric = await metricSVG(globalJson.metricFiles[element]);
            const metricImg = await metricPNG(`${element}.png`);
            const sortedPlayersInMetric = await sortObjectByScore(globalJson.metricsFetched[element], true);
            for (let i = 0; i < sortedPlayersInMetric.length; i++) {
                const player = sortedPlayersInMetric[i][0]; 
                const playerInfo = sortedPlayersInMetric[i][1];
                const helmImg = playerInfo.type === 'regular' ? false : await helmPNG(`${playerInfo.type}.png`);
                const role = await getRole(player) + '.png';
                const playerRole = await sharp(path.join('./Assets/Roles', role)).resize(18, 18).toBuffer();
                const playerName = await playerNameSVG(player);
                const playerScore = await playerNameSVG(formatNumberForMetrics(playerInfo.score));
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
                    input: scoreHeader,
                    left: 295,
                    top: 190,
                },
                {
                    input: rankHeader,
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

const buildMetricObj = async (metric) => { 
    try {
        const hiscores = await retryPromise(() => client.groups.getGroupHiscores(group_id, metric, { limit: 15 }), 3, 60100, "wiseoldman");
        for (const element of hiscores) {
            const name = element.player.displayName;
            const clanRole = getRole(name) 
            const hiscoresLite = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${name}`
            const updatedAt = element.player.updatedAt;
            const playerTypeData = element.player.type;
            let scoreData = 'skill';
            let rankData;
            let ironsRealHiscoresData;

            if (globalJson.metricsFetched[metric] != undefined && Object.keys(globalJson.metricsFetched[metric]).length >= 10) {
                //if the metric has more than 10 players, skip iteration
                continue; 
            }
            if (clanRole == 'guest') {
                //if the clan role is missing, skip iteration
                console.log(clanRole, metric)
                continue;
            } 

            if (playerTypeData !== 'regular' && element.data.type !== 'computed' && new Date(updatedAt).getTime() > Date.now() - (Date.UTC(1970, 0, 3))) {
                if (new Date(updatedAt).getTime() < Date.now() - (Date.UTC(1970, 0, 3))) {
                    console.log(`Skipping, ${name}:${updatedAt}, needs updated, removed, or ignored for metric ${metric}`); // build ignore logic later 
                    continue;
                }
                ironsRealHiscoresData = await retryPromise(() => axios.get(hiscoresLite, { headers: { 'User-Agent': 'Hobby project for osrs community vengienz. Fetches difference of ironman ranks for our in-game clan.' } }), 5, 180000, "jagex");
                rankData = await getRankByName(ironsRealHiscoresData.data, metric);
                // rankData === null ? console.log(`Rank data for ${name} in metric ${metric} is null.`) : console.log(`Rank data for ${name} in metric ${metric} is: ${rankData}`);
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
                type: playerTypeData,
                rank: rankData > 0 ? rankData : Object.keys(globalJson.metricsFetched[metric]).length,
                score: scoreData > 0 ? scoreData : Object.keys(globalJson.metricsFetched[metric]).length > 5 ? Object.keys(globalJson.metricsFetched[metric]).length - 5 : Object.keys(globalJson.metricsFetched[metric]).length,
                role: globalJson.roleFiles[getRole(name)]
            };
            delete globalJson.metricsFetched[metric].cat;
            globalJson.metricsFetched[metric][name] = playerData;
        }
    } catch (error) {
        console.error(error)
    }
}

const buildPetOwnerObj = async (petOwner) => { 
    try {
        let petCount = 0;
        const templeUrl = `https://templeosrs.com/api/pets/pet_count.php?player=${petOwner}`
        const wiseUrl = `https://api.wiseoldman.net/v2/players/search?username=${petOwner}`
        const response = await retryPromise(() => axios.get(templeUrl), 5, 60100, "templeosrs");
        const responseForAccType = await retryPromise(() => axios.get(wiseUrl), 5, 60100, "wiseoldman");
        const allPets = response.data.data["1"].pets;
        const accountType = responseForAccType.data[0].type;
        

        //console.log(JSON.stringify(allPets, null, 2))

        const petsKeyList = await parsePetStructures(allPets);
        
        // console.log(JSON.stringify(petsKeyList))



        const petObtained = Object.keys(petsKeyList).length;
        globalJson.petsFetched[petOwner].icons = globalJson.petsFiles;

        for (const petFile in globalJson.petsFetched[petOwner].icons) {
            const regexPet = /^(?!pet|dag|roc)([a-zA-Z]{3})/;
            const petCount = petsKeyList.includes(petFile.match(regexPet)[1].toLowerCase()) ? 1 : 0;
            globalJson.petsFetched[petOwner].icons[petFile] = petCount;
        }

        // for (const pet of allPets) { // diff data structure to loop through, in allPets? of allPets?
        //     if (allPets[pet] > 0) { petObtained++; }
        //     let petFile = globalJson.petFiles[petCount];

        //     globalJson.petsFetched[petOwner].icons[petFile] = allPets[pet];
        //     petCount++;
        // }
        globalJson.petsFetched[petOwner].onSite = true;
        globalJson.petsFetched[petOwner].amt = petObtained;
        globalJson.petsFetched[petOwner].type = accountType === 'normal' ? " " : globalJson.helmFiles[accountType];
        globalJson.petsFetched[petOwner].role = globalJson.roleFiles[await getRole(petOwner)];
        globalJson.petsFetched[petOwner].obtainable = petCount;
        console.log(petObtained)
    } catch (error) {
        console.error(error);
    }
}

// Iterator functions
const startIteratingMetrics = async () => {
    const metricDir = './Assets/Metrics/'
    const files = await fs.promises.readdir(metricDir); 
    globalJson["metricsFetched"] = {};
    for (const file of files) {
        // if (file !== 'overall') { // path.parse(file).name
        //     console.log(`Skipping metric: ${metricName}`);
        //     continue; 
        // }
        globalJson["metricsFetched"][path.parse(file).name] = {}; // Assets/Metrics locked formating to wiseoldman
        await buildMetricObj(path.parse(file).name);
        console.log(path.parse(file).name, 'finished')
    }
    await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const startIteratingPets = async () => {
    let playersCounted = [];
    const petOwnersToExempt = ["7J", "Yurus", "EasyFro"]; // see PetOverflow.json
    for (const petOwner in globalJson.petsFetched) {
        if (petOwnersToExempt.includes(petOwner)) continue;
        await buildPetOwnerObj(petOwner);
        playersCounted.push(petOwner);
    }
    console.log(`Pet owners processed: ${playersCounted.length}/${5 - petOwnersToExempt.length}`);
    await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const startIteratingCanvas = async () => {
    for (const metric in globalJson.metricsFetched) {
        // if (metric !== 'overall') {
        //     console.log(`Skipping metric: ${metric}`);
        //     continue; 
        // }
        await buildCanvas(metric);
    }
    await buildCanvas('pets');
}

// Shipment for file: SendToDiscord
const shipment = async (canvasOnly = false) => {
    // canvasOnly ? true : async () => { 
    //     await startIteratingMetrics()
    //     console.log("Metrics iteration complete. Pets to follow.")
    //     await startIteratingPets()
    //     console.log("Metrics and Pets iteration complete. Canvas to follow.");
    // };
    //await startIteratingMetrics()
    console.log("Metrics iteration complete. Pets to follow.")
    await startIteratingPets()
    console.log("Metrics and Pets iteration complete. Canvas to follow.");
    //await startIteratingCanvas();
}
shipment(false) 

module.exports = {
    shipment
};

// Weird async stack issues