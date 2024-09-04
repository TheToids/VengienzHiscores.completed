//run functions for final ship
require('dotenv').config();
const { getWebhookIdAndTokenFromLink, getRole, retryPromise, findParentObject, formatForCanvas, formatNumberForMetrics, sortData, findKey, findObj, sortPetOwners, updateMessageIds } = require('./Utility.js');
const { shipment } = require('./Create.js');
const globalJson = require('./Global.json');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const url = require('url');
const { WOMClient, Metric, METRICS } = require('@wise-old-man/utils');
const client = new WOMClient({
  apiKey: `${process.env.API_KEY}`,
  userAgent: 'Toids'
});
const { EmbedBuilder, WebhookClient, AttachmentBuilder, hyperlink, hideLinkEmbed } = require('discord.js');
const webhookDetails = getWebhookIdAndTokenFromLink(process.env.WEBHOOK_URL);
const webhookClient = new WebhookClient({ id: webhookDetails.id, token: webhookDetails.token });

const runThisToCreateAndSend = async () => {
  console.log("creating...");
  await shipment();
  console.log("updating...")
  await metricIterationUpdate();
  console.log("finished!");
}
//runThisToCreateAndSend();


const updateMsg = async (msgId, filename) => {
  try {
    //const msgId = globalJson.messageIDs[path.parse(filename).name];
    const file = new AttachmentBuilder(filename)
    await retryPromise(() => webhookClient.editMessage(msgId, { username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', files: [file] }));
  } catch (err) {
    console.error(err);
  }
}

const sendMsg = async (filename) => {
  try {
    const file = new AttachmentBuilder(filename);
    const messageId = await retryPromise(() => webhookClient.send({ username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', files: [file] }), 10, 10000);
    return messageId.id;
  } catch (err) {
    console.error(err);
  }
}

const metricIterationSend = async () => {
  if (!globalJson.messageIDs) {
    globalJson.messageIDs = {};
  }
  for (const metric of METRICS) {
    if (
      metric === 'bounty_hunter_hunter' ||
      metric === 'bounty_hunter_rogue' ||
      metric === 'league_points') { continue }
    console.log(metric);
    const messageId = await sendMsg(`./Assets/Embeds/${metric}.png`);
    globalJson.messageIDs[metric] = messageId;
  }
  
  for (player in await sortPetOwners(globalJson.petOwners)) {
    console.log(player);
    const messageId = await sendMsg(`./Assets/Embeds/${player}.png`);
    globalJson.messageIDs[player] = messageId;
  }

  if (true) {
    console.log('Collection Log');
    const messageId = await sendMsg(`./Assets/Embeds/collection_log.png`);
    globalJson.messageIDs['collection_log'] = messageId;
  }

  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const metricIterationUpdate = async () => {
  let i = 1;
  if (!globalJson.messageIDs) {
    globalJson.messageIDs = {};
  }
  for (const metric of METRICS) {
    if (
      metric === 'bounty_hunter_hunter' ||
      metric === 'bounty_hunter_rogue' ||
      metric === 'league_points') { continue }
      updateMsg(globalJson.messageIDs[metric], `./Assets/Embeds/${metric}.png`)
  }

  for (player in await sortPetOwners(globalJson.petOwners)) {
    updateMsg(globalJson.messageIDs[`Pet ${i}`], `./Assets/Embeds/${player}.png`);
    i++
  }

  if (true) {
    updateMsg(globalJson.messageIDs['collection_log'], `./Assets/Embeds/collection_log.png`)
  }

  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}


const sendWebhookEmbed = async () => {
  const urlSkills = `https://discord.com/channels/605618651147534337/1251746770837569668/${globalJson.messageIDs.overall}`;
  const urlActivities = `https://discord.com/channels/605618651147534337/1251746770837569668/${globalJson.messageIDs.clue_scrolls_all}`;
  const urlBosses = `https://discord.com/channels/605618651147534337/1251746770837569668/${globalJson.messageIDs.abyssal_sire}`;
  const urlComputed = `https://discord.com/channels/605618651147534337/1251746770837569668/${globalJson.messageIDs.ehp}`;
  const text =
    `
  ${hyperlink('Skills', urlSkills)}  | ${hyperlink('Activities', urlActivities)} | ${hyperlink('Bosses', urlBosses)} | ${hyperlink('Computed', urlComputed)}\n
  Message <@358710615923097600>\nto be added to collection log or pet hiscores
  `
  const embed = new EmbedBuilder()
    .setTitle('Click these to navigate')
    .setDescription(`${text}`) // This is where the custom text hyperlink is set

  const messageId = await retryPromise(() => webhookClient.send({ username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', embeds: [embed] }), 10, 10000);
  globalJson.messageIDs['footer'] = messageId.id;
  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}



const updateMsgTest = async (msgId) => {
  try { 
    const urlSkills = `https://discord.com/channels/605618651147534337/1278619620600971294/${globalJson.messageIDs.overall}`;
    const urlActivities = `https://discord.com/channels/605618651147534337/1278619620600971294/${globalJson.messageIDs.clue_scrolls_all}`;
    const urlBosses = `https://discord.com/channels/605618651147534337/1278619620600971294/${globalJson.messageIDs.abyssal_sire}`;
    const urlComputed = `https://discord.com/channels/605618651147534337/1278619620600971294/${globalJson.messageIDs.ehp}`;
    const text =
    `
  ${hyperlink('Skills', urlSkills)}  | ${hyperlink('Activities', urlActivities)} | ${hyperlink('Bosses', urlBosses)} | ${hyperlink('Computed', urlComputed)}
  Message <@358710615923097600>\nto be added to collection log or pet hiscores.\nHuge thanks to <@297509298311921666> for the artwork
  `
    const embed = new EmbedBuilder()
      .setTitle('Click these to navigate')
      .setDescription(`${text}`) // This is where the custom text hyperlink is set
    await retryPromise(() => webhookClient.editMessage(msgId, { username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', embeds: [embed] }));
  } catch (err) {
    console.error(err);
  }
}

updateMsgTest(`${globalJson.messageIDs.footer}`);


//updateMsg('1251437916010578061', )

const initializeChannel = async () => {
  await metricIterationSend();
  await sendWebhookEmbed();
}

//initializeChannel();