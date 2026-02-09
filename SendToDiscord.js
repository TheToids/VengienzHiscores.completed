// Tier 0:
// Goal: Create and send hiscores to a Discord channel using a webhook

// Tier 0.5:
// Goaloid: Check fetch logic, too many individuals leaving and returning for code to keep breaking

// Tier 1:
// Goaloid: Schedule a folder resize of embed icons
// Goaloid: Fixed-width of metric icons
// Goaloid: Lower anchor of ironman icon in pet header

// Tier 2:
// Goaloid: Entangle Vengienz hierarchy choice into an api fetch to handle tickets
// Goaloid: Create a breathing discord bot for osrs community hiscores
	// Reqs: Verify terms of service keywords

// Tier -1:
// Re-order functions for logic flow
// Global.json writes check scope
// Utility.js sorts check data type re-writes
// Drive migrated, embed generator might be slower on the image creation side

// Primary imports
require('dotenv').config();
const { shipment } = require('./Create.js');
const globalJson = require('./Global.json');
const { getchannelIdAndTokenFromLink,  retryPromise, sortPetOwners } = require('./Utility.js');

// Secondary imports
const axios = require('axios');
const { AttachmentBuilder, EmbedBuilder, WebhookClient, hyperlink } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Metric, METRICS, WOMClient } = require('@wise-old-man/utils');

// Declared file scope
const client = new WOMClient({
  apiKey: `${process.env.API_KEY}`,
  userAgent: 'Toids'
});
const webhookDetails = getchannelIdAndTokenFromLink(process.env.WEBHOOK_URL);
const webhookClient = new WebhookClient({ id: webhookDetails.id, token: webhookDetails.token });

//METRICS.forEach(metric => { console.log(metric) });

//runThisToCreateAndSend(build = false, send = true);
//updateMsgTest(`${globalJson.messageIds.footer}`);

async function runThisToCreateAndSend(build = false, send = true) {
  console.log("creating...");
  build ? await shipment() : false;
  console.log("sending...");
  send ? await metricIterationUpdate() : false; 
  console.log("finished!");
}

const metricIterationSend = async () => {
  let player_spot_counter = 1;
  if (!globalJson.messageIds) {
    globalJson.messageIds = {};
  }

  for (const metric of METRICS) {
    if (
      metric === 'bounty_hunter_hunter' ||
      metric === 'bounty_hunter_rogue' ||
      metric === 'league_points' ||
      metric === 'collections_logged') { continue }
    const message = await sendMsg(`./Assets/Embeds/${metric}.png`);
    globalJson.messageIds[metric] = message.id;
  }
  
  for (player in await sortPetOwners(globalJson.petsFetched)) {
    console.log(player);
    const message = await sendMsg(`./Assets/Embeds/${player}.png`);
    globalJson.messageIds[`Pet ${player_spot_counter}`] = message.id;
    player_spot_counter ++;
  }

  if (true) {
    console.log("trying collection log")
    message = await sendMsg(`./Assets/Embeds/collections_logged.png`)
    globalJson.messageIds['collections_logged'] = message.id;
    globalJson.messageIds["channelId"] = message.channel_id; 
  }

  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

async function metricIterationUpdate() {
  let player_spot_counter = 1;
  if (!globalJson.messageIds) {
    globalJson.messageIds = {};
  }

  for (const metric of METRICS) {
    if (
      metric === 'bounty_hunter_hunter' ||
      metric === 'bounty_hunter_rogue' ||
      metric === 'league_points' ||
      metric === 'collections_logged') { continue }
      await updateMsg(globalJson.messageIds[metric], `./Assets/Embeds/${metric}.png`)
  }

  for (player in await sortPetOwners(globalJson.petsFetched)) {
    await updateMsg(globalJson.messageIds[`Pet ${player_spot_counter}`], `./Assets/Embeds/${player}.png`);
    player_spot_counter++
  }

  if (true) {
    await updateMsg(globalJson.messageIds['collections_logged'], `./Assets/Embeds/collections_logged.png`)
  }

  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const sendWebhookEmbed = async () => {
  const urlSkills = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.overall}`;
  const urlActivities = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.clue_scrolls_all}`;
  const urlBosses = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.abyssal_sire}`;
  const urlComputed = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.ehp}`;
  const text =
    `${hyperlink('Skills', urlSkills)}  | ${hyperlink('Activities', urlActivities)} | ${hyperlink('Bosses', urlBosses)} | ${hyperlink('Computed', urlComputed)}
    Message for pet addition: <@358710615923097600> 
    Thanks for art creation: <@297509298311921666> 
   `
  const embed = new EmbedBuilder()
    .setTitle('Click these to navigate')
    .setDescription(`${text}`) 

  const message = await retryPromise(() => webhookClient.send({ username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', embeds: [embed] }), 10, 10000, "discord");
  globalJson.messageIds['footer'] = message.id;
  await fs.promises.writeFile('Global.json', JSON.stringify(globalJson, null, 2));
}

const sendMsg = async (filename) => {
  try {
    const file = new AttachmentBuilder(filename);
    const message = await retryPromise(() => webhookClient.send({ username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', files: [file] }), 10, 10000, "discord");
    return message;
  } catch (err) {
    console.error(err);
  }
}

async function updateMsg(msgId, filename) {
  try {
    const file = new AttachmentBuilder(filename)
    console.log("Trying file: ", filename, " id: ", msgId)
    await retryPromise(() => webhookClient.editMessage(msgId, { username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', files: [file] }), 10, 10000, "discord");
  } catch (err) { 
    console.error(err);
  }
}

async function updateMsgTest(msgId){ 
  try { 
  const urlSkills = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.overall}`;
  const urlActivities = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.clue_scrolls_all}`;
  const urlBosses = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.abyssal_sire}`;
  const urlComputed = `https://discord.com/channels/605618651147534337/${globalJson.messageIds.channelId}/${globalJson.messageIds.ehp}`;
    const text =
    `${hyperlink('Skills', urlSkills)}  | ${hyperlink('Activities', urlActivities)} | ${hyperlink('Bosses', urlBosses)} | ${hyperlink('Computed', urlComputed)}
    Message for pet addition: <@358710615923097600> 
    Thanks for art creation: <@297509298311921666> 
   `
    const embed = new EmbedBuilder()
      .setTitle('Click these to navigate')
      .setDescription(`${text}`) // This is where the custom text hyperlink is set
    await retryPromise(() => webhookClient.editMessage(msgId, { username: 'Vengienz Hiscores', avatarURL: 'https://i.imgur.com/K0Bz4ZN.png', embeds: [embed] }), 10, 10000, "discord");
  } catch (err) {
    console.error(err);
  }
}

const initializeChannel = async (skip = false) => {
  skip == false ? async () => { await shipment(); console.log("creating..."); } : false;
  await metricIterationSend();
  await sendWebhookEmbed();
}

// initializeChannel(true);