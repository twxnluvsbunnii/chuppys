
"use strict";

// ============================================================
// CHUPPYS VOUCH SYSTEM — DISCORD.JS V14 / RENDER
// COMPLETE REPLACEMENT VOUCH.JS
// ============================================================
//
// CATEGORIES:
// /vouch market
// /vouch giveaway
// /vouch invite
// /vouch converter
//
// NEW:
// - Converter Fees category
// - Converter limited to bunnii and twxn
// - Conversion description and fee fields
// - Converter vouches use personal channel by default
// - Dance emoji removed from posted vouch embeds
// - Dance emoji removed from success messages
// - Dance emoji added to slash category descriptions
//
// PRESERVED:
// - All 12 original market sellers
// - Purchase / Cash Out selection
// - Separate giveaway and invite channels
// - Client role requirement
// - Self-vouch protection
// - Rating 1–5
// - Required image proof
// - White NEW VOUCH embeds
// - Original bear thumbnail
// - Large proof image
// - Thank-you message
// - Private success and error responses
// - Existing exported helpers
// - index.js handles reactions and counters
//
// ============================================================
// IMPORTS
// ============================================================

const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  Events
} = require("discord.js");

// ============================================================
// BASIC CONFIGURATION
// ============================================================

const BRAND = ".gg/chuppys";

const WHITE = 0xffffff;

const EPHEMERAL = MessageFlags.Ephemeral;

// ============================================================
// CATEGORY EMOJI
// ============================================================
//
// Used in slash-command category descriptions ONLY.
//
// No dance emoji is inserted into a posted vouch,
// its type field, or its success confirmation.
//
// Discord may display custom emoji syntax as plain
// text in command descriptions on some clients.
//
// ============================================================

const CATEGORY_EMOJI =
  "<:zymochadance:1565501941675462719>";

// ============================================================
// ORIGINAL BEAR THUMBNAIL
// ============================================================

const BEAR_EMOJI_ID =
  "1561197586554036318";

const BEAR_THUMBNAIL_URL =
  `https://cdn.discordapp.com/emojis/${BEAR_EMOJI_ID}.png?size=128&quality=lossless`;

// ============================================================
// CLIENT ROLE
// ============================================================

const CLIENT_ROLE_ID =
  "1550373434301878282";

// ============================================================
// VOUCH CHANNELS
// ============================================================

// bunnii and twxn market vouches.
const PERSONAL_VOUCH_CHANNEL_ID =
  "1562227276051910676";

// Other market sellers.
const MARKET_VOUCH_CHANNEL_ID =
  "1530811494168657980";

// Giveaway.
const GIVEAWAY_VOUCH_CHANNEL_ID =
  "1572974320781885450";

// Invite Challenge.
const INVITE_VOUCH_CHANNEL_ID =
  "1572972324930724041";

// ============================================================
// CONVERTER FEES CHANNEL
// ============================================================
//
// Uses the personal vouch channel by default.
//
// To use a separate converter channel, add this
// environment variable on Render:
//
// CONVERTER_VOUCH_CHANNEL_ID=YOUR_CHANNEL_ID
//
// Or replace the fallback ID below.
//
// ============================================================

const CONVERTER_VOUCH_CHANNEL_ID =
  process.env.CONVERTER_VOUCH_CHANNEL_ID ||
  PERSONAL_VOUCH_CHANNEL_ID;

// ============================================================
// CHANNEL EXPORTS
// ============================================================

const CHANNELS = Object.freeze({
  personal: PERSONAL_VOUCH_CHANNEL_ID,
  market: MARKET_VOUCH_CHANNEL_ID,
  giveaway: GIVEAWAY_VOUCH_CHANNEL_ID,
  invite: INVITE_VOUCH_CHANNEL_ID,
  converter: CONVERTER_VOUCH_CHANNEL_ID
});

// ============================================================
// ORIGINAL 12 SELLERS — PRESERVED
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
// SPECIAL HOSTS
// ============================================================
//
// Only bunnii and twxn can receive:
//
// Giveaway
// Invite Challenge
// Converter Fees
//
// ============================================================

const SPECIAL_HOSTS =
  SELLERS.filter(seller => seller.personal);

// ============================================================
// VOUCH TYPES
// ============================================================

const VOUCH_TYPES = Object.freeze({
  MARKET: "market",
  GIVEAWAY: "giveaway",
  INVITE: "invite",
  CONVERTER: "converter"
});

const MARKET_TRANSACTIONS = Object.freeze({
  PURCHASE: "purchase",
  CASHOUT: "cashout"
});

// ============================================================
// SELLER HELPERS
// ============================================================

function getSeller(sellerId) {
  return SELLERS.find(
    seller => seller.id === sellerId
  ) || null;
}

function isSpecialHost(sellerId) {
  return SPECIAL_HOSTS.some(
    seller => seller.id === sellerId
  );
}

function sellerChoices(sellers) {
  return sellers.map(seller => ({
    name: seller.name,
    value: seller.id
  }));
}

// ============================================================
// SAFE USER INPUT
// ============================================================

function safeText(value, max = 500) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .trim()
    .slice(0, max);
}

// ============================================================
// PRIVATE RESPONSE
// ============================================================

async function replyPrivate(interaction, payload) {
  const data =
    typeof payload === "string"
      ? { content: payload }
      : { ...payload };

  data.allowedMentions = {
    parse: []
  };

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
// IMAGE PROOF VALIDATION
// ============================================================

function isValidProof(proof) {
  if (!proof?.url) {
    return false;
  }

  const contentType =
    String(proof.contentType || "").toLowerCase();

  const filename =
    String(proof.name || "");

  const validExtension =
    /\.(png|jpg|jpeg|gif|webp)$/i.test(filename);

  if (contentType) {
    return (
      [
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp"
      ].includes(contentType) &&
      (!filename.includes(".") || validExtension)
    );
  }

  return validExtension;
}

// ============================================================
// CORRECT DESTINATION CHANNEL
// ============================================================

function getVouchChannelId(sellerId, vouchType) {
  const seller = getSeller(sellerId);

  if (!seller) {
    throw new Error(
      "That seller is not in the seller list."
    );
  }

  // Market: personal or regular channel.

  if (vouchType === VOUCH_TYPES.MARKET) {
    return seller.personal
      ? PERSONAL_VOUCH_CHANNEL_ID
      : MARKET_VOUCH_CHANNEL_ID;
  }

  // All remaining categories are special-host only.

  if (!isSpecialHost(sellerId)) {
    throw new Error(
      "Only bunnii and twxn can receive " +
      "Giveaway, Invite Challenge, or Converter Fees vouches."
    );
  }

  if (vouchType === VOUCH_TYPES.GIVEAWAY) {
    return GIVEAWAY_VOUCH_CHANNEL_ID;
  }

  if (vouchType === VOUCH_TYPES.INVITE) {
    return INVITE_VOUCH_CHANNEL_ID;
  }

  if (vouchType === VOUCH_TYPES.CONVERTER) {
    return CONVERTER_VOUCH_CHANNEL_ID;
  }

  throw new Error("Invalid vouch category.");
}

// ============================================================
// SLASH COMMAND
// ============================================================

const vouchCommand =
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription(
      "Submit a Chuppys Market, Giveaway, Invite, or Converter vouch."
    )

    // ======================================================
    // MARKET
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("market")
        .setDescription(
          `${CATEGORY_EMOJI} Market Purchase or Cash Out vouch.`
        )

        .addStringOption(option =>
          option
            .setName("seller")
            .setDescription(
              "Choose the seller you purchased from or cashed out with."
            )
            .setRequired(true)
            .addChoices(
              ...sellerChoices(SELLERS)
            )
        )

        .addStringOption(option =>
          option
            .setName("transaction")
            .setDescription(
              "Choose Purchase or Cash Out."
            )
            .setRequired(true)
            .addChoices(
              {
                name: "Purchase",
                value: MARKET_TRANSACTIONS.PURCHASE
              },
              {
                name: "Cash Out",
                value: MARKET_TRANSACTIONS.CASHOUT
              }
            )
        )

        .addStringOption(option =>
          option
            .setName("items")
            .setDescription(
              "What did you purchase or cash out?"
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(500)
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

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload a screenshot of your transaction."
            )
            .setRequired(true)
        )
    )

    // ======================================================
    // GIVEAWAY
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("giveaway")
        .setDescription(
          `${CATEGORY_EMOJI} Giveaway reward vouch.`
        )

        .addStringOption(option =>
          option
            .setName("host")
            .setDescription(
              "Choose bunnii or twxn."
            )
            .setRequired(true)
            .addChoices(
              ...sellerChoices(SPECIAL_HOSTS)
            )
        )

        .addIntegerOption(option =>
          option
            .setName("rating")
            .setDescription(
              "Rate your giveaway experience from 1 to 5."
            )
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
        )

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload proof that you received your giveaway."
            )
            .setRequired(true)
        )
    )

    // ======================================================
    // INVITE CHALLENGE
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("invite")
        .setDescription(
          `${CATEGORY_EMOJI} Invite Challenge reward vouch.`
        )

        .addStringOption(option =>
          option
            .setName("host")
            .setDescription(
              "Choose bunnii or twxn."
            )
            .setRequired(true)
            .addChoices(
              ...sellerChoices(SPECIAL_HOSTS)
            )
        )

        .addIntegerOption(option =>
          option
            .setName("rating")
            .setDescription(
              "Rate your Invite Challenge experience."
            )
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
        )

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload proof of your Invite Challenge reward."
            )
            .setRequired(true)
        )
    )

    // ======================================================
    // CONVERTER FEES — NEW CATEGORY
    // ======================================================
    //
    // Only bunnii and twxn.
    //
    // Required:
    // - Converter
    // - Conversion details
    // - Fee paid
    // - Rating
    // - Proof image
    //
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("converter")
        .setDescription(
          `${CATEGORY_EMOJI} Converter Fees vouch.`
        )

        .addStringOption(option =>
          option
            .setName("converter")
            .setDescription(
              "Choose bunnii or twxn as your converter."
            )
            .setRequired(true)
            .addChoices(
              ...sellerChoices(SPECIAL_HOSTS)
            )
        )

        .addStringOption(option =>
          option
            .setName("conversion")
            .setDescription(
              "What payment or currency did you convert?"
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(500)
        )

        .addStringOption(option =>
          option
            .setName("fee")
            .setDescription(
              "What converter fee did you pay? Example: $2"
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100)
        )

        .addIntegerOption(option =>
          option
            .setName("rating")
            .setDescription(
              "Rate your conversion experience from 1 to 5."
            )
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
        )

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload a screenshot proving your conversion."
            )
            .setRequired(true)
        )
    );

// ============================================================
// REGISTER COMMAND WITHOUT REMOVING OTHER COMMANDS
// ============================================================

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
        "[VOUCH] Existing guild /vouch updated."
      );
    } else {
      await guild.commands.create(
        vouchCommand.toJSON()
      );

      console.log(
        "[VOUCH] Guild /vouch created."
      );
    }

    console.log(
      "[VOUCH] Market, Giveaway, Invite and Converter enabled."
    );

    console.log(
      `[VOUCH] ${SELLERS.length} market sellers preserved.`
    );

    console.log(
      "[VOUCH] Special hosts: bunnii and twxn."
    );

    console.log(
      `[VOUCH] Converter channel: ${CONVERTER_VOUCH_CHANNEL_ID}`
    );

  } catch (error) {
    console.error(
      "[VOUCH] Registration failed:",
      error
    );
  }
}

// ============================================================
// MEMBER ROLE VALIDATION
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
// CLIENT REQUIRED EMBED
// ============================================================

function makeClientRequiredEmbed() {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setDescription(
      "You need the **client** role to submit a vouch!\n\n" +
      "Thank you for shopping at **.gg/chuppys**.\n\n" +
      "Please visit the client verification message " +
      "and click the **client** button to receive your role.\n\n" +
      "Once verified, you can use `/vouch`."
    )
    .setFooter({
      text: BRAND
    });
}

// ============================================================
// VALIDATE VOUCH
// ============================================================

function validateVouch({
  sellerId,
  userId,
  rating,
  proof,
  vouchType,
  transaction,
  items,
  conversion,
  fee
}) {
  const seller = getSeller(sellerId);

  if (!seller) {
    throw new Error(
      "That seller or host is not in the seller list."
    );
  }

  // Self-vouch protection.

  if (sellerId === userId) {
    throw new Error(
      "You cannot submit a vouch for yourself."
    );
  }

  // Rating validation.

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error(
      "Your rating must be between 1 and 5."
    );
  }

  // Image validation.

  if (!isValidProof(proof)) {
    throw new Error(
      "Please attach a PNG, JPG, JPEG, GIF, or WEBP image as proof."
    );
  }

  // Category validation.

  if (
    !Object.values(VOUCH_TYPES).includes(vouchType)
  ) {
    throw new Error(
      "Invalid vouch category."
    );
  }

  // Market validation.

  if (vouchType === VOUCH_TYPES.MARKET) {
    if (
      !Object.values(MARKET_TRANSACTIONS)
        .includes(transaction)
    ) {
      throw new Error(
        "Choose Purchase or Cash Out."
      );
    }

    if (
      !items ||
      !items.trim() ||
      items.length > 500
    ) {
      throw new Error(
        "Enter the items purchased or cashed out."
      );
    }
  }

  // Restricted categories.

  if (
    vouchType !== VOUCH_TYPES.MARKET &&
    !isSpecialHost(sellerId)
  ) {
    throw new Error(
      "Only bunnii and twxn can receive " +
      "Giveaway, Invite, and Converter Fees vouches."
    );
  }

  // Converter validation.

  if (vouchType === VOUCH_TYPES.CONVERTER) {
    if (
      !conversion ||
      !conversion.trim() ||
      conversion.length > 500
    ) {
      throw new Error(
        "Please describe what you converted."
      );
    }

    if (
      !fee ||
      !fee.trim() ||
      fee.length > 100
    ) {
      throw new Error(
        "Please enter the converter fee you paid."
      );
    }
  }

  return seller;
}

// ============================================================
// VOUCH TYPE DISPLAY
// ============================================================

function getVouchTypeName(vouchType, transaction) {
  if (vouchType === VOUCH_TYPES.GIVEAWAY) {
    return "Giveaway";
  }

  if (vouchType === VOUCH_TYPES.INVITE) {
    return "Invite Challenge";
  }

  if (vouchType === VOUCH_TYPES.CONVERTER) {
    return "Converter Fees";
  }

  if (
    transaction === MARKET_TRANSACTIONS.CASHOUT
  ) {
    return "Market Cash Out";
  }

  return "Market Purchase";
}

// ============================================================
// CREATE WHITE VOUCH EMBED
// ============================================================
//
// No zymochadance emoji is present here.
//
// ============================================================

function makeVouchEmbed({
  sellerId,
  userId,
  rating,
  proof,
  vouchType,
  transaction,
  items,
  conversion,
  fee
}) {
  const proofFilename =
    safeText(proof.name || "Vouch proof", 200);

  const typeName =
    getVouchTypeName(vouchType, transaction);

  let description = "";

  // ========================================================
  // MARKET
  // ========================================================

  if (vouchType === VOUCH_TYPES.MARKET) {
    description +=
      `**seller:** <@${sellerId}>\n` +
      `**buyer:** <@${userId}>\n` +
      `**vouch type:** ${typeName}\n`;

    if (
      transaction === MARKET_TRANSACTIONS.PURCHASE
    ) {
      description +=
        `**items purchased:** ${safeText(items)}\n`;
    } else {
      description +=
        `**items cashed out:** ${safeText(items)}\n`;
    }
  }

  // ========================================================
  // GIVEAWAY
  // ========================================================

  if (vouchType === VOUCH_TYPES.GIVEAWAY) {
    description +=
      `**host:** <@${sellerId}>\n` +
      `**vouched by:** <@${userId}>\n` +
      `**vouch type:** Giveaway\n`;
  }

  // ========================================================
  // INVITE CHALLENGE
  // ========================================================

  if (vouchType === VOUCH_TYPES.INVITE) {
    description +=
      `**host:** <@${sellerId}>\n` +
      `**vouched by:** <@${userId}>\n` +
      `**vouch type:** Invite Challenge\n`;
  }

  // ========================================================
  // CONVERTER FEES
  // ========================================================

  if (vouchType === VOUCH_TYPES.CONVERTER) {
    description +=
      `**converter:** <@${sellerId}>\n` +
      `**customer:** <@${userId}>\n` +
      `**vouch type:** Converter Fees\n` +
      `**converted:** ${safeText(conversion)}\n` +
      `**converter fee:** ${safeText(fee, 100)}\n`;
  }

  // ========================================================
  // RATING, PROOF, AND THANK YOU
  // ========================================================

  description +=
    `**rating:** ${rating}/5\n` +
    `**proof:** 📎 ${proofFilename}\n\n` +
    "*thank you for vouching! shop again ♡*";

  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle("NEW VOUCH")
    .setDescription(description)
    .setThumbnail(BEAR_THUMBNAIL_URL)
    .setImage(proof.url)
    .setTimestamp();
}

// ============================================================
// DESTINATION CHANNEL AND BOT PERMISSIONS
// ============================================================

async function getDestinationChannel(
  interaction,
  sellerId,
  vouchType
) {
  const channelId =
    getVouchChannelId(sellerId, vouchType);

  const channel =
    await interaction.guild.channels.fetch(
      channelId
    );

  if (
    !channel ||
    !channel.isTextBased() ||
    typeof channel.send !== "function"
  ) {
    throw new Error(
      "I couldn't access the correct vouch channel."
    );
  }

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
      "The bot needs View Channel, Send Messages, " +
      "Embed Links, and Attach Files permissions " +
      "in the destination vouch channel."
    );
  }

  return channel;
}

// ============================================================
// PROCESS VOUCH
// ============================================================

async function submitVouch(interaction) {
  try {
    // ======================================================
    // GUILD ONLY
    // ======================================================

    if (!interaction.inGuild()) {
      return replyPrivate(
        interaction,
        "You can only submit vouches inside the server."
      );
    }

    // Acknowledge immediately to avoid interaction timeout.

    await interaction.deferReply({
      flags: EPHEMERAL
    });

    // ======================================================
    // CLIENT ROLE CHECK
    // ======================================================

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
      return replyPrivate(interaction, {
        embeds: [
          makeClientRequiredEmbed()
        ]
      });
    }

    // ======================================================
    // CATEGORY
    // ======================================================

    const vouchType =
      interaction.options.getSubcommand(true);

    if (
      !Object.values(VOUCH_TYPES).includes(vouchType)
    ) {
      throw new Error(
        "Invalid vouch category."
      );
    }

    // ======================================================
    // SELLER / HOST / CONVERTER
    // ======================================================

    let sellerId;

    if (vouchType === VOUCH_TYPES.MARKET) {
      sellerId =
        interaction.options.getString(
          "seller",
          true
        );
    } else if (
      vouchType === VOUCH_TYPES.CONVERTER
    ) {
      sellerId =
        interaction.options.getString(
          "converter",
          true
        );
    } else {
      sellerId =
        interaction.options.getString(
          "host",
          true
        );
    }

    // ======================================================
    // RATING AND PROOF
    // ======================================================

    const rating =
      interaction.options.getInteger(
        "rating",
        true
      );

    const proof =
      interaction.options.getAttachment(
        "proof",
        true
      );

    // ======================================================
    // OPTIONAL CATEGORY-SPECIFIC VALUES
    // ======================================================

    let transaction = null;
    let items = null;
    let conversion = null;
    let fee = null;

    if (vouchType === VOUCH_TYPES.MARKET) {
      transaction =
        interaction.options.getString(
          "transaction",
          true
        );

      items =
        interaction.options.getString(
          "items",
          true
        ).trim();
    }

    if (
      vouchType === VOUCH_TYPES.CONVERTER
    ) {
      conversion =
        interaction.options.getString(
          "conversion",
          true
        ).trim();

      fee =
        interaction.options.getString(
          "fee",
          true
        ).trim();
    }

    // ======================================================
    // VALIDATE
    // ======================================================

    const seller =
      validateVouch({
        sellerId,
        userId: interaction.user.id,
        rating,
        proof,
        vouchType,
        transaction,
        items,
        conversion,
        fee
      });

    // ======================================================
    // GET CHANNEL
    // ======================================================

    const channel =
      await getDestinationChannel(
        interaction,
        sellerId,
        vouchType
      );

    // ======================================================
    // BUILD EMBED
    // ======================================================

    const embed =
      makeVouchEmbed({
        sellerId,
        userId: interaction.user.id,
        rating,
        proof,
        vouchType,
        transaction,
        items,
        conversion,
        fee
      });

    // ======================================================
    // SEND
    // ======================================================

    const vouchMessage =
      await channel.send({
        embeds: [
          embed
        ],
        allowedMentions: {
          parse: []
        }
      });

    // ======================================================
    // SUCCESS LOGGING
    // ======================================================

    const typeName =
      getVouchTypeName(
        vouchType,
        transaction
      );

    console.log(
      `[VOUCH] ${typeName} successfully posted.`
    );

    console.log(
      `[VOUCH] Message: ${vouchMessage.id}`
    );

    console.log(
      `[VOUCH] Channel: ${channel.id}`
    );

    console.log(
      `[VOUCH] Submitted by: ${interaction.user.id}`
    );

    console.log(
      `[VOUCH] Seller/Host/Converter: ${sellerId}`
    );

    // ======================================================
    // PRIVATE SUCCESS RESPONSE
    // ======================================================
    //
    // No dance emoji in confirmation.
    //
    // ======================================================

    return replyPrivate(interaction, {
      content:
        `Your **${typeName}** vouch ` +
        `for ${seller.name} was submitted successfully! ♡\n\n` +
        `**Sent to:** <#${channel.id}>`
    });

  } catch (error) {
    console.error(
      "[VOUCH] Submission failed:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred.";

    return replyPrivate(interaction, {
      content:
        "Your vouch could not be submitted.\n\n" +
        safeText(errorMessage, 700)
    }).catch(console.error);
  }
}

// ============================================================
// SETUP VOUCH SYSTEM
// ============================================================

function setupVouch(client) {
  if (client.__chuppysVouchLoaded) {
    console.log(
      "[VOUCH] System already loaded."
    );

    return;
  }

  client.__chuppysVouchLoaded = true;

  // ========================================================
  // REGISTER ON READY
  // ========================================================

  if (client.isReady()) {
    void registerVouch(client);
  } else {
    client.once(
      Events.ClientReady,
      async () => {
        await registerVouch(client);
      }
    );
  }

  // ========================================================
  // INTERACTION HANDLER
  // ========================================================

  client.on(
    Events.InteractionCreate,
    async interaction => {
      if (!interaction.isChatInputCommand()) {
        return;
      }

      if (interaction.commandName !== "vouch") {
        return;
      }

      console.log(
        "[VOUCH] /vouch interaction received."
      );

      await submitVouch(interaction);
    }
  );

  // ========================================================
  // STARTUP LOGS
  // ========================================================

  console.log(
    "[VOUCH] Chuppys Vouch System loaded."
  );

  console.log(
    "[VOUCH] Market enabled."
  );

  console.log(
    "[VOUCH] Giveaway enabled."
  );

  console.log(
    "[VOUCH] Invite Challenge enabled."
  );

  console.log(
    "[VOUCH] Converter Fees enabled."
  );

  console.log(
    "[VOUCH] Original 12 sellers preserved."
  );

  console.log(
    "[VOUCH] bunnii/twxn restrictions enabled."
  );

  console.log(
    "[VOUCH] Client role protection enabled."
  );

  console.log(
    "[VOUCH] White vouch embeds preserved."
  );

  console.log(
    "[VOUCH] Dance emoji removed from vouch content."
  );

  console.log(
    "[VOUCH] Category descriptions configured."
  );

  console.log(
    "[VOUCH] All destination channels configured."
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = setupVouch;

module.exports.VOUCH_CHANNEL_IDS =
  CHANNELS;

module.exports.SELLERS =
  SELLERS;

module.exports.SPECIAL_HOSTS =
  SPECIAL_HOSTS;

module.exports.VOUCH_TYPES =
  VOUCH_TYPES;

module.exports.MARKET_TRANSACTIONS =
  MARKET_TRANSACTIONS;

module.exports.getSeller =
  getSeller;

module.exports.getVouchChannelId =
  getVouchChannelId;

// ============================================================
// END OF CHUPPYS VOUCH.JS
// ============================================================
