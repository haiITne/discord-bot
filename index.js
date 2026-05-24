require('dotenv').config();

const express = require('express');
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');

// =========================
// EXPRESS
// =========================

const app = express();

app.get('/', (req, res) => {
    res.send('Bot dang chay');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Web server dang chay o cong ${PORT}`);
});

// =========================
// DISCORD CLIENT
// =========================

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

// =========================
// FILE DATA
// =========================

const DATA_FILE = './data.json';

// =========================
// HAM LAY NGAY
// =========================

function getToday() {

    const d = new Date();

    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// =========================
// DATA MAC DINH
// =========================

let data = {
    date: getToday(),
    users: {},
    history: {}
};

// =========================
// DOC FILE
// =========================

if (fs.existsSync(DATA_FILE)) {

    try {

        const rawData = fs.readFileSync(DATA_FILE);

        data = JSON.parse(rawData);

    } catch (err) {

        console.log('Loi doc file JSON');
    }
}

// =========================
// SAVE DATA
// =========================

function saveData() {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
    );
}

// =========================
// RESET QUA NGAY MOI
// =========================

function checkNewDay() {

    const today = getToday();

    // NEU QUA NGAY MOI
    if (data.date !== today) {

        // TAO HISTORY NEU CHUA CO
        if (!data.history) {
            data.history = {};
        }

        // LUU DU LIEU HOM QUA
        if (Object.keys(data.users).length > 0) {

            data.history[data.date] = data.users;
        }

        // RESET
        data.date = today;
        data.users = {};

        saveData();

        console.log('Đã reset sang ngày mới :white_sun_small_cloud: ');
    }
}

// =========================
// MESSAGE EVENT
// =========================

client.on('messageCreate', async (message) => {

    // BO QUA BOT
    if (message.author.bot) return;

    // CHI CHAY TRONG 1 KENH
    if (message.channel.id !== process.env.CHANNEL_ID) return;

    // CHECK NGAY MOI
    checkNewDay();

    const text = message.content.toLowerCase();

    // =========================
    // RESET
    // =========================

    if (text === '!reset') {

        data.users = {};

        saveData();

        return message.reply('Reset thành công :piñata: ');
    }

    // =========================
    // TONG
    // =========================

    if (text === '!tong') {

        let tong = 0;

        let result = `📅 Ngày ${data.date}\n\n`;

        for (const user in data.users) {

            result += `${user} : ${data.users[user]}k\n`;

            tong += data.users[user];
        }

        const chia3 =
            Math.round((tong / 3) * 100) / 100;

        result += `\n💰 Tổng : ${tong}k`;
        result += `\n👤 Mỗi người nhận : ${chia3}k`;

        return message.reply(result);
    }

    // =========================
    // HISTORY
    // =========================

    if (text === '!history') {

        let result = '';

        for (const date in data.history) {

            result += `\n📅 ${date}\n`;

            const users = data.history[date];

            let tong = 0;

            for (const user in users) {

                result += `${user} : ${users[user]}k\n`;

                tong += users[user];
            }

            result += `💰 Tổng : ${tong}k\n`;
        }

        return message.reply(
            result || 'Chưa có lịch sử :warning: '
        );
    }

    // =========================
    // NHAP TIEN
    // VD:
    // 150k
    // =========================

    const regex = /(\d+)k?/i;

    const match = text.match(regex);

    if (match) {

        const soTien = parseInt(match[1]);

        const username = message.author.username;

        // TAO USER
        if (!data.users[username]) {

            data.users[username] = 0;
        }

        // CONG TIEN
        data.users[username] += soTien;

        // SAVE
        saveData();

        // REACT
        await message.react('✅');
    }
});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);