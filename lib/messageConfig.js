/**
 * WhatsApp Channel Forwarding Info
 * Clean & Professional Version
 * --------------------------------
 * This object is used so that the bot's message
 * looks like it was forwarded from an official
 * WhatsApp Channel.
 */

const channelInfo = {
    contextInfo: {
        // How many times the message looks forwarded (display)
        forwardingScore: 999,

        // Mark message as forwarded
        isForwarded: true,

        // Channel information shown in forwarded preview
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363419669505478@newsletter",  // Your Channel JID
            newsletterName: "Castle-Bot",                    // Your Channel Name
            serverMessageId: -12345                          // Random negative ID
        }
    }
};

/**
 * Exporting channelInfo so other bot files can use it
 */
module.exports = {
    channelInfo
};
