const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");

// ==================================================
// VOUCH CHANNELS
// ==================================================

const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676";
const VOUCH_CHANNEL_ID = "1530811494168657980";

const THANK_YOU_EMOJI = "<:uppyty:1561094713153429746>";

// ==================================================
// SELLER ID MAPPING
// ==================================================

const SELLERS = [
  {
    id: "1530733554869473320",
    name: "﹕𐔌・bunnii 〃・꒱",
    personal: true
  },
  {
    id: "1490962480963260466",
    name: "﹕𐔌・twxn 〃・꒱",
    personal: true
  },
  {
    id: "1192248188409749684",
    name: "﹕𐔌・angel 〃・꒱",
    personal: false
  },
  {
    id: "1079241163455873074",
    name: "﹕𐔌・felony 〃・꒱",
    personal: false
  },
  {
    id: "1032693136163622993",
    name: "﹕𐔌・cusi 〃・꒱",
    personal: false
  },
  {
    id: "1320199904219496530",
    name: "﹕𐔌・dav 〃・꒱",
    personal: false
  },
  {
    id: "952566845939023892",
    name: "﹕𐔌・momo 〃・꒱",
    personal: false
  },
  {
    id: "1473335012769267807",
    name: "﹕𐔌・kitako 〃・꒱",
    personal: false
  },
  {
    id: "1472856287527309313",
    name: "﹕𐔌・coraline 〃・꒱",
    personal: false
  },
  {
    id: "1269188505935024141",
    name: "﹕𐔌・maya 〃・꒱",
    personal: false
  }
];

// ==================================================
// SELECT CHANNEL USING THE SELLER'S ACTUAL ID
// ==================================================

function getVouchChannelId(sellerId) {
  const selectedSeller = SELLERS.find(
    seller => seller.id === sellerId
  );

  if (!selectedSeller) {
    throw new Error(`Unknown seller ID: ${sellerId}`);
  }

  return selectedSeller.personal
    ? PERSONAL_VOUCH_CHANNEL_ID
    : VOUCH_CHANNEL_ID;
}

// ==================================================
// /VOUCH COMMAND
// ==================================================

const vouchCommand = new SlashCommandBuilder()
  .setName("vouch")
  .setDescription("Leave a vouch for a seller.")
  .addStringOption(option =>
    option
      .setName("seller")
      .setDescription("Choose the seller you purchased from.")
      .setRequired(true)
      .addChoices(
        ...SELLERS.map(seller => ({
          name: seller.name,
          value: seller.id
        }))
      )
  )
  .addIntegerOption(option =>
    option
      .setName("rating")
      .setDescription("Rate your experience from 1 to 5.")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(5)
  )
  .addStringOption(option =>
    option
      .setName("order")
      .setDescription("Describe what you purchased.")
      .setRequired(true)
      .setMaxLength(500)
  )
  .addAttachmentOption(option =>
    option
      .setName("proof")
      .setDescription("Upload an image as proof of your order.")
      .setRequired(true)
  );

// ==================================================
// REGISTER /VOUCH
// ==================================================

async function registerVouch(client) {
  try {
    const guildId =
      process.env.DISCORD_GUILD_ID ||
      process.env.GUILD_ID;

    if (!guildId) {
      console.error("[VOUCH] Missing DISCORD_GUILD_ID.");
      return;
    }

    await client.application.fetch();

    const existingCommands =
      await client.application.commands.fetch({ guildId });

    // Preserve all other slash commands.
    const commands = existingCommands
      .filter(command => command.name !== "vouch")
      .map(command => command.toJSON());

    commands.push(vouchCommand.toJSON());

    await client.application.commands.set(commands, guildId);

    console.log("[VOUCH] /vouch registered successfully.");
    console.log("[VOUCH] Seller choices:", SELLERS.length);
  } catch (error) {
    console.error("[VOUCH] Registration failed:", error);
  }
}

// ==================================================
// SUBMIT VOUCH
// ==================================================

async function submitVouch(interaction) {
  try {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "You can only submit a vouch inside the server.",
        ephemeral: true
      });
    }

    // This is now the selected seller's actual ID.
    const sellerId = interaction.options.getString("seller");
    const rating = interaction.options.getInteger("rating");
    const order = interaction.options.getString("order");
    const proof = interaction.options.getAttachment("proof");

    const selectedSeller = SELLERS.find(
      seller => seller.id === sellerId
    );

    console.log(`[VOUCH] Buyer: ${interaction.user.tag}`);
    console.log(`[VOUCH] Selected seller ID: ${sellerId}`);
    console.log(
      `[VOUCH] Selected seller name: ${
        selectedSeller?.name || "UNKNOWN"
      }`
    );

    if (!selectedSeller) {
      return interaction.reply({
        content: "That seller is not in the seller list.",
        ephemeral: true
      });
    }

    if (!order || !order.trim()) {
      return interaction.reply({
        content: "Please describe what you purchased.",
        ephemeral: true
      });
    }

    if (!proof || !proof.contentType?.startsWith("image/")) {
      return interaction.reply({
        content: "Please upload an image as your proof.",
        ephemeral: true
      });
    }

    // Resolve the destination from the selected seller ID.
    const channelId = getVouchChannelId(sellerId);

    console.log(`[VOUCH] Destination channel: ${channelId}`);

    const channel =
      await interaction.client.channels.fetch(channelId);

    if (
      !channel ||
      !channel.isTextBased() ||
      !channel.isSendable()
    ) {
      console.error(`[VOUCH] Destination unavailable: ${channelId}`);

      return interaction.reply({
        content: "I couldn't access the correct vouch channel.",
        ephemeral: true
      });
    }

    const botMember = await interaction.guild.members.fetchMe();
    const permissions = channel.permissionsFor(botMember);

    if (
      !permissions ||
      !permissions.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AddReactions
      ])
    ) {
      return interaction.reply({
        content:
          "I need permission to view the channel, send messages and embeds, read message history, and add reactions.",
        ephemeral: true
      });
    }

    // Fetch the seller for the embed mention.
    const sellerUser =
      await interaction.client.users.fetch(sellerId);

    const embed = new EmbedBuilder()
      .setColor(0xffb6d9)
      .setTitle("NEW VOUCH")
      .setDescription(
        `Thank you for leaving a vouch!\n\n` +
        `**Seller:** ${sellerUser}\n` +
        `**Buyer:** ${interaction.user}\n` +
        `**Rating:** ${"⭐".repeat(rating)} (${rating}/5)\n` +
        `**Order:** ${order.trim()}`
      )
      .setImage(proof.url)
      .setFooter({
        text: `Vouch submitted by ${interaction.user.username}`
      })
      .setTimestamp();

    // Send the embed ONLY to the selected destination.
    const vouchMessage = await channel.send({
      embeds: [embed],
      allowedMentions: {
        users: [sellerId],
        parse: []
      }
    });

    console.log(
      `[VOUCH] Successfully sent message ${vouchMessage.id} ` +
      `to channel ${channelId}`
    );

    try {
      await vouchMessage.react(THANK_YOU_EMOJI);
    } catch (error) {
      console.error("[VOUCH] Reaction failed:", error.message);
    }

    return interaction.reply({
      content:
        `Your vouch for ${selectedSeller.name} was submitted successfully!`,
      ephemeral: true
    });

  } catch (error) {
    console.error("[VOUCH] Submission failed:", error);

    const reply = {
      content:
        "Something went wrong submitting your vouch. Please try again later.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp(reply).catch(() => {});
    }

    return interaction.reply(reply).catch(() => {});
  }
}

// ==================================================
// CONNECT TO THE BOT
// ==================================================

module.exports = function (client) {
  client.once("clientReady", async () => {
    await registerVouch(client);
  });

  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "vouch") return;

    console.log("[VOUCH] /vouch interaction received.");

    await submitVouch(interaction);
  });
};
