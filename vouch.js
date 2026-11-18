
"use strict";

const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  Events
} = require("discord.js");

// ============================================================
// CHUPPYS VOUCH SYSTEM — DISCORD.JS V14 / RENDER
// ============================================================
//
// RESTORED ORIGINAL VOUCH APPEARANCE:
//
// WHITE EMBED
// NEW VOUCH
// SELLER
// BUYER
// ITEMS PURCHASED
// RATING
// PROOF
// THANK YOU MESSAGE
// BEAR THUMBNAIL
// LARGE PROOF IMAGE
// TIMESTAMP
//
// PRESERVED:
//
// /vouch
// Seller dropdown
// Client role requirement
// Personal vouch channel
// Regular vouch channel
// Seller ID mapping
// Proof attachment
// Rating from 1 to 5
//
// This file only handles /vouch.
//
// index.js continues handling:
//
// Vouch reactions
// Vouch counters
// Other slash commands
//
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const BRAND = ".gg/chuppys";

const WHITE = 0xffffff;

const EPHEMERAL = MessageFlags.Ephemeral;

// ============================================================
// VOUCH CHANNELS
// ============================================================

const PERSONAL_VOUCH_CHANNEL_ID =
  "1562227276051910676";

const VOUCH_CHANNEL_ID =
  "1530811494168657980";

// ============================================================
// VOUCH THUMBNAIL — ORIGINAL BEAR
// ============================================================

const VOUCH_EMOJI_ID =
  "1561197586554036318";

const VOUCH_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${VOUCH_EMOJI_ID}.png?size=128&quality=lossless`;

// index.js handles the bear reaction.
// Do not react here a second time.

// ============================================================
// CLIENT ROLE REQUIREMENT
// ============================================================

const CLIENT_ROLE_ID =
  "1550373434301878282";

// ============================================================
// SELLERS — ORIGINAL LIST PRESERVED
// ============================================================

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
    name: "﹕𐔌・mira 〃・꒱",
    personal: false
  },

  {
    id: "1269188505935024141",
    name: "﹕𐔌・maya 〃・꒱",
    personal: false
  },

  {
    id: "1328450205774909441",
    name: "﹕𐔌・alex 〃・꒱",
    personal: false
  },

  {
    id: "1475237851414401105",
    name: "﹕𐔌・replusive 〃・꒱",
    personal: false
  }
];

// ============================================================
// SELLER LOOKUP
// ============================================================

function getSeller(sellerId) {
  return SELLERS.find(
    seller => seller.id === sellerId
  ) || null;
}

// ============================================================
// CHOOSE VOUCH CHANNEL
// ============================================================

function getVouchChannelId(sellerId) {
  const seller = getSeller(sellerId);

  if (!seller) {
    throw new Error(
      "That seller is not in the seller list."
    );
  }

  return seller.personal
    ? PERSONAL_VOUCH_CHANNEL_ID
    : VOUCH_CHANNEL_ID;
}

// ============================================================
// SAFE TEXT
// ============================================================

function safeText(value, max = 500) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .trim()
    .slice(0, max);
}

// ============================================================
// EPHEMERAL RESPONSE HELPER
// ============================================================

async function replyPrivate(interaction, payload) {
  const data =
    typeof payload === "string"
      ? { content: payload }
      : payload;

  if (interaction.deferred) {
    return interaction.editReply(data);
  }

  if (interaction.replied) {
    return interaction.followUp({
      ...data,
      flags: EPHEMERAL
    });
  }

  return interaction.reply({
    ...data,
    flags: EPHEMERAL
  });
}

// ============================================================
// /VOUCH SLASH COMMAND
// ============================================================

const vouchCommand = new SlashCommandBuilder()
  .setName("vouch")
  .setDescription(
    "Leave a vouch for a seller."
  )

  .addStringOption(option =>
    option
      .setName("seller")
      .setDescription(
        "Choose the seller you purchased from."
      )
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
      .setDescription(
        "Rate your experience from 1 to 5."
      )
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(5)
  )

  .addStringOption(option =>
    option
      .setName("order")
      .setDescription(
        "Describe what you purchased."
      )
      .setRequired(true)
      .setMaxLength(500)
  )

  .addAttachmentOption(option =>
    option
      .setName("proof")
      .setDescription(
        "Upload an image as proof of your order."
      )
      .setRequired(true)
  );

// ============================================================
// REGISTER /VOUCH WITHOUT REPLACING OTHER COMMANDS
// ============================================================

async function registerVouch(client) {
  try {
    const guildId =
      process.env.DISCORD_GUILD_ID ||
      process.env.GUILD_ID;

    if (!guildId) {
      console.error(
        "[VOUCH] DISCORD_GUILD_ID is missing."
      );

      return;
    }

    const guild =
      await client.guilds.fetch(guildId);

    const commands =
      await guild.commands.fetch();

    const existing =
      commands.find(
        command => command.name === "vouch"
      );

    if (existing) {
      await guild.commands.edit(
        existing.id,
        vouchCommand.toJSON()
      );

      console.log(
        "[VOUCH] Existing /vouch command updated."
      );
    } else {
      await guild.commands.create(
        vouchCommand.toJSON()
      );

      console.log(
        "[VOUCH] /vouch command registered."
      );
    }

    console.log(
      `[VOUCH] ${SELLERS.length} sellers available.`
    );

    console.log(
      "[VOUCH] White embed style enabled."
    );

    console.log(
      "[VOUCH] Client role requirement enabled."
    );

    console.log(
      "[VOUCH] Personal and regular vouch channels enabled."
    );

  } catch (error) {
    console.error(
      "[VOUCH] Registration failed:",
      error
    );
  }
}

// ============================================================
// CHECK CLIENT ROLE
// ============================================================

async function getClientMember(interaction) {
  if (!interaction.inGuild()) {
    return null;
  }

  return interaction.guild.members.fetch({
    user: interaction.user.id,
    force: true
  });
}

// ============================================================
// CLIENT ROLE DENIAL EMBED
// ============================================================

function makeClientRequiredEmbed() {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setDescription(
      "You need the **client** role to submit a vouch!\n\n" +
      "Thank you for shopping at **.gg/chuppys**.\n\n" +
      "Please visit the client verification message " +
      "and click the **client** button to receive your role.\n\n" +
      "Once you have the role, you can use `/vouch` successfully."
    )
    .setFooter({
      text: BRAND
    });
}

// ============================================================
// IMAGE VALIDATION
// ============================================================

function isValidProof(proof) {
  if (!proof?.url) {
    return false;
  }

  const contentType =
    proof.contentType || "";

  const filename =
    proof.name || "";

  return (
    contentType.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp)$/i.test(filename)
  );
}

// ============================================================
// BUILD ORIGINAL WHITE VOUCH EMBED
// ============================================================

function makeVouchEmbed({
  sellerId,
  buyer,
  rating,
  order,
  proof
}) {
  const proofFilename =
    safeText(
      proof.name || "Purchase proof",
      200
    );

  const description =
    `**seller:** <@${sellerId}>\n` +
    `**buyer:** <@${buyer.id}>\n` +
    `**items purchased:** ${safeText(order)}\n` +
    `**rating:** ${rating}/5\n` +
    `**proof:** 📎 ${proofFilename}\n\n` +
    "*thank you for vouching! shop again ♡*";

  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle("NEW VOUCH")
    .setDescription(description)
    .setThumbnail(VOUCH_EMOJI_URL)
    .setImage(proof.url)
    .setTimestamp();
}

// ============================================================
// PROCESS /VOUCH
// ============================================================

async function submitVouch(interaction) {
  try {

    // ========================================================
    // SERVER CHECK
    // ========================================================

    if (!interaction.inGuild()) {
      return replyPrivate(
        interaction,
        "You can only submit a vouch inside the server."
      );
    }

    // Acknowledge promptly before making Discord API calls.

    await interaction.deferReply({
      flags: EPHEMERAL
    });

    // ========================================================
    // CLIENT ROLE CHECK
    // ========================================================

    const member =
      await getClientMember(interaction);

    if (!member) {
      throw new Error(
        "I couldn't verify your server membership."
      );
    }

    if (
      !member.roles.cache.has(CLIENT_ROLE_ID)
    ) {
      console.log(
        `[VOUCH] Non-client blocked: ${interaction.user.tag}`
      );

      return replyPrivate(
        interaction,
        {
          embeds: [
            makeClientRequiredEmbed()
          ]
        }
      );
    }

    // ========================================================
    // GET COMMAND OPTIONS
    // ========================================================

    const sellerId =
      interaction.options.getString(
        "seller",
        true
      );

    const rating =
      interaction.options.getInteger(
        "rating",
        true
      );

    const order =
      interaction.options.getString(
        "order",
        true
      );

    const proof =
      interaction.options.getAttachment(
        "proof",
        true
      );

    // ========================================================
    // VALIDATE SELLER
    // ========================================================

    const seller =
      getSeller(sellerId);

    if (!seller) {
      throw new Error(
        "That seller is not in the seller list."
      );
    }

    // ========================================================
    // VALIDATE RATING
    // ========================================================

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      throw new Error(
        "Rating must be between 1 and 5."
      );
    }

    // ========================================================
    // VALIDATE ORDER
    // ========================================================

    if (
      !order ||
      !order.trim() ||
      order.length > 500
    ) {
      throw new Error(
        "Please enter a valid order description."
      );
    }

    // ========================================================
    // VALIDATE PROOF
    // ========================================================

    if (!isValidProof(proof)) {
      throw new Error(
        "Please attach a PNG, JPG, GIF, or WEBP image as proof."
      );
    }

    // ========================================================
    // PREVENT SELF-VOUCHING
    // ========================================================

    if (
      sellerId === interaction.user.id
    ) {
      throw new Error(
        "You cannot submit a vouch for yourself."
      );
    }

    // ========================================================
    // FIND VOUCH CHANNEL
    // ========================================================

    const channelId =
      getVouchChannelId(sellerId);

    const channel =
      await interaction.client.channels.fetch(
        channelId
      );

    if (
      !channel ||
      !channel.isTextBased() ||
      !channel.isSendable()
    ) {
      throw new Error(
        "I couldn't access the correct vouch channel."
      );
    }

    // ========================================================
    // CHECK BOT PERMISSIONS
    // ========================================================

    const botMember =
      await interaction.guild.members.fetchMe();

    const permissions =
      channel.permissionsFor(botMember);

    const requiredPermissions = [
      PermissionsBitField.Flags.ViewChannel,

      PermissionsBitField.Flags.SendMessages,

      PermissionsBitField.Flags.EmbedLinks,

      PermissionsBitField.Flags.AttachFiles
    ];

    if (
      !permissions ||
      !permissions.has(requiredPermissions)
    ) {
      throw new Error(
        "I need View Channel, Send Messages, " +
        "Embed Links, and Attach Files permissions " +
        "in the vouch channel."
      );
    }

    // ========================================================
    // BUILD ORIGINAL WHITE EMBED
    // ========================================================

    const embed =
      makeVouchEmbed({
        sellerId,

        buyer: interaction.user,

        rating,

        order,

        proof
      });

    // ========================================================
    // SEND VOUCH
    // ========================================================

    const vouchMessage =
      await channel.send({
        embeds: [
          embed
        ],

        allowedMentions: {
          parse: []
        }
      });

    console.log(
      `[VOUCH] Vouch posted: ${vouchMessage.id}`
    );

    console.log(
      `[VOUCH] Buyer: ${interaction.user.id}`
    );

    console.log(
      `[VOUCH] Seller: ${sellerId}`
    );

    console.log(
      `[VOUCH] Channel: ${channelId}`
    );

    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    return replyPrivate(
      interaction,
      `Your vouch for ${seller.name} was submitted successfully! ♡`
    );

  } catch (error) {
    console.error(
      "[VOUCH] Submission failed:",
      error
    );

    return replyPrivate(
      interaction,
      {
        content:
          "Your vouch could not be submitted.\n\n" +
          safeText(error.message, 700)
      }
    ).catch(console.error);
  }
}

// ============================================================
// CONNECT VOUCH SYSTEM TO BOT
// ============================================================

module.exports = function setupVouch(client) {

  // ========================================================
  // REGISTER COMMAND ON READY
  // ========================================================

  client.once(
    Events.ClientReady,
    async () => {
      await registerVouch(client);
    }
  );

  // ========================================================
  // HANDLE /VOUCH INTERACTION
  // ========================================================

  client.on(
    Events.InteractionCreate,
    async interaction => {
      if (
        !interaction.isChatInputCommand()
      ) {
        return;
      }

      if (
        interaction.commandName !== "vouch"
      ) {
        return;
      }

      console.log(
        "[VOUCH] /vouch interaction received."
      );

      await submitVouch(interaction);
    }
  );

  console.log(
    "[VOUCH] Chuppys Vouch System loaded."
  );
};

// ============================================================
// END OF VOUCH.JS
// ============================================================
