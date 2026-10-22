
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");

// ==================================================
// VOUCH CHANNELS
// ==================================================

const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676";
const REGULAR_VOUCH_CHANNEL_ID = "1530811494168657980";

const THANK_YOU_EMOJI = "<:uppyty:1561094713153429746>";

// ==================================================
// PERSONAL SELLERS
// These sellers use the personal vouch channel.
// ==================================================

const PERSONAL_SELLERS = [
  {
    id: "1530733554869473320",
    name: "﹕𐔌・bunnii 〃・꒱"
  },
  {
    id: "1490962480963260466",
    name: "﹕𐔌・twxn 〃・꒱"
  }
];

// ==================================================
// REGULAR SELLERS
// These sellers use the regular vouch channel.
// ==================================================

const REGULAR_SELLERS = [
  {
    id: "1192248188409749684",
    name: "﹕𐔌・angel 〃・꒱"
  },
  {
    id: "1079241163455873074",
    name: "﹕𐔌・felony 〃・꒱"
  },
  {
    id: "1032693136163622993",
    name: "﹕𐔌・cusi 〃・꒱"
  },
  {
    id: "1320199904219496530",
    name: "﹕𐔌・dav 〃・꒱"
  },
  {
    id: "952566845939023892",
    name: "﹕𐔌・momo 〃・꒱"
  },
  {
    id: "1473335012769267807",
    name: "﹕𐔌・kitako 〃・꒱"
  },
  {
    id: "1472856287527309313",
    name: "﹕𐔌・coraline 〃・꒱"
  },
  {
    id: "1269188505935024141",
    name: "﹕𐔌・maya 〃・꒱"
  }
];

// Combine the approved seller lists.
const ALL_SELLERS = [
  ...PERSONAL_SELLERS,
  ...REGULAR_SELLERS
];

// ==================================================
// FIND SELLER
// ==================================================

function findSeller(sellerId) {
  return ALL_SELLERS.find(
    seller => seller.id === sellerId
  );
}

// ==================================================
// SELECT VOUCH CHANNEL BY SELLER ID
// ==================================================

function getVouchChannelId(sellerId) {
  const isPersonalSeller = PERSONAL_SELLERS.some(
    seller => seller.id === sellerId
  );

  if (isPersonalSeller) {
    return PERSONAL_VOUCH_CHANNEL_ID;
  }

  return REGULAR_VOUCH_CHANNEL_ID;
}

// ==================================================
// /VOUCH COMMAND
// ==================================================

const vouchCommand = new SlashCommandBuilder()
  .setName("vouch")
  .setDescription("Leave a vouch for a Chuppys seller.")
  .addStringOption(option =>
    option
      .setName("seller")
      .setDescription("Choose the seller you purchased from.")
      .setRequired(true)
      .addChoices(
        ...ALL_SELLERS.map(seller => ({
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
      .setDescription("Upload an image proving your order.")
      .setRequired(true)
  );

// ==================================================
// REGISTER /VOUCH
// Preserve other existing slash commands.
// ==================================================

async function registerVouch(client) {
  try {
    const guildId =
      process.env.DISCORD_GUILD_ID ||
      process.env.GUILD_ID;

    if (!guildId) {
      console.error(
        "[VOUCH] Missing DISCORD_GUILD_ID or GUILD_ID."
      );
      return;
    }

    await client.application.fetch();

    const existingCommands =
      await client.application.commands.fetch({ guildId });

    const commands = existingCommands
      .filter(command => command.name !== "vouch")
      .map(command => command.toJSON());

    commands.push(vouchCommand.toJSON());

    await client.application.commands.set(
      commands,
      guildId
    );

    console.log(
      "[VOUCH] /vouch registered successfully."
    );
  } catch (error) {
    console.error(
      "[VOUCH] Registration failed:",
      error
    );
  }
}

// ==================================================
// SUBMIT A VOUCH
// ==================================================

async function submitVouch(interaction) {
  try {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content:
          "You can only submit a vouch inside the server.",
        ephemeral: true
      });
    }

    // The dropdown value is the selected seller's user ID.
    const sellerId =
      interaction.options.getString("seller");

    const sellerData = findSeller(sellerId);

    const rating =
      interaction.options.getInteger("rating");

    const order =
      interaction.options.getString("order");

    const proof =
      interaction.options.getAttachment("proof");

    // Validate the selected seller.
    if (!sellerData) {
      return interaction.reply({
        content:
          "Please select a valid approved Chuppys seller.",
        ephemeral: true
      });
    }

    if (sellerData.id === interaction.user.id) {
      return interaction.reply({
        content:
          "You cannot vouch for yourself.",
        ephemeral: true
      });
    }

    if (!order || !order.trim()) {
      return interaction.reply({
        content:
          "Please describe your order.",
        ephemeral: true
      });
    }

    if (
      !proof ||
      !proof.contentType?.startsWith("image/")
    ) {
      return interaction.reply({
        content:
          "Please upload an image as proof of your order.",
        ephemeral: true
      });
    }

    // Route using the selected seller's actual ID.
    const channelId =
      getVouchChannelId(sellerData.id);

    console.log(
      `[VOUCH] Seller: ${sellerData.name} (${sellerData.id})`
    );

    console.log(
      `[VOUCH] Destination channel: ${channelId}`
    );

    const channel =
      await interaction.client.channels.fetch(channelId);

    if (
      !channel ||
      !channel.isTextBased() ||
      !channel.isSendable()
    ) {
      console.error(
        `[VOUCH] Cannot send to channel ${channelId}.`
      );

      return interaction.reply({
        content:
          "I couldn't access the correct vouch channel. Please contact staff.",
        ephemeral: true
      });
    }

    // Check the bot's channel permissions.
    const botMember =
      await interaction.guild.members.fetchMe();

    const permissions =
      channel.permissionsFor(botMember);

    if (
      !permissions ||
      !permissions.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks
      ])
    ) {
      return interaction.reply({
        content:
          "The bot needs View Channel, Send Messages, and Embed Links permissions in the destination channel.",
        ephemeral: true
      });
    }

    // Build the pink vouch embed.
    // The seller is displayed using the decorative lowercase name.
    const embed = new EmbedBuilder()
      .setColor(0xffb6d9)
      .setTitle("NEW VOUCH")
      .setDescription(
        `Thank you for leaving a vouch!\n\n` +
        `**Seller:** ${sellerData.name}\n` +
        `**Buyer:** ${interaction.user}\n` +
        `**Rating:** ${"⭐".repeat(rating)} (${rating}/5)\n` +
        `**Order:** ${order.trim()}`
      )
      .setImage(proof.url)
      .setFooter({
        text:
          `Vouch submitted by ${interaction.user.username}`
      })
      .setTimestamp();

    // Send the embed to the correct channel only.
    const vouchMessage = await channel.send({
      embeds: [embed]
    });

    // Add the thank-you reaction.
    try {
      await vouchMessage.react(THANK_YOU_EMOJI);
    } catch (error) {
      console.error(
        "[VOUCH] Could not add thank-you reaction:",
        error
      );
    }

    return interaction.reply({
      content:
        `Your vouch for ${sellerData.name} was submitted successfully!`,
      ephemeral: true
    });

  } catch (error) {
    console.error(
      "[VOUCH] Submission error:",
      error
    );

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
// CONNECT VOUCH SYSTEM TO THE BOT
// ==================================================

module.exports = function (client) {
  client.once("ready", async () => {
    await registerVouch(client);
  });

  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== "vouch") return;

    await submitVouch(interaction);
  });
};
