const { 
    addWelcome, delWelcome, isWelcomeOn, getWelcome, 
    addGoodbye, delGoodBye, isGoodByeOn, getGoodbye 
} = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');
const { delay } = require('@whiskeysockets/baileys');

// =============================
// ⚙️ Handle Welcome Commands
// =============================
async function handleWelcome(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `📥 *Welcome Message Setup*\n\n✅ *.welcome on* — Enable welcome messages\n🛠️ *.welcome set Your custom message* — Set a custom welcome message\n🚫 *.welcome off* — Disable welcome messages\n\n*Available Variables:*\n• {user} - Mentions the new member\n• {group} - Shows group name\n• {description} - Shows group description`,
            quoted: message
        });
    }

    const [command, ...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    if (lowerCommand === 'on') {
        if (await isWelcomeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ Welcome messages are *already enabled*.', quoted: message });
        }
        await addWelcome(chatId, true, 'Welcome {user} to {group}! 🎉');
        return sock.sendMessage(chatId, { text: '✅ Welcome messages *enabled successfully*!', quoted: message });
    }

    if (lowerCommand === 'off') {
        if (!(await isWelcomeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ Welcome messages are *already disabled*.', quoted: message });
        }
        await delWelcome(chatId);
        return sock.sendMessage(chatId, { text: '✅ Welcome messages *disabled* for this group.', quoted: message });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠️ Please provide a custom welcome message.\nExample: *.welcome set Welcome {user} to {group}!*', quoted: message });
        }
        await addWelcome(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Custom welcome message *set successfully*!', quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `❌ Invalid command.\nUse:\n*.welcome on* - Enable\n*.welcome set [message]* - Custom message\n*.welcome off* - Disable`,
        quoted: message
    });
}

// =============================
// ⚙️ Handle Goodbye Commands
// =============================
async function handleGoodbye(sock, chatId, message, match) {
    if (!match) {
        return sock.sendMessage(chatId, {
            text: `📤 *Goodbye Message Setup*\n\n✅ *.goodbye on* — Enable goodbye messages\n🛠️ *.goodbye set Your custom message* — Set a custom goodbye message\n🚫 *.goodbye off* — Disable goodbye messages\n\n*Available Variables:*\n• {user} - Mentions the leaving member\n• {group} - Shows group name`,
            quoted: message
        });
    }

    const [command, ...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    if (lowerCommand === 'on') {
        if (await isGoodByeOn(chatId)) {
            return sock.sendMessage(chatId, { text: '⚠️ Goodbye messages are *already enabled*.', quoted: message });
        }
        await addGoodbye(chatId, true, 'Goodbye {user} 👋');
        return sock.sendMessage(chatId, { text: '✅ Goodbye messages *enabled successfully*!', quoted: message });
    }

    if (lowerCommand === 'off') {
        if (!(await isGoodByeOn(chatId))) {
            return sock.sendMessage(chatId, { text: '⚠️ Goodbye messages are *already disabled*.', quoted: message });
        }
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, { text: '✅ Goodbye messages *disabled* for this group.', quoted: message });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: '⚠️ Please provide a custom goodbye message.\nExample: *.goodbye set Goodbye {user}!*', quoted: message });
        }
        await addGoodbye(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: '✅ Custom goodbye message *set successfully*!', quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `❌ Invalid command.\nUse:\n*.goodbye on* - Enable\n*.goodbye set [message]* - Custom message\n*.goodbye off* - Disable`,
        quoted: message
    });
}

// =============================
// 👋 Handle New Member Join
// =============================
async function handleJoinEvent(sock, id, participants) {
    const isEnabled = await isWelcomeOn(id);
    if (!isEnabled) return;

    const customMessage = await getWelcome(id);
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'No description available';

    for (const participant of participants) {
        try {
            const user = typeof participant === 'string' ? participant : participant.id;
            const username = user.split('@')[0];

            let profilePicUrl = 'https://img.pyrocdn.com/dbKUgahg.png';
            try {
                const pic = await sock.profilePictureUrl(user, 'image');
                if (pic) profilePicUrl = pic;
            } catch {}

            const finalMessage = customMessage
                ? customMessage.replace(/{user}/g, `@${username}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc)
                : `Welcome @${username} to *${groupName}*! 🎉`;

            await sock.sendMessage(id, {
                image: { url: profilePicUrl },
                caption: finalMessage,
                mentions: [user],
                ...channelInfo
            });
        } catch (err) {
            console.error('Error sending welcome:', err);
        }
    }
}

// =============================
// 👋 Handle Member Leave
// =============================
async function handleLeaveEvent(sock, id, participants) {
    const isEnabled = await isGoodByeOn(id);
    if (!isEnabled) return;

    const customMessage = await getGoodbye(id);
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;

    for (const participant of participants) {
        try {
            const user = typeof participant === 'string' ? participant : participant.id;
            const username = user.split('@')[0];

            let profilePicUrl = 'https://img.pyrocdn.com/dbKUgahg.png';
            try {
                const pic = await sock.profilePictureUrl(user, 'image');
                if (pic) profilePicUrl = pic;
            } catch {}

            const finalMessage = customMessage
                ? customMessage.replace(/{user}/g, `@${username}`)
                    .replace(/{group}/g, groupName)
                : `Goodbye @${username} 👋`;

            await sock.sendMessage(id, {
                image: { url: profilePicUrl },
                caption: finalMessage,
                mentions: [user],
                ...channelInfo
            });
        } catch (err) {
            console.error('Error sending goodbye:', err);
        }
    }
}

module.exports = { 
    handleWelcome, 
    handleGoodbye, 
    handleJoinEvent, 
    handleLeaveEvent 
};
