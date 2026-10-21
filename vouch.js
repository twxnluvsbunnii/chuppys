const {
SlashCommandBuilder,
EmbedBuilder,
PermissionsBitField
} = require("discord.js”);

// ==================================================
// VOUCH CHANNEL SETTINGS
// ==================================================

const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676”;
const VOUCH_CHANNEL_ID = "1530811494168657980”;

const PERSONAL_SELLER_IDS = [
"1530733554869473320”,
"1490962480963260466”
];

const THANK_YOU_EMOJI = "<:uppyty:1561094713153429746>”;

// ==================================================
// ROUTE VOUCHES TO THE CORRECT CHANNEL
// ==================================================

function getVouchChannelId(sellerId) {
if (PERSONAL_SELLER_IDS.includes(sellerId)) {
return PERSONAL_VOUCH_CHANNEL_ID;
}

return VOUCH_CHANNEL_ID;
}

// ==================================================
// VOUCH SLASH COMMAND
// ==================================================

const vouchCommand = new SlashCommandBuilder()
.setName("vouch”)
.setDescription("Leave a vouch for a seller.”)
.addUserOption(option =>
option
.setName("seller”)
.setDescription("The seller you are vouching for.”)
.setRequired(true)
)
.addIntegerOption(option =>
option
.setName("rating”)
.setDescription("Rate your experience from 1 to 5.”)
.setRequired(true)
.setMinValue(1)
.setMaxValue(5)
)
.addStringOption(option =>
option
.setName("order”)
.setDescription("Describe what you purchased.”)
.setRequired(true)
.setMaxLength(500)
)
.addAttachmentOption(option =>
option
.setName("proof”)
.setDescription("Upload an image as proof of your order.”)
.setRequired(true)
);

// ==================================================
// REGISTER THE COMMAND
// ==================================================

async function registerVouch(client) {
try {
const guildId = process.env.GUILD_ID;

if (!guildId) {
  console.error(
    "VOUCH ERROR: GUILD_ID is missing from environment variables."
  );
  return;
}
await client.application.fetch();
const existingCommands =
  await client.application.commands.fetch({ guildId });
// Preserve other commands and replace only /vouch.
const commands = existingCommands
  .filter(command => command.name !== "vouch")
  .map(command => command.toJSON());
commands.push(vouchCommand.toJSON());
await client.application.commands.set(commands, guildId);
console.log("Vouch command registered successfully.");

} catch (error) {
console.error(“Failed to register vouch command:”, error);
}
}

// ==================================================
// SUBMIT A VOUCH
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
if (!order || !order.trim()) {
  return interaction.reply({
    content: "Please provide a description of your order.",
    ephemeral: true
  });
}
if (!proof || !proof.contentType?.startsWith("image/")) {
  return interaction.reply({
    content: "Please upload an image file as your proof.",
    ephemeral: true
  });
}
// Select the correct channel for the seller.
const channelId = getVouchChannelId(seller.id);
const channel =
  await interaction.client.channels.fetch(channelId);
if (
  !channel ||
  !channel.isTextBased() ||
  !channel.isSendable()
) {
  return interaction.reply({
    content:
      "I couldn't access the vouch channel. Please contact an administrator.",
    ephemeral: true
  });
}
// Check bot permissions.
const botMember = await interaction.guild.members.fetchMe();
const permissions = channel.permissionsFor(botMember);
if (
  !permissions ||
  !permissions.has([
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.AddReactions
  ])
) {
  return interaction.reply({
    content:
      "I need permission to view the vouch channel, send embeds, and add reactions.",
    ephemeral: true
  });
}
// Create the vouch embed.
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
// Send the vouch to the correct channel.
const vouchMessage = await channel.send({
  embeds: [embed]
});
// Add the thank-you reaction.
try {
  await vouchMessage.react(THANK_YOU_EMOJI);
} catch (error) {
  console.error(
    "Could not add the thank-you reaction:",
    error
  );
}
return interaction.reply({
  content:
    `Your vouch for ${seller.username} was submitted successfully!`,
  ephemeral: true
});

} catch (error) {
console.error(“Error submitting vouch:”, error);

const reply = {
  content:
    "Something went wrong while submitting your vouch. Please try again later.",
  ephemeral: true
};
if (interaction.replied || interaction.deferred) {
  return interaction.followUp(reply).catch(() => {});
}
return interaction.reply(reply).catch(() => {});

}
}

// ==================================================
// CONNECT THE VOUCH SYSTEM TO YOUR BOT
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
