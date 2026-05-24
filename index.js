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

// =========================
// FILE DU LIEU
// =========================

const DATA_FILE = './data.json';

// =========================
// HAM NGAY
// =========================

function getToday() {

    const d = new Date();

    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// =========================
// DOC DU LIEU
// =========================

let data = {
    date: getToday(),
    users: {},
    history: {}
};

if (fs.existsSync(DATA_FILE)) {

    data = JSON.parse(
        fs.readFileSync(DATA_FILE)
    );
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

        // TAO HISTORY
        if (!data.history) {
            data.history = {};
        }

        // LUU NGAY CU
        if (data.date) {

            data.history[data.date] = data.users;
        }

        // RESET
        data.date = today;
        data.users = {};

        saveData();

        console.log('Đã reset sang ngày mới🌞');
    }
}

// =========================
// MESSAGE
// =========================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // CHI CHAY TRONG 1 KENH
    if (message.channel.id !== process.env.CHANNEL_ID) return;

    // CHECK QUA NGAY
    checkNewDay();

    const text = message.content.toLowerCase();

    // =========================
    // RESET
    // =========================

    if (text === '!reset') {

        data.users = {};

        saveData();

        return message.reply('Reset thành công 🎉');
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

            result += `Tổng : ${tong}k✨\n`;
        }

        return message.reply(
            result || 'Chưa có lịch sử⚠'
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

        if (!data.users[username]) {

            data.users[username] = 0;
        }

        data.users[username] += soTien;

        saveData();

        await message.react('✅');
    }
});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);