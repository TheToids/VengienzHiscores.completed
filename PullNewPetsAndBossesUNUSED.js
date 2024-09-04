const fs = require('fs');
const axios = require('axios');
//const cheerio = require('cheerio'); //errors from this
//const { json } = require('stream/consumers');
const path = require('path');
const url = require('url');
const { WOMClient, Metric, METRICS } = require('@wise-old-man/utils');
const client = new WOMClient();

const downloadPetImage = async (petId, petString) => {
    const addNewPet = async (petId, petString) => {
        if (petId && petString) {
            try {
                let data = await fs.promises.readFile('./Global.json');
                let GlobalJsonVariables = JSON.parse(data);
                GlobalJsonVariables.petFiles[petId] = petString;
                await fs.promises.writeFile('./Global.json', JSON.stringify(GlobalJsonVariables, null, 2));
            } catch (err) {
                console.error(err);
            }
        } else {
            console.log("Missing pet or id");
        }
    }

    const checkForPet = async () => {
        try {
            let url = `https://wiseoldman.net/_next/image?url=%2Fimg%2Fmetrics_small%2F${variable}.png&w=32&q=75`;
            const filePath = path.resolve(__dirname, `./Assets/Pets/${variable}.png`);
            await fs.promises.access(filePath, fs.constants.F_OK);
        } catch (err) {
            await downloadImage(url, variable);
            console.log(`creating ${filePath}...`)
        }
    }
}
//grab icon from wiki save in pets folder, then addNewPet('420', 'Toidle.png');}



//GlobalJsonVariables["metrics"] = names;
//await fs.promises.writeFile('./Global.json', JSON.stringify(GlobalJsonVariables, null, 2));
const downloadMetricImages = async () => {
    let excludedNames = [
        "League Points",
        "Deadman Points",
        "Bounty Hunter (Legacy) - Hunter",
        "Bounty Hunter (Legacy) - Rogue"];
    const names = METRICS.filter(variable => !excludedNames.includes(variable));
    const downloadImage = async (url, formattedImageName) => {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
            });
            console.log(formattedImageName)
            const wstream = fs.createWriteStream(path.resolve(__dirname, `./Assets/Metrics/${formattedImageName}.png`));
            response.data.pipe(wstream);
            return new Promise((resolve, reject) => {
                wstream.on('finish', resolve);
                wstream.on('error', reject);
            });
        } catch (error) {
            throw new Error(`Failed to get image for ${formattedImageName}: ${error.message}`);
        }
    }
    const getMetrics = async () => {
        try {
            // Wise-old-man check for metrics
            await Promise.all(names.map(async (variable) => {
                let url = `https://wiseoldman.net/_next/image?url=%2Fimg%2Fmetrics_small%2F${variable}.png&w=32&q=75`;
                const filePath = path.resolve(__dirname, `./Assets/Metrics/${variable}.png`);
                try {
                    await fs.promises.access(filePath, fs.constants.F_OK);
                    //console.log(`${filePath} exists.`);
                } catch(err) {
                    await downloadImage(url, variable);
                    console.log(`creating ${filePath}...`)
                }
            }));
        } catch (error) {
            console.error(error);
        }
    } 
    await getMetrics();
}
//downloadMetricImages();