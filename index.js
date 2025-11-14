/**
 * Castle-Bot - A WhatsApp Bot
 * Developed & Managed by Professor & Manoj
 * 
 * Free to use under MIT License
 */

require('./settings');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const NodeCache = require('node-cache');
const pino = require('pino');
const readline = require('readline');
const PhoneNumber = require('awesome-phonenumber');
const { rmSync } = require('fs');
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys");

// 🧩 Handlers
const { handleMessages, handleStatus } = require('./main');
const { handleJoinEvent, handleLeaveEvent } = require('./commands/welcome'); // ✅ Welcome & Goodbye system

// 🧠 Store system
const store = require('./lib/lightweight_store');
store.readFromFile();
setInterval(() => store.writeToFile(), 10000);

const settings = require('./settings');

// ♻️ Auto Garbage Collect & Memory check
setInterval(() => global.gc && global.gc(), 60000);
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...');
        process.exit(1);
    }
}, 30000);

let phoneNumber = "911234567890";
let owner = JSON.parse(fs.readFileSync('./data/owner.json'));
global.botname = "KNIGHT BOT";
global.themeemoji = "•";

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const question = (text) => rl ? new Promise((resolve) => rl.question(text, resolve)) : Promise.resolve(settings.ownerNumber || phoneNumber);

// ==========================
// ⚙️ MAIN FUNCTION START
// ==========================
async function startCastleBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const msgRetryCounterCache = new NodeCache();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !phoneNumber,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        msgRetryCounterCache
    });

    store.bind(sock.ev);
    sock.public = true;
    sock.serializeM = (m) => require('./lib/myfunc').smsg(sock, m, store);

    // ==========================
    // 📨 MESSAGE HANDLER
    // ==========================
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = mek.message?.ephemeralMessage?.message || mek.message;
            if (mek.key.remoteJid === 'status@broadcast') return await handleStatus(sock, chatUpdate);
            await handleMessages(sock, chatUpdate, true);
        } catch (err) {
            console.log('❌ Error in message handler:', err);
        }
    });

    // ==========================
    // 👥 GROUP JOIN / LEAVE HANDLER
    // ==========================
    sock.ev.on('group-participants.update', async (update) => {
        try {
            if (update.action === 'add') {
                await handleJoinEvent(sock, update.id, update.participants);
            } else if (update.action === 'remove') {
                await handleLeaveEvent(sock, update.id, update.participants);
            }
        } catch (err) {
            console.error('Error in group participant event:', err);
        }
    });

    // ==========================
    // 📞 ANTI-CALL SYSTEM
    // ==========================
    const antiCallNotified = new Set();
    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            const callerJid = call.from || call.peerJid || call.chatId;
            if (!callerJid) continue;
            if (!antiCallNotified.has(callerJid)) {
                antiCallNotified.add(callerJid);
                await sock.sendMessage(callerJid, { text: '📵 Anticall active. You are being blocked.' });
                setTimeout(async () => await sock.updateBlockStatus(callerJid, 'block'), 1000);
            }
        }
    });

    // ==========================
    // 🔄 CONNECTION HANDLER
    // ==========================
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(chalk.green(`✅ Connected Successfully as ${sock.user.name}`));
            console.log(chalk.yellow(`🤖 ${global.botname} is Online & Ready!`));
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut || reason === 401) {
                console.log(chalk.red('Session expired. Re-authenticating...'));
                rmSync('./session', { recursive: true, force: true });
            }
            startCastleBot();
        }
    });

    // ==========================
    // 📡 CONTACTS + UPDATES
    // ==========================
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {};
            return decode.user && decode.server ? decode.user + '@' + decode.server : jid;
        } else return jid;
    };

    sock.ev.on('contacts.update', (update) => {
        for (const contact of update) {
            let id = sock.decodeJid(contact.id);
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
        }
    });

    sock.getName = (jid, withoutContact = false) => {
        id = sock.decodeJid(jid);
        withoutContact = sock.withoutContact || withoutContact;
        let v;
        if (id.endsWith("@g.us")) {
            return new Promise(async (resolve) => {
                v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = await sock.groupMetadata(id) || {};
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'));
            });
        } else {
            v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } :
                id === sock.decodeJid(sock.user.id) ? sock.user :
                    (store.contacts[id] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        }
    };

    // ==========================
    // 🔐 SAVE CREDS
    // ==========================
    sock.ev.on('creds.update', saveCreds);
    return sock;
}

// ==========================
// 🚀 START BOT
// ==========================
startCastleBot().catch((err) => {
    console.error('❌ Fatal Error:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => console.error('❌ Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('❌ Unhandled Rejection:', err));

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`🌀 File Updated: ${__filename}`));
    delete require.cache[file];
    require(file);
});
