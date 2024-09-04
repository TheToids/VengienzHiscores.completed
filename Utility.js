//various utility functions
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const url = require('url');
const globalJson = require('./Global.json');
const { WOMClient, Metric, METRICS } = require('@wise-old-man/utils');
const client = new WOMClient({
    apiKey: `${process.env.API_KEY}`,
    userAgent: 'Toids'
});
const { EmbedBuilder, WebhookClient, AttachmentBuilder } = require('discord.js');
let membersGlobal = []; //unsure if this is being called mutiple times due to scope.



const getWebhookIdAndTokenFromLink = (link) => {
    const regex = /https:\/\/discord\.com\/api\/webhooks\/(\d+)\/([\w-]+)/;
    const matches = link.match(regex);
    return matches ? { id: matches[1], token: matches[2] } : null;
};

function parseCSV(csvString) {
    const lines = csvString.split('\n');
    const result = [];

    lines.forEach((line, index) => {
        if (index > 0) {
            let [player, role] = line.split(',');
            player = player.toLowerCase();
            const playerObject = {};
            playerObject[player.trim()] = role.trim();
            playerObject[player] = role;
            result.push(playerObject);
        }
    });
    return result;
}

const initializeCSV = async () => {
    if (!membersGlobal.length) {
        const csv = await client.groups.getMembersCSV(1219);
        membersGlobal = parseCSV(csv);
    }
    return membersGlobal;
};


const getRole = async (playerName) => {
    try {
        const members = await initializeCSV();
        const member = await members.find(obj => obj.hasOwnProperty(playerName.toLowerCase()));
        const memberRole = member[playerName.toLowerCase()];
        return await memberRole;
    } catch (error) {
        console.error('An error occurred:', error);
        return "guest";
    }
}

async function retryPromise(fn, maxRetries = 10, delay = 61000) {
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            attempts++;
            console.log(`Attempt ${attempts}: Retrying in ${delay}ms...`);
            if (attempts === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

function findParentObject(obj, targetKey) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
            if (obj[key].hasOwnProperty(targetKey)) {
                return key; // This is the parent key
            }
        }
    }
    return null; // If the targetKey wasn't found in any object
}

function formatForCanvas(word) {
    let words = word.split('_')
    let formattedWord = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return formattedWord;
}
function formatNumberForMetrics(number) {
    if (number >= 1000000000) {
        return (number / 1000000000).toFixed(3) + 'b';
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(1).toLocaleString() + 'm';
    }
    else {
        return Math.floor(number).toLocaleString()
    }

}


const sortData = async (data) => {
    let dataToSort = Object.keys(data).map(key => {
        //console.log('Key:', key, 'Value:', data[key]); // Add this to debug
        return { name: key, ...data[key] };
    }); 
    dataToSort.sort((a, b) => b.amt - a.amt);
    let sortedData = {};
    dataToSort.forEach(item => {
        let { name, ...rest } = item;
        sortedData[name] = rest;
    });
    return sortedData;
}

function sortObjectByScore(obj) {
    // Convert the object to an array of entries
    let entries = Object.entries(obj);

    // Sort the entries by score
    entries.sort(([,a], [,b]) => b.score - a.score);

    return entries;
}
const sortPetOwners = async (petOwners) => {
    // Convert the object to an array of entries
    let entries = Object.entries(petOwners);

    // Sort the entries by the 'amt' value
    entries.sort((a, b) => b[1].amt - a[1].amt);

    // Convert the entries back to an object
    let sortedPetOwners = Object.fromEntries(entries);

    return sortedPetOwners;
}

const findKey = (obj, key) => {
    return Object.values(obj).find(subObj => Object.keys(subObj).includes(key));
};

const findObj = (obj, innerKey) => {
    for (let [outerKey, subObj] of Object.entries(obj)) {
        if (innerKey in subObj) {
            return outerKey;
        }
    }
    return null;
};


/* const updateMessageIds = async (sortedPets) => {
    let i = 0;
    for (player in sortedPets) {
        i++
        globalJson.messageIDs[player]
    }
    await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}
 */


module.exports = {
    getWebhookIdAndTokenFromLink,
    getRole,
    retryPromise,
    findParentObject,
    formatForCanvas,
    formatNumberForMetrics,
    sortData,
    sortPetOwners,
    findKey,
    findObj,
    sortObjectByScore
};
