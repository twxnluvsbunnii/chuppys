const {
SlashCommandBuilder,
EmbedBuilder,
PermissionsBitField
} = require(“discord.js”);

// ==================================================
// VOUCH CHANNEL SETTINGS
// ==================================================

// Personal vouch channel for you and your boyfriend
const PERSONAL_VOUCH_CHANNEL_ID = “1562227276051910676”;

// Regular vouch channel for all other sellers
const VOUCH_CHANNEL_ID = “1530811494168657980”;

// Your Discord ID and your boyfriend’s Discord ID
const PERSONAL_SELLER_IDS = [
“1530733554869473320”,
“1490962480963260466”
];

// Thank-you reaction
const THANK_YOU_EMOJI = “<:uppyty:1561094713153429746>”;

// ==================================================
// CHANNEL ROUTING
// ==================================================

function getVouchChannelId(sellerId) {
if (PERSONAL_SELLER_IDS.includes(sellerId)) {
return PERSONAL_VOUCH_CHANNEL_ID;
}

return VOUCH_CHANNEL_ID;
}

// ==================================================
// SLASH COMMAND
// ==================================================

const vouchCommand = new SlashCommandBuilder()
.setName(“vouch”)
.setDescription(“Leave a vouch for a seller.”)
.addUserOption(option =>
option
.setName(“seller”)
.setDescription(“The seller you are vouching for.”)
.setRequired(true)
)
.addIntegerOption(option =>
option
.setName(“rating”)
.setDescription(“Rate your experience from 1 to 5.”)
.setRequired(true)
.setMinValue(1)
.setMaxValue(5)
)
.addStringOption(option =>
option
.setName(“order”)
.setDescription(“Describe what you purchased.”)
.setRequired(true)
.setMaxLength(500)
)
.addAttachmentOption(option =>
option
.setName(“proof”)
.setDescription(“Upload an image as proof of your order.”)
.setRequired(true)
);

// ==================================================
// REGISTER COMMAND WITHOUT REMOVING OTHER COMMANDS
// ==================================================

async function registerVouch(client) {
try {
const guildId = process.env.GUILD_ID;

if (!guildId) {
  console.error("VOUCH ERROR: GUILD_ID is missing from your environment variables.");
  return;
}
await client.application.fetch();
const existingCommands = await client.application.commands.fetch({
  guildId
});
const commands = existingCommands
  .filter(command => command.name !== "vouch")
  .map(command => command.toJSON());
commands.push(vouchCommand.toJSON());
await client.application.commands.set(commands, guildId);
console.log("Vouch slash command registered successfully.");

} catch (error) {
console.error(“Failed to register vouch command:”, error);
}
}

// ==================================================
// SUBMIT VOUCH
// ==================================================

async function submitVouch(interaction) {
try {
if (!interaction.inGuild()) {
return interaction.reply({
content: “You can only submit a vouch inside a server.”,
ephemeral: true
});
}

const seller = interaction.options.getUser("seller");
const rating = interaction.options.getInteger("rating");
const order = interaction.options.getString("order");
const proof = interaction.options.getAttachment("proof");
// Prevent invalid seller selections
if (seller.bot) {
  return interaction.reply({
    content: "You cannot leave a vouch for a bot.",
    ephemeral: true
  });
}
if (seller.id === interaction.user.id) {
  return interaction.reply({
    content: "You cannot leave a vouch for yourself.",
    ephemeral: true
  });
}
// Validate order description
if (!order || !order.trim()) {
  return interaction.reply({
    content: "Please provide a description of your order.",
    ephemeral: true
  });
}
// Validate proof attachment
if (!proof || !proof.contentType?.startsWith("image/")) {
  return interaction.reply({
    content: "Please upload an image as your proof.",
    ephemeral: true
  });
}
// Choose the correct channel based on the seller
const channelId = getVouchChannelId(seller.id);
const channel = await interaction.client.channels.fetch(channelId);
if (!channel || !channel.isTextBased() || !channel.isSendable()) {
  return interaction.reply({
    content: "I couldn't access the vouch channel. Please contact an administrator.",
    ephemeral: true
  });
}
// Check bot permissions
const botMember = await interaction.guild.members.fetchMe();
const permissions = channel.permissionsFor(botMember);
if (
  !permissions ||
  !permissions.has([
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks
  ])
) {
  return interaction.reply({
    content: "I don't have permission to send vouches in the selected channel.",
    ephemeral: true
  });
}
// Build the vouch embed
const embed = new EmbedBuilder()
  .setColor(0xffb6d9)
  .setTitle("NEW VOUCH")
  .setDescription(
    `Thank you for leaving a vouch!\n\n` +
    `**Seller:** ${seller}\n` +
    `**Buyer:** ${interaction.user}\n` +
    `**Rating:** ${"⭐".repeat(rating)} (${rating}/5)\n` +
    `**Order:** ${order.trim()}`
  )
  .setImage(proof.url)
  .setFooter({
    text: `Vouch submitted by ${interaction.user.username}`
  })
  .setTimestamp();
// Send the vouch to the correct channel
const vouchMessage = await channel.send({
  embeds: [embed]
});
// Add the thank-you reaction
await vouchMessage.react(THANK_YOU_EMOJI).catch(error => {
  console.error("Could not add the vouch reaction:", error);
});
// Confirm to the person submitting the vouch
return interaction.reply({
  content: `Your vouch for **${seller.username}** has been submitted successfully!`,
  ephemeral: true
});

} catch (error) {
console.error(“Error submitting vouch:”, error);

const reply = {
  content: "Something went wrong while submitting your vouch. Please try again later.",
  ephemeral: true
};
if (interaction.replied || interaction.deferred) {
  return interaction.followUp(reply).catch(() => {});
}
return interaction.reply(reply).catch(() => {});

}
}

// ==================================================
// CONNECT VOUCH SYSTEM TO YOUR EXISTING BOT
// ==================================================

module.exports = function (client) {
client.once(“ready”, async () => {
await registerVouch(client);
});

client.on(“interactionCreate”, async interaction => {
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName !== “vouch”) return;

await submitVouch(interaction);

});
};
