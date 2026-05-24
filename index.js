require('dotenv').config();

const express = require('express');
const fs = require('fs');

const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

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
        GatewayIntentBits.GuildMessages
    ]
});

// =========================
// READY
// =========================

client.once('ready', () => {
    console.log(`Bot online: ${client.user.tag}`);
});

// =========================
// DATA FILE
// =========================

const DATA_FILE = './data.json';

// =========================
// NGAY
// =========================

function getToday() {

    const d = new Date();

    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// =========================
// FORMAT TIEN
// =========================

function formatMoney(number) {

    return number.toLocaleString('vi-VN');
}

// =========================
// DATA
// =========================

let data = {
    date: getToday(),
    users: {},
    history: {},
    kpi: 0
};

// =========================
// LOAD DATA
// =========================

if (fs.existsSync(DATA_FILE)) {

    try {

        data = JSON.parse(
            fs.readFileSync(DATA_FILE)
        );

    } catch {

        console.log('Lỗi đọc data');
    }
}

// =========================
// SAVE
// =========================

function saveData() {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
    );
}

// =========================
// CHECK NGAY MOI
// =========================

function checkNewDay() {

    const today = getToday();

    if (data.date !== today) {

        if (!data.history) {
            data.history = {};
        }

        if (Object.keys(data.users).length > 0) {

            data.history[data.date] =
                data.users;
        }

        data.date = today;
        data.users = {};

        saveData();

        console.log('Đã reset sang ngày mới:partly_sunny::partly_sunny::partly_sunny:');
    }
}

// =========================
// SLASH COMMANDS
// =========================

const commands = [

    new SlashCommandBuilder()
        .setName('tong')
        .setDescription('Xem tong doanh thu'),

    new SlashCommandBuilder()
        .setName('history')
        .setDescription('Xem lich su'),

    new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset du lieu'),

    new SlashCommandBuilder()
        .setName('kpi')
        .setDescription('Dat KPI')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('So KPI')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('congkpi')
        .setDescription('Cong KPI')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('So tien')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('trukpi')
        .setDescription('Tru KPI')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('So tien')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('resetkpi')
        .setDescription('Reset KPI'),

    new SlashCommandBuilder()
        .setName('them')
        .setDescription('Them doanh thu')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('So tien')
                .setRequired(true)
        )

].map(command => command.toJSON());

// =========================
// REGISTER COMMAND
// =========================

const rest = new REST({
    version: '10'
}).setToken(process.env.TOKEN);

(async () => {

    try {

        console.log('Dang register slash commands...');

        await rest.put(
            Routes.applicationCommands(
                process.env.CLIENT_ID
            ),
            { body: commands }
        );

        console.log('Slash commands ready');

    } catch (error) {

        console.log(error);
    }
})();

// =========================
// INTERACTION
// =========================

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    // CHI CHAY 1 KENH
    if (
        interaction.channelId !==
        process.env.CHANNEL_ID
    ) {
        return interaction.reply({
            content: 'Sai kenh',
            ephemeral: true
        });
    }

    checkNewDay();

    const { commandName } = interaction;

    // =========================
    // THEM TIEN
    // =========================

    if (commandName === 'them') {

        const soTien =
            interaction.options.getInteger('sotien');

        const username =
            interaction.user.username;

        if (!data.users[username]) {

            data.users[username] = 0;
        }

        data.users[username] += soTien;

        saveData();

        return interaction.reply(
            `Đã thêm ${formatMoney(soTien)}k thành công:white_check_mark:`
        );
    }

    // =========================
    // TONG
    // =========================

    if (commandName === 'tong') {

        let tong = 0;

        let result =
            `📅 Ngày ${data.date}\n\n`;

        for (const user in data.users) {

            result +=
                `${user} : ${formatMoney(data.users[user])}k\n`;

            tong += data.users[user];
        }

        const chia3 =
            Math.round((tong / 3) * 100) / 100;

        result +=
            `\n💰 Tổng : ${formatMoney(tong)}k`;

        result +=
            `\n👤 Mỗi người nhận : ${formatMoney(chia3)}k`;

        if (data.kpi > 0) {

            const percent = Math.min(
                (tong / data.kpi) * 100,
                100
            );

            const filled =
                Math.round(percent / 10);

            const empty = 10 - filled;

            const bar =
                '🟩'.repeat(filled) +
                '⬜'.repeat(empty);

            result += `\n`;
            result += `\n🎯 KPI`;
            result +=
                `\n${bar} ${percent.toFixed(0)}%`;

            result +=
                `\n${formatMoney(tong)} / ${formatMoney(data.kpi)}`;
        }

        return interaction.reply(result);
    }

    // =========================
    // KPI
    // =========================

    if (commandName === 'kpi') {

        const amount =
            interaction.options.getInteger('sotien');

        data.kpi = amount;

        saveData();

        return interaction.reply(
            `Đã đủ KPI cho sếp Danh ${formatMoney(amount)}:piñata::piñata::piñata:`
        );
    }

    // =========================
    // CONG KPI
    // =========================

    if (commandName === 'tangkpi') {

        const amount =
            interaction.options.getInteger('sotien');

        data.kpi += amount;

        saveData();

        return interaction.reply(
            `Đã tăng KPI ${formatMoney(amount)} :white_check_mark:`
        );
    }

    // =========================
    // TRU KPI
    // =========================

    if (commandName === 'giamkpi') {

        const amount =
            interaction.options.getInteger('sotien');

        data.kpi -= amount;

        if (data.kpi < 0) {
            data.kpi = 0;
        }

        saveData();

        return interaction.reply(
            `Đã trừ KPI ${formatMoney(amount)} :white_check_mark:`
        );
    }

    // =========================
    // RESET KPI
    // =========================

    if (commandName === 'resetkpi') {

        data.kpi = 0;

        saveData();

        return interaction.reply(
            'Đã reset KPI :white_check_mark:'
        );
    }

    // =========================
    // RESET
    // =========================

    if (commandName === 'reset') {

        data.users = {};

        saveData();

        return interaction.reply(
            'Reset thành công :piñata:'
        );
    }

    // =========================
    // HISTORY
    // =========================

    if (commandName === 'history') {

        let result = '';

        for (const date in data.history) {

            result += `\n📅 ${date}\n`;

            const users =
                data.history[date];

            let tong = 0;

            for (const user in users) {

                result +=
                    `${user} : ${formatMoney(users[user])}k\n`;

                tong += users[user];
            }

            result +=
                `💰 Tổng : ${formatMoney(tong)}k\n`;
        }

        return interaction.reply(
            result || 'Chưa có lịch sử :x: '
        );
    }
});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);