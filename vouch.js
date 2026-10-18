
const {
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
  PermissionsBitField
} = require("discord.js");

// ==================================================
// CONFIGURATION
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const VOUCH_CHANNEL_ID = "1530811494168657980";

const VOUCH_EMOJI_URL =
  "https://cdn.discordapp.com/emojis/1561197586554036318.png";

const THANK_YOU_EMOJI =
  "<:uppyty:1561094713153429746>";

// ==================================================
// /VOUCH SLASH COMMAND
// ==================================================

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

// ==================================================
// CREATE THE VOUCH EMBED
// ==================================================

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

// ==================================================
// REGISTER /VOUCH WITHOUT REMOVING OTHER COMMANDS
// ==================================================

async function registerVouch(client) {
  if (!TOKEN || !GUILD_ID) {
    console.error(
      "[VOUCH] Set DISCORD_BOT_TOKEN and DISCORD_GUILD_ID in Render."
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const route = Routes.applicationGuildCommands(
    client.user.id,
    GUILD_ID
  );

  try {
    const existingCommands = await rest.get(route);

    // Keep existing commands, replacing only /vouch.
    const otherCommands = existingCommands
      .filter(command => command.name !== "vouch")
      .map(command => {
        const payload = {
          name: command.name,
          type: command.type
        };

        if (command.description !== undefined) {
          payload.description = command.description;
        }

        if (command.options !== undefined) {
          payload.options = command.options;
        }

        if (command.default_member_permissions !== undefined) {
          payload.default_member_permissions =
            command.default_member_permissions;
        }

        if (command.nsfw !== undefined) {
          payload.nsfw = command.nsfw;
        }

        if (command.name_localizations !== undefined) {
          payload.name_localizations = command.name_localizations;
        }

        if (command.description_localizations !== undefined) {
          payload.description_localizations =
            command.description_localizations;
        }

        if (command.integration_types !== undefined) {
          payload.integration_types = command.integration_types;
        }

        if (command.contexts !== undefined) {
          payload.contexts = command.contexts;
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
    console.error("[VOUCH] Could not register /vouch:", error);
  }
}

// ==================================================
// SUBMIT THE VOUCH
// ==================================================

async function submitVouch(interaction) {
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

  const channel = await interaction.guild.channels.fetch(
    VOUCH_CHANNEL_ID
  );

  if (!channel || !channel.isTextBased() || !channel.send) {
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

  const embed = createVouchEmbed({
    seller,
    buyer,
    order: order.trim(),
    rating,
    proof
  });

  const postedMessage = await channel.send({
    embeds: [embed],
    allowedMentions: {
      users: [seller.id, buyer.id]
    }
  });

  try {
    await postedMessage.react(THANK_YOU_EMOJI);
  } catch (error) {
    console.warn(
      "[VOUCH] Could not add the thank-you reaction:",
      error.message
    );
  }

  console.log(
    `[VOUCH] ${buyer.tag} vouched for ${seller.tag}.`
  );
}

// ==================================================
// EXPORT THE VOUCH MODULE
// ==================================================

module.exports = function setupVouch(client) {
  // Register /vouch when the bot is ready.
  client.once(Events.ClientReady, async readyClient => {
    await registerVouch(readyClient);
  });

  // Respond only to the /vouch command.
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "vouch") return;

    try {
      // Acknowledge Discord quickly while processing the vouch.
      await interaction.deferReply({
        ephemeral: true
      });

      await submitVouch(interaction);

      await interaction.editReply(
        "Your vouch was submitted successfully! ♡"
      );
    } catch (error) {
      console.error("[VOUCH] Error submitting vouch:", error);

      const errorMessage =
        error.message ||
        "Something went wrong while submitting your vouch.";

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          `❌ ${errorMessage}`
        ).catch(console.error);
      } else {
        await interaction.reply({
          content: `❌ ${errorMessage}`,
          ephemeral: true
        }).catch(console.error);
      }
    }
  });
};
