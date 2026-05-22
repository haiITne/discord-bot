require('dotenv').config();

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bot dang chay');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Web server dang chay o cong ${PORT}`);
});

const fs = require('fs');

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
client.once('ready', () => {
    console.log(`Bot online: ${client.user.tag}`);
});
// FILE LUU DU LIEU
const DATA_FILE = './data.json';

// DOC DU LIEU
let users = {};

if (fs.existsSync(DATA_FILE)) {

    const data = fs.readFileSync(DATA_FILE);

    users = JSON.parse(data);
}

// HAM SAVE
function saveData() {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(users, null, 2)
    );
}

client.once('ready', () => {

    console.log(`Bot online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    const text = message.content.toLowerCase();

    // RESET
    if (text === '!reset') {

        users = {};

        saveData();

        return message.reply('Da reset!');
    }

    // TONG
    if (text === '!tong') {

    let tong = 0;

    const today = new Date();

    const ngay =
        `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    let result = `Ngay ${ngay}\n\n`;

    for (const user in users) {

        result += `${user} : ${users[user]}k\n`;

        tong += users[user];
    }

    const chia3 = tong / 3;

    result += `\nTổng : ${tong}k`;
    result += `\nMỗi người nhận : ${chia3}k`;

    return message.reply(result);
}

    // VD:
    // 3 cục 150k

    const regex = /(\d+)k?/i;

const match = text.match(regex);

if (match) {

    const soTien = parseInt(match[1]);

        const username = message.author.username;

        if (!users[username]) {

            users[username] = 0;
        }

        users[username] += soTien;

        // SAVE
        saveData();

        await message.react('✅');
    }

});

client.login(process.env.TOKEN);