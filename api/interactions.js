import crypto from "crypto";
import { waitUntil } from "@vercel/functions";

export const config = { api: { bodyParser: false } };

// ==================================================
// CONFIGURATION — EXISTING FEATURES PRESERVED
// ==================================================

const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676";
const VOUCH_CHANNEL_ID = "1530811494168657980";

const PERSONAL_SELLER_IDS = [
  "1530733554869473320",
  "1490962480963260466"
];

const VOUCH_EMOJI_URL =
  "https://cdn.discordapp.com/emojis/1561197586554036318.png";

const CLIENT_ROLE_BUTTON_ID = "chuppys_client";
const CLIENT_ROLE_ID = "1550373434301878282";

const QUESTION_CHANNEL_ID = "1566490648549527602";
const TICKET_CHANNEL_ID = "1530811385678790716";
const TICKET_SUPPORT_ROLE_ID = "1563003884656398406";

const QUESTION_EMOJI_ID = "1561388594625511514";

const QUESTION_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${QUESTION_EMOJI_ID}.png?size=128&quality=lossless`;

const QUESTION_EMOJI =
  "<:chuppypayment:1561388594625511514>";

const TICKET_EMOJI =
  "<:chuppyhi:1561103471325745242>";

const QUESTION_TICKET_CUSTOM_ID = "question_ticket:";
const QUESTION_REPLY_CUSTOM_ID = "question_reply:";
const QUESTION_MODAL_CUSTOM_ID = "question_reply_modal:";

const REQUEST_CHANNEL_ID = "1569732416388726834";
const REQUEST_THUMBNAIL_URL = QUESTION_EMOJI_URL;

const REQUEST_CATEGORIES = new Set([
  "Baddies",
  "MM2",
  "Adopt Me",
  "Blade Ball",
  "Robux"
]);

const VERIFY_CUSTOM_ID = "chuppys_verify";
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
  "1531084435716571137",
  "1531104789075853472",
  "1531104886630907925",
  "1531105107586973696",
  "1551276593425685333",
  "1558913216602706011",
  "1568240267344093254",
  "1568240367076122634",
  "1568283533879939123",
  "1568240484206514248",
  "1569731217799127210",
  "1569731506706849872"
];

const ROLE_GROUPS = {
  chuppys_self_roles: {
    roles: PING_ROLE_IDS,
    success: "﹕𐔌・your roles have been updated〃・꒱ 🤍"
  },

  chuppys_second_roles: {
    roles: AGE_ROLE_IDS,
    success: "﹕𐔌・your age roles have been updated〃・꒱ 🤍"
  },

  chuppys_pronoun_roles: {
    roles: PRONOUN_ROLE_IDS,
    success: "﹕𐔌・your pronouns have been updated〃・꒱ 🤍"
  }
};

function getVouchChannelId(sellerId) {
  return PERSONAL_SELLER_IDS.includes(sellerId)
    ? PERSONAL_VOUCH_CHANNEL_ID
    : VOUCH_CHANNEL_ID;
}

console.log("[INTERACTIONS DEBUG] api/interactions.js loaded.");

// ==================================================
// DISCORD SIGNATURE VALIDATION
// ==================================================

async function getRawBody(req) {
  const chunks = [];
  let total = 0;

  for await (const chunk of req) {
    total += chunk.length;

    if (total > 100000) {
      throw new Error("Request body too large.");
    }

    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function verifyDiscordSignature(
  body,
  signature,
  timestamp,
  publicKeyHex
) {
  try {
    if (
      typeof signature !== "string" ||
      typeof timestamp !== "string" ||
      !/^[0-9a-f]{128}$/i.test(signature) ||
      typeof publicKeyHex !== "string" ||
      !/^[0-9a-f]{64}$/i.test(publicKeyHex)
    ) {
      return false;
    }

    const key = crypto.createPublicKey({
      key: Buffer.concat([
        Buffer.from(
          "302a300506032b6570032100",
          "hex"
        ),
        Buffer.from(publicKeyHex, "hex")
      ]),
      format: "der",
      type: "spki"
    });

    return crypto.verify(
      null,
      Buffer.concat([
        Buffer.from(timestamp, "utf8"),
        body
      ]),
      key,
      Buffer.from(signature, "hex")
    );
  } catch (error) {
    console.error(
      "[INTERACTIONS DEBUG] Signature error:",
      error.message
    );

    return false;
  }
}

// ==================================================
// DISCORD API HELPERS
// ==================================================

async function discordFetch(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    8000
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await response.text();

    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    throw new Error(
      error.name === "AbortError"
        ? "Discord API request timed out after 8 seconds."
        : `Discord API network error: ${error.message}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

function botHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new Error(
      "DISCORD_BOT_TOKEN is missing from Vercel Environment Variables."
    );
  }

  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json"
  };
}

async function postChannelMessage(channelId, payload) {
  const result = await discordFetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify(payload)
    }
  );

  if (!result.ok) {
    throw new Error(
      `Could not send message: HTTP ${result.status} ` +
      JSON.stringify(result.data)
    );
  }

  return result.data;
}

async function getMemberRoles(guildId, userId, botToken) {
  const result = await discordFetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bot ${botToken}`
      }
    }
  );

  if (!result.ok) {
    throw new Error(
      `Could not retrieve member roles: HTTP ${result.status} ` +
      JSON.stringify(result.data)
    );
  }

  return result.data.roles || [];
}

async function updateOriginalResponse(
  interaction,
  contentOrPayload
) {
  const payload =
    typeof contentOrPayload === "string"
      ? { content: contentOrPayload }
      : contentOrPayload;

  const result = await discordFetch(
    `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}/messages/@original`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!result.ok) {
    throw new Error(
      `Could not update interaction response: HTTP ${result.status} ` +
      JSON.stringify(result.data)
    );
  }
}

function hasStaffPermission(interaction) {
  const member = interaction.member;

  if (!member) return false;

  if (
    (member.roles || []).includes(TICKET_SUPPORT_ROLE_ID)
  ) {
    return true;
  }

  const permissions = BigInt(
    member.permissions || "0"
  );

  return (
    (permissions & 8n) === 8n ||
    (permissions & 32n) === 32n ||
    (permissions & 8192n) === 8192n
  );
}

function ephemeral(content) {
  return {
    type: 4,
    data: {
      content,
      flags: 64
    }
  };
}

function deferEphemeral(res, task) {
  res.status(200).json({
    type: 5,
    data: {
      flags: 64
    }
  });

  waitUntil(
    Promise.resolve(task).catch(error => {
      console.error("[ASYNC TASK]", error);
    })
  );
}

function optionsMap(interaction) {
  return Object.fromEntries(
    (interaction.data?.options || []).map(option => [
      option.name,
      option.value
    ])
  );
}

// ==================================================
// ROLE MENU HANDLER
// ==================================================

async function changeRoles(interaction, group) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = interaction.guild_id;

  const userId =
    interaction.member?.user?.id ||
    interaction.user?.id;

  if (!botToken || !guildId || !userId) {
    throw new Error(
      "Missing bot token, server ID, or member ID."
    );
  }

  const selectedRoles = new Set(
    interaction.data.values || []
  );

  for (const roleId of selectedRoles) {
    if (!group.roles.includes(roleId)) {
      throw new Error(
        `Unexpected role ID: ${roleId}`
      );
    }
  }

  const currentRoles = new Set(
    await getMemberRoles(
      guildId,
      userId,
      botToken
    )
  );

  for (const roleId of group.roles) {
    const shouldHaveRole =
      selectedRoles.has(roleId);

    if (
      shouldHaveRole === currentRoles.has(roleId)
    ) {
      continue;
    }

    const result = await discordFetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: shouldHaveRole
          ? "PUT"
          : "DELETE",

        headers: {
          Authorization: `Bot ${botToken}`
        }
      }
    );

    if (!result.ok) {
      throw new Error(
        `Role ${roleId} failed: HTTP ${result.status} ` +
        JSON.stringify(result.data)
      );
    }

    console.log(
      `[ROLE DEBUG] ${shouldHaveRole ? "Added" : "Removed"} ${roleId} for ${userId}`
    );
  }
}

async function processRoleInteraction(
  interaction,
  group
) {
  try {
    await changeRoles(
      interaction,
      group
    );

    await updateOriginalResponse(
      interaction,
      group.success
    );
  } catch (error) {
    console.error(
      "[ROLE DEBUG] Failed:",
      error
    );

    await updateOriginalResponse(
      interaction,
      "﹕𐔌・role update failed. Please contact staff.〃・꒱ 🤍"
    ).catch(console.error);
  }
}

// ==================================================
// CLIENT ROLE BUTTON HANDLER
// ==================================================

async function processClientRole(interaction) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;

    const userId =
      interaction.member?.user?.id ||
      interaction.user?.id;

    if (!botToken || !guildId || !userId) {
      throw new Error(
        "Missing bot token, server ID, or member ID."
      );
    }

    const roles = await getMemberRoles(
      guildId,
      userId,
      botToken
    );

    if (roles.includes(CLIENT_ROLE_ID)) {
      await updateOriginalResponse(
        interaction,
        "﹕𐔌・you already have the client role! you're ready to vouch. 🤍"
      );

      return;
    }

    const result = await discordFetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${CLIENT_ROLE_ID}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`
        }
      }
    );

    if (!result.ok) {
      throw new Error(
        `Could not grant client role: HTTP ${result.status} ` +
        JSON.stringify(result.data)
      );
    }

    await updateOriginalResponse(
      interaction,
      "﹕𐔌・you now have the client role! you can successfully submit a vouch. thank you for shopping at .gg/chuppys! 🤍"
    );
  } catch (error) {
    console.error(
      "[CLIENT DEBUG] Failed:",
      error
    );

    await updateOriginalResponse(
      interaction,
      "Your client role could not be added. Please contact staff."
    ).catch(console.error);
  }
}

// ==================================================
// VERIFICATION BUTTON HANDLER
// ==================================================

async function processVerification(interaction) {
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = interaction.guild_id;

    const userId =
      interaction.member?.user?.id ||
      interaction.user?.id;

    if (!botToken || !guildId || !userId) {
      throw new Error(
        "Missing bot token, server ID, or member ID."
      );
    }

    const roles = new Set(
      await getMemberRoles(
        guildId,
        userId,
        botToken
      )
    );

    if (roles.has(CHUPPYS_ROLE_ID)) {
      await updateOriginalResponse(
        interaction,
        "﹕𐔌・you are already verified! welcome to .gg/chuppys 🤍"
      );

      return;
    }

    const hasAgeRole =
      AGE_ROLE_IDS.some(id => roles.has(id));

    const hasPronounRole =
      PRONOUN_ROLE_IDS.some(id => roles.has(id));

    const pingRoleCount =
      PING_ROLE_IDS.filter(id => roles.has(id)).length;

    if (
      !hasAgeRole ||
      !hasPronounRole ||
      pingRoleCount < 2
    ) {
      await updateOriginalResponse(
        interaction,
        `Please select your roles in <#${ROLES_CHANNEL_ID}> before verifying to gain full access to .gg/chuppys. 🤍`
      );

      return;
    }

    const result = await discordFetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${CHUPPYS_ROLE_ID}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`
        }
      }
    );

    if (!result.ok) {
      throw new Error(
        `Could not grant Chuppys role: HTTP ${result.status} ` +
        JSON.stringify(result.data)
      );
    }

    await updateOriginalResponse(
      interaction,
      "﹕𐔌・you are now verified! welcome to .gg/chuppys 🤍"
    );
  } catch (error) {
    console.error(
      "[VERIFY DEBUG] Verification failed:",
      error
    );

    await updateOriginalResponse(
      interaction,
      "Verification failed. Please contact staff for help."
    ).catch(console.error);
  }
}

// ==================================================
// /VOUCH
// ==================================================

async function processVouchInteraction(interaction) {
  try {
    console.log(
      "[VOUCH DEBUG] Processing /vouch."
    );

    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
      throw new Error(
        "DISCORD_BOT_TOKEN is missing from Vercel Environment Variables."
      );
    }

    if (!interaction.guild_id) {
      throw new Error(
        "Use /vouch inside your Discord server."
      );
    }

    const buyerId =
      interaction.member?.user?.id ||
      interaction.user?.id;

    if (!buyerId) {
      throw new Error(
        "Could not identify the buyer."
      );
    }

    const buyerRoles = await getMemberRoles(
      interaction.guild_id,
      buyerId,
      botToken
    );

    if (!buyerRoles.includes(CLIENT_ROLE_ID)) {
      await updateOriginalResponse(
        interaction,
        "You need the client role before submitting a vouch! Please click the **client** button in the client-role message in .gg/chuppys. 🤍"
      );

      return;
    }

    const options = optionsMap(interaction);
    const resolved = interaction.data.resolved || {};

    const sellerId = options.seller;
    const rating = options.rating;
    const order = options.order?.trim();

    const proof =
      resolved.attachments?.[options.proof];

    const seller =
      resolved.users?.[sellerId];

    if (!sellerId || !buyerId) {
      throw new Error(
        "Could not identify the buyer or seller."
      );
    }

    if (seller?.bot) {
      throw new Error(
        "You cannot vouch for a bot."
      );
    }

    if (sellerId === buyerId) {
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

    if (!order) {
      throw new Error(
        "Please enter what you purchased."
      );
    }

    if (order.length > 500) {
      throw new Error(
        "Your order description must be 500 characters or fewer."
      );
    }

    if (!proof) {
      throw new Error(
        "Please attach proof of your purchase."
      );
    }

    const isImage =
      proof.content_type?.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp)$/i.test(
        proof.filename || ""
      );

    if (!isImage) {
      throw new Error(
        "Proof must be a PNG, JPG, GIF, or WEBP image."
      );
    }

    const embed = {
      color: 0xffffff,

      title: "NEW VOUCH",

      thumbnail: {
        url: VOUCH_EMOJI_URL
      },

      description:
        `**seller:** <@${sellerId}>\n` +
        `**buyer:** <@${buyerId}>\n` +
        `**items purchased:** ${order}\n` +
        `**rating:** ${rating}/5\n` +
        `**proof:** 📎 ${proof.filename || "Purchase proof"}\n\n` +
        "*thank you for vouching! shop again ♡*",

      image: {
        url: proof.url
      },

      timestamp: new Date().toISOString()
    };

    const targetChannelId =
      getVouchChannelId(sellerId);

    const result = await postChannelMessage(
      targetChannelId,
      {
        embeds: [embed],

        allowed_mentions: {
          parse: [],
          users: [sellerId, buyerId]
        }
      }
    );

    console.log(
      `[VOUCH DEBUG] Posted ${result?.id || "unknown"} to ${targetChannelId}`
    );

    await updateOriginalResponse(
      interaction,
      "Your vouch was submitted successfully! ♡"
    );
  } catch (error) {
    console.error(
      "[VOUCH DEBUG] /vouch failed:",
      error
    );

    await updateOriginalResponse(
      interaction,
      `❌ ${error.message || "Your vouch could not be submitted."}`
    ).catch(console.error);
  }
}

// ==================================================
// /QUESTION
// ==================================================

async function processQuestionInteraction(interaction) {
  try {
    if (!interaction.guild_id) {
      throw new Error(
        "Use /question inside your Discord server."
      );
    }

    if (
      interaction.channel_id !== QUESTION_CHANNEL_ID
    ) {
      await updateOriginalResponse(
        interaction,
        `Please use /question in <#${QUESTION_CHANNEL_ID}>.`
      );

      return;
    }

    const options = optionsMap(interaction);

    const questionText =
      options.question?.trim();

    const picture = options.picture
      ? interaction.data.resolved?.attachments?.[
          options.picture
        ]
      : null;

    if (!questionText) {
      throw new Error(
        "Please enter your question."
      );
    }

    if (
      picture &&
      !(
        picture.content_type?.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp)$/i.test(
          picture.filename || ""
        )
      )
    ) {
      await updateOriginalResponse(
        interaction,
        "Please attach an image file for the picture option."
      );

      return;
    }

    const askerId =
      interaction.member?.user?.id ||
      interaction.user?.id;

    if (!askerId) {
      throw new Error(
        "Could not identify the member."
      );
    }

    const embed = {
      title:
        `Question from @${interaction.member?.user?.username || interaction.user?.username || "Member"}`,

      color: 0xffffff,

      description:
        `**Question**\n${questionText}`,

      thumbnail: {
        url: QUESTION_EMOJI_URL
      },

      footer: {
        text:
          `.gg/chuppys • Question User ID: ${askerId}`
      },

      timestamp: new Date().toISOString()
    };

    if (picture?.url) {
      embed.image = {
        url: picture.url
      };
    }

    const components = [{
      type: 1,

      components: [
        {
          type: 2,
          style: 2,
          label: "Make a Support Ticket",

          custom_id:
            `${QUESTION_TICKET_CUSTOM_ID}${askerId}`
        },

        {
          type: 2,
          style: 1,
          label: "Reply to Question",

          custom_id:
            `${QUESTION_REPLY_CUSTOM_ID}${askerId}`
        }
      ]
    }];

    await postChannelMessage(
      QUESTION_CHANNEL_ID,
      {
        embeds: [embed],
        components,

        allowed_mentions: {
          parse: []
        }
      }
    );

    await updateOriginalResponse(
      interaction,
      "Your question was sent to Chuppys staff! ♡"
    );
  } catch (error) {
    console.error(
      "[QUESTION DEBUG] Failed:",
      error
    );

    await updateOriginalResponse(
      interaction,
      `Your question could not be sent: ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// /REQUEST
// ==================================================

async function processRequestInteraction(interaction) {
  try {
    if (!interaction.guild_id) {
      throw new Error(
        "Use /request inside the Chuppys server."
      );
    }

    if (
      interaction.channel_id !== REQUEST_CHANNEL_ID
    ) {
      await updateOriginalResponse(
        interaction,
        `Please use /request in <#${REQUEST_CHANNEL_ID}>.`
      );

      return;
    }

    const options = optionsMap(interaction);

    const category = options.category;

    const items =
      typeof options.items === "string"
        ? options.items.trim()
        : "";

    if (!REQUEST_CATEGORIES.has(category)) {
      throw new Error(
        "Please select a valid request category."
      );
    }

    if (!items || items.length > 1000) {
      throw new Error(
        "Enter what you want (up to 1000 characters)."
      );
    }

    const requesterId =
      interaction.member?.user?.id ||
      interaction.user?.id;

    if (!requesterId) {
      throw new Error(
        "Could not identify the requester."
      );
    }

    const embed = {
      title: `${category} Request`,

      color: 0xffffff,

      description:
        `**Requested by:** <@${requesterId}>\n\n` +
        "**What they'd like Chuppys to stock up on:**\n" +
        items,

      thumbnail: {
        url: REQUEST_THUMBNAIL_URL
      },

      footer: {
        text: ".gg/chuppys"
      },

      timestamp: new Date().toISOString()
    };

    await postChannelMessage(
      REQUEST_CHANNEL_ID,
      {
        embeds: [embed],

        allowed_mentions: {
          parse: []
        }
      }
    );

    await updateOriginalResponse(
      interaction,
      `Your **${category}** request has been submitted! Thank you for helping Chuppys decide what to stock.`
    );
  } catch (error) {
    console.error(
      "[REQUEST DEBUG] Failed:",
      error
    );

    await updateOriginalResponse(
      interaction,
      `Your request could not be submitted: ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// /HELP
// ==================================================

function makeHelpEmbed() {
  return {
    title: ".gg/chuppys Bot Commands",

    color: 0xffffff,

    description:
      "Here is a list of available commands and what they do.\n\n" +
      "Use the commands below to access the bot's features.",

    fields: [
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
    ],

    thumbnail: {
      url:
        "https://cdn.discordapp.com/emojis/1569039366880235560.png"
    },

    footer: {
      text: ".gg/chuppys"
    }
  };
}

// ==================================================
// QUESTION BUTTONS AND PRIVATE STAFF REPLIES
// ==================================================

function handleQuestionTicketButton() {
  return {
    type: 4,

    data: {
      flags: 64,

      embeds: [{
        color: 0xffffff,

        description:
          "This question requires a support ticket.\n\n" +
          `Please make one in <#${TICKET_CHANNEL_ID}> ` +
          "and @ Ticket Support for assistance.\n\n" +
          "Thank you! <:uppyty:1561094713153429746>",

        thumbnail: {
          url: QUESTION_EMOJI_URL
        },

        footer: {
          text: ".gg/chuppys"
        }
      }],

      allowed_mentions: {
        parse: []
      }
    }
  };
}

function handleQuestionReplyButton(interaction) {
  if (!hasStaffPermission(interaction)) {
    return ephemeral(
      "Only the owner, administrators, moderators, or Ticket Support can reply to questions."
    );
  }

  const askerId =
    interaction.data.custom_id.slice(
      QUESTION_REPLY_CUSTOM_ID.length
    );

  if (!/^\d{17,20}$/.test(askerId)) {
    return ephemeral(
      "This question button is invalid."
    );
  }

  return {
    type: 9,

    data: {
      custom_id:
        `${QUESTION_MODAL_CUSTOM_ID}${askerId}:${interaction.message.id}`,

      title: "Reply to Question",

      components: [{
        type: 1,

        components: [{
          type: 4,

          custom_id: "question_reply_text",

          label: "Your response",

          style: 2,
          min_length: 1,
          max_length: 2000,

          placeholder:
            "Type your answer to the member...",

          required: true
        }]
      }]
    }
  };
}

async function processQuestionReply(interaction) {
  try {
    if (!hasStaffPermission(interaction)) {
      throw new Error(
        "Only authorized staff can answer questions."
      );
    }

    const match =
      interaction.data.custom_id.match(
        /^question_reply_modal:(\d{17,20}):(\d{17,20})$/
      );

    if (!match) {
      throw new Error(
        "Invalid question reply form."
      );
    }

    const askerId = match[1];
    const originalMessageId = match[2];

    const actionRow =
      interaction.data.components?.find(
        component => component.type === 1
      );

    const answerText =
      actionRow?.components?.find(
        component =>
          component.custom_id === "question_reply_text"
      )?.value?.trim();

    if (!answerText) {
      throw new Error(
        "Please enter a response."
      );
    }

    const staffId =
      interaction.member?.user?.id ||
      interaction.user?.id;

    if (!staffId) {
      throw new Error(
        "Could not identify the staff member."
      );
    }

    const dmResult = await discordFetch(
      "https://discord.com/api/v10/users/@me/channels",
      {
        method: "POST",

        headers: botHeaders(),

        body: JSON.stringify({
          recipient_id: askerId
        })
      }
    );

    if (!dmResult.ok || !dmResult.data?.id) {
      throw new Error(
        "I couldn't open a DM with the member. They may have direct messages disabled."
      );
    }

    const replyEmbed = {
      title: "Response to Your Question",

      color: 0xffffff,

      description:
        `${QUESTION_EMOJI} **Replied by:** <@${staffId}>\n\n` +
        `**Response:**\n${answerText}`,

      thumbnail: {
        url: QUESTION_EMOJI_URL
      },

      footer: {
        text: ".gg/chuppys"
      },

      timestamp: new Date().toISOString()
    };

    await postChannelMessage(
      dmResult.data.id,
      {
        embeds: [replyEmbed],

        allowed_mentions: {
          parse: []
        }
      }
    );

    try {
      await postChannelMessage(
        QUESTION_CHANNEL_ID,
        {
          content:
            `A response was sent privately by <@${staffId}>.`,

          message_reference: {
            message_id: originalMessageId,
            fail_if_not_exists: false
          },

          allowed_mentions: {
            parse: [],
            users: [staffId]
          }
        }
      );
    } catch (error) {
      console.warn(
        "[QUESTION DEBUG] Could not post staff reply notice:",
        error
      );
    }

    await updateOriginalResponse(
      interaction,
      "Your response was sent to the member privately."
    );
  } catch (error) {
    console.error(
      "[QUESTION DEBUG] Could not send staff response:",
      error
    );

    await updateOriginalResponse(
      interaction,
      `Could not send the response: ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// TICKET ENDPOINT — RENDER TICKETS.JS V3
// ==================================================

// HTTP interactions arrive at Vercel when the
// Discord Interactions Endpoint URL is configured.
//
// Prefix commands still reach tickets.js on Render.
//
// Both runtimes use the V3 private metadata channel.

const TC = Object.freeze({
  data: "1571112668037644388",
  logs: "1570913954333728808",

  owner: "1530988662970650865",
  admin: "1531800870444994641",
  mod: "1531800784700706887",

  support: "1563003884656398406",
  seller: "1550322075208646766",

  verified: CHUPPYS_ROLE_ID,

  verifyButton:
    "chuppys_create_verification_ticket"
});

const STATE_V3 =
  "CHUPPYS_PRIVATE_TICKET_METADATA_V3:";

const LEGACY_STATES = [
  STATE_V3,
  "CHUPPYS_PRIVATE_TICKET_METADATA_V2:",
  "CHUPPYS_TICKET_STATE_V4:",
  "CHUPPYS_TICKET_STATE_V3:",
  "CHUPPYS_TICKET_STATE_V2:"
];

const COUNTER_V1 =
  "CHUPPYS_GLOBAL_TICKET_COUNTER_V1:";

// ==================================================
// TICKET PERMISSIONS
// ==================================================

const PERM = {
  view: 1024n,
  send: 2048n,
  attach: 32768n,
  history: 65536n,

  manageChannels: 16n,
  manageMessages: 8192n,

  administrator: 8n
};

const FULL_P = String(
  PERM.view |
  PERM.send |
  PERM.attach |
  PERM.history
);

const READ_P = String(
  PERM.view |
  PERM.history
);

const HIDE_P = String(
  PERM.view |
  PERM.send |
  PERM.attach |
  PERM.history
);

// ==================================================
// TICKET TYPES
// ==================================================

const T_TYPES = {
  purchase: {
    label: "Purchase",

    env: "PURCHASE_TICKET_CATEGORY_ID",

    names: [
      "chuppys-purchase",
      "Purchasing tickets",
      "Purchase tickets"
    ],

    questions: [
      "What are you purchasing?",
      "Who are you buying from?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  cashout: {
    label: "Cash Out",

    env: "CASHOUT_TICKET_CATEGORY_ID",

    names: [
      "chuppys-cashout",
      "Cashout tickets",
      "Cash Out tickets"
    ],

    questions: [
      "What are you cashing out?",
      "How much are you looking for?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  giveaway: {
    label: "Giveaway",

    env: "GIVEAWAY_TICKET_CATEGORY_ID",

    names: [
      "chuppys-giveaway",
      "Giveaway tickets"
    ],

    description:
      "Please explain the giveaway you won."
  },

  partnership: {
    label: "Partnership",

    env: "PARTNERSHIP_TICKET_CATEGORY_ID",

    names: [
      "chuppys-partnership",
      "Partnership tickets"
    ],

    questions: [
      "How many vouches?",
      "How many server members?"
    ]
  },

  support: {
    label: "Support",

    env: "SUPPORT_TICKET_CATEGORY_ID",

    names: [
      "chuppys-support",
      "Support tickets",
      "Support ticket",
      "Support",
      "Support-tickets",
      "Help and Support"
    ],

    description:
      "Please explain what you need help with."
  },

  verification: {
    label: "Verification",

    names: [
      "chuppys-verification",
      "Verification tickets",
      "Verification ticket",
      "Verification",
      "Verify tickets",
      "Verify"
    ],

    description:
      "Please explain what you need help with while verifying for **.gg/chuppys**."
  }
};

const T_SELECT = new Set([
  "chuppys_ticket_select",
  "chuppys_ticket_category",
  "chuppys_tickets",
  "ticket_select",
  "ticket_category",
  "ticket_open",
  "ticket_create"
]);

const T_MODAL = "chuppys_ticket_form:";
const T_CLOSE = "chuppys_ticket_close_modal:";

const T_BUTTONS = {
  chuppys_ticket_claim: "claim",
  chuppys_ticket_close: "close",
  chuppys_ticket_reopen: "reopen",
  chuppys_ticket_delete: "delete"
};

const T_COMPAT = {
  claim: "claim",
  close: "close",
  reopen: "reopen",
  delete: "delete"
};

// ==================================================
// TICKET HELPERS
// ==================================================

const tUser = i =>
  i.member?.user?.id ||
  i.user?.id;

const tRoles = i =>
  new Set(i.member?.roles || []);

const tMemberHas = (i, id) =>
  tRoles(i).has(id);

const tOwner = i =>
  i.member?.user?.id === i.guild_owner_id ||
  tMemberHas(i, TC.owner);

const tTrading = state =>
  state.type === "purchase" ||
  state.type === "cashout";

const tClean = s =>
  String(s ?? "")
    .replace(/@/g, "＠")
    .slice(0, 1000);

const tNormalize = s =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const tName = s =>
  `${s.status === "closed" ? "closed-" : ""}` +
  `${s.type}-${String(s.number).padStart(4, "0")}`;

const tEmbed = (title, description) => ({
  title,
  description,

  color: 0xffffff,

  footer: {
    text: ".gg/chuppys"
  }
});

// ==================================================
// TICKET API
// ==================================================

async function tApi(method, path, body) {
  const r = await discordFetch(
    `https://discord.com/api/v10${path}`,
    {
      method,
      headers: botHeaders(),

      ...(body === undefined
        ? {}
        : {
            body: JSON.stringify(body)
          })
    }
  );

  if (!r.ok) {
    throw new Error(
      `Discord API ${r.status}: ` +
      JSON.stringify(r.data).slice(0, 500)
    );
  }

  return r.data;
}

// ==================================================
// PAGINATE TICKET MESSAGES
// ==================================================

async function tPages(
  channelId,
  maxPages = 150
) {
  const all = [];
  let before;

  for (
    let page = 0;
    page < maxPages;
    page++
  ) {
    const batch = await tApi(
      "GET",
      `/channels/${channelId}/messages?limit=100` +
      `${before ? `&before=${before}` : ""}`
    );

    all.push(...batch);

    if (batch.length < 100) {
      break;
    }

    before = batch[
      batch.length - 1
    ].id;
  }

  return all;
}

// ==================================================
// DECODE PRIVATE TICKET METADATA
// ==================================================

function tDecode(msg) {
  const prefix = LEGACY_STATES.find(
    p => msg.content?.startsWith(p)
  );

  if (!prefix) {
    return null;
  }

  try {
    const state = JSON.parse(
      msg.content.slice(prefix.length)
    );

    if (
      !state.channelId ||
      !state.ownerId ||
      !T_TYPES[state.type]
    ) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

// ==================================================
// LOAD ALL TICKET STATES
// ==================================================

async function tAllStates() {
  const rows = await tPages(TC.data);

  const found = new Map();

  for (const row of rows) {
    const state = tDecode(row);

    if (
      state &&
      !found.has(state.channelId)
    ) {
      found.set(
        state.channelId,
        {
          state,
          messageId: row.id
        }
      );
    }
  }

  return {
    found,
    rows
  };
}

// ==================================================
// SAVE PRIVATE V3 METADATA
// ==================================================

async function tSave(
  state,
  messageId = null
) {
  const payload = {
    content:
      STATE_V3 + JSON.stringify(state),

    allowed_mentions: {
      parse: []
    }
  };

  if (messageId) {
    return tApi(
      "PATCH",
      `/channels/${TC.data}/messages/${messageId}`,
      payload
    );
  }

  return tApi(
    "POST",
    `/channels/${TC.data}/messages`,
    payload
  );
}

// ==================================================
// GET TICKET STATE
// ==================================================

async function tStateFor(channelId) {
  const { found } = await tAllStates();

  if (found.has(channelId)) {
    return found.get(channelId);
  }

  // Import older V2 metadata from private logs.

  const oldRows = await tPages(
    TC.logs
  ).catch(() => []);

  for (const msg of oldRows) {
    const old = tDecode(msg);

    if (
      old?.channelId === channelId
    ) {
      const saved = await tSave(old);

      return {
        state: old,
        messageId: saved.id
      };
    }
  }

  // Legacy channel-topic compatibility.

  const ch = await tApi(
    "GET",
    `/channels/${channelId}`
  );

  if (
    ch.topic?.startsWith("chuppys-ticket:")
  ) {
    const s = JSON.parse(
      ch.topic.slice(
        "chuppys-ticket:".length
      )
    );

    if (
      s.ownerId &&
      T_TYPES[s.type]
    ) {
      s.channelId = channelId;

      const saved = await tSave(s);

      return {
        state: s,
        messageId: saved.id
      };
    }
  }

  throw new Error(
    "This channel has no recognized ticket metadata."
  );
}

// ==================================================
// GLOBAL TICKET COUNTER
// ==================================================

async function tCounter(guildId, rows) {
  let highest = 0;
  let record = null;

  for (const row of rows) {
    if (
      row.content?.startsWith(COUNTER_V1)
    ) {
      const n = Number(
        row.content.slice(
          COUNTER_V1.length
        )
      );

      if (Number.isSafeInteger(n)) {
        highest = Math.max(
          highest,
          n
        );

        if (!record) {
          record = row;
        }
      }
    }

    const s = tDecode(row);

    if (s) {
      highest = Math.max(
        highest,
        Number(s.number) || 0
      );
    }
  }

  if (!record) {
    const guildChannels = await tApi(
      "GET",
      `/guilds/${guildId}/channels`
    );

    for (const channel of guildChannels) {
      const match = (
        channel.name || ""
      ).match(
        /^(?:closed-)?(?:purchase|purchasing|cashout|cash-out|support|giveaway|partnership|verification)-(\d+)$/i
      );

      if (match) {
        highest = Math.max(
          highest,
          Number(match[1])
        );
      }
    }
  }

  const next = highest + 1;

  if (record) {
    await tApi(
      "PATCH",
      `/channels/${TC.data}/messages/${record.id}`,
      {
        content: COUNTER_V1 + next
      }
    );
  } else {
    await tApi(
      "POST",
      `/channels/${TC.data}/messages`,
      {
        content: COUNTER_V1 + next
      }
    );
  }

  return next;
}

// ==================================================
// TICKET CATEGORY
// ==================================================

async function tCategory(guildId, type) {
  const cfg = T_TYPES[type];

  const channels = await tApi(
    "GET",
    `/guilds/${guildId}/channels`
  );

  const valid = channels.filter(
    c => c.type === 4
  );

  // Verification tickets get their own category.

  if (type === "verification") {
    const match =
      valid.find(
        c =>
          tNormalize(c.name) ===
          "chuppysverification"
      ) ||
      valid.find(
        c =>
          cfg.names
            .map(tNormalize)
            .includes(
              tNormalize(c.name)
            )
      );

    if (match) {
      return match.id;
    }

    const created = await tApi(
      "POST",
      `/guilds/${guildId}/channels`,
      {
        name: "chuppys-verification",

        type: 4,

        permission_overwrites: [
          {
            id: guildId,
            type: 0,
            deny: String(PERM.view)
          },

          ...[
            TC.owner,
            TC.admin,
            TC.mod,
            TC.support
          ].map(id => ({
            id,
            type: 0,
            allow: FULL_P
          }))
        ]
      }
    );

    return created.id;
  }

  const specified =
    process.env[cfg.env];

  if (
    specified &&
    valid.some(c => c.id === specified)
  ) {
    return specified;
  }

  const match = valid.find(
    c =>
      cfg.names
        .map(tNormalize)
        .includes(
          tNormalize(c.name)
        )
  );

  if (match) {
    return match.id;
  }

  throw new Error(
    `No ${cfg.label} category. Set ${cfg.env} on Vercel.`
  );
}

// ==================================================
// TICKET CONTROL BUTTONS
// ==================================================

function tControls(state) {
  const button = (
    id,
    label,
    style,
    disabled = false
  ) => ({
    type: 2,
    custom_id: id,
    label,
    style,
    disabled,

    emoji: {
      name:
        label === "Delete"
          ? "🗑️"
          : label === "Close"
            ? "🔒"
            : label === "Reopen"
              ? "🔓"
              : "🙋"
    }
  });

  return [{
    type: 1,

    components:
      state.status === "closed"
        ? [
            button(
              "chuppys_ticket_reopen",
              "Reopen",
              3
            ),

            button(
              "chuppys_ticket_delete",
              "Delete",
              4
            )
          ]
        : [
            button(
              "chuppys_ticket_claim",
              state.claimedBy
                ? "Claimed"
                : "Claim",
              1,
              !!state.claimedBy
            ),

            button(
              "chuppys_ticket_close",
              "Close",
              4
            ),

            button(
              "chuppys_ticket_delete",
              "Delete",
              2
            )
          ]
  }];
}

// ==================================================
// TICKET PRIVACY PERMISSIONS
// ==================================================

async function tPermissions(
  guildId,
  state
) {
  const closed =
    state.status === "closed";

  const allowed =
    closed ? READ_P : FULL_P;

  const base = new Map();

  const add = (
    id,
    type,
    allow = "0",
    deny = "0"
  ) => {
    base.set(id, {
      id,
      type,
      allow,
      deny
    });
  };

  // Hide the ticket from everyone.

  add(
    guildId,
    0,
    "0",
    String(PERM.view)
  );

  const guild = await tApi(
    "GET",
    `/guilds/${guildId}?with_counts=false`
  );

  const serverOwnerId =
    guild.owner_id;

  const claimedTrading =
    tTrading(state) &&
    !!state.claimedBy;

  // Owner and Ticket Support always retain access.

  add(
    TC.owner,
    0,
    allowed
  );

  add(
    TC.support,
    0,
    allowed
  );

  // Admin and Moderator access before claim.

  if (!claimedTrading) {
    add(
      TC.mod,
      0,
      allowed
    );

    add(
      TC.admin,
      0,
      allowed
    );
  }

  // Purchase and Cash Out sellers.

  if (tTrading(state)) {
    if (claimedTrading) {
      add(
        TC.seller,
        0,
        "0",
        HIDE_P
      );
    } else {
      add(
        TC.seller,
        0,
        allowed
      );
    }
  }

  // After a trading ticket is claimed,
  // only the claiming seller, buyer,
  // Ticket Support, and owners should see it.

  if (claimedTrading) {
    let members = [];
    let after;

    while (true) {
      const batch = await tApi(
        "GET",
        `/guilds/${guildId}/members?limit=1000` +
        `${after ? `&after=${after}` : ""}`
      );

      members.push(...batch);

      if (batch.length < 1000) {
        break;
      }

      after =
        batch[batch.length - 1].user.id;
    }

    for (const m of members) {
      const roles = new Set(
        m.roles || []
      );

      if (!roles.has(TC.seller)) {
        continue;
      }

      if (
        [
          state.ownerId,
          state.claimedBy,
          serverOwnerId
        ].includes(m.user.id)
      ) {
        continue;
      }

      // Explicit member permissions handle
      // sellers with multiple staff roles.

      if (
        roles.has(TC.owner) ||
        roles.has(TC.support)
      ) {
        add(
          m.user.id,
          1,
          allowed
        );
      } else {
        add(
          m.user.id,
          1,
          "0",
          HIDE_P
        );
      }
    }
  }

  // Server owner.

  if (serverOwnerId) {
    add(
      serverOwnerId,
      1,
      allowed
    );
  }

  // Ticket opener.

  add(
    state.ownerId,
    1,
    allowed
  );

  // Claiming staff member.

  if (state.claimedBy) {
    add(
      state.claimedBy,
      1,
      allowed
    );
  }

  if (base.size > 100) {
    throw new Error(
      "Ticket privacy exceeds Discord's 100-overwrite limit. Reduce seller membership or use a smaller staff scope."
    );
  }

  return [...base.values()];
}

// ==================================================
// APPLY TICKET PERMISSIONS
// ==================================================

async function tApplyPermissions(
  channelId,
  guildId,
  state
) {
  const permission_overwrites =
    await tPermissions(
      guildId,
      state
    );

  await tApi(
    "PATCH",
    `/channels/${channelId}`,
    {
      permission_overwrites
    }
  );
}

// ==================================================
// UPDATE TICKET BUTTONS
// ==================================================

async function tUpdateControls(
  channelId,
  state
) {
  if (!state.controlMessageId) {
    return;
  }

  await tApi(
    "PATCH",
    `/channels/${channelId}/messages/${state.controlMessageId}`,
    {
      components: tControls(state)
    }
  ).catch(error => {
    console.error(
      "[TICKET CONTROLS]",
      error
    );
  });
}

// ==================================================
// TICKET LOGGING
// ==================================================

async function tLog(title, state) {
  await postChannelMessage(
    TC.logs,
    {
      embeds: [
        tEmbed(
          title,
          `\`${tName(state)}\``
        )
      ],

      allowed_mentions: {
        parse: []
      }
    }
  ).catch(error => {
    console.error(
      "[TICKET LOG]",
      error
    );
  });
}

// ==================================================
// TICKET FORMS
// ==================================================

function tForm(type) {
  const cfg = T_TYPES[type];

  return {
    type: 9,

    data: {
      title:
        `${cfg.label} Ticket`,

      custom_id:
        T_MODAL + type,

      components:
        cfg.questions.map(
          (q, n) => ({
            type: 1,

            components: [{
              type: 4,

              custom_id:
                `answer_${n}`,

              label: q,

              style: 1,
              min_length: 1,
              max_length: 250,
              required: true
            }]
          })
        )
    }
  };
}

// ==================================================
// CLOSE TICKET MODAL
// ==================================================

function tCloseForm(channelId) {
  return {
    type: 9,

    data: {
      title: "Close Ticket",

      custom_id:
        T_CLOSE + channelId,

      components: [{
        type: 1,

        components: [{
          type: 4,

          custom_id:
            "close_reason",

          label:
            "Reason (optional)",

          style: 2,
          required: false,
          max_length: 500
        }]
      }]
    }
  };
}

// ==================================================
// TICKET FORM ANSWERS
// ==================================================

function tAnswers(i, type) {
  const fields = (
    i.data?.components || []
  ).flatMap(
    r => r.components || []
  );

  return T_TYPES[type].questions.map(
    (q, n) => {
      const text = fields.find(
        f =>
          f.custom_id ===
          `answer_${n}`
      )?.value?.trim();

      if (!text) {
        throw new Error(
          `Please answer: ${q}`
        );
      }

      return (
        `**${q}**\n` +
        tClean(text)
      );
    }
  ).join("\n\n");
}

// ==================================================
// /TICKETPANEL
// ==================================================

async function tPanel(i) {
  try {
    const perms = BigInt(
      i.member?.permissions || "0"
    );

    if (
      !(perms & 32n) &&
      !(perms & 8n)
    ) {
      throw new Error(
        "Manage Server is required."
      );
    }

    const menu = {
      type: 1,

      components: [{
        type: 3,

        custom_id:
          "chuppys_ticket_select",

        placeholder:
          "Select a ticket category",

        options:
          Object.entries(T_TYPES)
            .filter(
              ([id]) =>
                id !== "verification"
            )
            .map(
              ([value, cfg]) => ({
                label: cfg.label,
                value,

                description:
                  `Open a ${cfg.label} ticket`
              })
            )
      }]
    };

    const payload = {
      embeds: [
        tEmbed(
          `${TICKET_EMOJI} Chuppys Tickets`,

          "Welcome to Chuppys!\n\n" +
          "Select a ticket category below.\n\n" +
          "**Purchase** — Purchase assistance\n" +
          "**Cash Out** — Cashout assistance\n" +
          "**Giveaway** — Giveaway claims\n" +
          "**Partnership** — Partnerships\n" +
          "**Support** — General support"
        )
      ],

      components: [menu],

      allowed_mentions: {
        parse: []
      }
    };

    const panelId =
      "1530811385678790716";

    const messages = await tApi(
      "GET",
      `/channels/${panelId}/messages?limit=100`
    );

    const existing = messages.find(
      m =>
        m.author?.id === i.application_id &&
        (m.components || []).some(
          r =>
            (r.components || []).some(
              c =>
                T_SELECT.has(c.custom_id)
            )
        )
    );

    if (existing) {
      await tApi(
        "PATCH",
        `/channels/${panelId}/messages/${existing.id}`,
        payload
      );
    } else {
      await postChannelMessage(
        panelId,
        payload
      );
    }

    await updateOriginalResponse(
      i,
      `Ticket panel ${existing ? "updated" : "posted"} successfully.`
    );
  } catch (error) {
    console.error(
      "[TICKET PANEL]",
      error
    );

    await updateOriginalResponse(
      i,
      `Could not update ticket panel: ${tClean(error.message)}`
    ).catch(console.error);
  }
}

// ==================================================
// CREATE TICKET
// ==================================================

async function tCreate(
  i,
  type,
  answerText
) {
  try {
    const guildId = i.guild_id;
    const userId = tUser(i);

    if (!guildId || !userId) {
      throw new Error(
        "Tickets only work in a server."
      );
    }

    // Verified users do not need verification tickets.

    if (type === "verification") {
      const memberRoles =
        await getMemberRoles(
          guildId,
          userId,
          process.env.DISCORD_BOT_TOKEN
        );

      if (
        memberRoles.includes(TC.verified)
      ) {
        throw new Error(
          "You are already verified."
        );
      }
    }

    // Check for an existing open ticket.

    const {
      found,
      rows
    } = await tAllStates();

    for (const { state } of found.values()) {
      if (
        state.ownerId === userId &&
        state.type === type &&
        state.status !== "closed"
      ) {
        const channel = await tApi(
          "GET",
          `/channels/${state.channelId}`
        ).catch(() => null);

        if (channel) {
          return updateOriginalResponse(
            i,
            `You already have an open ticket: <#${state.channelId}>`
          );
        }
      }
    }

    const parent =
      await tCategory(
        guildId,
        type
      );

    const number =
      await tCounter(
        guildId,
        rows
      );

    const state = {
      channelId: null,
      ownerId: userId,
      type,
      number,

      status: "open",
      claimedBy: null,

      controlMessageId: null,

      closeReason:
        "No further action required.",

      transcriptUrl: null,

      createdAt:
        new Date().toISOString()
    };

    // Create private ticket channel.

    const ch = await tApi(
      "POST",
      `/guilds/${guildId}/channels`,
      {
        name: tName(state),

        type: 0,
        parent_id: parent,

        topic: null,

        permission_overwrites:
          await tPermissions(
            guildId,
            state
          )
      }
    );

    state.channelId = ch.id;

    // Store private V3 metadata.

    const saved =
      await tSave(state);

    const cfg = T_TYPES[type];

    const mentionRoles =
      tTrading(state)
        ? [
            TC.seller,
            TC.support
          ]
        : [
            TC.support
          ];

    const welcome =
      await postChannelMessage(
        ch.id,
        {
          content: [
            `<@${userId}>`,

            ...mentionRoles.map(
              r => `<@&${r}>`
            )
          ].join(" "),

          embeds: [
            tEmbed(
              `${TICKET_EMOJI} ${cfg.label} Ticket #${String(number).padStart(4, "0")}`,

              `Welcome <@${userId}>!\n\n` +
              `${answerText || cfg.description || "Please explain what you need help with."}` +
              `${type === "partnership" ? "\n\n**Please show proof of your vouches!**" : ""}` +
              "\n\nOur team will assist you as soon as possible."
            )
          ],

          components:
            tControls(state),

          allowed_mentions: {
            parse: [],
            users: [userId],
            roles: mentionRoles
          }
        }
      );

    state.controlMessageId =
      welcome.id;

    await tSave(
      state,
      saved.id
    );

    await tLog(
      "Ticket Opened",
      state
    );

    await updateOriginalResponse(
      i,
      `Your ${cfg.label} ticket is ready: <#${ch.id}>`
    );
  } catch (error) {
    console.error(
      "[TICKET CREATE]",
      error
    );

    await updateOriginalResponse(
      i,
      `Could not create ticket: ${tClean(error.message)}`
    ).catch(console.error);
  }
}

// ==================================================
// TICKET CLAIM PERMISSIONS
// ==================================================

function tCanClaim(i, state) {
  const roles = tRoles(i);

  if (
    roles.has(TC.owner) ||
    roles.has(TC.mod)
  ) {
    return true;
  }

  if (tTrading(state)) {
    return (
      roles.has(TC.seller) ||
      roles.has(TC.support)
    );
  }

  return (
    roles.has(TC.admin) ||
    roles.has(TC.support)
  );
}

// ==================================================
// TICKET MANAGEMENT PERMISSIONS
// ==================================================

function tCanManage(i, state) {
  const roles = tRoles(i);

  if (
    roles.has(TC.owner) ||
    roles.has(TC.support)
  ) {
    return true;
  }

  if (state.claimedBy) {
    return (
      state.claimedBy === tUser(i)
    );
  }

  return (
    roles.has(TC.mod) ||
    roles.has(TC.admin) ||
    tCanClaim(i, state)
  );
}

// ==================================================
// CLAIM / CLOSE / REOPEN / DELETE
// ==================================================

async function tAction(
  i,
  action,
  closeReason = null
) {
  try {
    const channelId = i.channel_id;
    const guildId = i.guild_id;
    const actor = tUser(i);

    const {
      state,
      messageId
    } = await tStateFor(
      channelId
    );

    if (!T_TYPES[state.type]) {
      throw new Error(
        "Invalid ticket type."
      );
    }

    // ================================================
    // CLAIM
    // ================================================

    if (action === "claim") {
      if (!tCanClaim(i, state)) {
        throw new Error(
          "You cannot claim this ticket."
        );
      }

      if (state.status !== "open") {
        throw new Error(
          "Reopen this ticket first."
        );
      }

      if (state.claimedBy) {
        throw new Error(
          state.claimedBy === actor
            ? "You already claimed this ticket."
            : "Another staff member already claimed this ticket."
        );
      }

      const previous = {
        ...state
      };

      state.claimedBy = actor;

      try {
        await tApplyPermissions(
          channelId,
          guildId,
          state
        );

        await tSave(
          state,
          messageId
        );
      } catch (error) {
        await tApplyPermissions(
          channelId,
          guildId,
          previous
        ).catch(console.error);

        throw error;
      }

      await tUpdateControls(
        channelId,
        state
      );

      await postChannelMessage(
        channelId,
        {
          embeds: [
            tEmbed(
              "Ticket Claimed",
              `Claimed by <@${actor}>.`
            )
          ],

          allowed_mentions: {
            parse: []
          }
        }
      );

      await tLog(
        "Ticket Claimed",
        state
      );

      return updateOriginalResponse(
        i,
        "Ticket claimed successfully."
      );
    }

    // Other actions require management permissions.

    if (!tCanManage(i, state)) {
      throw new Error(
        "You cannot manage this ticket."
      );
    }

    // ================================================
    // CLOSE / REOPEN
    // ================================================

    if (
      action === "close" ||
      action === "reopen"
    ) {
      if (
        action === "close" &&
        state.status === "closed"
      ) {
        throw new Error(
          "Already closed."
        );
      }

      if (
        action === "reopen" &&
        state.status === "open"
      ) {
        throw new Error(
          "Already open."
        );
      }

      state.status =
        action === "close"
          ? "closed"
          : "open";

      if (action === "close") {
        state.closeReason =
          closeReason ||
          "No further action required.";
      }

      await tApplyPermissions(
        channelId,
        guildId,
        state
      );

      await tApi(
        "PATCH",
        `/channels/${channelId}`,
        {
          name: tName(state),
          topic: null
        }
      );

      await tSave(
        state,
        messageId
      );

      await tUpdateControls(
        channelId,
        state
      );

      await postChannelMessage(
        channelId,
        {
          embeds: [
            tEmbed(
              action === "close"
                ? "Ticket Closed"
                : "Ticket Reopened",

              `${action === "close" ? "Closed" : "Reopened"} by <@${actor}>.` +
              `${action === "close" ? `\n\nReason: ${tClean(state.closeReason)}` : ""}`
            )
          ],

          allowed_mentions: {
            parse: []
          }
        }
      );

      await tLog(
        action === "close"
          ? "Ticket Closed"
          : "Ticket Reopened",
        state
      );

      return updateOriginalResponse(
        i,
        `Ticket ${action === "close" ? "closed" : "reopened"} successfully.`
      );
    }

    // ================================================
    // DELETE
    // ================================================

    if (action === "delete") {
      if (state.status !== "closed") {
        throw new Error(
          "Close this ticket before deleting."
        );
      }

      if (
        !(
          tRoles(i).has(TC.owner) ||
          tRoles(i).has(TC.admin) ||
          tRoles(i).has(TC.mod) ||
          tCanManage(i, state)
        )
      ) {
        throw new Error(
          "No delete permission."
        );
      }

      // Save transcript BEFORE deletion.
      // Abort deletion if transcript upload fails.

      const msgs = (
        await tPages(
          channelId,
          500
        )
      ).reverse();

      const htmlEsc = v =>
        String(v ?? "").replace(
          /[&<>"']/g,
          c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
          })[c]
        );

      const html =
        "<!doctype html>" +
        "<html>" +
        "<head>" +
        '<meta charset="utf-8">' +
        "<title>Chuppys Transcript</title>" +
        "</head>" +
        "<body>" +
        `<h1>${htmlEsc(tName(state))}</h1>` +
        msgs.map(
          m =>
            "<article>" +
            `<b>${htmlEsc(m.author?.username)}</b> ` +
            `<small>${htmlEsc(m.timestamp)}</small>` +
            `<pre>${htmlEsc(m.content)}</pre>` +
            (m.attachments || []).map(
              a =>
                `<p>${htmlEsc(a.filename)}: ` +
                `${htmlEsc(a.url)}</p>`
            ).join("") +
            "</article>"
        ).join("") +
        "</body>" +
        "</html>";

      const form = new FormData();

      form.append(
        "payload_json",
        JSON.stringify({
          embeds: [
            tEmbed(
              "Ticket Deleted",
              `\`${tName(state)}\``
            )
          ]
        })
      );

      form.append(
        "files[0]",
        new Blob(
          [html],
          {
            type: "text/html"
          }
        ),
        `transcript-${state.type}-${state.number}.html`
      );

      const uploaded = await fetch(
        `https://discord.com/api/v10/channels/${TC.logs}/messages`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bot ${process.env.DISCORD_BOT_TOKEN}`
          },

          body: form
        }
      );

      if (!uploaded.ok) {
        throw new Error(
          `Transcript upload failed: ${uploaded.status}`
        );
      }

      await updateOriginalResponse(
        i,
        "Transcript saved. Deleting ticket..."
      );

      await tApi(
        "DELETE",
        `/channels/${channelId}`
      );

      return;
    }

    throw new Error(
      "Unknown ticket action."
    );
  } catch (error) {
    console.error(
      "[TICKET ACTION]",
      error
    );

    await updateOriginalResponse(
      i,
      `Ticket action failed: ${tClean(error.message)}`
    ).catch(console.error);
  }
}

// ==================================================
// MAIN VERCEL INTERACTIONS ENDPOINT
// ==================================================

export default async function handler(
  req,
  res
) {
  console.log(
    `[INTERACTIONS DEBUG] Received ${req.method} request.`
  );

  // ==================================================
  // REQUEST METHOD
  // ==================================================

  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      "POST"
    );

    return res.status(405).send(
      "Method not allowed"
    );
  }

  let body;

  try {
    body = await getRawBody(req);
  } catch (error) {
    console.error(
      "[INTERACTIONS DEBUG] Could not read request:",
      error
    );

    return res.status(400).send(
      "Invalid request body"
    );
  }

  // ==================================================
  // VERIFY DISCORD SIGNATURE
  // ==================================================

  const signature =
    req.headers["x-signature-ed25519"];

  const timestamp =
    req.headers["x-signature-timestamp"];

  const publicKey =
    process.env.DISCORD_PUBLIC_KEY;

  if (
    !signature ||
    !timestamp ||
    !publicKey
  ) {
    return res.status(401).send(
      "Missing signature information"
    );
  }

  if (
    !verifyDiscordSignature(
      body,
      signature,
      timestamp,
      publicKey
    )
  ) {
    return res.status(401).send(
      "Invalid signature"
    );
  }

  let interaction;

  try {
    interaction = JSON.parse(
      body.toString("utf8")
    );
  } catch {
    return res.status(400).send(
      "Invalid JSON"
    );
  }

  console.log(
    "[INTERACTIONS DEBUG] Interaction received:",
    {
      type: interaction.type,

      command:
        interaction.data?.name || null,

      customId:
        interaction.data?.custom_id || null
    }
  );

  // ==================================================
  // DISCORD PING
  // ==================================================

  if (interaction.type === 1) {
    return res.status(200).json({
      type: 1
    });
  }

  // ==================================================
  // SLASH COMMANDS
  // ==================================================

  if (interaction.type === 2) {
    const commandName =
      interaction.data?.name;

    // /help

    if (commandName === "help") {
      return res.status(200).json({
        type: 4,

        data: {
          flags: 64,

          embeds: [
            makeHelpEmbed()
          ]
        }
      });
    }

    // /ticketpanel

    if (commandName === "ticketpanel") {
      deferEphemeral(
        res,
        tPanel(interaction)
      );

      return;
    }

    // /request

    if (commandName === "request") {
      deferEphemeral(
        res,
        processRequestInteraction(
          interaction
        )
      );

      return;
    }

    // /vouch

    if (commandName === "vouch") {
      deferEphemeral(
        res,
        processVouchInteraction(
          interaction
        )
      );

      return;
    }

    // /question

    if (commandName === "question") {
      deferEphemeral(
        res,
        processQuestionInteraction(
          interaction
        )
      );

      return;
    }

    return res.status(200).json(
      ephemeral(
        "This slash command is not configured on the Vercel endpoint."
      )
    );
  }

  // ==================================================
  // BUTTONS AND DROPDOWNS
  // ==================================================

  if (interaction.type === 3) {
    const customId =
      interaction.data?.custom_id;

    // ================================================
    // TICKET CATEGORY DROPDOWN
    // ================================================

    if (
      T_SELECT.has(customId) &&
      interaction.data?.component_type === 3
    ) {
      const type = String(
        interaction.data.values?.[0] || ""
      ).toLowerCase();

      if (
        !T_TYPES[type] ||
        type === "verification"
      ) {
        return res.status(200).json(
          ephemeral(
            "Invalid ticket type."
          )
        );
      }

      if (T_TYPES[type].questions) {
        return res.status(200).json(
          tForm(type)
        );
      }

      deferEphemeral(
        res,
        tCreate(
          interaction,
          type
        )
      );

      return;
    }

    // ================================================
    // VIEW TRANSCRIPT
    // ================================================

    if (
      customId?.startsWith(
        "chuppys_transcript:"
      )
    ) {
      deferEphemeral(
        res,
        (async () => {
          try {
            const roles =
              tRoles(interaction);

            const admin =
              (
                BigInt(
                  interaction.member?.permissions || "0"
                ) & 8n
              ) !== 0n;

            if (
              !roles.has(TC.owner) &&
              !roles.has(TC.support) &&
              !admin
            ) {
              throw new Error(
                "Only Owner and Ticket Support may view transcripts."
              );
            }

            const logId =
              customId.slice(
                "chuppys_transcript:".length
              );

            if (
              logId !== interaction.message?.id
            ) {
              throw new Error(
                "Invalid transcript button."
              );
            }

            const msg = await tApi(
              "GET",
              `/channels/${TC.logs}/messages/${logId}`
            );

            const file = (
              msg.attachments || []
            ).find(
              a =>
                /^transcript-/i.test(
                  a.filename || ""
                )
            );

            if (!file) {
              throw new Error(
                "Transcript attachment not found."
              );
            }

            await updateOriginalResponse(
              interaction,
              {
                content:
                  `Transcript: [Open ${file.filename}](${file.url})`,

                allowed_mentions: {
                  parse: []
                }
              }
            );
          } catch (error) {
            await updateOriginalResponse(
              interaction,
              `Could not open transcript: ${tClean(error.message)}`
            ).catch(console.error);
          }
        })()
      );

      return;
    }

    // ================================================
    // CREATE VERIFICATION TICKET
    // ================================================

    if (
      customId === TC.verifyButton
    ) {
      deferEphemeral(
        res,
        tCreate(
          interaction,
          "verification"
        )
      );

      return;
    }

    // ================================================
    // TICKET MANAGEMENT BUTTONS
    // ================================================

    const action =
      T_BUTTONS[customId] ||
      (
        customId?.startsWith(
          "chuppys_ticket:"
        )
          ? T_COMPAT[
              customId.slice(
                "chuppys_ticket:".length
              )
            ]
          : null
      );

    // Close opens a modal.

    if (action === "close") {
      return res.status(200).json(
        tCloseForm(
          interaction.channel_id
        )
      );
    }

    // Claim, Reopen, Delete.

    if (action) {
      deferEphemeral(
        res,
        tAction(
          interaction,
          action
        )
      );

      return;
    }

    // ================================================
    // CLIENT ROLE BUTTON
    // ================================================

    if (
      customId === CLIENT_ROLE_BUTTON_ID
    ) {
      if (!interaction.guild_id) {
        return res.status(200).json(
          ephemeral(
            "You must use this button inside Chuppys."
          )
        );
      }

      deferEphemeral(
        res,
        processClientRole(
          interaction
        )
      );

      return;
    }

    // ================================================
    // VERIFY BUTTON
    // ================================================

    if (
      customId === VERIFY_CUSTOM_ID
    ) {
      if (!interaction.guild_id) {
        return res.status(200).json(
          ephemeral(
            "You must verify inside the Chuppys server."
          )
        );
      }

      deferEphemeral(
        res,
        processVerification(
          interaction
        )
      );

      return;
    }

    // ================================================
    // QUESTION SUPPORT BUTTON
    // ================================================

    if (
      typeof customId === "string" &&
      customId.startsWith(
        QUESTION_TICKET_CUSTOM_ID
      )
    ) {
      return res.status(200).json(
        handleQuestionTicketButton(
          interaction
        )
      );
    }

    // ================================================
    // QUESTION REPLY BUTTON
    // ================================================

    if (
      typeof customId === "string" &&
      customId.startsWith(
        QUESTION_REPLY_CUSTOM_ID
      )
    ) {
      return res.status(200).json(
        handleQuestionReplyButton(
          interaction
        )
      );
    }

    // ================================================
    // ROLE DROPDOWNS
    // ================================================

    const group =
      Object.prototype.hasOwnProperty.call(
        ROLE_GROUPS,
        customId
      )
        ? ROLE_GROUPS[customId]
        : null;

    if (
      !group ||
      !Array.isArray(
        interaction.data?.values
      )
    ) {
      return res.status(200).json(
        ephemeral(
          "This interaction is not configured."
        )
      );
    }

    if (
      interaction.data.values.some(
        roleId =>
          !group.roles.includes(roleId)
      )
    ) {
      return res.status(200).json(
        ephemeral(
          "Invalid role selection."
        )
      );
    }

    deferEphemeral(
      res,
      processRoleInteraction(
        interaction,
        group
      )
    );

    return;
  }

  // ==================================================
  // MODAL SUBMISSIONS
  // ==================================================

  if (interaction.type === 5) {
    const customId =
      interaction.data?.custom_id || "";

    // ================================================
    // PURCHASE / CASHOUT / PARTNERSHIP MODALS
    // ================================================

    if (
      customId.startsWith(
        T_MODAL
      )
    ) {
      const type =
        customId.slice(
          T_MODAL.length
        );

      if (
        !T_TYPES[type]?.questions
      ) {
        return res.status(200).json(
          ephemeral(
            "Invalid ticket form."
          )
        );
      }

      let answers;

      try {
        answers = tAnswers(
          interaction,
          type
        );
      } catch (error) {
        return res.status(200).json(
          ephemeral(
            tClean(error.message)
          )
        );
      }

      deferEphemeral(
        res,
        tCreate(
          interaction,
          type,
          answers
        )
      );

      return;
    }

    // ================================================
    // CLOSE TICKET MODAL
    // ================================================

    if (
      customId.startsWith(
        T_CLOSE
      )
    ) {
      if (
        interaction.channel_id !==
        customId.slice(
          T_CLOSE.length
        )
      ) {
        return res.status(200).json(
          ephemeral(
            "This form belongs to another ticket."
          )
        );
      }

      const fields = (
        interaction.data.components || []
      ).flatMap(
        r => r.components || []
      );

      const reason = fields.find(
        f =>
          f.custom_id ===
          "close_reason"
      )?.value?.trim() || "";

      deferEphemeral(
        res,
        tAction(
          interaction,
          "close",
          reason
        )
      );

      return;
    }

    // ================================================
    // QUESTION REPLY MODAL
    // ================================================

    if (
      customId.startsWith(
        QUESTION_MODAL_CUSTOM_ID
      )
    ) {
      if (
        !hasStaffPermission(
          interaction
        )
      ) {
        return res.status(200).json(
          ephemeral(
            "Only the owner, administrators, moderators, or Ticket Support can reply to questions."
          )
        );
      }

      deferEphemeral(
        res,
        processQuestionReply(
          interaction
        )
      );

      return;
    }

    return res.status(200).json(
      ephemeral(
        "This form is not configured."
      )
    );
  }

  // ==================================================
  // UNSUPPORTED INTERACTIONS
  // ==================================================

  return res.status(200).json(
    ephemeral(
      "This interaction type is not supported."
    )
  );
}
