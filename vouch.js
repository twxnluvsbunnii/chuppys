
"use strict";

// ============================================================
// CHUPPYS VOUCH SYSTEM
// DISCORD.JS V14 / RENDER
// COMPLETE REPLACEMENT VOUCH.JS
// ============================================================
//
// VOUCH CATEGORY IS SELECTED FIRST:
//
// /vouch market
// /vouch giveaway
// /vouch invite
//
// MARKET VOUCH:
// - All original 12 sellers
// - Required Purchase / Cash Out selection
// - Required items description
// - Required rating 1–5
// - Required image proof
// - bunnii/twxn -> personal vouch channel
// - Other sellers -> regular market channel
//
// GIVEAWAY VOUCH:
// - Only bunnii and twxn
// - Required rating 1–5
// - Required image proof
// - No items purchased field
// - Separate giveaway channel
//
// INVITE CHALLENGE VOUCH:
// - Only bunnii and twxn
// - Required rating 1–5
// - Required image proof
// - No items purchased field
// - Separate invite challenge channel
//
// ALL VOUCH EMBEDS:
// - White color
// - NEW VOUCH title
// - Seller/host mention
// - Buyer/person who vouched mention
// - Vouch type
// - Custom zymochadance emoji
// - Rating
// - Proof filename
// - Original bear thumbnail
// - Large proof image
// - Thank-you message
// - Timestamp
//
// PROTECTION:
// - Client role required
// - Self-vouch prevention
// - Valid seller/host validation
// - Valid rating validation
// - Required image proof
// - Bot permission checks
// - Private success/error responses
//
// index.js continues handling:
// - Vouch reactions
// - Vouch counters
// - Forwarded vouch counting
// - Duplicate counting protection
//
// This module does not increment counters directly.
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
// CONFIGURATION
// ============================================================

const BRAND = ".gg/chuppys";

const WHITE = 0xffffff;

const EPHEMERAL = MessageFlags.Ephemeral;

// ============================================================
// CUSTOM VOUCH EMOJI
// ============================================================

const VOUCH_EMOJI =
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

// Market vouches for bunnii and twxn.

const PERSONAL_VOUCH_CHANNEL_ID =
  "1562227276051910676";

// Market vouches for other sellers.

const MARKET_VOUCH_CHANNEL_ID =
  "1530811494168657980";

// Giveaway vouches.

const GIVEAWAY_VOUCH_CHANNEL_ID =
  "1572974320781885450";

// Invite Challenge vouches.

const INVITE_VOUCH_CHANNEL_ID =
  "1572972324930724041";

// ============================================================
// CHANNEL EXPORT CONFIGURATION
// ============================================================

const CHANNELS = Object.freeze({
  personal: PERSONAL_VOUCH_CHANNEL_ID,
  market: MARKET_VOUCH_CHANNEL_ID,
  giveaway: GIVEAWAY_VOUCH_CHANNEL_ID,
  invite: INVITE_VOUCH_CHANNEL_ID
});

// ============================================================
// ORIGINAL SELLER LIST — ALL PRESERVED
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
// GIVEAWAY AND INVITE HOSTS
// ============================================================
//
// Only bunnii and twxn appear in these selections.
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
  INVITE: "invite"
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
      : payload;

  if (interaction.deferred) {
    return interaction.editReply(data);
  }

  if (interaction.replied) {
    return interaction.followUp({
      ...data,
      flags: EPHEMERAL,
      allowedMentions: {
        parse: []
      }
    });
  }

  return interaction.reply({
    ...data,
    flags: EPHEMERAL,
    allowedMentions: {
      parse: []
    }
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
    proof.contentType || "";

  const filename =
    proof.name || "";

  return (
    contentType.startsWith("image/") ||
    /\.(png|jpg|jpeg|gif|webp)$/i.test(filename)
  );
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
  // MARKET VOUCH
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.MARKET
  ) {
    return seller.personal
      ? PERSONAL_VOUCH_CHANNEL_ID
      : MARKET_VOUCH_CHANNEL_ID;
  }

  // ========================================================
  // GIVEAWAY VOUCH
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
  // INVITE CHALLENGE VOUCH
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

  throw new Error(
    "Invalid vouch category."
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
// /VOUCH SLASH COMMAND
// ============================================================
//
// Discord subcommands make the category selection
// happen FIRST.
//
// User types:
//
// /vouch
//
// Discord displays:
//
// market
// giveaway
// invite
//
// Each category has its own required options.
//
// ============================================================

const vouchCommand =
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription(
      "Submit a Chuppys Market, Giveaway, or Invite Challenge vouch."
    )

    // ======================================================
    // /VOUCH MARKET
    // ======================================================

    .addSubcommand(subcommand =>
      subcommand
        .setName("market")
        .setDescription(
          "Vouch for a Market Purchase or Cash Out."
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

        // Required Purchase / Cash Out.

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

        // Required item description.

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

        // Required rating.

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

        // Required proof.

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
          "Vouch for a giveaway hosted by bunnii or twxn."
        )

        // Only bunnii and twxn.

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

        // Required rating.

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

        // Required proof.

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload a screenshot proving you received the giveaway."
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
          "Vouch for a completed Invite Challenge."
        )

        // Only bunnii and twxn.

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

        // Required rating.

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

        // Required proof.

        .addAttachmentOption(option =>
          option
            .setName("proof")
            .setDescription(
              "Upload a screenshot proving your Invite Challenge reward."
            )
            .setRequired(true)
        )
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
      "[VOUCH] Category-first subcommands enabled."
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
      `[VOUCH] ${SELLERS.length} market sellers available.`
    );

    console.log(
      "[VOUCH] Giveaway and Invite hosts: bunnii, twxn."
    );

    console.log(
      "[VOUCH] All four destination channels configured."
    );

  } catch (error) {
    console.error(
      "[VOUCH] Registration failed:",
      error
    );
  }
}

// ============================================================
// CLIENT ROLE REQUIREMENT
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
  items
}) {
  // Valid seller.

  const seller =
    getSeller(sellerId);

  if (!seller) {
    throw new Error(
      "That seller is not in the seller list."
    );
  }

  // No self-vouching.

  if (sellerId === userId) {
    throw new Error(
      "You cannot submit a vouch for yourself."
    );
  }

  // Rating 1–5.

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error(
      "Rating must be between 1 and 5."
    );
  }

  // Required valid proof image.

  if (!isValidProof(proof)) {
    throw new Error(
      "Please attach a PNG, JPG, GIF, or WEBP image as proof."
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

  // Validate Market Purchase or Cash Out.

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

  // Giveaway/Invite only bunnii and twxn.

  if (
    (
      vouchType === VOUCH_TYPES.GIVEAWAY ||
      vouchType === VOUCH_TYPES.INVITE
    ) &&
    !isSpecialHost(sellerId)
  ) {
    throw new Error(
      "Only bunnii and twxn can receive Giveaway or Invite Challenge vouches."
    );
  }

  return seller;
}

// ============================================================
// VOUCH TYPE DISPLAY
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
    transaction ===
    MARKET_TRANSACTIONS.CASHOUT
  ) {
    return "Market Cash Out";
  }

  return "Market Purchase";
}

// ============================================================
// ORIGINAL WHITE VOUCH EMBED
// ============================================================

function makeVouchEmbed({
  sellerId,
  userId,
  rating,
  proof,
  vouchType,
  transaction,
  items
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
  // MARKET
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.MARKET
  ) {
    description +=
      `**seller:** <@${sellerId}>\n` +
      `**buyer:** <@${userId}>\n` +
      `**vouch type:** ${VOUCH_EMOJI} ${typeName}\n`;

    if (
      transaction ===
      MARKET_TRANSACTIONS.PURCHASE
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

  if (
    vouchType === VOUCH_TYPES.GIVEAWAY
  ) {
    description +=
      `**host:** <@${sellerId}>\n` +
      `**vouched by:** <@${userId}>\n` +
      `**vouch type:** ${VOUCH_EMOJI} Giveaway\n`;
  }

  // ========================================================
  // INVITE CHALLENGE
  // ========================================================

  if (
    vouchType === VOUCH_TYPES.INVITE
  ) {
    description +=
      `**host:** <@${sellerId}>\n` +
      `**vouched by:** <@${userId}>\n` +
      `**vouch type:** ${VOUCH_EMOJI} Invite Challenge\n`;
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
    // GET SELLER OR HOST
    // ======================================================

    const sellerId =
      vouchType === VOUCH_TYPES.MARKET
        ? interaction.options.getString(
            "seller",
            true
          )
        : interaction.options.getString(
            "host",
            true
          );

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
    // MARKET TRANSACTION AND ITEMS
    // ======================================================

    let transaction = null;
    let items = null;

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

    // ======================================================
    // VALIDATE ALL INFORMATION
    // ======================================================

    const seller =
      validateVouch({
        sellerId,
        userId: interaction.user.id,
        rating,
        proof,
        vouchType,
        transaction,
        items
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
    // CREATE WHITE EMBED
    // ======================================================

    const embed =
      makeVouchEmbed({
        sellerId,
        userId: interaction.user.id,
        rating,
        proof,
        vouchType,
        transaction,
        items
      });

    // ======================================================
    // SEND VOUCH TO CORRECT CHANNEL
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
      `[VOUCH] Seller/Host: ${sellerId}`
    );

    // ======================================================
    // PRIVATE SUCCESS RESPONSE
    // ======================================================

    return replyPrivate(
      interaction,
      {
        content:
          `${VOUCH_EMOJI} Your **${typeName}** vouch ` +
          `for ${seller.name} was submitted successfully! ♡\n\n` +
          `**Sent to:** <#${channel.id}>`,
        allowedMentions: {
          parse: []
        }
      }
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
          safeText(
            error.message,
            700
          ),
        allowedMentions: {
          parse: []
        }
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

  console.log(
    "[VOUCH] Chuppys Vouch System loaded."
  );

  console.log(
    "[VOUCH] Market / Giveaway / Invite subcommands enabled."
  );

  console.log(
    "[VOUCH] Original seller list preserved."
  );

  console.log(
    "[VOUCH] bunnii/twxn special host restriction enabled."
  );

  console.log(
    "[VOUCH] Buyer/vouched-by mentions enabled."
  );

  console.log(
    "[VOUCH] Original white embed appearance preserved."
  );

  console.log(
    "[VOUCH] All four destination channels configured."
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
