const {
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
  PermissionsBitField
} = require("discord.js");
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const VOUCH_CHANNEL_ID = "1530811494168657980";
const VOUCH_EMOJI_URL =
  "https://cdn.discordapp.com/emojis/1561197586554036318.png";
const THANK_YOU_EMOJI = "<:uppyty:1561094713153429746>";
// ================================
// VOUCH SLASH COMMAND
// ================================
const vouchCommand = new SlashCommandBuilder()
  .setName("vouch")
  .setDescription("Submit a vouch for a seller")
  .addUserOption(option =>
    option
      .setName("seller")
      .setDescription("The seller you purchased from")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName("rating")
      .setDescription("Rate your purchase from 1 to 5")
      .setMinValue(1)
      .setMaxValue(5)
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("order")
      .setDescription("What you purchased")
      .setMaxLength(500)
      .setRequired(true)
  )
  .addAttachmentOption(option =>
    option
      .setName("proof")
      .setDescription("Upload an image showing proof of purchase")
      .setRequired(true)
  );
// ================================
// CREATE VOUCH EMBED
// ================================
function createVouchEmbed({
  seller,
  buyer,
  order,
  rating,
  proof
}) {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle("NEW VOUCH")
    .setThumbnail(VOUCH_EMOJI_URL)
    .setDescription(
      `**seller:** <@${seller.id}>\n` +
      `**buyer:** <@${buyer.id}>\n` +
      `**items purchased:** ${order}\n` +
      `**rating:** ${rating}/5\n` +
      `**proof:** 📎 ${proof.name}\n\n` +
      `*thank you for vouching! shop again ♡*`
    )
    .setImage(proof.url)
    .setTimestamp();
}
// ================================
// REGISTER /VOUCH
// ================================
async function registerVouch(client) {
  console.log("[VOUCH DEBUG] Starting command registration.");
  if (!TOKEN || !GUILD_ID) {
    console.error(
      "[VOUCH DEBUG] Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID."
    );
    return;
  }
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    const route = Routes.applicationGuildCommands(
      client.user.id,
      GUILD_ID
    );
    // Keep the other existing server slash commands.
    const existingCommands = await rest.get(route);
    const otherCommands = existingCommands
      .filter(command => command.name !== "vouch")
      .map(command => {
        const payload = {
          name: command.name,
          type: command.type
        };
        const optionalFields = [
          "description",
          "options",
          "default_member_permissions",
          "default_permission",
          "dm_permission",
          "nsfw",
          "name_localizations",
          "description_localizations",
          "integration_types",
          "contexts"
        ];
        for (const field of optionalFields) {
          if (command[field] !== undefined) {
            payload[field] = command[field];
          }
        }
        return payload;
      });
    await rest.put(route, {
      body: [
        ...otherCommands,
        vouchCommand.toJSON()
      ]
    });
    console.log("[VOUCH] /vouch registered successfully.");
  } catch (error) {
    console.error(
      "[VOUCH DEBUG] Command registration failed:",
      error
    );
  }
}
// ================================
// SUBMIT VOUCH
// ================================
async function submitVouch(interaction) {
  console.log("[VOUCH DEBUG] Starting vouch submission.");
  const seller = interaction.options.getUser("seller");
  const rating = interaction.options.getInteger("rating");
  const order = interaction.options.getString("order");
  const proof = interaction.options.getAttachment("proof");
  const buyer = interaction.user;
  if (!interaction.guild) {
    throw new Error("You must use /vouch inside the server.");
  }
  if (seller.bot) {
    throw new Error("You cannot vouch for a bot.");
  }
  if (seller.id === buyer.id) {
    throw new Error("You cannot vouch for yourself.");
  }
  if (!proof) {
    throw new Error("Please upload proof of your purchase.");
  }
  const isImage =
    (proof.contentType &&
      proof.contentType.startsWith("image/")) ||
    /\.(png|jpe?g|gif|webp)$/i.test(proof.name);
  if (!isImage) {
    throw new Error(
      "Your proof must be an image: PNG, JPG, GIF, or WEBP."
    );
  }
  if (!order || !order.trim()) {
    throw new Error("Please enter what you purchased.");
  }
  console.log("[VOUCH DEBUG] Fetching vouch channel.");
  const channel = await interaction.guild.channels.fetch(
    VOUCH_CHANNEL_ID
  );
  if (
    !channel ||
    !channel.isTextBased() ||
    !channel.send
  ) {
    throw new Error(
      "The vouch channel could not be found. Check the channel ID."
    );
  }
  const botMember = interaction.guild.members.me;
  if (botMember) {
    const permissions = channel.permissionsFor(botMember);
    if (
      !permissions ||
      !permissions.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks
      ])
    ) {
      throw new Error(
        "I need View Channel, Send Messages, and Embed Links permissions in the vouch channel."
      );
    }
  }
  console.log("[VOUCH DEBUG] Building vouch embed.");
  const embed = createVouchEmbed({
    seller,
    buyer,
    order: order.trim(),
    rating,
    proof
  });
  console.log("[VOUCH DEBUG] Sending vouch to channel.");
  const postedMessage = await channel.send({
    embeds: [embed],
    allowedMentions: {
      users: [seller.id, buyer.id]
    }
  });
  console.log(
    "[VOUCH DEBUG] Vouch message sent:",
    postedMessage.id
  );
  try {
    await postedMessage.react(THANK_YOU_EMOJI);
    console.log("[VOUCH DEBUG] Thank-you reaction added.");
  } catch (error) {
    console.warn(
      "[VOUCH DEBUG] Could not add reaction:",
      error.message
    );
  }
  console.log(
    `[VOUCH] ${buyer.tag} vouched for ${seller.tag}.`
  );
}
// ================================
// EXPORT VOUCH HANDLER
// ================================
module.exports = function setupVouch(client) {
  console.log("[VOUCH DEBUG] vouch.js loaded.");
  client.once(Events.ClientReady, async readyClient => {
    console.log("[VOUCH DEBUG] Discord client is ready.");
    await registerVouch(readyClient);
  });
  client.on(Events.InteractionCreate, async interaction => {
    // DEBUG: Log every incoming interaction.
    if (interaction.isChatInputCommand()) {
      console.log(
        "[VOUCH DEBUG] Interaction received:",
        interaction.commandName
      );
    }
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "vouch") return;
    console.log("[VOUCH DEBUG] /vouch command matched.");
    try {
      // Acknowledge Discord immediately to avoid the 3-second timeout.
      await interaction.deferReply({
        ephemeral: true
      });
      console.log("[VOUCH DEBUG] Interaction acknowledged.");
      await submitVouch(interaction);
      await interaction.editReply(
        "Your vouch was submitted successfully! ♡"
      );
      console.log("[VOUCH DEBUG] Success reply sent.");
    } catch (error) {
      console.error(
        "[VOUCH DEBUG] Error submitting vouch:",
        error
      );
      const errorMessage =
        error.message ||
        "Something went wrong while submitting your vouch.";
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          `❌ ${errorMessage}`
        ).catch(replyError => {
          console.error(
            "[VOUCH DEBUG] Could not edit reply:",
            replyError
          );
        });
      } else {
        await interaction.reply({
          content: `❌ ${errorMessage}`,
          ephemeral: true
        }).catch(replyError => {
          console.error(
            "[VOUCH DEBUG] Could not send reply:",
            replyError
          );
        });
      }
    }
  });
  client.on(Events.Error, error => {
    console.error("[VOUCH DEBUG] Discord client error:", error);
  });
};
