const os = require('os');
const fs = require('fs');
const path = require('path');
const settings = require('../settings.js');

// Format uptime (like 1d 3h 24m 5s)
function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= (24 * 60 * 60);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;
    return time.trim();
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: '🏓 Checking connection...' }, { quoted: message });
        const end = Date.now();
        const ping = Math.round((end - start) / 2);

        const uptimeFormatted = formatTime(process.uptime());
        const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);

        // Beautiful Castle-Bot Status Message
        const statusText = `
╔═══════════════╗
  🤖 *${settings.botName || 'Castle-Bot'} STATUS PANEL*
╚═══════════════╝
╔═══════════════╗
🚀 *Ping:* ${ping} ms
⏱️ *Uptime:* ${uptimeFormatted}
🧠 *RAM Used:* ${usedMemory} / ${totalMemory} MB
🔖 *Version:* v${settings.version || '3.0.1'}
👑 *Owner:* ${settings.botOwner || '𝓜𝓻. 𝓜𝓐𝓝𝓞𝓙'}
🔗 *Channel:* ${global.ytch || 'https://whatsapp.com/channel/0029Vb6YUWsHrDZfhWaRuj15'}

📅 *Server:* ${os.type()} ${os.release()}
💻 *Platform:* ${os.platform().toUpperCase()}
╚═══════════════╝
        `.trim();

        // Check image availability
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        const imageExists = fs.existsSync(imagePath);

        // Send Message with or without image
        if (imageExists) {
            const imageBuffer = fs.readFileSync(imagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: statusText,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363419669505478@newsletter',
                        newsletterName: 'Castle-Bot',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            console.warn('⚠️ Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, {
                text: statusText,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363419669505478@newsletter',
                        newsletterName: 'Castle-Bot',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        }

    } catch (error) {
        console.error('❌ Error in ping command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get bot status.' });
    }
}

module.exports = pingCommand;
