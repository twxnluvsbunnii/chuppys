
"use strict";

// ============================================================
// CHUPPYS VOUCH SYSTEM — DISCORD.JS V14 / RENDER
// ============================================================
//
// VOUCH TYPES:
// - Market
// - Giveaway
// - Invite Challenge
//
// CUSTOM EMOJI:
// <:zymochadance:1565501941675462719>
//
// MARKET:
// - Purchase
// - Cash Out
// - Items purchased/cashed out
// - bunnii and twxn personal channel
// - Other sellers regular market channel
//
// GIVEAWAY:
// - Only bunnii and twxn
// - Separate giveaway vouch channel
//
// INVITE CHALLENGE:
// - Separate invite challenge vouch channel
//
// PRESERVED:
// - Original sellers
// - Client role check
// - White embeds
// - Original bear thumbnail
// - Rating 1–5
// - Required proof image
// - Large proof image
// - Thank-you message
// - Self-vouch protection
// - Private responses
//
// Counters and reactions handled by index.js.
//
// ============================================================
// IMPORTS
// ============================================================

const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionsBitField,
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const {
  randomBytes
} = require("node:crypto");

// ============================================================
// CONFIGURATION
// ============================================================

const BRAND = ".gg/chuppys";
const WHITE = 0xffffff;
const EPHEMERAL = MessageFlags.Ephemeral;

const EMOJI =
  "<:zymochadance:1565501941675462719>";

const MENU_EMOJI = {
  id: "1565501941675462719",
  name: "zymochadance",
  animated: false
};

const BEAR =
  "https://cdn.discordapp.com/emojis/1561197586554036318.png?size=128&quality=lossless";

const CLIENT_ROLE_ID =
  "1550373434301878282";

// ============================================================
// VOUCH CHANNELS
// ============================================================

const CHANNELS = Object.freeze({
  personal: "1562227276051910676",
  market: "1530811494168657980",
  giveaway: "1572974320781885450",
  invite: "1572972324930724041"
});

// ============================================================
// SELLERS — ORIGINAL LIST
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
// INTERACTION IDS
// ============================================================

const TYPE_ID =
  "chuppys_vouch_type:";

const MARKET_ID =
  "chuppys_vouch_market:";

const MODAL_ID =
  "chuppys_vouch_order:";

// ============================================================
// SESSIONS
// ============================================================

const sessions = new Map();

const SESSION_MS =
  10 * 60 * 1000;

// ============================================================
// HELPERS
// ============================================================

function getSeller(id) {
  return SELLERS.find(
    seller => seller.id === id
  ) || null;
}

function safe(value, max = 500) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .replace(/</g, "‹")
    .replace(/>/g, "›")
    .trim()
    .slice(0, max);
}

// ============================================================
// CHANNEL ROUTING
// ============================================================

function destination(sellerId, type) {
  const seller =
    getSeller(sellerId);

  if (!seller) {
    throw new Error(
      "This seller is not available."
    );
  }

  if (type === "giveaway") {
    if (!seller.personal) {
      throw new Error(
        "Giveaway vouches are only for bunnii and twxn."
      );
    }

    return CHANNELS.giveaway;
  }

  if (type === "invite") {
    return CHANNELS.invite;
  }

  if (type === "market") {
    return seller.personal
      ? CHANNELS.personal
      : CHANNELS.market;
  }

  throw new Error(
    "Invalid vouch type."
  );
}

// ============================================================
// /VOUCH COMMAND
// ============================================================

const command =
  new SlashCommandBuilder()
    .setName("vouch")
    .setDescription(
      "Leave a Market, Giveaway, or Invite Challenge vouch."
    )
    .addStringOption(option =>
      option
        .setName("seller")
        .setDescription(
          "Choose who you are vouching for."
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
    .addAttachmentOption(option =>
      option
        .setName("proof")
        .setDescription(
          "Upload a screenshot of proof."
        )
        .setRequired(true)
    );

// ============================================================
// PROOF VALIDATION
// ============================================================

function validProof(proof) {
  return Boolean(
    proof?.url &&
    (
      (proof.contentType || "").startsWith(
        "image/"
      ) ||
      /\.(?:png|jpe?g|gif|webp)$/i.test(
        proof.name || ""
      )
    )
  );
}

// ============================================================
// PRIVATE RESPONSE
// ============================================================

async function privateReply(
  interaction,
  content
) {
  const payload =
    typeof content === "string"
      ? { content }
      : content;

  if (interaction.deferred) {
    return interaction.editReply(payload);
  }

  if (interaction.replied) {
    return interaction.followUp({
      ...payload,
      flags: EPHEMERAL
    });
  }

  return interaction.reply({
    ...payload,
    flags: EPHEMERAL
  });
}

// ============================================================
// CLIENT ROLE CHECK
// ============================================================

async function checkClient(interaction) {
  if (!interaction.inGuild()) {
    throw new Error(
      "Vouches can only be submitted inside the server."
    );
  }

  const member =
    await interaction.guild.members.fetch({
      user: interaction.user.id,
      force: true
    });

  if (
    !member.roles.cache.has(
      CLIENT_ROLE_ID
    )
  ) {
    throw new Error(
      "You need the client role before submitting a vouch. " +
      "Please claim it using the client verification button."
    );
  }
}

// ============================================================
// CREATE DROPDOWN
// ============================================================

function row(
  customId,
  placeholder,
  options
) {
  const menu =
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        options.map(
          ([
            label,
            value,
            description
          ]) => ({
            label,
            value,
            description,
            emoji: MENU_EMOJI
          })
        )
      );

  return new ActionRowBuilder()
    .addComponents(menu);
}

// ============================================================
// SESSION VALIDATION
// ============================================================

function sessionFor(
  interaction,
  prefix
) {
  const id =
    interaction.customId.slice(
      prefix.length
    );

  const session =
    sessions.get(id);

  if (
    !session ||
    session.expiresAt <= Date.now()
  ) {
    sessions.delete(id);

    throw new Error(
      "This vouch expired. Run /vouch again."
    );
  }

  if (
    session.userId !== interaction.user.id ||
    session.guildId !== interaction.guildId
  ) {
    throw new Error(
      "This menu belongs to another member's vouch."
    );
  }

  if (session.busy) {
    throw new Error(
      "This vouch is already being submitted."
    );
  }

  return [
    id,
    session
  ];
}

// ============================================================
// BUILD VOUCH EMBED
// ============================================================

function embedFor(
  session,
  interaction,
  type,
  transaction,
  order
) {
  const filename =
    safe(
      session.proof.name || "Vouch proof",
      200
    );

  let description =
    `**seller:** <@${session.sellerId}>\n` +
    `**buyer:** <@${interaction.user.id}>\n`;

  // MARKET PURCHASE / CASH OUT

  if (type === "market") {
    const name =
      transaction === "cashout"
        ? "Cash Out"
        : "Purchase";

    const itemsLabel =
      transaction === "cashout"
        ? "items cashed out"
        : "items purchased";

    description +=
      `**vouch type:** ${EMOJI} Market ${name}\n` +
      `**${itemsLabel}:** ${safe(order)}\n`;
  }

  // GIVEAWAY

  else if (type === "giveaway") {
    description +=
      `**vouch type:** ${EMOJI} Giveaway\n`;
  }

  // INVITE CHALLENGE

  else if (type === "invite") {
    description +=
      `**vouch type:** ${EMOJI} Invite Challenge\n`;
  }

  // ORIGINAL RATING / PROOF / THANK YOU

  description +=
    `**rating:** ${session.rating}/5\n` +
    `**proof:** 📎 ${filename}\n\n` +
    "*thank you for vouching! shop again ♡*";

  return new EmbedBuilder()
    .setTitle("NEW VOUCH")
    .setColor(WHITE)
    .setDescription(description)
    .setThumbnail(BEAR)
    .setImage(session.proof.url)
    .setTimestamp();
}

// ============================================================
// POST VOUCH
// ============================================================

async function post(
  interaction,
  session,
  type,
  transaction = null,
  order = null
) {
  await checkClient(interaction);

  if (
    session.sellerId === interaction.user.id
  ) {
    throw new Error(
      "You cannot vouch for yourself."
    );
  }

  if (
    type === "market" &&
    (
      !["purchase", "cashout"].includes(
        transaction
      ) ||
      !order?.trim()
    )
  ) {
    throw new Error(
      "Select Purchase or Cash Out and describe the items."
    );
  }

  const channelId =
    destination(
      session.sellerId,
      type
    );

  const channel =
    await interaction.guild.channels.fetch(
      channelId
    );

  if (
    !channel ||
    typeof channel.send !== "function"
  ) {
    throw new Error(
      "The destination vouch channel could not be accessed."
    );
  }

  const bot =
    await interaction.guild.members.fetchMe();

  const permissions =
    channel.permissionsFor(bot);

  const needed = [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.AttachFiles
  ];

  if (
    !permissions?.has(needed)
  ) {
    throw new Error(
      "The bot needs View Channel, Send Messages, " +
      "Embed Links and Attach Files permissions " +
      "in the vouch channel."
    );
  }

  const embed =
    embedFor(
      session,
      interaction,
      type,
      transaction,
      order
    );

  const message =
    await channel.send({
      embeds: [embed],
      allowedMentions: {
        parse: []
      }
    });

  console.log(
    `[VOUCH] ${type} ${transaction || ""} posted=${message.id}`
  );

  console.log(
    `[VOUCH] Channel=${channelId}`
  );

  console.log(
    `[VOUCH] Seller=${session.sellerId}`
  );

  console.log(
    `[VOUCH] Buyer=${interaction.user.id}`
  );

  return channel;
}

// ============================================================
// REGISTER /VOUCH
// ============================================================

async function register(client) {
  try {
    const guildId =
      process.env.DISCORD_GUILD_ID ||
      process.env.GUILD_ID;

    if (!guildId) {
      throw new Error(
        "Missing DISCORD_GUILD_ID or GUILD_ID."
      );
    }

    const guild =
      await client.guilds.fetch(guildId);

    const commands =
      await guild.commands.fetch();

    const existing =
      commands.find(
        command =>
          command.name === "vouch"
      );

    if (existing) {
      await guild.commands.edit(
        existing.id,
        command.toJSON()
      );
    } else {
      await guild.commands.create(
        command.toJSON()
      );
    }

    console.log(
      "[VOUCH] /vouch registered."
    );

    console.log(
      `[VOUCH] ${SELLERS.length} sellers preserved.`
    );

    console.log(
      "[VOUCH] Three categories enabled."
    );
  } catch (error) {
    console.error(
      "[VOUCH] Registration failed:",
      error
    );
  }
}

// ============================================================
// START /VOUCH
// ============================================================

async function start(interaction) {
  await interaction.deferReply({
    flags: EPHEMERAL
  });

  await checkClient(interaction);

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

  const proof =
    interaction.options.getAttachment(
      "proof",
      true
    );

  if (!getSeller(sellerId)) {
    throw new Error(
      "Invalid seller."
    );
  }

  if (
    sellerId === interaction.user.id
  ) {
    throw new Error(
      "You cannot vouch for yourself."
    );
  }

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error(
      "Rating must be between 1 and 5."
    );
  }

  if (!validProof(proof)) {
    throw new Error(
      "Attach a PNG, JPG, GIF or WEBP image as proof."
    );
  }

  // Clean expired sessions.

  for (const [id, session] of sessions) {
    if (
      session.expiresAt <= Date.now()
    ) {
      sessions.delete(id);
    }
  }

  const id =
    randomBytes(12).toString("hex");

  sessions.set(id, {
    userId: interaction.user.id,
    guildId: interaction.guildId,
    sellerId,
    rating,
    proof: {
      url: proof.url,
      name: proof.name,
      contentType: proof.contentType
    },
    expiresAt:
      Date.now() + SESSION_MS,
    busy: false,
    type: null,
    transaction: null
  });

  const embed =
    new EmbedBuilder()
      .setColor(WHITE)
      .setTitle("CHUPPYS VOUCH SYSTEM")
      .setDescription(
        `${EMOJI} **Choose your vouch category!**\n\n` +
        `**seller:** <@${sellerId}>\n` +
        `**rating:** ${rating}/5\n` +
        "**proof:** uploaded\n\n" +
        "**Market:** Purchase or Cash Out\n" +
        "**Giveaway:** bunnii and twxn only\n" +
        "**Invite Challenge:** Completed invite challenges"
      )
      .setThumbnail(BEAR)
      .setFooter({
        text: BRAND
      });

  return interaction.editReply({
    embeds: [embed],
    components: [
      row(
        TYPE_ID + id,
        "Choose your vouch category",
        [
          [
            "Market Vouch",
            "market",
            "Purchase or Cash Out"
          ],
          [
            "Giveaway Vouch",
            "giveaway",
            "bunnii or twxn only"
          ],
          [
            "Invite Challenge Vouch",
            "invite",
            "Completed invite challenge"
          ]
        ]
      )
    ]
  });
}

// ============================================================
// CHOOSE VOUCH CATEGORY
// ============================================================

async function chooseType(interaction) {
  const [
    id,
    session
  ] = sessionFor(
    interaction,
    TYPE_ID
  );

  const type =
    interaction.values[0];

  if (
    ![
      "market",
      "giveaway",
      "invite"
    ].includes(type)
  ) {
    throw new Error(
      "Invalid vouch category."
    );
  }

  // Validate routing and Giveaway restriction.

  destination(
    session.sellerId,
    type
  );

  session.type = type;

  // ========================================================
  // MARKET SELECTION
  // ========================================================

  if (type === "market") {
    const embed =
      new EmbedBuilder()
        .setColor(WHITE)
        .setTitle("MARKET VOUCH")
        .setDescription(
          `${EMOJI} Choose whether this is a ` +
          "**Purchase** or **Cash Out**.\n\n" +
          "Next, you'll type the items you " +
          "purchased or cashed out."
        )
        .setThumbnail(BEAR);

    return interaction.update({
      embeds: [embed],
      components: [
        row(
          MARKET_ID + id,
          "Choose transaction type",
          [
            [
              "Purchase",
              "purchase",
              "Items purchased"
            ],
            [
              "Cash Out",
              "cashout",
              "Items cashed out"
            ]
          ]
        )
      ]
    });
  }

  // ========================================================
  // GIVEAWAY OR INVITE CHALLENGE
  // ========================================================

  session.busy = true;

  await interaction.deferUpdate();

  try {
    const channel =
      await post(
        interaction,
        session,
        type
      );

    sessions.delete(id);

    const name =
      type === "giveaway"
        ? "Giveaway"
        : "Invite Challenge";

    return interaction.editReply({
      content:
        `${EMOJI} Your **${name}** vouch ` +
        `was sent to <#${channel.id}>! ♡`,
      embeds: [],
      components: [],
      allowedMentions: {
        parse: []
      }
    });
  } catch (error) {
    session.busy = false;
    throw error;
  }
}

// ============================================================
// CHOOSE MARKET TRANSACTION
// ============================================================

async function chooseMarket(interaction) {
  const [
    id,
    session
  ] = sessionFor(
    interaction,
    MARKET_ID
  );

  const type =
    interaction.values[0];

  if (
    session.type !== "market" ||
    ![
      "purchase",
      "cashout"
    ].includes(type)
  ) {
    throw new Error(
      "Invalid market selection."
    );
  }

  session.transaction = type;

  const input =
    new TextInputBuilder()
      .setCustomId("order")
      .setLabel(
        type === "cashout"
          ? "What did you cash out?"
          : "What did you purchase?"
      )
      .setPlaceholder(
        type === "cashout"
          ? "Example: 2B Baddies Cash"
          : "Example: 500M Baddies Cash"
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(500);

  const modal =
    new ModalBuilder()
      .setCustomId(
        MODAL_ID + id
      )
      .setTitle(
        type === "cashout"
          ? "Chuppys Cash Out Vouch"
          : "Chuppys Purchase Vouch"
      )
      .addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );

  return interaction.showModal(modal);
}

// ============================================================
// SUBMIT MARKET VOUCH
// ============================================================

async function submitMarket(interaction) {
  const [
    id,
    session
  ] = sessionFor(
    interaction,
    MODAL_ID
  );

  if (
    session.type !== "market"
  ) {
    throw new Error(
      "Invalid market session."
    );
  }

  const order =
    interaction.fields
      .getTextInputValue("order")
      .trim();

  if (!order) {
    throw new Error(
      "Please describe the purchased or cashed-out items."
    );
  }

  session.busy = true;

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  try {
    const channel =
      await post(
        interaction,
        session,
        "market",
        session.transaction,
        order
      );

    sessions.delete(id);

    const name =
      session.transaction === "cashout"
        ? "Cash Out"
        : "Purchase";

    return interaction.editReply({
      content:
        `${EMOJI} Your **Market ${name}** vouch ` +
        `was sent to <#${channel.id}>! ♡`,
      allowedMentions: {
        parse: []
      }
    });
  } catch (error) {
    session.busy = false;
    throw error;
  }
}

// ============================================================
// SETUP VOUCH MODULE
// ============================================================

function setupVouch(client) {
  if (client.__chuppysVouchLoaded) {
    return;
  }

  client.__chuppysVouchLoaded = true;

  // Register slash command when ready.

  if (client.isReady()) {
    void register(client);
  } else {
    client.once(
      Events.ClientReady,
      () => void register(client)
    );
  }

  // ========================================================
  // INTERACTION HANDLER
  // ========================================================

  client.on(
    Events.InteractionCreate,
    async interaction => {
      const ours =
        (
          interaction.isChatInputCommand() &&
          interaction.commandName === "vouch"
        ) ||
        (
          interaction.isStringSelectMenu() &&
          (
            interaction.customId.startsWith(
              TYPE_ID
            ) ||
            interaction.customId.startsWith(
              MARKET_ID
            )
          )
        ) ||
        (
          interaction.isModalSubmit() &&
          interaction.customId.startsWith(
            MODAL_ID
          )
        );

      if (!ours) {
        return;
      }

      try {
        // /VOUCH

        if (
          interaction.isChatInputCommand()
        ) {
          await start(interaction);
        }

        // VOUCH TYPE

        else if (
          interaction.isStringSelectMenu() &&
          interaction.customId.startsWith(
            TYPE_ID
          )
        ) {
          await chooseType(interaction);
        }

        // MARKET TYPE

        else if (
          interaction.isStringSelectMenu()
        ) {
          await chooseMarket(interaction);
        }

        // ORDER MODAL

        else {
          await submitMarket(interaction);
        }

      } catch (error) {
        console.error(
          "[VOUCH] Interaction error:",
          error
        );

        try {
          await privateReply(
            interaction,
            "Your vouch could not be submitted.\n\n" +
            safe(error.message, 600)
          );
        } catch (replyError) {
          console.error(
            "[VOUCH] Reply error:",
            replyError
          );
        }
      }
    }
  );

  console.log(
    "[VOUCH] Chuppys Vouch System loaded."
  );

  console.log(
    "[VOUCH] Market, Giveaway and Invite Challenge enabled."
  );

  console.log(
    "[VOUCH] Original seller list preserved."
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

module.exports.getVouchChannelId =
  destination;

// ============================================================
// END OF VOUCH.JS
// ============================================================
