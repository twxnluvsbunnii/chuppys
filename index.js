
const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

// ==================================================
// RENDER WEB SERVER
// ==================================================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Chuppys bot is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on port ${PORT}`);
});

// ==================================================
// CONFIGURATION
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";

const NITRO_CHANNEL_ID = "1555760937557041273";
const DECOR_CHANNEL_ID = "1555769588229345280";
const BOOSTIES_CHANNEL_ID = "1555769708928831489";

const SELLERS_CHANNEL_ID = "1551713598181605496";
const STAFF_CHANNEL_ID = "1561013244905132122";

const ROBUX_CASHOUT_CHANNEL_ID = "1552385740405473513";

const ROBUX_CASHOUT_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561094713153429746.png";

// ==================================================
// STOCK REQUEST SETTINGS
// ==================================================

const REQUEST_CHANNEL_ID = "1569732416388726834";

const REQUEST_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561388594625511514.png?size=128&quality=lossless";

// ==================================================
// VERIFICATION SETTINGS
// ==================================================

const VERIFY_CHANNEL_ID = "1528716328985301052";
const VERIFY_BUTTON_ID = "chuppys_verify";

const VERIFY_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561103471325745242.png";

const VERIFY_BUTTON_EMOJI_ID = "1561103471325745242";

const CHUPPYS_ROLE_ID = "1550230619127021568";

const ROLES_CHANNEL_ID = "1530808091380285592";

const AGE_ROLE_IDS = [
  "1531084465126772877",
  "1531084550849954003",
  "1531084611399188640"
];

const PRONOUN_ROLE_IDS = [
  "1531084942241697854",
  "1531086100867842190",
  "1531101006451048448"
];

const PING_ROLE_IDS = [
  "1531039846871728248",
  "1568240267344093254",
  "1531084435716571137",
  "1531104789075853472",
  "1531104886630907925",
  "1531105107586973696",
  "1551276593425685333",
  "1558913216602706011",
  "1568240367076122634",
  "1568283533879939123",
  "1568240484206514248",
  "1569731217799127210",
  "1569731506706849872"
];

// ==================================================
// CLIENT ROLE SETTINGS
// ==================================================

const CLIENT_ROLE_ID = "1550373434301878282";
const CLIENT_BUTTON_ID = "chuppys_client";
const CLIENT_EMOJI_ID = "1569091548468219985";
const CLIENT_EMOJI = "<:unis:1569091548468219985>";

// ==================================================
// RANKED ROLES SETTINGS
// ==================================================

const RANKED_ROLES_CHANNEL_ID = "1567178497917718568";

const RANKED_ROLES_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1568404337154068618.png?size=128&quality=lossless";

const RANKED_ROLE_IDS = [
  "1550374791217680485",
  "1562961485091573902",
  "1550374678449754163",
  "1561439464327483583",
  "1550374524640436235",
  "1550374377130827856",
  "1550374079385575454",
  "1550373983336144936",
  "1550373843170889728",
  "1550373695204360252",
  "1550373612144304219"
];

// ==================================================
// QUESTION COMMAND
// ==================================================

const QUESTION_CHANNEL_ID = "1566490648549527602";
const QUESTION_EMOJI_ID = "1561388594625511514";
const QUESTION_EMOJI = "<:chuppypayment:1561388594625511514>";

const QUESTION_TICKET_CHANNEL_ID = "1530811385678790716";

const QUESTION_COMMAND = new SlashCommandBuilder()
  .setName("question")
  .setDescription("Submit a question to the Chuppys team.")
  .addStringOption(option =>
    option
      .setName("question")
      .setDescription("Type the question you want to ask.")
      .setRequired(true)
      .setMaxLength(2000)
  )
  .addAttachmentOption(option =>
    option
      .setName("picture")
      .setDescription("Optionally attach a picture.")
      .setRequired(false)
  );

// ==================================================
// REQUEST COMMAND
// ==================================================

const REQUEST_COMMAND = new SlashCommandBuilder()
  .setName("request")
  .setDescription("Request items for Chuppys to stock up on.")
  .addStringOption(option =>
    option
      .setName("category")
      .setDescription("Choose the category for your request.")
      .setRequired(true)
      .addChoices(
        { name: "Baddies", value: "Baddies" },
        { name: "MM2", value: "MM2" },
        { name: "Adopt Me", value: "Adopt Me" },
        { name: "Blade Ball", value: "Blade Ball" },
        { name: "Robux", value: "Robux" }
      )
  )
  .addStringOption(option =>
    option
      .setName("items")
      .setDescription("What would you like Chuppys to stock up on?")
      .setRequired(true)
      .setMaxLength(1000)
  );

// ==================================================
// HELP COMMAND
// ==================================================

const HELP_COMMAND = new SlashCommandBuilder()
  .setName("help")
  .setDescription("View all Chuppys bot commands.");

// ==================================================
// CHUPPYS ROLE COMMANDS
// ==================================================

const TICKET_SUPPORT_ROLE_ID = "1563003884656398406";

const RULES_CHANNEL_ID = "1551275482857865333";

const VOUCH_TUTORIAL_CHANNEL_ID = "1562958688896028802";
const QUICK_VOUCH_CHANNEL_ID = "1552903786077360269";

const PARTNER_AD_CHANNEL_ID = "1552387259276329110";

const CHUPPYS_WELCOME_EMOJI =
  "<:chuppys:1560284517955141653>";

// ==================================================
// VOUCH COUNTERS
// ==================================================

const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676";
const VOUCH_CHANNEL_ID = "1530811494168657980";

const CHUPPY_COUNT_CHANNEL_ID = "1553242286412922960";
const SERVER_COUNT_CHANNEL_ID = "1562266346891247688";

const VOUCH_SOURCE_CHANNEL_IDS = [
  PERSONAL_VOUCH_CHANNEL_ID,
  VOUCH_CHANNEL_ID
];

const CHUPPY_COUNT_PREFIX = "╭・chuppy total vouches : ";
const CHUPPY_COUNT_SUFFIX = "";

const SERVER_COUNT_PREFIX = "╰・server total vouches : ";
const SERVER_COUNT_SUFFIX = "";

const CHUPPY_TY_EMOJI = "<:uppyty:1561094713153429746>";

// ==================================================
// VOUCH TUTORIAL IMAGES
// ==================================================

const VOUCH_TUTORIAL_IMAGES = {
  command:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5265.jpeg",
  completed:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5267.jpeg",
  success:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5266.jpeg"
};

// ==================================================
// OTHER SETTINGS
// ==================================================

const WELCOME_ROLE_ID = "1531039846871728248";

const INVITE_CHANNEL_ID = "1560249120667734016";
const INVITE_BOT_ID = "499595256270946326";
const INVITE_REACTION_EMOJI =
  "<:chuppynewinv:1561398288593330326>";

const AFK_GOING_EMOJI = "<:chuppybye:1561103844832846014>";
const AFK_RETURN_EMOJI = "<:chuppyhi:1561103471325745242>";

const PAYMENT_EMOJI_ID = "1561388594625511514";
const PAYMENT_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${PAYMENT_EMOJI_ID}.png`;

const QUESTION_EMOJI_URL = PAYMENT_EMOJI_URL;

const SERVICE_EMOJI = "<a:aBouncyDiscord:1557138733717782599>";
const BOOST_EMOJI = "<:white_nitro_boost:1557165507600326756>";
const SELLER_EMOJI = "<:chuppyseller:1560284517955141653>";

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

const CASHAPP_USERNAME = "$yysluvv";
const CASHAPP_URL = "https://cash.app/$yysluvv";

const PAYPAL_USERNAME = "PayPal.me/twxnsrevenge";
const PAYPAL_URL = "https://paypal.me/twxnsrevenge";

const APPLE_PAY = "929-554-5969";
const ZELLE = "631-401-8951";

const PAYMENT_METHODS_TEXT =
  "**Payment Methods**\n> Apple Pay\n> Venmo\n> Cash App";

const afkUsers = new Map();

let vouchCounterTimer = null;
let vouchCounterUpdateRunning = false;
let vouchCounterRecountRequested = false;

const sellerCommandLocks = new Set();
const clientCommandLocks = new Set();
const promoterCommandLocks = new Set();

// ==================================================
// DISCORD CLIENT
// ==================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

require("./vouch")(client);
require("./transactions")(client);

// ==================================================
// VERIFICATION MESSAGE
// ==================================================

function makeVerificationEmbed() {
  return new EmbedBuilder()
    .setTitle("Verify to Access .gg/chuppys")
    .setDescription(
      `Select your roles in <#${ROLES_CHANNEL_ID}> before verifying ` +
      `to gain full access to **.gg/chuppys**.`
    )
    .setColor("#FFFFFF")
    .setThumbnail(VERIFY_THUMBNAIL_URL)
    .setFooter({ text: ".gg/chuppys" });
}

function makeVerificationButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(VERIFY_BUTTON_ID)
      .setLabel("Verify")
      .setEmoji({ id: VERIFY_BUTTON_EMOJI_ID })
      .setStyle(ButtonStyle.Primary)
  );
}

async function sendOrUpdateVerificationMessage() {
  try {
    const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);

    if (!channel || !channel.isTextBased() || !channel.messages) {
      throw new Error("Verification channel not found or invalid.");
    }

    const messages = await channel.messages.fetch({ limit: 100 });

    const matching = messages.filter(message =>
      message.author.id === client.user.id &&
      message.embeds.some(embed =>
        embed.title === "Verify to Access .gg/chuppys"
      )
    );

    const existing = matching.first();

    const payload = {
      embeds: [makeVerificationEmbed()],
      components: [makeVerificationButton()],
      allowedMentions: { parse: [] }
    };

    if (existing) {
      await existing.edit(payload);

      for (const duplicate of matching.values()) {
        if (duplicate.id !== existing.id) {
          await duplicate.delete().catch(error => {
            console.error("[VERIFY] Could not delete duplicate:", error);
          });
        }
      }

      console.log("[VERIFY] Existing verification message updated.");
      return existing;
    }

    const sent = await channel.send(payload);

    console.log("[VERIFY] Verification message created.");

    return sent;
  } catch (error) {
    console.error("[VERIFY] Could not create/update verification message:", error);
  }
}

// ==================================================
// VERIFICATION ROLE CHECKS
// ==================================================

function hasAtLeastOneRole(member, roleIds) {
  return roleIds.some(roleId => member.roles.cache.has(roleId));
}

function countMatchingRoles(member, roleIds) {
  return roleIds.filter(roleId =>
    member.roles.cache.has(roleId)
  ).length;
}

function checkVerificationRequirements(member) {
  const hasAgeRole = hasAtLeastOneRole(member, AGE_ROLE_IDS);
  const hasPronounRole = hasAtLeastOneRole(member, PRONOUN_ROLE_IDS);
  const pingRoleCount = countMatchingRoles(member, PING_ROLE_IDS);

  return {
    hasAgeRole,
    hasPronounRole,
    pingRoleCount,
    passed:
      hasAgeRole &&
      hasPronounRole &&
      pingRoleCount >= 2
  };
}

// ==================================================
// SLASH COMMAND REGISTRATION
// ==================================================

async function registerQuestionCommand() {
  if (!TOKEN || !GUILD_ID || !client.user) {
    console.error("[COMMANDS] Missing token, guild ID, or logged-in bot.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const commandsToRegister = [
    QUESTION_COMMAND,
    REQUEST_COMMAND,
    HELP_COMMAND
  ];

  try {
    const route = Routes.applicationGuildCommands(
      client.user.id,
      GUILD_ID
    );

    const existingCommands = await rest.get(route);

    for (const command of commandsToRegister) {
      const existing = existingCommands.find(
        registered => registered.name === command.name
      );

      if (existing) {
        await rest.patch(
          Routes.applicationGuildCommand(
            client.user.id,
            GUILD_ID,
            existing.id
          ),
          {
            body: command.toJSON()
          }
        );

        console.log(`[COMMANDS] Updated /${command.name}.`);
      } else {
        await rest.post(route, {
          body: command.toJSON()
        });

        console.log(`[COMMANDS] Registered /${command.name}.`);
      }
    }
  } catch (error) {
    console.error("[COMMANDS] Registration failed:", error);
  }
}

// ==================================================
// QUESTION PERMISSIONS
// ==================================================

function canReplyToQuestion(interaction) {
  if (!interaction.guild || !interaction.member) return false;

  const memberPermissions = interaction.memberPermissions;

  if (
    memberPermissions?.has(PermissionsBitField.Flags.Administrator) ||
    memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) ||
    memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)
  ) {
    return true;
  }

  const memberRoles = interaction.member.roles;

  if (memberRoles?.cache?.has(TICKET_SUPPORT_ROLE_ID)) {
    return true;
  }

  if (Array.isArray(memberRoles)) {
    return memberRoles.includes(TICKET_SUPPORT_ROLE_ID);
  }

  return false;
}

// ==================================================
// TICKET SUPPORT PERMISSION
// ==================================================

function isTicketSupport(member) {
  return member.roles.cache.has(TICKET_SUPPORT_ROLE_ID);
}

// ==================================================
// CLIENT ROLE EMBED + BUTTON
// ==================================================

function makeClientEmbed() {
  return new EmbedBuilder()
    .setDescription(
      "Thank you for shopping at **.gg/chuppys**!\n\n" +
      "Please click the button below for the client role " +
      "to be able to successfully submit a vouch."
    )
    .setColor("#FFFFFF")
    .setThumbnail(
      `https://cdn.discordapp.com/emojis/${CLIENT_EMOJI_ID}.png`
    )
    .setFooter({ text: ".gg/chuppys" });
}

function makeClientButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CLIENT_BUTTON_ID)
      .setLabel("client")
      .setEmoji({ id: CLIENT_EMOJI_ID })
      .setStyle(ButtonStyle.Secondary)
  );
}

// ==================================================
// CLIENT MESSAGE SEARCH
// ==================================================

async function findClientRoleMessages(channel) {
  const messages = await channel.messages.fetch({ limit: 100 });

  return messages
    .filter(msg =>
      msg.author.id === client.user.id &&
      msg.embeds.some(embed =>
        (embed.description || "").includes(
          "Please click the button below for the client role"
        )
      )
    )
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp);
}

// ==================================================
// ROBUX CASH OUT EMBED
// ==================================================

async function sendRobuxCashoutEmbed(channel) {
  if (!channel || !channel.isTextBased() || !channel.messages) {
    throw new Error("Robux Cash Out channel not found or invalid.");
  }

  const embed = new EmbedBuilder()
    .setTitle("Cashing Out Robux\n\n")
    .setThumbnail(ROBUX_CASHOUT_THUMBNAIL_URL)
    .setDescription(
      "RATES\n\n" +
      "**Below 10k**\n" +
      "3/k\n\n" +
      "**Above 10k**\n" +
      "3.5/k\n\n" +
      "-# make a cash out ticket now !! make sure u ping me in tickets <:uppyty:1561094713153429746>"
    )
    .setColor("#FFFFFF")
    .setFooter({ text: ".gg/chuppys" });

  const payload = {
    embeds: [embed],
    allowedMentions: { parse: [] }
  };

  const messages = await channel.messages.fetch({ limit: 100 });

  const matches = messages.filter(message =>
    message.author.id === client.user.id &&
    message.embeds.some(existingEmbed => {
      const title = existingEmbed.title || "";
      return (
        title.startsWith("Cashing Out Robux") ||
        title.startsWith("Robux Cash out")
      );
    })
  );

  const existing = matches.first();

  if (existing) {
    await existing.edit(payload);

    for (const duplicate of matches.values()) {
      if (duplicate.id !== existing.id) {
        await duplicate.delete().catch(() => {});
      }
    }

    console.log("[ROBUX CASHOUT] Existing embed updated.");
    return existing;
  }

  const sent = await channel.send(payload);
  console.log("[ROBUX CASHOUT] New embed created.");
  return sent;
}

// ==================================================
// RANKED ROLES EMBED — !ranked
// ==================================================

function makeRankedRolesEmbed() {
  const roleList = RANKED_ROLE_IDS
    .map((roleId, index) => `**${index + 1}.** <@&${roleId}>`)
    .join("\n\n");

  return new EmbedBuilder()
    .setTitle(".gg/chuppys ranked roles")
    .setDescription(roleList)
    .setColor("#FFFFFF")
    .setThumbnail(RANKED_ROLES_THUMBNAIL_URL)
    .setFooter({ text: ".gg/chuppys" });
}

async function sendRankedRoles(guild) {
  const channel = await guild.channels.fetch(RANKED_ROLES_CHANNEL_ID);

  if (!channel || !channel.isTextBased() || !channel.send) {
    throw new Error("Ranked roles channel not found or invalid.");
  }

  const sent = await channel.send({
    embeds: [makeRankedRolesEmbed()],
    allowedMentions: { parse: [] }
  });

  console.log(
    `[RANKED ROLES] Embed sent in ${channel.id}. Message: ${sent.id}`
  );

  return sent;
}

// ==================================================
// VOUCH COUNTERS
// ==================================================

async function countChannelMessages(channel) {
  if (!channel || !channel.isTextBased() || !channel.messages) {
    throw new Error(
      `Vouch source channel ${channel?.id || "unknown"} is unavailable.`
    );
  }

  let count = 0;
  let before;

  while (true) {
    const options = { limit: 100 };
    if (before) options.before = before;

    const messages = await channel.messages.fetch(options);

    if (messages.size === 0) break;

    count += messages.size;
    before = messages.last().id;

    if (messages.size < 100) break;
  }

  return count;
}

async function renameCounterChannel(channelId, name) {
  const channel = await client.channels.fetch(channelId);

  if (!channel || typeof channel.setName !== "function") {
    throw new Error(
      `Counter channel ${channelId} was not found or cannot be renamed.`
    );
  }

  if (channel.name !== name) {
    await channel.setName(name);
    console.log(`[VOUCH COUNTER] Updated channel name: ${name}`);
  }
}

async function recountAllVouches() {
  if (vouchCounterUpdateRunning) {
    vouchCounterRecountRequested = true;
    return;
  }

  vouchCounterUpdateRunning = true;

  try {
    do {
      vouchCounterRecountRequested = false;

      const personalChannel = await client.channels.fetch(
        PERSONAL_VOUCH_CHANNEL_ID
      );

      const regularChannel = await client.channels.fetch(
        VOUCH_CHANNEL_ID
      );

      const personalCount = await countChannelMessages(personalChannel);
      const regularCount = await countChannelMessages(regularChannel);

      const chuppyName =
        `${CHUPPY_COUNT_PREFIX}${personalCount}${CHUPPY_COUNT_SUFFIX}`;

      const serverTotal = personalCount + regularCount;
      const serverName =
        `${SERVER_COUNT_PREFIX}${serverTotal}${SERVER_COUNT_SUFFIX}`;

      await Promise.all([
        renameCounterChannel(CHUPPY_COUNT_CHANNEL_ID, chuppyName),
        renameCounterChannel(SERVER_COUNT_CHANNEL_ID, serverName)
      ]);

      console.log(
        `[VOUCH COUNTER] Personal: ${personalCount} | ` +
        `Regular: ${regularCount} | Server total: ${serverTotal}`
      );
    } while (vouchCounterRecountRequested);
  } catch (error) {
    console.error("[VOUCH COUNTER] Recount failed:", error);
  } finally {
    vouchCounterUpdateRunning = false;

    if (vouchCounterRecountRequested) {
      scheduleVouchCounterUpdate();
    }
  }
}

function scheduleVouchCounterUpdate() {
  clearTimeout(vouchCounterTimer);

  vouchCounterTimer = setTimeout(() => {
    recountAllVouches();
  }, 2000);
}

// ==================================================
// VOUCH TUTORIAL — !vouchtut
// ==================================================

async function sendVouchTutorial(guild) {
  const channel = await guild.channels.fetch(VOUCH_TUTORIAL_CHANNEL_ID);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Vouch tutorial channel not found.");
  }

  const embeds = [
    new EmbedBuilder()
      .setTitle("HOW TO VOUCH")
      .setDescription(
        "Please follow this tutorial to leave a vouch!\n\n" +
        "Stay inside your **purchase or cash-out ticket** while completing " +
        "the process.\n\n" +
        "When you're ready, use the **`/vouch`** command."
      )
      .setColor("#FFFFFF")
      .setFooter({ text: ".gg/chuppys" }),

    new EmbedBuilder()
      .setTitle("STEP 1 — USE /VOUCH")
      .setDescription(
        "Run the **`/vouch`** slash command in your ticket. Select the " +
        "seller you purchased from and complete the fields that appear."
      )
      .setImage(VOUCH_TUTORIAL_IMAGES.command)
      .setColor("#FFFFFF")
      .setFooter({ text: ".gg/chuppys" }),

    new EmbedBuilder()
      .setTitle("WHAT TO FILL IN")
      .setDescription(
        "**Seller:** Select the seller you purchased from.\n\n" +
        "**Rating:** Give your honest rating of the transaction.\n\n" +
        "**Order:** Describe what you purchased or the service you received.\n\n" +
        "**Proof:** Provide the requested proof or screenshot if prompted.\n\n" +
        "Check your answers before submitting."
      )
      .setColor("#FFFFFF")
      .setFooter({ text: ".gg/chuppys" }),

    new EmbedBuilder()
      .setTitle("EXAMPLE OF A COMPLETED VOUCH")
      .setDescription(
        "If the command was completed correctly, your vouch should look " +
        "similar to this! ↓"
      )
      .setImage(VOUCH_TUTORIAL_IMAGES.completed)
      .setColor("#FFFFFF")
      .setFooter({ text: ".gg/chuppys" }),

    new EmbedBuilder()
      .setTitle("SUCCESSFULLY SUBMITTED")
      .setDescription(
        "Once you submit the command successfully, your vouch should appear " +
        "in the appropriate vouch channel.\n\n" +
        "Make sure your vouch accurately describes your actual transaction."
      )
      .setImage(VOUCH_TUTORIAL_IMAGES.success)
      .setColor("#FFFFFF")
      .setFooter({ text: ".gg/chuppys" })
  ];

  for (const embed of embeds) {
    await channel.send({ embeds: [embed] });
  }

  console.log(`[VOUCH TUTORIAL] Tutorial posted in ${channel.id}`);
}

// ==================================================
// HELP EMBED — /help
// ==================================================

function makeHelpEmbed() {
  return new EmbedBuilder()
    .setTitle(".gg/chuppys Bot Commands")
    .setDescription(
      "Here is a list of available commands and what they do.\n\n" +
      "Use the commands below to access the bot's features."
    )
    .addFields(
      {
        name: "General Commands",
        value:
          "`/help` — Displays this command menu.\n" +
          "`/question` — Submit a question to the Chuppys team.\n" +
          "`/request` — Request items for Chuppys to stock up on.\n" +
          "`/vouch` — Submit a vouch for a completed transaction.\n" +
          "`,afk [reason]` — Set your AFK status.\n" +
          "`,pay` — Displays available payment methods.\n" +
          "`,client` — Posts or updates the client-role message."
      },
      {
        name: "Support Commands",
        value:
          "`,r @user c` — Gives a member the Chuppys role.\n" +
          "`,r @user r` — Sends a member a vouch reminder.\n" +
          "`,partner` — Displays partnership instructions.\n" +
          "`,mod` — Displays moderator responsibilities.\n" +
          "`,seller` — Displays seller application information.\n" +
          "`,promoter` — Displays promoter responsibilities and application questions."
      },
      {
        name: "Service Commands",
        value:
          "`,nitro` / `!nitro` — Updates the Nitro price list.\n" +
          "`,decor` / `!decor` — Updates the Decor price list.\n" +
          "`,boosties` / `!boosties` — Updates the Boosties price list.\n" +
          "`,sellers` / `!sellers` — Posts the seller list.\n" +
          "`,staff` / `!staff` — Posts the staff list."
      },
      {
        name: "Additional Commands",
        value:
          "`!vouchtut` — Posts the vouch tutorial.\n" +
          "`!ranked` — Posts the ranked roles list.\n" +
          "`!robuxcashout` — Posts Robux cashout rates.\n" +
          "`!testwelcome` — Tests the welcome embed.\n" +
          "`!testgoodbye` — Tests the goodbye embed."
      }
    )
    .setColor("#FFFFFF")
    .setThumbnail(
      "https://cdn.discordapp.com/emojis/1569039366880235560.png"
    )
    .setFooter({ text: ".gg/chuppys" });
}

// ==================================================
// PROMOTER RESPONSIBILITIES — ,promoter
// ==================================================

function makePromoterEmbed() {
  return new EmbedBuilder()
    .setTitle(".gg/chuppys promoter information")
    .setDescription(
      "**Interested in becoming a .gg/chuppys promoter?**\n\n" +

      "**Promoter Responsibilities**\n\n" +
      "• Actively advertise and promote **.gg/chuppys**.\n" +
      "• Help bring genuine new members into the server.\n" +
      "• Share the server with your audience and on your platforms.\n" +
      "• Help the community grow and attract potential customers.\n" +
      "• Represent Chuppys in a positive and respectful way.\n" +
      "• Keep promotions appropriate and follow platform rules.\n" +
      "• Do not use fake invites, spam, or misleading advertisements.\n\n" +

      "**Promoter Application Questions**\n\n" +
      "**1. Do you have a following base?**\n" +
      "If so, how many followers do you have and what platform are they on?\n\n" +
      "**2. How many invites do you think you will gain monthly?**\n\n" +

      "**Payment Information**\n\n" +
      "Promoters are paid **monthly**. Payment details and arrangements " +
      "will be discussed with management.\n\n" +

      "If you're interested, please answer both application questions " +
      "and send your answers to the Chuppys team."
    )
    .setColor("#FFFFFF")
    .setFooter({ text: ".gg/chuppys" });
}

// ==================================================
// CLIENT READY
// ==================================================

client.once(Events.ClientReady, async readyClient => {
  console.log(`[READY] Logged in as ${readyClient.user.tag}`);
  console.log("[READY] Chuppys bot is online.");

  readyClient.user.setActivity(".gg/chuppys", { type: 3 });

  await registerQuestionCommand();
  await recountAllVouches();
  await sendOrUpdateVerificationMessage();

  setInterval(() => {
    if (client.isReady()) scheduleVouchCounterUpdate();
  }, 5 * 60 * 1000);
});

// ==================================================
// QUESTION + REQUEST + VERIFICATION + CLIENT INTERACTIONS
// ==================================================

client.on(Events.InteractionCreate, async interaction => {
  try {

    // ==================================================
    // /HELP COMMAND
    // ==================================================

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "help"
    ) {
      await interaction.reply({
        embeds: [makeHelpEmbed()],
        ephemeral: true
      });

      return;
    }

    // ==================================================
    // /REQUEST COMMAND
    // ==================================================

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "request"
    ) {
      if (interaction.channelId !== REQUEST_CHANNEL_ID) {
        await interaction.reply({
          content:
            `Please use \`/request\` in <#${REQUEST_CHANNEL_ID}>.`,
          ephemeral: true
        });
        return;
      }

      const category = interaction.options.getString("category", true);
      const items = interaction.options.getString("items", true).trim();

      const validCategories = [
        "Baddies",
        "MM2",
        "Adopt Me",
        "Blade Ball",
        "Robux"
      ];

      if (!validCategories.includes(category)) {
        await interaction.reply({
          content: "Please select a valid category.",
          ephemeral: true
        });
        return;
      }

      if (!items) {
        await interaction.reply({
          content: "Please enter the items you want to request.",
          ephemeral: true
        });
        return;
      }

      const requestEmbed = new EmbedBuilder()
        .setTitle(`${category} Request`)
        .setDescription(
          `**Requested by:** <@${interaction.user.id}>\n\n` +
          `**Category:** ${category}\n\n` +
          `**What they'd like Chuppys to stock up on:**\n${items}`
        )
        .setColor("#FFFFFF")
        .setThumbnail(REQUEST_THUMBNAIL_URL)
        .setFooter({ text: ".gg/chuppys" })
        .setTimestamp();

      const requestChannel = await client.channels.fetch(
        REQUEST_CHANNEL_ID
      );

      if (
        !requestChannel ||
        !requestChannel.isTextBased() ||
        !requestChannel.send
      ) {
        await interaction.reply({
          content: "I couldn't find the stock request channel.",
          ephemeral: true
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      await requestChannel.send({
        embeds: [requestEmbed],
        allowedMentions: { parse: [] }
      });

      await interaction.editReply({
        content:
          `Your **${category}** request has been submitted! ` +
          "Thank you for helping Chuppys decide what to stock. ♡"
      });

      console.log(
        `[REQUEST] ${interaction.user.tag} submitted a ${category} request.`
      );

      return;
    }

    // ==================================================
    // VERIFY BUTTON
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === VERIFY_BUTTON_ID
    ) {
      if (!interaction.guild) {
        await interaction.reply({
          content: "Verification can only be completed inside the server.",
          ephemeral: true
        });
        return;
      }

      const member = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);

      if (!member) {
        await interaction.reply({
          content: "I couldn't find your server membership. Please try again.",
          ephemeral: true
        });
        return;
      }

      if (member.roles.cache.has(CHUPPYS_ROLE_ID)) {
        await interaction.reply({
          content: "You're already verified and have full access to .gg/chuppys!",
          ephemeral: true
        });
        return;
      }

      const requirements = checkVerificationRequirements(member);

      if (!requirements.passed) {
        await interaction.reply({
          content:
            `Please select your roles in <#${ROLES_CHANNEL_ID}> before verifying.\n\n` +
            "You need at least one age role, one pronoun role, and two ping roles.",
          ephemeral: true
        });
        return;
      }

      await member.roles.add(
        CHUPPYS_ROLE_ID,
        "Successfully completed Chuppys verification."
      );

      await interaction.reply({
        content:
          `${AFK_RETURN_EMOJI} You're verified! You now have full access to **.gg/chuppys**.`,
        ephemeral: true
      });

      console.log(`[VERIFY] ${member.user.tag} verified successfully.`);
      return;
    }

    // ==================================================
    // CLIENT ROLE BUTTON
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === CLIENT_BUTTON_ID
    ) {
      if (!interaction.guild) {
        await interaction.reply({
          content: "This button can only be used inside the server.",
          ephemeral: true
        });
        return;
      }

      const member = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);

      if (!member) {
        await interaction.reply({
          content: "I couldn't find your server membership.",
          ephemeral: true
        });
        return;
      }

      if (member.roles.cache.has(CLIENT_ROLE_ID)) {
        await interaction.reply({
          content: "You already have the client role!",
          ephemeral: true
        });
        return;
      }

      await member.roles.add(
        CLIENT_ROLE_ID,
        "Member claimed the Chuppys client role."
      );

      await interaction.reply({
        content:
          `${CLIENT_EMOJI} You've received the client role! ` +
          "You can now submit your vouch.",
        ephemeral: true
      });

      console.log(`[CLIENT] ${member.user.tag} received the client role.`);
      return;
    }

    // ==================================================
    // /QUESTION COMMAND
    // ==================================================

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "question"
    ) {
      if (interaction.channelId !== QUESTION_CHANNEL_ID) {
        await interaction.reply({
          content:
            `Please use \`/question\` in <#${QUESTION_CHANNEL_ID}>.`,
          ephemeral: true
        });
        return;
      }

      const questionText = interaction.options.getString("question", true);
      const picture = interaction.options.getAttachment("picture");

      if (picture && !picture.contentType?.startsWith("image/")) {
        await interaction.reply({
          content: "The optional picture must be an image.",
          ephemeral: true
        });
        return;
      }

      const questionEmbed = new EmbedBuilder()
        .setTitle(`Question from ${interaction.user.username}`)
        .setDescription(`**Question**\n${questionText}`)
        .setColor("#FFFFFF")
        .setThumbnail(QUESTION_EMOJI_URL)
        .setFooter({
          text: `.gg/chuppys • Question User ID: ${interaction.user.id}`
        })
        .setTimestamp();

      if (picture) {
        questionEmbed.setImage(picture.url);
      }

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("question_ticket")
          .setLabel("Make a Support Ticket")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("question_reply")
          .setLabel("Reply to Question")
          .setEmoji("💬")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({
        embeds: [questionEmbed],
        components: [buttons],
        allowedMentions: { parse: [] }
      });

      await interaction.reply({
        content: "Your question has been submitted!",
        ephemeral: true
      });

      return;
    }

    // ==================================================
    // QUESTION TICKET BUTTON
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "question_ticket"
    ) {
      const ticketEmbed = new EmbedBuilder()
        .setDescription(
          "This question requires a support ticket.\n\n" +
          `Please make one in <#${QUESTION_TICKET_CHANNEL_ID}> and ` +
          `ping <@&${TICKET_SUPPORT_ROLE_ID}> for assistance.\n\n` +
          "Thank you! <:uppyty:1561094713153429746>"
        )
        .setColor("#FFFFFF")
        .setThumbnail(QUESTION_EMOJI_URL)
        .setFooter({ text: ".gg/chuppys" });

      await interaction.reply({
        embeds: [ticketEmbed],
        ephemeral: true,
        allowedMentions: { parse: [] }
      });

      return;
    }

    // ==================================================
    // QUESTION REPLY BUTTON
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "question_reply"
    ) {
      if (!canReplyToQuestion(interaction)) {
        await interaction.reply({
          content:
            "Only Ticket Support, moderators, administrators, or the server owner can reply to questions.",
          ephemeral: true
        });
        return;
      }

      const replyModal = new ModalBuilder()
        .setCustomId(
          `question_reply_modal:${interaction.message.id}`
        )
        .setTitle("Reply to Question");

      const replyInput = new TextInputBuilder()
        .setCustomId("question_reply_text")
        .setLabel("Your response")
        .setPlaceholder("Write your response to the user here...")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(2000);

      replyModal.addComponents(
        new ActionRowBuilder().addComponents(replyInput)
      );

      await interaction.showModal(replyModal);
      return;
    }

    // ==================================================
    // QUESTION REPLY MODAL
    // ==================================================

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("question_reply_modal:")
    ) {
      if (!canReplyToQuestion(interaction)) {
        await interaction.reply({
          content: "You are not allowed to reply to questions.",
          ephemeral: true
        });
        return;
      }

      const questionMessageId =
        interaction.customId.split(":")[1];

      const answerText =
        interaction.fields.getTextInputValue("question_reply_text");

      const questionChannel = await client.channels.fetch(
        QUESTION_CHANNEL_ID
      );

      if (!questionChannel || !questionChannel.isTextBased()) {
        await interaction.reply({
          content: "I couldn't find the question channel.",
          ephemeral: true
        });
        return;
      }

      const questionMessage = await questionChannel.messages
        .fetch(questionMessageId)
        .catch(() => null);

      if (!questionMessage) {
        await interaction.reply({
          content:
            "I couldn't find the original question. It may have been deleted.",
          ephemeral: true
        });
        return;
      }

      const originalEmbed = questionMessage.embeds[0];
      const footerText = originalEmbed?.footer?.text || "";
      const userIdMatch = footerText.match(/Question User ID:\s*(\d+)/);

      if (!userIdMatch) {
        await interaction.reply({
          content:
            "I couldn't identify the person who submitted this question.",
          ephemeral: true
        });
        return;
      }

      const questionUserId = userIdMatch[1];

      const questionUser = await client.users
        .fetch(questionUserId)
        .catch(() => null);

      if (!questionUser) {
        await interaction.reply({
          content: "I couldn't find that user's Discord account.",
          ephemeral: true
        });
        return;
      }

      const responseEmbed = new EmbedBuilder()
        .setTitle("Response to Your Question")
        .setDescription(
          `${QUESTION_EMOJI} **Replied by:** ${interaction.user.username}\n\n` +
          `**Response:**\n${answerText}`
        )
        .setColor("#FFFFFF")
        .setThumbnail(QUESTION_EMOJI_URL)
        .setFooter({ text: ".gg/chuppys" })
        .setTimestamp();

      try {
        await questionUser.send({
          embeds: [responseEmbed],
          allowedMentions: { parse: [] }
        });
      } catch (error) {
        await interaction.reply({
          content:
            "I couldn't DM that user. They may have their direct messages disabled.",
          ephemeral: true
        });
        return;
      }

      await interaction.reply({
        content:
          `Your response was sent privately to **${questionUser.username}**.`,
        ephemeral: true
      });

      return;
    }

  } catch (error) {
    console.error("[INTERACTION] Error:", error);

    if (interaction.isRepliable()) {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content: "Something went wrong while processing that interaction."
        }).catch(() => {});
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Something went wrong while processing that interaction.",
          ephemeral: true
        }).catch(() => {});
      }
    }
  }
});

// ==================================================
// VOUCH COUNTER + AUTO-REACTION
// ==================================================

client.on(Events.MessageCreate, async message => {
  if (!VOUCH_SOURCE_CHANNEL_IDS.includes(message.channel.id)) return;

  scheduleVouchCounterUpdate();

  try {
    await message.react(CHUPPY_TY_EMOJI);
  } catch (error) {
    console.error(
      `[VOUCH REACTION] Could not react to message ${message.id}:`,
      error.message
    );
  }
});

client.on(Events.MessageDelete, message => {
  if (!VOUCH_SOURCE_CHANNEL_IDS.includes(message.channel.id)) return;
  scheduleVouchCounterUpdate();
});

client.on(Events.MessageBulkDelete, messages => {
  const affectsVouchChannel = messages.some(message =>
    VOUCH_SOURCE_CHANNEL_IDS.includes(message.channel.id)
  );

  if (affectsVouchChannel) scheduleVouchCounterUpdate();
});

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async member => {
  try {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    await member.roles.add(WELCOME_ROLE_ID).catch(error => {
      console.error("[WELCOME] Could not assign role:", error);
    });

    const embed = new EmbedBuilder()
      .setTitle(`Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`)
      .setDescription(
        `Welcome ${member}!\n\n` +
        "We're happy to have you here. Make sure to read the rules " +
        "and enjoy your time in the server!"
      )
      .setColor("#FFFFFF")
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(WELCOME_IMAGE)
      .setFooter({ text: member.guild.name });

    await channel.send({ content: `${member}`, embeds: [embed] });
  } catch (error) {
    console.error("[WELCOME] Error:", error);
  }
});

// ==================================================
// GOODBYE
// ==================================================

client.on(Events.GuildMemberRemove, async member => {
  try {
    const channel = await member.guild.channels.fetch(GOODBYE_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(`Goodbye ${AFK_GOING_EMOJI}`)
      .setDescription(
        `**${member.user.username}** has left **${member.guild.name}**.\n\n` +
        "We hope to see you again!"
      )
      .setColor("#FFFFFF")
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: member.guild.name });

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("[GOODBYE] Error:", error);
  }
});

// ==================================================
// PAYMENT EMBED — ,pay
// ==================================================

async function sendPaymentEmbed(channel) {
  if (!channel || !channel.isTextBased() || !channel.messages) {
    throw new Error("Payment channel not found or invalid.");
  }

  const embed = new EmbedBuilder()
    .setTitle("Payment Methods")
    .setDescription(
      "Choose a payment method below.\n\n" +
      "Please make sure the payment information is correct before sending."
    )
    .addFields(
      { name: "Cash App", value: `\`${CASHAPP_USERNAME}\`` },
      { name: "PayPal", value: `\`${PAYPAL_USERNAME}\`` },
      { name: "Apple Pay", value: `\`${APPLE_PAY}\`` },
      { name: "Zelle", value: `\`${ZELLE}\`` }
    )
    .setColor("#FFFFFF")
    .setThumbnail(PAYMENT_EMOJI_URL)
    .setFooter({ text: ".gg/chuppys" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Cash App")
      .setStyle(ButtonStyle.Link)
      .setURL(CASHAPP_URL),
    new ButtonBuilder()
      .setLabel("PayPal")
      .setStyle(ButtonStyle.Link)
      .setURL(PAYPAL_URL)
  );

  const payload = { embeds: [embed], components: [row] };
  const messages = await channel.messages.fetch({ limit: 100 });

  const matches = messages.filter(msg =>
    msg.author.id === client.user.id &&
    msg.embeds.some(existingEmbed =>
      existingEmbed.title === "Payment Methods"
    )
  );

  const existing = matches.first();

  if (existing) {
    await existing.edit(payload);

    for (const duplicate of matches.values()) {
      if (duplicate.id !== existing.id) {
        await duplicate.delete().catch(() => {});
      }
    }

    return existing;
  }

  return channel.send(payload);
}

// ==================================================
// SERVICE MESSAGE UPDATER
// ==================================================

async function updateServiceMessage(channel, embed, serviceName) {
  if (!channel || !channel.isTextBased() || !channel.messages) {
    throw new Error(`${serviceName} channel not found or invalid.`);
  }

  const messages = await channel.messages.fetch({ limit: 100 });

  const matching = messages.filter(msg => {
    if (msg.author.id !== client.user.id || !msg.embeds.length) {
      return false;
    }

    const description = msg.embeds[0].description || "";

    if (serviceName === "DECOR") return description.includes("# DECOR");
    if (serviceName === "NITRO") return description.includes("# NITRO");

    if (serviceName === "BOOSTIES") {
      return (
        description.includes("# 1 MONTH") ||
        description.includes("# 3 MONTHS")
      );
    }

    return false;
  });

  const existing = matching.first();

  if (existing) {
    await existing.edit({
      content: "",
      embeds: [embed],
      components: []
    });

    for (const duplicate of matching.values()) {
      if (duplicate.id !== existing.id) {
        await duplicate.delete().catch(() => {});
      }
    }

    return existing;
  }

  return channel.send({ embeds: [embed] });
}

// ==================================================
// DECOR
// ==================================================

async function sendDecorServices(channel) {
  const embed = new EmbedBuilder()
    .setDescription(
      `# DECOR ${SERVICE_EMOJI}\n\n` +
      "*original price • our price*\n\n" +
      "$4.99-$5.99 • **$3.00**\n" +
      "$6.99-$8.99 • **$5.00**\n" +
      "$9.99-$11.99 • **$8.00**\n" +
      "$12.99-$14.99 • **$9.00**\n" +
      "$15.99-$17.99 • **$10.00**\n" +
      "$18.99-$20.00 • **$13.00**\n" +
      "$21.99-$23.99 • **$15.00**\n\n" +
      `# BUNDLES ${SERVICE_EMOJI}\n\n` +
      "*original price • our price*\n\n" +
      "$8.99 • **$6.50**\n" +
      "$10.99 • **$7.50**\n" +
      "$12.99 • **$8.50**\n" +
      "$14.99 • **$9.50**\n" +
      "$17.99 • **$13.50**\n" +
      "$21.99 • **$15.00**\n" +
      "$22.99 • **$16.00**\n\n" +
      "All legally purchased and will be sent the same day!\n\n" +
      `${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
    )
    .setColor("#FFFFFF");

  await updateServiceMessage(channel, embed, "DECOR");
}

// ==================================================
// NITRO
// ==================================================

async function sendNitroServices(channel) {
  const embed = new EmbedBuilder()
    .setDescription(
      `# NITRO ${SERVICE_EMOJI}\n\n` +
      "**1 Month + No War — $7.25**\n\n" +
      "**1 Month + War — $9.25**\n\n" +
      `${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
    )
    .setColor("#FFFFFF");

  await updateServiceMessage(channel, embed, "NITRO");
}

// ==================================================
// BOOSTIES
// ==================================================

async function sendBoostiesServices(channel) {
  const oneMonth = [
    ["2", "$1.25"], ["4", "$2.50"], ["6", "$3.75"],
    ["8", "$4.00"], ["10", "$5.25"], ["12", "$6.50"],
    ["14", "$7.00"], ["16", "$8.50"], ["18", "$9.00"],
    ["20", "$9.50"], ["30", "$11.00"]
  ];

  const threeMonths = [
    ["2", "$2.00"], ["4", "$4.00"], ["6", "$6.00"],
    ["8", "$8.00"], ["10", "$10.00"], ["12", "$12.00"],
    ["14", "$14.00"], ["16", "$16.00"], ["18", "$18.00"],
    ["20", "$20.00"], ["30", "$27.00"]
  ];

  const embed = new EmbedBuilder()
    .setDescription(
      `# 1 MONTH ${BOOST_EMOJI}\n\n` +
      oneMonth.map(([count, price]) =>
        `${BOOST_EMOJI} **${count} • ${price}**`
      ).join("\n") +
      `\n\n# 3 MONTHS ${BOOST_EMOJI}\n\n` +
      threeMonths.map(([count, price]) =>
        `${BOOST_EMOJI} **${count} • ${price}**`
      ).join("\n") +
      `\n\n${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
    )
    .setColor("#FFFFFF");

  await updateServiceMessage(channel, embed, "BOOSTIES");
}

// ==================================================
// SELLERS
// ==================================================

function makeSellersEmbed() {
  const sellers = [
    ["1192248188409749684", "services seller", "no limit"],
    ["1079241163455873074", "seller", "no limit"],
    ["1032693136163622993", "seller", "$45"],
    ["1320199904219496530", "seller", "$35"],
    ["952566845939023892", "seller", "no limit"],
    ["1473335012769267807", "seller", "$100"],
    ["1472856287527309313", "seller", "$100"],
    ["1269188505935024141", "seller", "$250"],
    ["1427118849215692920", "seller", "$50"],
    ["1328450205774909441", "seller", "$100"]
  ];

  const lines = ["# .gg/chuppys sellers", ""];

  for (const [id, role, limit] of sellers) {
    lines.push(
      `${SELLER_EMOJI} **<@${id}>**`,
      `Role: ${role}`,
      `Limit: ${limit}`,
      `ID: ${id}`,
      ""
    );
  }

  lines.push(
    "-# my sellers are prohibited from dm’ing you, if for whatever reason they do please open a support ticket."
  );

  return new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription(lines.join("\n"));
}

// ==================================================
// STAFF
// ==================================================

function makeStaffEmbed() {
  return new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription([
      "# .gg/chuppys staff",
      "",
      `${SELLER_EMOJI} **<@1530733554869473320>**`,
      "Role: owner | seller",
      "Limit: no limit",
      "ID: 1530733554869473320",
      "",
      `${SELLER_EMOJI} **<@1490962480963260466>**`,
      "Role: owner | seller",
      "Limit: no limit",
      "ID: 1490962480963260466",
      "",
      `${SELLER_EMOJI} **<@1381473377696350238>**`,
      "Role: Admin | staff",
      "ID: 1381473377696350238",
      "",
      `${SELLER_EMOJI} **<@727673410737668107>**`,
      "Role: Admin | staff",
      "ID: 727673410737668107",
      "",
      `${SELLER_EMOJI} **<@1398772218359451668>**`,
      "Role: Mod | staff",
      "ID: 1398772218359451668",
      "",
      `${SELLER_EMOJI} **<@941559349808091167>**`,
      "Role: Mod | staff",
      "ID: 941559349808091167",
      "",
      `${SELLER_EMOJI} **<@952566845939023892>**`,
      "Role: Mod | seller",
      "Limit: no limit",
      "ID: 952566845939023892",
      ""
    ].join("\n"));
}

// ==================================================
// MODERATOR RESPONSIBILITIES — ,mod
// ==================================================

function makeModEmbed() {
  return new EmbedBuilder()
    .setTitle(".gg/chuppys moderator responsibilities")
    .setDescription(
      "**Server Moderation**\n\n" +
      "• Keep the server organized, safe, and welcoming.\n" +
      "• Monitor chats and make sure members follow the server rules.\n" +
      "• Address rule violations fairly and professionally.\n" +
      "• Help prevent spam, harassment, scams, and inappropriate behavior.\n\n" +

      "**Ticket Assistance**\n\n" +
      "• Help members who need assistance with their tickets.\n" +
      "• Respond to questions and concerns in a timely manner.\n" +
      "• Make sure tickets are handled respectfully and correctly.\n" +
      "• Escalate situations to an owner when necessary.\n\n" +

      "**Member Assistance**\n\n" +
      "• Help members understand how the server works.\n" +
      "• Direct members to the correct channels and resources.\n" +
      "• Assist with verification and server access when needed.\n" +
      "• Treat every member with patience and respect.\n\n" +

      "**Seller & Transaction Safety**\n\n" +
      "• Help members understand the vouch process.\n" +
      "• Remind members to use the appropriate support channels.\n" +
      "• Take reports about suspicious behavior seriously.\n" +
      "• Never ignore reports involving potential scams or seller misconduct.\n\n" +

      "**Staff Expectations**\n\n" +
      "• Remain active and professional.\n" +
      "• Do not abuse moderator permissions.\n" +
      "• Do not share private staff discussions or information.\n" +
      "• Avoid unnecessary arguments with members.\n" +
      "• Be fair and consistent when handling situations.\n\n" +

      "**Important Rules**\n\n" +
      "• Do not use your staff position for personal benefits.\n" +
      "• Do not threaten members with staff permissions.\n" +
      "• Contact an owner if you are unsure how to handle a situation.\n" +
      "• Remember that being staff means representing **.gg/chuppys**.\n\n" +

      "-# Thank you for helping keep .gg/chuppys a safe and welcoming community."
    )
    .setColor("#FFFFFF")
    .setFooter({ text: ".gg/chuppys" });
}

// ==================================================
// SHARED EMBED SENDER
// ==================================================

async function sendEmbedToChannel(guild, channelId, embed, label) {
  const channel = await guild.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error(`${label} channel not found or is not a text channel.`);
  }

  await channel.send({
    embeds: [embed],
    allowedMentions: { parse: [] }
  });
}

// ==================================================
// AFK HANDLER
// ==================================================

async function handleAFK(message) {
  const guildId = message.guild.id;
  const userId = message.author.id;
  const afkKey = `${guildId}:${userId}`;
  const rawContent = message.content.trim();

  const afkMatch = rawContent.match(/^,afk(?:\s+([\s\S]*))?$/i);

  if (afkMatch) {
    const reason = (afkMatch[1] || "No reason provided.")
      .trim()
      .slice(0, 500) || "No reason provided.";

    afkUsers.set(afkKey, {
      reason,
      since: Date.now(),
      username: message.author.username
    });

    await message.reply({
      content:
        `${AFK_GOING_EMOJI} ${message.author}, you're now AFK!\n` +
        `**Reason:** ${reason}`,
      allowedMentions: { repliedUser: false }
    });

    return true;
  }

  if (afkUsers.has(afkKey)) {
    const oldAFK = afkUsers.get(afkKey);
    afkUsers.delete(afkKey);

    await message.channel.send({
      content:
        `${AFK_RETURN_EMOJI} Welcome back, ${message.author}! ` +
        "Your AFK status has been removed.",
      allowedMentions: { parse: [] }
    });

    console.log(
      `[AFK] ${message.author.tag} returned. Previous reason: ${oldAFK.reason}`
    );
  }

  const notifiedUsers = new Set();

  for (const [mentionedUserId, user] of message.mentions.users) {
    if (mentionedUserId === userId || user.bot) continue;

    const afkData = afkUsers.get(`${guildId}:${mentionedUserId}`);

    if (!afkData || notifiedUsers.has(mentionedUserId)) continue;
    notifiedUsers.add(mentionedUserId);

    await message.channel.send({
      content:
        `${AFK_GOING_EMOJI} **${user.username} is currently AFK.**\n` +
        `**Reason:** ${afkData.reason}`,
      allowedMentions: { parse: [] }
    });
  }

  return false;
}

// ==================================================
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  const rawContent = message.content.trim();
  const content = rawContent.toLowerCase();

  try {
    if (/^(hi+|hey+|hello+|heya+)[!.?,\s]*$/i.test(rawContent)) {
      await message.reply({
        content: `Hi ! ${AFK_RETURN_EMOJI}`,
        allowedMentions: { repliedUser: false }
      });
      return;
    }

    const wasAFKCommand = await handleAFK(message);
    if (wasAFKCommand) return;

    // ==================================================
    // CLIENT — FAST SEND OR UPDATE
    // ==================================================

    if (content === ",client") {
      const channelId = message.channel.id;

      if (clientCommandLocks.has(channelId)) {
        console.log(
          `[CLIENT] Ignored simultaneous command in channel ${channelId}.`
        );
        return;
      }

      clientCommandLocks.add(channelId);

      try {
        const matching = await findClientRoleMessages(message.channel);

        const payload = {
          embeds: [makeClientEmbed()],
          components: [makeClientButton()],
          allowedMentions: { parse: [] }
        };

        if (matching.size > 0) {
          const existing = matching.first();

          await existing.edit(payload);

          const duplicates = matching.filter(
            msg => msg.id !== existing.id
          );

          if (duplicates.size > 0) {
            await Promise.all(
              duplicates.map(msg =>
                msg.delete().catch(error => {
                  console.error(
                    "[CLIENT] Duplicate deletion failed:",
                    error
                  );
                })
              )
            );
          }

          console.log(
            `[CLIENT] Updated existing message in ${channelId}.`
          );
        } else {
          await message.channel.send(payload);

          console.log(
            `[CLIENT] Created new message in ${channelId}.`
          );
        }
      } finally {
        clientCommandLocks.delete(channelId);
      }

      return;
    }

    // ==================================================
    // ,promoter — PROMOTER RESPONSIBILITIES
    // ==================================================

    if (content === ",promoter") {
      const channelId = message.channel.id;

      if (promoterCommandLocks.has(channelId)) {
        console.log(
          `[PROMOTER] Ignored simultaneous command in channel ${channelId}.`
        );
        return;
      }

      promoterCommandLocks.add(channelId);

      try {
        const messages = await message.channel.messages.fetch({
          limit: 100
        });

        const matching = messages.filter(msg =>
          msg.author.id === client.user.id &&
          msg.embeds.some(embed =>
            embed.title === ".gg/chuppys promoter information"
          )
        );

        const existing = matching.first();

        const payload = {
          embeds: [makePromoterEmbed()],
          content: "",
          components: [],
          allowedMentions: { parse: [] }
        };

        if (existing) {
          await existing.edit(payload);

          for (const duplicate of matching.values()) {
            if (duplicate.id !== existing.id) {
              await duplicate.delete().catch(error => {
                console.error(
                  "[PROMOTER] Could not delete duplicate:",
                  error
                );
              });
            }
          }

          console.log(
            `[PROMOTER] Updated promoter information in ${channelId}.`
          );
        } else {
          await message.channel.send(payload);

          console.log(
            `[PROMOTER] Created promoter information in ${channelId}.`
          );
        }
      } finally {
        promoterCommandLocks.delete(channelId);
      }

      return;
    }

    // ==================================================
    // VOUCH TUTORIAL — MANAGE SERVER ONLY
    // ==================================================

    if (content === "!vouchtut") {
      if (!message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )) {
        await message.reply({
          content: "You need **Manage Server** permission to use this command.",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      await sendVouchTutorial(message.guild);

      await message.reply({
        content: "The vouch tutorial has been posted!",
        allowedMentions: { repliedUser: false }
      });
      return;
    }

    // ==================================================
    // RANKED ROLES — MANAGE SERVER ONLY
    // ==================================================

    if (content === "!ranked") {
      if (!message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )) {
        await message.reply({
          content: "You need **Manage Server** permission to use this command.",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      await sendRankedRoles(message.guild);

      await message.reply({
        content: "The ranked roles embed has been sent!",
        allowedMentions: { repliedUser: false }
      });
      return;
    }

    // ==================================================
    // ,r @user c AND ,r @user r
    // TICKET SUPPORT ONLY
    // ==================================================

    if (/^,r(?:\s|$)/i.test(rawContent)) {
      if (!isTicketSupport(message.member)) {
        await message.reply({
          content: "Only Ticket Support can use this command.",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      const commandMatch = rawContent.match(
        /^,r\s+<@!?(\d+)>\s+([cr])$/i
      );

      if (!commandMatch) {
        await message.reply({
          content: "Usage: `,r @user c` or `,r @user r`",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      const targetId = commandMatch[1];
      const action = commandMatch[2].toLowerCase();

      const target = await message.guild.members
        .fetch(targetId)
        .catch(() => null);

      if (!target) {
        await message.reply({
          content: "I couldn't find that member in this server.",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      if (action === "c") {
        if (target.roles.cache.has(CHUPPYS_ROLE_ID)) {
          await message.reply({
            content: `${target.user.username} already has the Chuppys role.`,
            allowedMentions: { parse: [] }
          });
          return;
        }

        await target.roles.add(
          CHUPPYS_ROLE_ID,
          `Chuppys access granted by Ticket Support: ${message.author.tag}`
        );

        const embed = new EmbedBuilder()
          .setDescription(
            `Welcome to **.gg/chuppys**! Please check out ` +
            `<#${ROLES_CHANNEL_ID}> and <#${RULES_CHANNEL_ID}>. ` +
            `Enjoy shopping at Chuppy’s Market ${CHUPPYS_WELCOME_EMOJI}`
          )
          .setColor("#FFFFFF")
          .setFooter({ text: ".gg/chuppys" });

        await message.channel.send({
          content: `${target}`,
          embeds: [embed],
          allowedMentions: { users: [target.id] }
        });

        return;
      }

      if (action === "r") {
        const embed = new EmbedBuilder()
          .setTitle("Reminder to Vouch!")
          .setDescription(
            `Thank you for shopping at **.gg/chuppys**! ` +
            `${CHUPPYS_WELCOME_EMOJI}\n\n` +
            `Please check out <#${VOUCH_TUTORIAL_CHANNEL_ID}> to learn ` +
            `how to leave a vouch using the **/vouch** command.\n\n` +
            `And don't forget to stop by <#${QUICK_VOUCH_CHANNEL_ID}> ` +
            `for a quick vouch as well!\n\n` +
            `Not vouching sellers within the 2 day grace period will ` +
            `result in you being black listed in this server.`
          )
          .setColor("#FFFFFF")
          .setFooter({ text: ".gg/chuppys" });

        await message.channel.send({
          content: `${target}`,
          embeds: [embed],
          allowedMentions: { users: [target.id] }
        });

        return;
      }
    }

    // ==================================================
    // ,partner — PARTNERSHIP INSTRUCTIONS
    // ==================================================

    if (content === ",partner") {
      if (!isTicketSupport(message.member)) {
        await message.reply({
          content: "Only Ticket Support can use this command.",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      const partnerEmbed = new EmbedBuilder()
        .setDescription(
          `**.gg/chuppys partnership**\n\n` +
          `Please make sure all questions from the .gg/chuppys ` +
          `ticket bot are answered !! If not please answer them now !!\n\n` +
          `1.  **How many vouches ? Please show us proof !**\n\n\n` +
          `2.  **How many server members ?**\n\n\n` +
          `After these questions are answered, please copy and paste ` +
          `your server ad in this partnership ticket. Staff will post ` +
          `it shortly in <#1552387314049618041>.\n\n` +
          `Go to <#${PARTNER_AD_CHANNEL_ID}> to copy and paste ` +
          `Chuppys' ad. Once this is done, send a screenshot for proof.\n\n` +
          `Thank you for partnering with **.gg/chuppys!** ` +
          `${CHUPPYS_WELCOME_EMOJI}`
        )
        .setColor("#FFFFFF")
        .setFooter({ text: ".gg/chuppys" });

      const messages = await message.channel.messages.fetch({ limit: 100 });

      const matching = messages.filter(msg =>
        msg.author.id === client.user.id &&
        msg.embeds.some(embed =>
          (embed.description || "").includes(".gg/chuppys partnership")
        )
      );

      const existing = matching.first();

      const payload = {
        embeds: [partnerEmbed],
        content: "",
        components: [],
        allowedMentions: { parse: [] }
      };

      if (existing) {
        await existing.edit(payload);

        for (const duplicate of matching.values()) {
          if (duplicate.id !== existing.id) {
            await duplicate.delete().catch(() => {});
          }
        }
      } else {
        await message.channel.send(payload);
      }

      return;
    }

    // ==================================================
    // ,mod — MODERATOR RESPONSIBILITIES
    // ==================================================

    if (content === ",mod") {
      if (!isTicketSupport(message.member)) {
        await message.reply({
          content: "Only Ticket Support can use this command.",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      const messages = await message.channel.messages.fetch({
        limit: 100
      });

      const matching = messages.filter(msg =>
        msg.author.id === client.user.id &&
        msg.embeds.some(embed =>
          embed.title === ".gg/chuppys moderator responsibilities"
        )
      );

      const existing = matching.first();

      const payload = {
        embeds: [makeModEmbed()],
        content: "",
        components: [],
        allowedMentions: { parse: [] }
      };

      if (existing) {
        await existing.edit(payload);

        for (const duplicate of matching.values()) {
          if (duplicate.id !== existing.id) {
            await duplicate.delete().catch(error => {
              console.error("[MOD] Could not delete duplicate:", error);
            });
          }
        }

        console.log(
          `[MOD] Updated moderator responsibilities in ${message.channel.id}.`
        );
      } else {
        await message.channel.send(payload);

        console.log(
          `[MOD] Created moderator responsibilities in ${message.channel.id}.`
        );
      }

      return;
    }

    // ==================================================
    // ,seller — SELLER APPLICATION
    // ==================================================

    if (content === ",seller") {
      const channelId = message.channel.id;

      if (sellerCommandLocks.has(channelId)) {
        console.log(
          `[SELLER] Ignored simultaneous command in channel ${channelId}.`
        );
        return;
      }

      sellerCommandLocks.add(channelId);

      try {
        const sellerEmbed = new EmbedBuilder()
          .setDescription(
            `**Interested in selling at .gg/chuppys**\n\n` +
            `**Permanent fees**\n\n` +
            `$10 - permanent fee with no personal commands\n\n` +
            `$15 - permanent fee with personal commands\n\n` +
            `Personal commands are ones we can create for you or insert ` +
            `your code that allows you to use your personal payment command, ` +
            `ps command, etc.\n\n` +
            `Your limit is defined primarily based on how many personal ` +
            `vouches you have. If you have a server with multiple sellers, ` +
            `the vouches they received in your server do not increase your ` +
            `limit. However, after your limit is determined, every 2 vouches ` +
            `gained in .gg/chuppys increases your limit by $5.\n\n` +
            `If you agree and understand all of this, please ping ` +
            `<@&${TICKET_SUPPORT_ROLE_ID}> to assist you further. Thank you!`
          )
          .setColor("#FFFFFF")
          .setFooter({ text: ".gg/chuppys" });

        const messages = await message.channel.messages.fetch({
          limit: 100
        });

        const matching = messages.filter(msg =>
          msg.author.id === client.user.id &&
          msg.embeds.some(embed =>
            (embed.description || "").includes(
              "Interested in selling at .gg/chuppys"
            )
          )
        );

        const existing = matching.first();

        const payload = {
          embeds: [sellerEmbed],
          content: "",
          components: [],
          allowedMentions: {
            roles: [TICKET_SUPPORT_ROLE_ID]
          }
        };

        if (existing) {
          await existing.edit(payload);

          for (const duplicate of matching.values()) {
            if (duplicate.id !== existing.id) {
              await duplicate.delete().catch(error => {
                console.error(
                  "[SELLER] Could not delete duplicate:",
                  error
                );
              });
            }
          }

          console.log(
            `[SELLER] Updated existing seller embed in ${channelId}.`
          );
        } else {
          await message.channel.send(payload);

          console.log(
            `[SELLER] Created seller embed in ${channelId}.`
          );
        }
      } finally {
        sellerCommandLocks.delete(channelId);
      }

      return;
    }

    // ==================================================
    // ROBUX CASHOUT
    // ==================================================

    if (content === "!robuxcashout") {
      if (!message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )) {
        await message.reply(
          "You need **Manage Server** permission to use this command."
        );
        return;
      }

      const channel = await client.channels.fetch(ROBUX_CASHOUT_CHANNEL_ID);
      await sendRobuxCashoutEmbed(channel);
      await message.reply("Robux Cash Out message sent or updated successfully!");
      return;
    }

    // ==================================================
    // PAYMENT
    // ==================================================

    if (content === ",pay") {
      await sendPaymentEmbed(message.channel);
      return;
    }

    // ==================================================
    // ADMIN COMMANDS
    // ==================================================

    const adminCommands = [
      "!nitro", ",nitro",
      "!decor", ",decor",
      "!boosties", ",boosties",
      "!sellers", ",sellers",
      "!staff", ",staff"
    ];

    if (
      adminCommands.includes(content) &&
      !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
      await message.reply(
        "You need **Manage Server** permission to use this command."
      );
      return;
    }

    if (["!nitro", ",nitro"].includes(content)) {
      await sendNitroServices(
        await client.channels.fetch(NITRO_CHANNEL_ID)
      );
      await message.reply("Nitro message updated successfully.");
      return;
    }

    if (["!decor", ",decor"].includes(content)) {
      await sendDecorServices(
        await client.channels.fetch(DECOR_CHANNEL_ID)
      );
      await message.reply("Decor message updated successfully.");
      return;
    }

    if (["!boosties", ",boosties"].includes(content)) {
      await sendBoostiesServices(
        await client.channels.fetch(BOOSTIES_CHANNEL_ID)
      );
      await message.reply("Boosties message updated successfully.");
      return;
    }

    if (["!sellers", ",sellers"].includes(content)) {
      await sendEmbedToChannel(
        message.guild,
        SELLERS_CHANNEL_ID,
        makeSellersEmbed(),
        "Sellers"
      );
      await message.reply("The sellers message was sent!");
      return;
    }

    if (["!staff", ",staff"].includes(content)) {
      await sendEmbedToChannel(
        message.guild,
        STAFF_CHANNEL_ID,
        makeStaffEmbed(),
        "Staff"
      );
      await message.reply("The staff message was sent!");
      return;
    }

    // ==================================================
    // TEST WELCOME
    // ==================================================

    if (content === "!testwelcome") {
      const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);

      if (!channel || !channel.isTextBased()) {
        await message.reply("Welcome channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`)
        .setDescription(
          `Welcome ${message.author}!\n\n` +
          "We're happy to have you here. Make sure to read the rules " +
          "and enjoy your time in the server!"
        )
        .setColor("#FFFFFF")
        .setThumbnail(message.author.displayAvatarURL())
        .setImage(WELCOME_IMAGE)
        .setFooter({ text: message.guild.name });

      await channel.send({
        content: `${message.author}`,
        embeds: [embed]
      });

      return;
    }

    // ==================================================
    // TEST GOODBYE
    // ==================================================

    if (content === "!testgoodbye") {
      const channel = await client.channels.fetch(GOODBYE_CHANNEL_ID);

      if (!channel || !channel.isTextBased()) {
        await message.reply("Goodbye channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Goodbye ${AFK_GOING_EMOJI}`)
        .setDescription(
          `**${message.author.username}** has left ` +
          `**${message.guild.name}**.\n\nWe hope to see you again!`
        )
        .setColor("#FFFFFF")
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: message.guild.name });

      await channel.send({ embeds: [embed] });
      return;
    }
  } catch (error) {
    console.error("[MESSAGE COMMAND] Error:", error);

    await message.reply(
      `Something went wrong: ${error.message}`
    ).catch(() => {});
  }
});

// ==================================================
// INVITE BOT REACTION
// ==================================================

client.on(Events.MessageCreate, async message => {
  if (!message.guild) return;
  if (message.channel.id !== INVITE_CHANNEL_ID) return;
  if (message.author.id !== INVITE_BOT_ID) return;

  try {
    await message.react(INVITE_REACTION_EMOJI);
  } catch (error) {
    console.error(
      "[INVITE REACTION] Could not react to invite message:",
      error
    );
  }
});

// ==================================================
// ERROR HANDLING
// ==================================================

client.on("error", error => {
  console.error("[DISCORD CLIENT] Error:", error);
});

// ==================================================
// LOGIN
// ==================================================

if (!TOKEN) {
  console.error("[LOGIN] DISCORD_BOT_TOKEN is missing.");
} else {
  client.login(TOKEN).catch(error => {
    console.error("[LOGIN] Discord login failed:", error);
  });
}
