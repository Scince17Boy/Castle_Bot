const fs = require('fs');
const path = require('path');

// ======================
// 🗂 Load & Save JSON Data
// ======================
function loadUserGroupData() {
    try {
        const dataPath = path.join(__dirname, '../data/userGroupData.json');
        if (!fs.existsSync(dataPath)) {
            const defaultData = {
                antibadword: {},
                antilink: {},
                antitag: {},
                welcome: {},
                goodbye: {},
                chatbot: {},
                warnings: {},
                sudo: []
            };
            fs.writeFileSync(dataPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
        console.error('Error loading user group data:', err);
        return {
            antibadword: {},
            antilink: {},
            antitag: {},
            welcome: {},
            goodbye: {},
            chatbot: {},
            warnings: {},
            sudo: []
        };
    }
}

function saveUserGroupData(data) {
    try {
        const dataPath = path.join(__dirname, '../data/userGroupData.json');
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving user group data:', err);
        return false;
    }
}

// ======================
// 🔗 Antilink System
// ======================
async function setAntilink(groupId, type, action) {
    const data = loadUserGroupData();
    data.antilink[groupId] = { enabled: type === 'on', action: action || 'delete' };
    saveUserGroupData(data);
    return true;
}
async function getAntilink(groupId) {
    const data = loadUserGroupData();
    return data.antilink[groupId] || null;
}
async function removeAntilink(groupId) {
    const data = loadUserGroupData();
    delete data.antilink[groupId];
    saveUserGroupData(data);
    return true;
}

// ======================
// 🏷️ Antitag System
// ======================
async function setAntitag(groupId, type, action) {
    const data = loadUserGroupData();
    data.antitag[groupId] = { enabled: type === 'on', action: action || 'delete' };
    saveUserGroupData(data);
    return true;
}
async function getAntitag(groupId) {
    const data = loadUserGroupData();
    return data.antitag[groupId] || null;
}
async function removeAntitag(groupId) {
    const data = loadUserGroupData();
    delete data.antitag[groupId];
    saveUserGroupData(data);
    return true;
}

// ======================
// ⚠️ Warning System
// ======================
async function incrementWarningCount(groupId, userId) {
    const data = loadUserGroupData();
    if (!data.warnings[groupId]) data.warnings[groupId] = {};
    if (!data.warnings[groupId][userId]) data.warnings[groupId][userId] = 0;
    data.warnings[groupId][userId]++;
    saveUserGroupData(data);
    return data.warnings[groupId][userId];
}
async function resetWarningCount(groupId, userId) {
    const data = loadUserGroupData();
    if (data.warnings[groupId]) data.warnings[groupId][userId] = 0;
    saveUserGroupData(data);
    return true;
}

// ======================
// 👑 Sudo System
// ======================
async function isSudo(userId) {
    const data = loadUserGroupData();
    return data.sudo.includes(userId);
}
async function addSudo(userJid) {
    const data = loadUserGroupData();
    if (!data.sudo.includes(userJid)) data.sudo.push(userJid);
    saveUserGroupData(data);
    return true;
}
async function removeSudo(userJid) {
    const data = loadUserGroupData();
    data.sudo = data.sudo.filter(id => id !== userJid);
    saveUserGroupData(data);
    return true;
}
async function getSudoList() {
    const data = loadUserGroupData();
    return data.sudo || [];
}

// ======================
// 👋 Welcome System
// ======================
async function addWelcome(jid, enabled, message) {
    const data = loadUserGroupData();
    data.welcome[jid] = {
        enabled: enabled,
        message: message || '╔═⚔️ WELCOME ⚔️═╗\n║ 🛡️ User: {user}\n║ 🏰 Kingdom: {group}\n╠═══════════════╣\n║ 📜 {description}\n╚═══════════════╝',
        channelId: '120363419669505478@newsletter'
    };
    saveUserGroupData(data);
    return true;
}
async function delWelcome(jid) {
    const data = loadUserGroupData();
    delete data.welcome[jid];
    saveUserGroupData(data);
    return true;
}
async function isWelcomeOn(jid) {
    const data = loadUserGroupData();
    return data.welcome[jid]?.enabled || false;
}
async function getWelcome(jid) {
    const data = loadUserGroupData();
    return data.welcome[jid]?.message || null;
}

// ======================
// ⚰️ Goodbye System
// ======================
async function addGoodbye(jid, enabled, message) {
    const data = loadUserGroupData();
    data.goodbye[jid] = {
        enabled: enabled,
        message: message || '╔═⚔️ GOODBYE ⚔️═╗\n║ 🛡️ User: {user}\n║ 🏰 Kingdom: {group}\n╠═══════════════╣\n║ ⚰️ Farewell!\n╚═══════════════╝',
        channelId: '120363419669505478@newsletter'
    };
    saveUserGroupData(data);
    return true;
}
async function delGoodBye(jid) {
    const data = loadUserGroupData();
    delete data.goodbye[jid];
    saveUserGroupData(data);
    return true;
}
async function isGoodByeOn(jid) {
    const data = loadUserGroupData();
    return data.goodbye[jid]?.enabled || false;
}
async function getGoodbye(jid) {
    const data = loadUserGroupData();
    return data.goodbye[jid]?.message || null;
}

// ======================
// 🤬 Anti Badword System
// ======================
async function setAntiBadword(groupId, type, action) {
    const data = loadUserGroupData();
    data.antibadword[groupId] = { enabled: type === 'on', action: action || 'delete' };
    saveUserGroupData(data);
    return true;
}
async function getAntiBadword(groupId) {
    const data = loadUserGroupData();
    return data.antibadword[groupId] || null;
}
async function removeAntiBadword(groupId) {
    const data = loadUserGroupData();
    delete data.antibadword[groupId];
    saveUserGroupData(data);
    return true;
}

// ======================
// 🤖 Chatbot System
// ======================
async function setChatbot(groupId, enabled) {
    const data = loadUserGroupData();
    data.chatbot[groupId] = { enabled };
    saveUserGroupData(data);
    return true;
}
async function getChatbot(groupId) {
    const data = loadUserGroupData();
    return data.chatbot[groupId] || null;
}
async function removeChatbot(groupId) {
    const data = loadUserGroupData();
    delete data.chatbot[groupId];
    saveUserGroupData(data);
    return true;
}

// ======================
// 📦 Export All
// ======================
module.exports = {
    loadUserGroupData,
    saveUserGroupData,
    // Antilink
    setAntilink,
    getAntilink,
    removeAntilink,
    // Antitag
    setAntitag,
    getAntitag,
    removeAntitag,
    // Warning
    incrementWarningCount,
    resetWarningCount,
    // Sudo
    isSudo,
    addSudo,
    removeSudo,
    getSudoList,
    // Welcome
    addWelcome,
    delWelcome,
    isWelcomeOn,
    getWelcome,
    // Goodbye
    addGoodbye,
    delGoodBye,
    isGoodByeOn,
    getGoodbye,
    // AntiBadword
    setAntiBadword,
    getAntiBadword,
    removeAntiBadword,
    // Chatbot
    setChatbot,
    getChatbot,
    removeChatbot
};
