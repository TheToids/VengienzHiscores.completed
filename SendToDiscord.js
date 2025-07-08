//run functions for final ship
require('dotenv').config();
const { getWebhookIdAndTokenFromLink,  retryPromise, sortPetOwners } = require('./Utility.js');
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

// const returnFromHiatus = async () => {
//   METRICS.forEach(metric => {
//     if (globalJson.untapped_metrics[metric] == null || metric != 'league_points') {
//       globalJson.untapped_metrics[metric] = metric
//     }
//   });
//   try {
//      await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
//   }
//   catch(error) {
//     console.log(error)
//   }
// }
//check that it doesnt somehow make globals.json clear
//returnFromHiatus();

const runThisToCreateAndSend = async () => {
  console.log("creating...");
  await shipment();
  console.log("sending...");
  await metricIterationUpdate();
  console.log("finished!");
}
runThisToCreateAndSend();

const updateMsg = async (msgId, filename) => {
  try {
    //const msgId = globalJson.messageIDs[path.parse(filename).name];
    const file = new AttachmentBuilder(filename)
    console.log("Trying file: ", filename, " id: ", msgId)
    await retryPromise(() => webhookClient.editMessage(msgId, { username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', files: [file] }), 10, 10000, "discord");
  } catch (err) { 
    console.error(err);
  }
}

const sendMsg = async (filename) => {
  try {
    const file = new AttachmentBuilder(filename);
    const messageId = await retryPromise(() => webhookClient.send({ username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', files: [file] }), 10, 10000, "discord");
    return messageId.id;
  } catch (err) {
    console.error(err);
  }
}

const metricIterationSend = async () => {
  let player_spot_counter = 1;
  if (!globalJson.messageIDs) {
    globalJson.messageIDs = {};
  }
  for (const metric of METRICS) {
    if (
      metric === 'bounty_hunter_hunter' ||
      metric === 'bounty_hunter_rogue' ||
      metric === 'league_points' ||
      metric === 'collections_logged') { continue }
    console.log(metric);
    const messageId = await sendMsg(`./Assets/Embeds/${metric}.png`);
    globalJson.messageIDs[metric] = messageId;
  }
  
  
  for (player in await sortPetOwners(globalJson.petOwners)) {
    console.log(player);
    const messageId = await sendMsg(`./Assets/Embeds/${player}.png`);
    globalJson.messageIDs[`Pet ${player_spot_counter}`] = messageId;
    player_spot_counter ++;
  }

  if (true) {
    console.log('Collection Log');
    const messageId = await sendMsg(`./Assets/Embeds/collections_logged.png`);
    globalJson.messageIDs['collections_logged'] = messageId;
  }

  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const metricIterationUpdate = async () => {
  let player_spot_counter = 1;
  if (!globalJson.messageIDs) {
    globalJson.messageIDs = {};
  }
  for (const metric of METRICS) {
    if (
      metric === 'bounty_hunter_hunter' ||
      metric === 'bounty_hunter_rogue' ||
      metric === 'league_points' ||
      metric === 'collections_logged') { continue }
      await updateMsg(globalJson.messageIDs[metric], `./Assets/Embeds/${metric}.png`)
  }

  for (player in await sortPetOwners(globalJson.petOwners)) {
    await updateMsg(globalJson.messageIDs[`Pet ${player_spot_counter}`], `./Assets/Embeds/${player}.png`);
    player_spot_counter++
  }

  if (true) {
    await updateMsg(globalJson.messageIDs['collections_logged'], `./Assets/Embeds/collections_logged.png`)
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

  const messageId = await retryPromise(() => webhookClient.send({ username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', embeds: [embed] }), 10, 10000, "discord");
  globalJson.messageIDs['footer'] = messageId.id;
  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}



const updateMsgTest = async (msgId) => {
  try { 
    //https://discord.com/channels/605618651147534337/new_channel_numbers/
    const urlSkills = `https://discord.com/channels/605618651147534337/1392098152055832608/${globalJson.messageIDs.overall}`;
    const urlActivities = `https://discord.com/channels/605618651147534337/1392098152055832608/${globalJson.messageIDs.clue_scrolls_all}`;
    const urlBosses = `https://discord.com/channels/605618651147534337/1392098152055832608/${globalJson.messageIDs.abyssal_sire}`;
    const urlComputed = `https://discord.com/channels/605618651147534337/1392098152055832608/${globalJson.messageIDs.ehp}`;
    const text =
    `${hyperlink('Skills', urlSkills)}  | ${hyperlink('Activities', urlActivities)} | ${hyperlink('Bosses', urlBosses)} | ${hyperlink('Computed', urlComputed)}
   Message <@358710615923097600>\nto be added to pet hiscores.\nHuge thanks to <@297509298311921666> for the artwork
   `
    const embed = new EmbedBuilder()
      .setTitle('Click these to navigate')
      .setDescription(`${text}`) // This is where the custom text hyperlink is set
    await retryPromise(() => webhookClient.editMessage(msgId, { username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', embeds: [embed] }), 10, 10000, "discord");
  } catch (err) {
    console.error(err);
  }
}




//updateMsg('1251437916010578061', )


const initializeChannel = async () => {
  console.log("creating...");
  //await shipment();
  await metricIterationSend();
  await sendWebhookEmbed();
}

//initializeChannel();

//updateMsgTest(`${globalJson.messageIDs.footer}`);