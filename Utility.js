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
let fetchCount = 0;

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
        console.error('An error occurred fetching member role:', error);
        return "guest";
    }
}

async function retryPromise(fn, maxRetries = 5, delay = 60000, apiHeader = "wiseoldman") {
    //apiHeader is used to determine if the api is wiseoldman, templeosrs, jagex, or discord
    //https://docs.wiseoldman.net/api/groups/group-endpoints#get-group-hiscores
    //https://templeosrs.com/api_doc.php#Pet_Endpoints
    //https://runescape.wiki/w/Application_programming_interface#Old_School_Hiscores
    //https://discord.com/developers/docs/topics/rate-limits#rate-limits
    let attempt = 0, lastError;
    while (attempt < maxRetries) {
        try {
            if (apiHeader === "wiseoldman" && (fetchCount / 100) >= 1 && fetchCount % 100 === 0) {
                throw new Error('Fetch count exceeded 100 requests, waiting for rate limit reset.');
            }
            return await fn();
        } catch (error) {
             // Only retry on network/timeout errors (504, ECONNABORTED, etc)
            const status = error.response?.status;
            if (error.message.toLowerCase().includes('Fetch count exceeded')) {
                if (attempt >= maxRetries) break;
                console.log(`Attempt ${attempt}: ${error} Retrying in ${delay}ms...`);
            } else if (status && status >= 500) {
                // Server errors (5xx) are retried
                console.log(`Attempt ${attempt + 1}: Server error ${status}. Retrying in ${delay}ms...`);
                delay = 300000; // Cap at 5 min
            } else if (status && status >= 400 && status < 500) {
                // Client errors (4xx) are not retried, except for rate limits
                if (status === 429 || status === 403 || status === 401 || status === 404) {
                    console.log(`Attempt ${attempt + 1}: Client error ${status}. Retrying in ${delay}ms...`);
                    delay = Math.min(delay * 1.1, 300000); // Increase delay, cap at 5 min
                } else {
                    console.log(`Attempt ${attempt + 1}: Client error ${status}. Not retrying.`);
                    throw error;
                }
            } else {
                // Network errors or unknown errors are retried
                console.log(`Attempt ${attempt + 1}: Network error or unknown error. Retrying in ${delay}ms...`);
                delay = Math.min(delay * 1.1, 300000); // Increase delay, cap at 5 min
            }
            const isGatewayTimeout = status === 504;
            const isServiceUnavailable = status === 503;
            const isBadGateway = status === 502; // Bad gateway
            const isRateLimit = status === 429;
            const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout')); 
            const isNotFound = status === 404; // Not found
            const isForbidden = status === 403; // Blocked or blacklisted
            const isUnauthorized = status === 401; // Unauthorized
            const isNetworkError = !status && error.code === 'ENOTFOUND'; // DNS/network error
            lastError = error;
            attempt++;
            await new Promise(resolve => setTimeout(resolve, delay));
        } finally {
            fetchCount += 1;
        }
    }
    throw lastError;
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

// let sortedData = {};
// dataToSort.forEach(item => {
// let { name, ...rest } = item;
// sortedData[name] = rest; });

function sortObjectByScore(obj) {
    // Convert the object to an array of entries
    let entries = Object.entries(obj);
    // Sort the entries by score
    entries.sort(([, a], [, b]) => b.score - a.score);
    return entries;
}

const sortDataWithPetOrdering = async (data) => { //seems unneeded, but keeping for now
    const order = globalJson.petFilesOrdering;
    const sortedIcons = {};
    order.forEach(key => {
        if (data[key] !== undefined) {
            sortedIcons[key] = data[key];
        }
    });
    return sortedIcons;
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

const sortPetOwners = async (petOwners) => {
    // Convert the object to an array of entries
    let entries = Object.entries(petOwners);
    // Sort the entries by the 'amt' value
    entries.sort((a, b) => b[1].amt - a[1].amt);
    // Convert the entries back to an object
    let sortedPetOwners = Object.fromEntries(entries);
    return sortedPetOwners;
}

const getRankByName = (playerData, metric) => {
    const newMetric = globalJson.untapped_metrics[metric];
    //Search through skills
    const skill = playerData.skills.find(skill => skill.name === newMetric);
    if (skill) {
        return skill.rank;
    }
    // Search through activities if not found in skills
    const activity = playerData.activities.find(activity => activity.name === newMetric);
    if (activity) {
        return activity.rank;
    }
    //Return null if not found in either
    return null;
}


// const findKey = (obj, key) => {
//     return Object.values(obj).find(subObj => Object.keys(subObj).includes(key));
// };

// const findObj = (obj, innerKey) => {
//     for (let [outerKey, subObj] of Object.entries(obj)) {
//         if (innerKey in subObj) {
//             return outerKey;
//         }
//     }
//     return null;
// };





module.exports = {
    getWebhookIdAndTokenFromLink,
    getRole,
    getRankByName,
    retryPromise,
    formatNumberForMetrics,
    sortData,
    sortDataWithPetOrdering,
    sortPetOwners,
    sortObjectByScore
};
