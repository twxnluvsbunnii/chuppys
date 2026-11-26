
"use strict";

// ============================================================
// CHUPPYS VOUCH SYSTEM
// DISCORD.JS V14 / RENDER
// COMPLETE REPLACEMENT VOUCH.JS
// ============================================================
//
// VOUCH COMMANDS:
//
// /vouch market
// /vouch giveaway
// /vouch invite
// /vouch converter
//
// MARKET:
// - All original 12 sellers
// - Purchase / Cash Out selection
// - Required items description
// - Required rating 1–5
// - Required image proof
// - bunnii/twxn -> personal market channel
// - Other sellers -> regular market channel
//
// GIVEAWAY:
// - Only bunnii and twxn
// - Rating and image proof required
// - Separate giveaway channel
//
// INVITE CHALLENGE:
// - Only bunnii and twxn
// - Rating and image proof required
// - Separate invite challenge channel
//
// CONVERTER FEES:
// - Only bunnii and twxn
// - Required conversion details
// - Required converter fee
// - Required rating 1–5
// - Required image proof
// - Separate converter channel
// - Converter channel: 1573189115162402857
//
// EMBEDS:
// - White color
// - NEW VOUCH title
// - Original bear thumbnail
// - Large proof screenshot
// - Seller/host/converter mentions
// - Buyer/customer mentions
// - Rating
// - Proof filename
// - Thank-you message
// - Timestamp
// - No mocha dance emoji in posted vouches
//
// COMMAND CATEGORIES:
// - Mocha dance emoji in descriptions only
// - No emoji in actual subcommand names
//
// PROTECTION:
// - Client role required
// - Self-vouch prevention
// - Valid seller/host/converter checks
// - Rating validation
// - Required image proof
// - Bot permission checks
// - Private success/error responses
// - Immediate interaction acknowledgement
//
// COUNTERS:
// - index.js handles counters and reactions
// - This file does not increment counters
// - Converter vouches have their own channel
// - Counter integration will be added to index.js
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
// BASIC SETTINGS
// ============================================================

const BRAND = ".gg/chuppys";

const WHITE = 0xffffff;

const EPHEMERAL = MessageFlags.Ephemeral;

// ============================================================
// CATEGORY EMOJI
// ============================================================
//
// Discord slash-command names cannot contain
// custom emoji syntax.
//
// The emoji is placed in category descriptions.
//
// Discord may render the custom emoji syntax as
// plain text depending on the client.
//
// No dance emoji appears in the actual vouches.
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

// Other sellers' market vouches.

const MARKET_VOUCH_CHANNEL_ID =
  "1530811494168657980";

// Giveaway vouches.

const GIVEAWAY_VOUCH_CHANNEL_ID =
  "1572974320781885450";

// Invite Challenge vouches.

const INVITE_VOUCH_CHANNEL_ID =
  "1572972324930724041";

// NEW: Converter Fees vouches.

const CONVERTER_VOUCH_CHANNEL_ID =
  "1573189115162402857";

// ============================================================
// CHANNEL EXPORT CONFIGURATION
// ============================================================

const CHANNELS = Object.freeze({
  personal: PERSONAL_VOUCH_CHANNEL_ID,
  market: MARKET_VOUCH_CHANNEL_ID,
  giveaway: GIVEAWAY_VOUCH_CHANNEL_ID,
  invite: INVITE_VOUCH_CHANNEL_ID,
  converter: CONVERTER_VOUCH_CHANNEL_ID
});

// ============================================================
// ORIGINAL SELLER LIST — ALL 12 PRESERVED
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
    id: "1494800814303220018",
    name: "﹕𐔌・kitten 〃・꒱",
    personal: false
  }
];

// ============================================================
// SPECIAL HOSTS
// ============================================================
//
// Only bunnii and twxn appear in:
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
// SELLER LOOKUP
// ============================================================

function getSeller(sellerId) {
  return (
    SELLERS.find(
      seller => seller.id === sellerId
    ) || null
  );
}

// ============================================================
// SPECIAL HOST LOOKUP
// ============================================================

function isSpecialHost(sellerId) {
  return SPECIAL_HOSTS.some(
    seller => seller.id === sellerId
  );
}

// ============================================================
// SELLER OPTION CHOICES
// ============================================================

function sellerChoices(sellers) {
  return sellers.map(seller => ({
    name: seller.name,
    value: seller.id
  }));
}

// ============================================================
// SAFE TEXT
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
// PRIVATE RESPONSE HELPER
// ============================================================

async function replyPrivate(
  interaction,
  payload
) {
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
    String(proof.contentType || "")
      .toLowerCase();

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
      (
        !filename.includes(".") ||
        validExtension
      )
    );
  }

  return validExtension;
}

// ============================================================
// CHOOSE CORRECT VOUCH CHANNEL
// ============================================================

function getVouchChannelId(
  sellerId,
  vouchType
) {
  const seller =
    getSeller(sellerId);

  if (!seller) {
    throw new Error(
      "That seller is not in the seller list."
    );
  }

  // ========================================================
  // MARKET
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.MARKET
  ) {
    return seller.personal
      ? PERSONAL_VOUCH_CHANNEL_ID
      : MARKET_VOUCH_CHANNEL_ID;
  }

  // ========================================================
  // GIVEAWAY
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.GIVEAWAY
  ) {
    if (!isSpecialHost(sellerId)) {
      throw new Error(
        "Giveaway vouches can only be submitted " +
        "for bunnii or twxn."
      );
    }

    return GIVEAWAY_VOUCH_CHANNEL_ID;
  }

  // ========================================================
  // INVITE CHALLENGE
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.INVITE
  ) {
    if (!isSpecialHost(sellerId)) {
      throw new Error(
        "Invite Challenge vouches can only be " +
        "submitted for bunnii or twxn."
      );
    }

    return INVITE_VOUCH_CHANNEL_ID;
  }

  // ========================================================
  // CONVERTER FEES
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.CONVERTER
  ) {
    if (!isSpecialHost(sellerId)) {
      throw new Error(
        "Converter Fees vouches can only be " +
        "submitted for bunnii or twxn."
      );
    }

    return CONVERTER_VOUCH_CHANNEL_ID;
  }

  throw new Error(
    "Invalid vouch category."
  );
}

// ============================================================
// /VOUCH SLASH COMMAND
// ============================================================
//
// Categories:
//
// /vouch market
// /vouch giveaway
// /vouch invite
// /vouch converter
//
// ============================================================

const vouchCommand =
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription(
      "Submit a Chuppys Market, Giveaway, Invite, or Converter vouch."
    )

    // ======================================================
    // /VOUCH MARKET
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("market")
        .setDescription(
          `${CATEGORY_EMOJI} Market Purchase or Cash Out vouch.`
        )

        // All 12 sellers.

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

        // Purchase or Cash Out.

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

        // Items.

        .addStringOption(option =>
          option
            .setName("items")
            .setDescription(
              "Type what you purchased or cashed out."
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(500)
        )

        // Rating.

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

        // Proof.

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload a screenshot of your purchase or cash out."
            )
            .setRequired(true)
        )
    )

    // ======================================================
    // /VOUCH GIVEAWAY
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("giveaway")
        .setDescription(
          `${CATEGORY_EMOJI} Vouch for a Giveaway reward.`
        )

        // bunnii and twxn only.

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

        // Rating.

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

        // Proof.

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
    // /VOUCH INVITE
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("invite")
        .setDescription(
          `${CATEGORY_EMOJI} Vouch for an Invite Challenge reward.`
        )

        // bunnii and twxn only.

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

        // Rating.

        .addIntegerOption(option =>
          option
            .setName("rating")
            .setDescription(
              "Rate your Invite Challenge experience from 1 to 5."
            )
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
        )

        // Proof.

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
    // /VOUCH CONVERTER
    // ======================================================
    //
    // NEW CONVERTER FEES CATEGORY
    //
    // Only bunnii and twxn.
    //
    // Required:
    // - Converter
    // - Conversion details
    // - Fee
    // - Rating
    // - Proof
    //
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("converter")
        .setDescription(
          `${CATEGORY_EMOJI} Vouch for Converter Fees.`
        )

        // Converter.

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

        // Conversion details.

        .addStringOption(option =>
          option
            .setName("conversion")
            .setDescription(
              "What money or payment method did you convert?"
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(500)
        )

        // Converter fee.

        .addStringOption(option =>
          option
            .setName("fee")
            .setDescription(
              "How much was the converter fee? Example: $2"
            )
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100)
        )

        // Rating.

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

        // Proof.

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload a screenshot proving the conversion."
            )
            .setRequired(true)
        )
    );

// ============================================================
// REGISTER /VOUCH
// ============================================================
//
// Updates existing guild /vouch command.
//
// Does NOT delete or replace unrelated commands.
//
// ============================================================

async function registerVouch(client) {
  try {
    const guildId =
      process.env.DISCORD_GUILD_ID ||
      process.env.GUILD_ID;

    if (!guildId) {
      console.error(
        "[VOUCH] DISCORD_GUILD_ID or GUILD_ID is missing."
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
      "[VOUCH] Category-first commands enabled."
    );

    console.log(
      "[VOUCH] /vouch market enabled."
    );

    console.log(
      "[VOUCH] /vouch giveaway enabled."
    );

    console.log(
      "[VOUCH] /vouch invite enabled."
    );

    console.log(
      "[VOUCH] /vouch converter enabled."
    );

    console.log(
      `[VOUCH] ${SELLERS.length} market sellers available.`
    );

    console.log(
      "[VOUCH] Special hosts: bunnii and twxn."
    );

    console.log(
      `[VOUCH] Converter destination: ${CONVERTER_VOUCH_CHANNEL_ID}`
    );

  } catch (error) {
    console.error(
      "[VOUCH] Registration failed:",
      error
    );
  }
}

// ============================================================
// CLIENT ROLE CHECK
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
// VALIDATE VOUCH INFORMATION
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
  // Valid seller.

  const seller =
    getSeller(sellerId);

  if (!seller) {
    throw new Error(
      "That seller or host is not in the seller list."
    );
  }

  // Self-vouch prevention.

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
      "Rating must be between 1 and 5."
    );
  }

  // Required image proof.

  if (!isValidProof(proof)) {
    throw new Error(
      "Please attach a PNG, JPG, JPEG, GIF, or WEBP image as proof."
    );
  }

  // Valid category.

  if (
    !Object.values(VOUCH_TYPES).includes(
      vouchType
    )
  ) {
    throw new Error(
      "Invalid vouch category."
    );
  }

  // ========================================================
  // MARKET VALIDATION
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.MARKET
  ) {
    if (
      !Object.values(MARKET_TRANSACTIONS).includes(
        transaction
      )
    ) {
      throw new Error(
        "You must select Purchase or Cash Out."
      );
    }

    if (
      !items ||
      !items.trim() ||
      items.length > 500
    ) {
      throw new Error(
        "Please enter what you purchased or cashed out."
      );
    }
  }

  // ========================================================
  // GIVEAWAY / INVITE / CONVERTER HOST VALIDATION
  // ========================================================

  if (
    vouchType !== VOUCH_TYPES.MARKET &&
    !isSpecialHost(sellerId)
  ) {
    throw new Error(
      "Only bunnii and twxn can receive Giveaway, " +
      "Invite Challenge, or Converter Fees vouches."
    );
  }

  // ========================================================
  // CONVERTER FEES VALIDATION
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.CONVERTER
  ) {
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
// VOUCH TYPE DISPLAY NAMES
// ============================================================

function getVouchTypeName(
  vouchType,
  transaction
) {
  if (
    vouchType === VOUCH_TYPES.GIVEAWAY
  ) {
    return "Giveaway";
  }

  if (
    vouchType === VOUCH_TYPES.INVITE
  ) {
    return "Invite Challenge";
  }

  if (
    vouchType === VOUCH_TYPES.CONVERTER
  ) {
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
// No mocha dance emoji in any vouch.
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
    safeText(
      proof.name || "Vouch proof",
      200
    );

  const typeName =
    getVouchTypeName(
      vouchType,
      transaction
    );

  let description = "";

  // ========================================================
  // MARKET VOUCH
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.MARKET
  ) {
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
  // GIVEAWAY VOUCH
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.GIVEAWAY
  ) {
    description +=
      `**host:** <@${sellerId}>\n` +
      `**vouched by:** <@${userId}>\n` +
      `**vouch type:** Giveaway\n`;
  }

  // ========================================================
  // INVITE CHALLENGE VOUCH
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.INVITE
  ) {
    description +=
      `**host:** <@${sellerId}>\n` +
      `**vouched by:** <@${userId}>\n` +
      `**vouch type:** Invite Challenge\n`;
  }

  // ========================================================
  // CONVERTER FEES VOUCH
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.CONVERTER
  ) {
    description +=
      `**converter:** <@${sellerId}>\n` +
      `**customer:** <@${userId}>\n` +
      `**vouch type:** Converter Fees\n` +
      `**converted:** ${safeText(conversion)}\n` +
      `**converter fee:** ${safeText(fee, 100)}\n`;
  }

  // ========================================================
  // RATING / PROOF / THANK YOU
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
// FETCH DESTINATION CHANNEL
// ============================================================

async function getDestinationChannel(
  interaction,
  sellerId,
  vouchType
) {
  const channelId =
    getVouchChannelId(
      sellerId,
      vouchType
    );

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
      "The bot needs View Channel, Send Messages, " +
      "Embed Links, and Attach Files permissions " +
      "in the destination vouch channel."
    );
  }

  return channel;
}

// ============================================================
// PROCESS /VOUCH
// ============================================================

async function submitVouch(interaction) {
  try {
    // ======================================================
    // SERVER CHECK
    // ======================================================

    if (!interaction.inGuild()) {
      return replyPrivate(
        interaction,
        "You can only submit vouches inside the server."
      );
    }

    // Acknowledge immediately.

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
      return replyPrivate(
        interaction,
        {
          embeds: [
            makeClientRequiredEmbed()
          ]
        }
      );
    }

    // ======================================================
    // CATEGORY FIRST
    // ======================================================

    const vouchType =
      interaction.options.getSubcommand(true);

    if (
      !Object.values(VOUCH_TYPES).includes(
        vouchType
      )
    ) {
      throw new Error(
        "Invalid vouch category."
      );
    }

    // ======================================================
    // SELLER / HOST / CONVERTER
    // ======================================================

    let sellerId;

    if (
      vouchType === VOUCH_TYPES.MARKET
    ) {
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
    // CATEGORY-SPECIFIC VALUES
    // ======================================================

    let transaction = null;
    let items = null;
    let conversion = null;
    let fee = null;

    // Market values.

    if (
      vouchType === VOUCH_TYPES.MARKET
    ) {
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

    // Converter values.

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
    // VALIDATE INFORMATION
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
    // FIND CORRECT CHANNEL
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
    // SEND TO DESTINATION CHANNEL
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
    // SUCCESS LOG
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
    // No mocha dance emoji in success messages.
    //
    // ======================================================

    return replyPrivate(
      interaction,
      {
        content:
          `Your **${typeName}** vouch ` +
          `for ${seller.name} was submitted successfully! ♡\n\n` +
          `**Sent to:** <#${channel.id}>`
      }
    );

  } catch (error) {
    console.error(
      "[VOUCH] Submission failed:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred.";

    return replyPrivate(
      interaction,
      {
        content:
          "Your vouch could not be submitted.\n\n" +
          safeText(
            errorMessage,
            700
          )
      }
    ).catch(console.error);
  }
}

// ============================================================
// CONNECT VOUCH SYSTEM
// ============================================================

function setupVouch(client) {
  // Prevent duplicate module loading.

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
  // /VOUCH INTERACTION HANDLER
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
    "[VOUCH] Self-vouch protection enabled."
  );

  console.log(
    "[VOUCH] White vouch embeds preserved."
  );

  console.log(
    "[VOUCH] Dance emoji removed from vouch content."
  );

  console.log(
    "[VOUCH] All destination channels configured."
  );

  console.log(
    `[VOUCH] Converter channel: ${CONVERTER_VOUCH_CHANNEL_ID}`
  );

  console.log(
    "[VOUCH] Counters handled by index.js."
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
