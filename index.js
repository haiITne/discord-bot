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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
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

        console.log('Loi doc data');
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

            data.history[data.date] = {
                ...data.users
            };
        }

        data.date = today;
        data.users = {};

        saveData();

        console.log('Da reset sang ngay moi');
    }
}

// =========================
// SLASH COMMANDS
// =========================

const commands = [
	
    new SlashCommandBuilder()
        .setName('top')
        .setDescription('Xem bảng xếp hạng'),

    new SlashCommandBuilder()
        .setName('me')
        .setDescription('Xem doanh thu cá nhân'),

    new SlashCommandBuilder()
    	.setName('resethistory')
    	.setDescription('Reset lịch sử'),

    new SlashCommandBuilder()
        .setName('tong')
        .setDescription('Xem tổng doanh thu'),

    new SlashCommandBuilder()
        .setName('history')
        .setDescription('Xem lịch sử'),

    new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset dữ liệu'),

    new SlashCommandBuilder()
        .setName('kpi')
        .setDescription('Đặt KPI')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('KPI')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('tangkpi')
        .setDescription('Tăng KPI')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('Số tiền')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('giamkpi')
        .setDescription('Giảm KPI')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('Số tiền')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('resetkpi')
        .setDescription('Reset KPI'),

    new SlashCommandBuilder()
        .setName('them')
        .setDescription('Thêm doanh thu')
        .addIntegerOption(option =>
            option
                .setName('sotien')
                .setDescription('Số tiền')
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
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('Slash commands ready');

    } catch (error) {

        console.error('LOI REGISTER COMMAND');
        console.error(error);
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

    await interaction.deferReply();

    checkNewDay();

    const { commandName } = interaction;
// =========================
// ME
// =========================

    if (commandName === 'me') {

    const username =
        interaction.user.username;

    const money =
        data.users[username] || 0;

    return interaction.editReply(
        `👤 ${username}\n💰 ${formatMoney(money)}k`
    );
}

// =========================
// TOP
// =========================

if (commandName === 'top') {

    const sortedUsers =
        Object.entries(data.users)
        .sort((a, b) => b[1] - a[1]);

    if (sortedUsers.length === 0) {

        return interaction.editReply(
            '❌ Chưa có dữ liệu'
        );
    }

    let result =
        '🏆 TOP DOANH THU\n\n';

    sortedUsers.forEach(
        ([user, money], index) => {

            let icon = '👤';

if (index === 0) icon = '🥇';
else if (index === 1) icon = '🥈';
else if (index === 2) icon = '🥉';

// nguoi cuoi
if (index === sortedUsers.length - 1) {
    icon = '🐑 Con cừu đen';
}

            result +=
                `${icon} ${index + 1}. ${user} - ${formatMoney(money)}k\n`;
        }
    );

    return interaction.editReply(result);
}

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

        return interaction.editReply(
            `✅ Đã thêm ${formatMoney(soTien)}k`
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
                `👤 ${user} : ${formatMoney(data.users[user])}k\n`;

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

        return interaction.editReply(result);
    }

    // =========================
    // KPI
    // =========================

    if (commandName === 'kpi') {

        const amount =
            interaction.options.getInteger('sotien');

        data.kpi = amount;

        saveData();

        return interaction.editReply(
            `🎯 Mục tiêu KPI ${formatMoney(amount)} cho sếp Danh :piñata: :piñata: :piñata: `
        );
    }

    // =========================
    // TANG KPI
    // =========================

    if (commandName === 'tangkpi') {

        const amount =
            interaction.options.getInteger('sotien');

        data.kpi += amount;

        saveData();

        return interaction.editReply(
            `📈 Đã tăng KPI ${formatMoney(amount)}`
        );
    }

    // =========================
    // GIAM KPI
    // =========================

    if (commandName === 'giamkpi') {

        const amount =
            interaction.options.getInteger('sotien');

        data.kpi -= amount;

        if (data.kpi < 0) {

            data.kpi = 0;
        }

        saveData();

        return interaction.editReply(
            `📉 Đã giảm KPI ${formatMoney(amount)}`
        );
    }

    // =========================
    // RESET KPI
    // =========================

    if (commandName === 'resetkpi') {

        data.kpi = 0;

        saveData();

        return interaction.editReply(
            '♻️ Đã reset KPI chích điện'
        );
    }

    // =========================
    // RESET
    // =========================

    if (commandName === 'reset') {

        data.users = {};

        saveData();

        return interaction.editReply(
            '♻️ Reset thành công'
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
                    `👤 ${user} : ${formatMoney(users[user])}k\n`;

                tong += users[user];
            }

            result +=
                `💰 Tổng : ${formatMoney(tong)}k\n`;
        }

        return interaction.editReply(
            result || '❌ Chưa có lịch sử'
        );
    }
});

// =========================
// AUTO ADD MONEY
// =========================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    if (
        message.channel.id !==
        process.env.CHANNEL_ID
    ) return;

    checkNewDay();

    const text =
        message.content.toLowerCase();

    // BO QUA LENH
    if (
        text.startsWith('/')
    ) return;

    const regex = /^(\d+)k?$/i;

    const match = text.match(regex);

    if (match) {

        let soTien =
    parseInt(match[1]);

// 2 chu so => x1000
// VD: 15 => 15000

if (
    soTien >= 10 &&
    soTien <= 99
) {

    soTien *= 1000;
}

// 3 chu so => x1000
// VD: 150 => 150000

else if (
    soTien >= 100 &&
    soTien <= 999
) {

    soTien *= 1000;
}

        const username =
            message.author.username;

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