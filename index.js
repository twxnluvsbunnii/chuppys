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
// CHUPPYS ROLE COMMANDS
// ==================================================

const CHUPPYS_ROLE_ID = "1550230619127021568";
const TICKET_SUPPORT_ROLE_ID = "1563003884656398406";

const ROLES_CHANNEL_ID = "1530808091380285592";
const RULES_CHANNEL_ID = "1551275482857865336";

const VOUCH_TUTORIAL_CHANNEL_ID = "1562958688896028802";
const QUICK_VOUCH_CHANNEL_ID = "1552903786077360269";

const PARTNER_AD_CHANNEL_ID = "1552387259276329110";
const PARTNER_POST_CHANNEL_ID = "1552387314049618041";

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
const SELLER_EMOJI = "<:chuppyseller:1560283615445778503>";

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
// QUESTION COMMAND REGISTRATION
// ==================================================

async function registerQuestionCommand() {
  if (!TOKEN || !GUILD_ID || !client.user) {
    console.error(
      "[QUESTION] Missing token, guild ID, or logged-in bot."
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    const route = Routes.applicationGuildCommands(
      client.user.id,
      GUILD_ID
    );

    const existingCommands = await rest.get(route);

    const existingQuestion = existingCommands.find(
      command => command.name === "question"
    );

    if (existingQuestion) {
      await rest.patch(
        Routes.applicationGuildCommand(
          client.user.id,
          GUILD_ID,
          existingQuestion.id
        ),
        {
          body: QUESTION_COMMAND.toJSON()
        }
      );

      console.log("[QUESTION] Existing /question command updated.");
    } else {
      await rest.post(route, {
        body: QUESTION_COMMAND.toJSON()
      });

      console.log("[QUESTION] /question command registered.");
    }
  } catch (error) {
    console.error("[QUESTION] Command registration failed:", error);
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
        await duplicate.delete().catch(error => {
          console.error("[ROBUX CASHOUT] Could not delete duplicate:", error);
        });
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
  const channel = await guild.channels.fetch(
    RANKED_ROLES_CHANNEL_ID
  );

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
        "**Seller:** Select the seller who helped you.\n\n" +
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
// BOT READY
// ==================================================

client.once(Events.ClientReady, async readyClient => {
  console.log(`[READY] Logged in as ${readyClient.user.tag}`);
  console.log("[READY] Chuppys bot is online.");

  readyClient.user.setActivity(".gg/chuppys", { type: 3 });

  await registerQuestionCommand();
  await recountAllVouches();

  setInterval(() => {
    if (client.isReady()) scheduleVouchCounterUpdate();
  }, 5 * 60 * 1000);
});

// ==================================================
// QUESTION COMMAND + BUTTON INTERACTIONS
// ==================================================

client.on(Events.InteractionCreate, async interaction => {
  try {
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

    if (
      interaction.isRepliable() &&
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content: "Something went wrong while processing that interaction.",
        ephemeral: true
      }).catch(() => {});
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
    ["952566845939023892", "seller", "$100"],
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
// NEW SELLER INFORMATION — ,seller
// ==================================================

function makeSellerInfoEmbed() {
  return new EmbedBuilder()
    .setTitle("Interested in selling at .gg/chuppys")
    .setDescription(
      "**Permanent fees**\n\n" +
      "$10 - permanent fee with no personal commands\n\n" +
      "$15 - permanent fee with personal commands\n\n" +
      "Personal commands are ones we can create for you or insert your code " +
      "that allows you to use your personal payment command, ps command, etc.\n\n" +
      "Your limit is defined primarily based on how many personal vouches " +
      "you have. If you have a server with multiple sellers, the vouches " +
      "they received in your server do not increase your limit. However, " +
      "after your limit is determined, every 2 vouches gained in " +
      ".gg/chuppys increases your limit by $5.\n\n" +
      "If you agree and understand all of this, please ping " +
      `<@&${TICKET_SUPPORT_ROLE_ID}> to assist you further. Thank you!`
    )
    .setColor("#FFFFFF")
    .setFooter({ text: ".gg/chuppys" });
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
      "Role: Mod | staff",
      "ID: 1381473377696350238",
      "",
      `${SELLER_EMOJI} **<@727673410737668107>**`,
      "Role: Mod | staff",
      "ID: 727673410737668107"
    ].join("\n"));
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

    // VOUCH TUTORIAL — Manage Server only

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

    // RANKED ROLES — Manage Server only

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

      // ,r @user c — GIVE CHUPPYS ROLE

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

      // ,r @user r — VOUCH REMINDER

      if (action === "r") {
        const embed = new EmbedBuilder()
          .setTitle("Reminder to Vouch!")
          .setDescription(
            `Thank you for shopping at **.gg/chuppys**! ` +
            `${CHUPPYS_WELCOME_EMOJI}\n\n` +
            `Please check out <#${VOUCH_TUTORIAL_CHANNEL_ID}> to learn ` +
            `how to leave a vouch using the **/vouch** command.\n\n` +
            `Please also stop by <#${QUICK_VOUCH_CHANNEL_ID}> ` +
            `to leave your quick vouch!\n\n` +
            "**Please note not vouching sellers within the 2 day grace period will " +
            "result in you being black listed in this server.**"
          )
          .setColor("#FFFFFF")
          .setFooter({ text: ".gg/chuppys" });

        await message.channel.send({
          content: `${target}`,
          embeds: [embed],
          allowedMentions: {
            users: [target.id]
          }
        });

        return;
      }
    }

    // ==================================================
    // ,partner — PARTNERSHIP INSTRUCTIONS
    // TICKET SUPPORT ONLY
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
          "**.gg/chuppys partnership**\n\n" +
          "Please make sure all questions from the .gg/chuppys ticket bot " +
          "are answered !! If not please answer them now !!\n\n" +
          "**1. How many vouches ? Please show us proof !**\n\n" +
          "**2. How many server members ?**\n\n" +
          `After these questions are answered, please copy and paste your ` +
          `server ad in this partnership ticket. Staff will post it shortly ` +
          `in <#${PARTNER_POST_CHANNEL_ID}>.\n\n` +
          `Go to <#${PARTNER_AD_CHANNEL_ID}> to copy and paste Chuppys' ad. ` +
          `Once this is done, send a screenshot for proof.\n\n` +
          `Thank you for partnering with **.gg/chuppys**! ` +
          `${CHUPPYS_WELCOME_EMOJI}`
        )
        .setColor("#FFFFFF")
        .setFooter({ text: ".gg/chuppys" });

      await message.channel.send({
        embeds: [partnerEmbed],
        allowedMentions: { parse: [] }
      });

      return;
    }

    // ==================================================
    // ,seller — SELLER APPLICATION INFORMATION
    // ==================================================

    if (content === ",seller") {
      await message.channel.send({
        embeds: [makeSellerInfoEmbed()],
        allowedMentions: {
          roles: [TICKET_SUPPORT_ROLE_ID]
        }
      });

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

process.on("unhandledRejection", error => {
  console.error("[PROCESS] Unhandled promise rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("[PROCESS] Uncaught exception:", error);
});

// ==================================================
// START BOT
// ==================================================

if (!TOKEN) {
  console.error(
    "[STARTUP] DISCORD_BOT_TOKEN is missing from Render environment variables."
  );
  process.exit(1);
}

if (!GUILD_ID) {
  console.error(
    "[STARTUP] DISCORD_GUILD_ID is missing from Render environment variables."
  );
  process.exit(1);
}

client.login(TOKEN).catch(error => {
  console.error("[STARTUP] Discord login failed:", error);
});
