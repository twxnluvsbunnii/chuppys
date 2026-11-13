import crypto from "crypto";
import { waitUntil } from "@vercel/functions";

export const config = { api: { bodyParser: false } };

// ==================================================
// CONFIGURATION
// ==================================================

const API = "https://discord.com/api/v10";

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
const TICKET_PANEL_CHANNEL_ID = "1530811385678790716";
const TICKET_LOG_CHANNEL_ID = "1570913954333728808";

const QUESTION_EMOJI_ID = "1561388594625511514";
const QUESTION_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${QUESTION_EMOJI_ID}.png`;

const QUESTION_EMOJI =
  "<:chuppypayment:1561388594625511514>";

const QUESTION_TICKET_CUSTOM_ID = "question_ticket:";
const QUESTION_REPLY_CUSTOM_ID = "question_reply:";
const QUESTION_MODAL_CUSTOM_ID = "question_reply_modal:";

const REQUEST_CHANNEL_ID = "1569732416388726834";

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
  "1568240267344093254",
  "1531084435716571137",
  "1531104789075853472",
  "1531104886630907925",
  "1551276593425682543",
  "1558913216602706011",
  "1568240367076122634",
  "1568283533879939123",
  "1568240484206514248"
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

// ==================================================
// TICKET ROLES
// ==================================================

const TICKET_EMOJI = "<:chuppyhi:1561103471325745242>";
const TICKET_EMOJI_ID = "1561103471325745242";

const OWNER_ROLE_ID = "1530988662970650865";
const ADMIN_ROLE_ID = "1531800870444994641";
const MOD_ROLE_ID = "1531800784700706887";
const TICKET_SUPPORT_ROLE_ID = "1563003884656398406";
const SELLER_ROLE_ID = "1550322075208646766";
const CONVERTER_ROLE_ID = "1569334149695668287";
const MIDDLEMAN_ROLE_ID = "1569334076224053268";

const TICKET_ACCESS_ROLE_IDS = [
  OWNER_ROLE_ID,
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID,
  SELLER_ROLE_ID,
  CONVERTER_ROLE_ID,
  MIDDLEMAN_ROLE_ID
];

const TICKET_MANAGER_ROLE_IDS = [
  OWNER_ROLE_ID,
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID
];

// ==================================================
// TICKET PINGS BY CATEGORY
// ==================================================

const TICKET_PING_ROLES = {
  purchase: [
    OWNER_ROLE_ID,
    CHUPPYS_ROLE_ID,
    SELLER_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID,
    MIDDLEMAN_ROLE_ID,
    CONVERTER_ROLE_ID
  ],

  cashout: [
    OWNER_ROLE_ID,
    CHUPPYS_ROLE_ID,
    SELLER_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID,
    MIDDLEMAN_ROLE_ID,
    CONVERTER_ROLE_ID
  ],

  support: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ],

  giveaway: [],
  partnership: []
};

function getTicketPingRoles(type) {
  return [...new Set(TICKET_PING_ROLES[type] || [])];
}

// ==================================================
// TICKET TYPES
// ==================================================

const TICKET_TYPES = {
  purchase: {
    name: "Purchase",
    description: "Please provide your purchase details.",
    env: "PURCHASE_TICKET_CATEGORY_ID",
    questions: [
      "What are you purchasing?",
      "Who are you buying from?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  cashout: {
    name: "Cash Out",
    description: "Please provide your cash out details.",
    env: "CASHOUT_TICKET_CATEGORY_ID",
    questions: [
      "What are you cashing out?",
      "How much are you looking for?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  giveaway: {
    name: "Giveaway",
    description: "Please provide details of the giveaway you won.",
    env: "GIVEAWAY_TICKET_CATEGORY_ID"
  },

  partnership: {
    name: "Partnership",
    description: "Please provide your partnership information.",
    env: "PARTNERSHIP_TICKET_CATEGORY_ID"
  },

  support: {
    name: "Support",
    description: "Please explain what you need help with.",
    env: "SUPPORT_TICKET_CATEGORY_ID"
  }
};

const TICKET_SELECT_IDS = new Set([
  "chuppys_ticket_select",
  "chuppys_ticket_category",
  "chuppys_tickets",
  "ticket_select",
  "ticket_category",
  "ticket_open",
  "ticket_create"
]);

const TICKET_MODAL_PREFIX = "chuppys_ticket_form:";
const TRANSCRIPT_BUTTON_PREFIX = "chuppys_transcript:";
const COUNTER_PREFIX = "CHUPPYS_TICKET_COUNTERS_V1:";

// ==================================================
// PERMISSIONS
// ==================================================

const VIEW_CHANNEL = 1024n;
const SEND_MESSAGES = 2048n;
const READ_HISTORY = 65536n;
const ATTACH_FILES = 32768n;

const ADMINISTRATOR = 8n;
const MANAGE_GUILD = 32n;
const MANAGE_MESSAGES = 8192n;

const TICKET_ALLOW = String(
  VIEW_CHANNEL |
  SEND_MESSAGES |
  READ_HISTORY |
  ATTACH_FILES
);

const TICKET_READ_ONLY = String(
  VIEW_CHANNEL | READ_HISTORY
);

const TICKET_DENY = String(VIEW_CHANNEL);

function getUserId(i) {
  return i.member?.user?.id || i.user?.id;
}

function memberHasRole(i, ids) {
  return (i.member?.roles || [])
    .some(id => ids.includes(id));
}

function hasStaffPermission(i) {
  const p = BigInt(i.member?.permissions || "0");

  return memberHasRole(i, TICKET_MANAGER_ROLE_IDS) ||
    (p & (
      ADMINISTRATOR |
      MANAGE_GUILD |
      MANAGE_MESSAGES
    )) !== 0n;
}

function canManageTicket(i) {
  const p = BigInt(i.member?.permissions || "0");

  return memberHasRole(i, TICKET_MANAGER_ROLE_IDS) ||
    (p & ADMINISTRATOR) !== 0n;
}

function canViewTranscript(i) {
  const p = BigInt(i.member?.permissions || "0");

  return memberHasRole(i, [
    OWNER_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ]) || (p & ADMINISTRATOR) !== 0n;
}

// ==================================================
// TICKET EMBEDS AND BUTTONS
// ==================================================

function ticketButtons(closed = false) {
  const button = (id, label, style) => ({
    type: 2,
    custom_id: id,
    label,
    style,
    emoji: { id: TICKET_EMOJI_ID }
  });

  return [{
    type: 1,
    components: closed
      ? [
          button("chuppys_ticket_reopen", "Reopen", 3),
          button("chuppys_ticket_delete", "Delete", 4)
        ]
      : [
          button("chuppys_ticket_claim", "Claim", 1),
          button("chuppys_ticket_close", "Close", 4)
        ]
  }];
}

function ticketEmbed(title, description) {
  return {
    color: 0xffffff,
    title,
    description,
    footer: {
      text: ".gg/chuppys | Ticket System"
    },
    timestamp: new Date().toISOString()
  };
}

function ticketChannelName(type, number, closed = false) {
  return (
    `${closed ? "closed-" : ""}${type}-` +
    String(number).padStart(4, "0")
  ).slice(0, 100);
}

function safeText(value) {
  return String(value ?? "").replace(/@/g, "＠");
}

// ==================================================
// DISCORD API HELPERS
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
      !/^[0-9a-f]{128}$/i.test(signature || "") ||
      !/^[0-9a-f]{64}$/i.test(publicKeyHex || "") ||
      typeof timestamp !== "string"
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
        Buffer.from(timestamp),
        body
      ]),
      key,
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

async function discordFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    12000
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    const text = await response.text();
    let data;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } finally {
    clearTimeout(timeout);
  }
}

function botHeaders() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN is missing.");
  }

  return {
    Authorization:
      `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json"
  };
}

async function botRequest(method, path, body) {
  const result = await discordFetch(
    `${API}${path}`,
    {
      method,
      headers: botHeaders(),
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {})
    }
  );

  if (!result.ok) {
    throw new Error(
      `Discord HTTP ${result.status}: ` +
      JSON.stringify(result.data)
    );
  }

  return result.data;
}

async function postChannelMessage(channelId, payload) {
  return botRequest(
    "POST",
    `/channels/${channelId}/messages`,
    payload
  );
}

async function getMemberRoles(guildId, userId) {
  const member = await botRequest(
    "GET",
    `/guilds/${guildId}/members/${userId}`
  );

  return member.roles || [];
}

async function updateOriginalResponse(i, payload) {
  const result = await discordFetch(
    `${API}/webhooks/${i.application_id}/${i.token}/messages/@original`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        typeof payload === "string"
          ? { content: payload }
          : payload
      )
    }
  );

  if (!result.ok) {
    throw new Error(
      `Could not update response: ${result.status}`
    );
  }
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
    data: { flags: 64 }
  });

  waitUntil(
    Promise.resolve(task).catch(error => {
      console.error("[BACKGROUND]", error);
    })
  );
}

function optionsMap(i) {
  return Object.fromEntries(
    (i.data?.options || [])
      .map(option => [
        option.name,
        option.value
      ])
  );
}

function getVouchChannelId(sellerId) {
  return PERSONAL_SELLER_IDS.includes(sellerId)
    ? PERSONAL_VOUCH_CHANNEL_ID
    : VOUCH_CHANNEL_ID;
}

// ==================================================
// DISCORD-BASED TICKET COUNTERS
// ==================================================

function emptyTicketCounters() {
  return Object.fromEntries(
    Object.keys(TICKET_TYPES)
      .map(type => [type, 0])
  );
}

function parseCounterMessage(content) {
  if (!content?.startsWith(COUNTER_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      content.slice(COUNTER_PREFIX.length)
    );

    const counters = emptyTicketCounters();

    for (const type of Object.keys(counters)) {
      if (
        !Number.isSafeInteger(parsed[type]) ||
        parsed[type] < 0
      ) {
        return null;
      }

      counters[type] = parsed[type];
    }

    return counters;
  } catch {
    return null;
  }
}

async function findCounterMessage() {
  let before;

  while (true) {
    const query = before
      ? `?limit=100&before=${before}`
      : "?limit=100";

    const messages = await botRequest(
      "GET",
      `/channels/${TICKET_LOG_CHANNEL_ID}/messages${query}`
    );

    for (const message of messages) {
      const counters = parseCounterMessage(
        message.content
      );

      if (counters) {
        return { message, counters };
      }
    }

    if (messages.length < 100) {
      break;
    }

    before = messages[messages.length - 1].id;
  }

  return null;
}

async function nextTicketNumber(guildId, type) {
  const found = await findCounterMessage();

  const counters = found?.counters ||
    emptyTicketCounters();

  if (!found) {
    const channels = await botRequest(
      "GET",
      `/guilds/${guildId}/channels`
    );

    for (const channel of channels) {
      const ticket = decodeTicketTopic(
        channel.topic
      );

      if (
        ticket &&
        Number.isSafeInteger(ticket.number) &&
        counters[ticket.type] !== undefined
      ) {
        counters[ticket.type] = Math.max(
          counters[ticket.type],
          ticket.number
        );
      }

      for (const name of Object.keys(counters)) {
        const match = channel.name?.match(
          new RegExp(
            `^(?:closed-)?${name}-(\\d+)$`
          )
        );

        if (match) {
          counters[name] = Math.max(
            counters[name],
            Number(match[1])
          );
        }
      }
    }
  }

  counters[type]++;

  const content =
    COUNTER_PREFIX + JSON.stringify(counters);

  if (found) {
    await botRequest(
      "PATCH",
      `/channels/${TICKET_LOG_CHANNEL_ID}/messages/${found.message.id}`,
      { content }
    );
  } else {
    await postChannelMessage(
      TICKET_LOG_CHANNEL_ID,
      {
        content,
        allowed_mentions: { parse: [] }
      }
    );
  }

  return counters[type];
}

// ==================================================
// PRIVATE TICKET CATEGORIES
// ==================================================

async function getTicketCategory(guildId, type) {
  const settings = TICKET_TYPES[type];

  if (!settings) {
    throw new Error("Invalid ticket category.");
  }

  const configuredId = process.env[settings.env];

  if (configuredId) {
    const channel = await botRequest(
      "GET",
      `/channels/${configuredId}`
    );

    if (
      channel.type !== 4 ||
      channel.guild_id !== guildId
    ) {
      throw new Error(
        `${settings.env} is not a valid category.`
      );
    }

    return channel.id;
  }

  const channels = await botRequest(
    "GET",
    `/guilds/${guildId}/channels`
  );

  const existing = channels.find(
    channel =>
      channel.type === 4 &&
      channel.name === `chuppys-${type}`
  );

  if (existing) {
    return existing.id;
  }

  const category = await botRequest(
    "POST",
    `/guilds/${guildId}/channels`,
    {
      name: `chuppys-${type}`,
      type: 4,
      permission_overwrites: [
        {
          id: guildId,
          type: 0,
          deny: TICKET_DENY
        },
        ...TICKET_ACCESS_ROLE_IDS.map(id => ({
          id,
          type: 0,
          allow: TICKET_ALLOW
        }))
      ]
    }
  );

  return category.id;
}

function encodeTicketTopic(data) {
  return `chuppys-ticket:${JSON.stringify(data)}`;
}

function decodeTicketTopic(topic) {
  if (!topic?.startsWith("chuppys-ticket:")) {
    return null;
  }

  try {
    return JSON.parse(
      topic.slice("chuppys-ticket:".length)
    );
  } catch {
    return null;
  }
}

async function getTicketChannel(i) {
  const channel = await botRequest(
    "GET",
    `/channels/${i.channel_id}`
  );

  const ticket = decodeTicketTopic(
    channel.topic
  );

  if (!ticket || !TICKET_TYPES[ticket.type]) {
    throw new Error(
      "This channel is not a Chuppys ticket."
    );
  }

  return { channel, ticket };
}

// ==================================================
// PURCHASE AND CASH OUT FORMS
// ==================================================

function ticketForm(type) {
  const settings = TICKET_TYPES[type];

  return {
    type: 9,
    data: {
      custom_id: `${TICKET_MODAL_PREFIX}${type}`,
      title: `${settings.name} Ticket`,
      components: settings.questions.map(
        (question, index) => ({
          type: 1,
          components: [{
            type: 4,
            custom_id: `answer_${index}`,
            label: question,
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

function ticketAnswers(i, type) {
  const fields = (i.data?.components || [])
    .flatMap(row => row.components || []);

  return TICKET_TYPES[type].questions.map(
    (question, index) => {
      const answer = fields.find(
        field =>
          field.custom_id === `answer_${index}`
      )?.value?.trim();

      if (!answer) {
        throw new Error(
          `Please answer: ${question}`
        );
      }

      return { question, answer };
    }
  );
}

// ==================================================
// TICKET LOGS
// ==================================================

async function logTicketEvent(title, description) {
  return postChannelMessage(
    TICKET_LOG_CHANNEL_ID,
    {
      embeds: [
        ticketEmbed(title, description)
      ],
      allowed_mentions: { parse: [] }
    }
  );
}

// ==================================================
// CREATE TICKET WITH CATEGORY-SPECIFIC PINGS
// ==================================================

async function processTicketOpen(i, formType = null) {
  try {
    const guildId = i.guild_id;
    const userId = getUserId(i);

    const type = formType ||
      String(i.data?.values?.[0] || "")
        .toLowerCase()
        .trim();

    if (!guildId || !userId) {
      throw new Error(
        "Tickets can only be opened inside the server."
      );
    }

    if (!TICKET_TYPES[type]) {
      throw new Error(
        "Please select a valid ticket category."
      );
    }

    const settings = TICKET_TYPES[type];

    const answers = settings.questions
      ? ticketAnswers(i, type)
      : [];

    const channels = await botRequest(
      "GET",
      `/guilds/${guildId}/channels`
    );

    const existing = channels.find(channel => {
      const ticket = decodeTicketTopic(
        channel.topic
      );

      return (
        ticket?.ownerId === userId &&
        ticket?.type === type &&
        ticket?.status !== "closed"
      );
    });

    if (existing) {
      return updateOriginalResponse(
        i,
        `You already have an open **${settings.name}** ticket: <#${existing.id}>`
      );
    }

    const parentId = await getTicketCategory(
      guildId,
      type
    );

    const number = await nextTicketNumber(
      guildId,
      type
    );

    const ticket = {
      ownerId: userId,
      type,
      number,
      status: "open",
      claimedBy: null
    };

    const channel = await botRequest(
      "POST",
      `/guilds/${guildId}/channels`,
      {
        name: ticketChannelName(type, number),
        type: 0,
        parent_id: parentId,
        topic: encodeTicketTopic(ticket),
        permission_overwrites: [
          {
            id: guildId,
            type: 0,
            deny: TICKET_DENY
          },
          {
            id: userId,
            type: 1,
            allow: TICKET_ALLOW
          },
          ...TICKET_ACCESS_ROLE_IDS.map(id => ({
            id,
            type: 0,
            allow: TICKET_ALLOW
          }))
        ]
      }
    );

    const answerText = answers.length
      ? answers.map(answer =>
          `**${answer.question}**\n${safeText(answer.answer)}`
        ).join("\n\n")
      : settings.description;

    // Select pings for this ticket category.
    const pingRoles = getTicketPingRoles(type);

    const pingContent = [
      `<@${userId}>`,
      ...pingRoles.map(id => `<@&${id}>`)
    ].join(" ");

    try {
      const welcome = await postChannelMessage(
        channel.id,
        {
          content: pingContent,

          embeds: [
            ticketEmbed(
              `${TICKET_EMOJI} ${settings.name} #${number}`,
              `Welcome to your private **${settings.name}** ticket!\n\n` +
              `${answerText}\n\n` +
              `**Opened by:** <@${userId}>\n\n` +
              "Our team will assist you as soon as possible."
            )
          ],

          components: ticketButtons(),

          allowed_mentions: {
            users: [userId],
            roles: pingRoles,
            parse: []
          }
        }
      );

      ticket.controlMessageId = welcome.id;

      await botRequest(
        "PATCH",
        `/channels/${channel.id}`,
        {
          topic: encodeTicketTopic(ticket)
        }
      );
    } catch (error) {
      console.error(
        "[TICKET WELCOME]",
        error
      );
    }

    await logTicketEvent(
      "Ticket Opened",
      `**Ticket:** ${channel.name}\n` +
      `**Channel ID:** ${channel.id}\n` +
      `**Type:** ${settings.name}\n` +
      `**Opened by:** <@${userId}>`
    ).catch(console.error);

    await updateOriginalResponse(
      i,
      `${TICKET_EMOJI} Your **${settings.name}** ticket has been created!\n\n<#${channel.id}>`
    );
  } catch (error) {
    console.error("[TICKET OPEN]", error);

    await updateOriginalResponse(
      i,
      `I couldn't create your ticket. ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// FETCH TICKET MESSAGES FOR TRANSCRIPTS
// ==================================================

async function fetchTicketMessages(channelId) {
  const messages = [];
  let before;

  while (true) {
    const query = before
      ? `?limit=100&before=${before}`
      : "?limit=100";

    const batch = await botRequest(
      "GET",
      `/channels/${channelId}/messages${query}`
    );

    if (!batch.length) {
      break;
    }

    messages.push(...batch);

    before = batch[batch.length - 1].id;

    if (batch.length < 100) {
      break;
    }
  }

  return messages.reverse();
}

function buildTranscript(
  channel,
  ticket,
  deletedBy,
  messages
) {
  return [
    `Ticket: ${channel.name}`,
    `Channel ID: ${channel.id}`,
    `Owner ID: ${ticket.ownerId}`,
    `Category: ${ticket.type}`,
    `Ticket Number: ${ticket.number || "Legacy"}`,
    `Deleted by: ${deletedBy}`,
    `Messages: ${messages.length}`,
    "",

    ...messages.map(message => {
      const attachments = (
        message.attachments || []
      ).map(attachment =>
        `${attachment.filename}: ${attachment.url}`
      ).join("\n");

      const embeds = (
        message.embeds || []
      ).map(embed =>
        `${embed.title || ""}\n${embed.description || ""}`
      ).join("\n");

      return (
        `[${message.timestamp}] ` +
        `${message.author?.username || "Unknown"} ` +
        `(${message.author?.id || "?"}):\n` +
        `${message.content || ""}\n` +
        `${embeds}\n` +
        `${attachments}`
      );
    })
  ].join("\n\n");
}

// ==================================================
// UPLOAD TRANSCRIPT FILE
// ==================================================

async function uploadTranscriptFile(
  channelId,
  filename,
  transcript,
  logEmbed
) {
  const form = new FormData();

  form.append(
    "payload_json",
    JSON.stringify({
      embeds: [logEmbed],
      allowed_mentions: { parse: [] }
    })
  );

  form.append(
    "files[0]",
    new Blob(
      [transcript],
      {
        type: "text/plain;charset=utf-8"
      }
    ),
    filename
  );

  const response = await fetch(
    `${API}/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bot ${process.env.DISCORD_BOT_TOKEN}`
      },
      body: form
    }
  );

  const data = await response.json()
    .catch(() => null);

  if (
    !response.ok ||
    !data?.attachments?.[0]
  ) {
    throw new Error(
      `Could not save transcript: ${response.status}`
    );
  }

  return data;
}

// ==================================================
// SAVE TRANSCRIPT AND ADD BUTTON
// ==================================================

async function saveTranscriptLog(
  channel,
  ticket,
  deletedBy,
  messages
) {
  const transcript = buildTranscript(
    channel,
    ticket,
    deletedBy,
    messages
  );

  const filename =
    `transcript-${ticket.type}-` +
    `${ticket.number || channel.id}.txt`;

  const description =
    `**Ticket:** ${channel.name}\n` +
    `**Owner:** <@${ticket.ownerId}>\n` +
    `**Category:** ${ticket.type}\n` +
    `**Deleted by:** <@${deletedBy}>\n` +
    `**Messages:** ${messages.length}\n\n` +
    "Press **View Transcript** to access the conversation.";

  const saved = await uploadTranscriptFile(
    TICKET_LOG_CHANNEL_ID,
    filename,
    transcript,
    ticketEmbed(
      "Ticket Deleted",
      description
    )
  );

  await botRequest(
    "PATCH",
    `/channels/${TICKET_LOG_CHANNEL_ID}/messages/${saved.id}`,
    {
      components: [{
        type: 1,
        components: [{
          type: 2,
          style: 1,
          custom_id:
            `${TRANSCRIPT_BUTTON_PREFIX}${saved.id}`,
          label: "View Transcript",
          emoji: { name: "📄" }
        }]
      }]
    }
  );

  return saved;
}

// ==================================================
// VIEW TRANSCRIPT BUTTON
// ==================================================

async function processViewTranscript(i) {
  try {
    if (
      !i.guild_id ||
      i.channel_id !== TICKET_LOG_CHANNEL_ID ||
      !canViewTranscript(i)
    ) {
      throw new Error(
        "Only authorized ticket staff can view transcripts."
      );
    }

    const messageId = i.data.custom_id.slice(
      TRANSCRIPT_BUTTON_PREFIX.length
    );

    if (
      !/^\d{17,20}$/.test(messageId) ||
      i.message?.id !== messageId
    ) {
      throw new Error(
        "Invalid transcript button."
      );
    }

    const log = await botRequest(
      "GET",
      `/channels/${TICKET_LOG_CHANNEL_ID}/messages/${messageId}`
    );

    const file = log.attachments?.find(
      attachment =>
        attachment.filename?.startsWith(
          "transcript-"
        ) &&
        attachment.filename?.endsWith(".txt")
    );

    if (!file) {
      throw new Error(
        "The transcript attachment could not be found."
      );
    }

    await updateOriginalResponse(
      i,
      {
        content:
          "📄 **Ticket Transcript**\n\n" +
          `[Open ${file.filename}](${file.url})\n\n` +
          "This response is visible only to you.",

        allowed_mentions: { parse: [] }
      }
    );
  } catch (error) {
    console.error(
      "[VIEW TRANSCRIPT]",
      error
    );

    await updateOriginalResponse(
      i,
      `Could not view transcript: ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// UPDATE TICKET CONTROL BUTTONS
// ==================================================

async function updateTicketControlMessage(
  channelId,
  ticket,
  closed
) {
  if (!ticket.controlMessageId) {
    return;
  }

  await botRequest(
    "PATCH",
    `/channels/${channelId}/messages/${ticket.controlMessageId}`,
    {
      components: ticketButtons(closed)
    }
  ).catch(console.warn);
}

// ==================================================
// CLAIM / CLOSE / REOPEN / DELETE
// ==================================================

async function processTicketAction(i, action) {
  try {
    const { channel, ticket } =
      await getTicketChannel(i);

    const userId = getUserId(i);

    if (!canManageTicket(i)) {
      throw new Error(
        "Only authorized staff can manage tickets."
      );
    }

    // CLAIM
    if (action === "claim") {
      if (ticket.status === "closed") {
        throw new Error(
          "Reopen this ticket before claiming it."
        );
      }

      if (
        ticket.claimedBy &&
        ticket.claimedBy !== userId
      ) {
        throw new Error(
          "This ticket has already been claimed by another staff member."
        );
      }

      ticket.claimedBy = userId;

      await botRequest(
        "PATCH",
        `/channels/${channel.id}`,
        {
          topic: encodeTicketTopic(ticket)
        }
      );

      await postChannelMessage(
        channel.id,
        {
          embeds: [
            ticketEmbed(
              `${TICKET_EMOJI} Ticket Claimed`,
              `This ticket has been claimed by <@${userId}>.`
            )
          ],
          allowed_mentions: { parse: [] }
        }
      );

      await logTicketEvent(
        "Ticket Claimed",
        `**Ticket:** ${channel.name}\n` +
        `**Claimed by:** <@${userId}>`
      ).catch(console.error);

      return updateOriginalResponse(
        i,
        "Ticket claimed successfully."
      );
    }

    // CLOSE
    if (action === "close") {
      if (ticket.status === "closed") {
        throw new Error(
          "This ticket is already closed."
        );
      }

      ticket.status = "closed";

      await botRequest(
        "PUT",
        `/channels/${channel.id}/permissions/${ticket.ownerId}`,
        {
          type: 1,
          allow: TICKET_READ_ONLY,
          deny: String(SEND_MESSAGES)
        }
      );

      await botRequest(
        "PATCH",
        `/channels/${channel.id}`,
        {
          topic: encodeTicketTopic(ticket),
          name: ticket.number
            ? ticketChannelName(
                ticket.type,
                ticket.number,
                true
              )
            : `closed-${ticket.type}-${ticket.ownerId}`.slice(0, 100)
        }
      );

      await updateTicketControlMessage(
        channel.id,
        ticket,
        true
      );

      await postChannelMessage(
        channel.id,
        {
          embeds: [
            ticketEmbed(
              `${TICKET_EMOJI} Ticket Closed`,
              `Closed by <@${userId}>.\n\n` +
              "Staff can reopen or delete this ticket."
            )
          ],
          components: ticketButtons(true),
          allowed_mentions: { parse: [] }
        }
      );

      await logTicketEvent(
        "Ticket Closed",
        `**Ticket:** ${channel.name}\n` +
        `**Category:** ${ticket.type}\n` +
        `**Closed by:** <@${userId}>`
      ).catch(console.error);

      return updateOriginalResponse(
        i,
        "Ticket closed successfully."
      );
    }

    // REOPEN
    if (action === "reopen") {
      if (ticket.status !== "closed") {
        throw new Error(
          "This ticket is already open."
        );
      }

      ticket.status = "open";

      await botRequest(
        "PUT",
        `/channels/${channel.id}/permissions/${ticket.ownerId}`,
        {
          type: 1,
          allow: TICKET_ALLOW,
          deny: "0"
        }
      );

      await botRequest(
        "PATCH",
        `/channels/${channel.id}`,
        {
          topic: encodeTicketTopic(ticket),
          name: ticket.number
            ? ticketChannelName(
                ticket.type,
                ticket.number
              )
            : `${ticket.type}-${ticket.ownerId}`.slice(0, 100)
        }
      );

      await updateTicketControlMessage(
        channel.id,
        ticket,
        false
      );

      await postChannelMessage(
        channel.id,
        {
          embeds: [
            ticketEmbed(
              `${TICKET_EMOJI} Ticket Reopened`,
              `Reopened by <@${userId}>.`
            )
          ],
          components: ticketButtons(),
          allowed_mentions: { parse: [] }
        }
      );

      await logTicketEvent(
        "Ticket Reopened",
        `**Ticket:** ${channel.name}\n` +
        `**Category:** ${ticket.type}\n` +
        `**Reopened by:** <@${userId}>`
      ).catch(console.error);

      return updateOriginalResponse(
        i,
        "Ticket reopened successfully."
      );
    }

    // DELETE
    if (action === "delete") {
      if (ticket.status !== "closed") {
        throw new Error(
          "Close the ticket before deleting it."
        );
      }

      const messages = await fetchTicketMessages(
        channel.id
      );

      // Never delete until transcript is saved.
      await saveTranscriptLog(
        channel,
        ticket,
        userId,
        messages
      );

      await updateOriginalResponse(
        i,
        "Transcript saved. Deleting ticket..."
      );

      await botRequest(
        "DELETE",
        `/channels/${channel.id}`
      );

      return;
    }

    throw new Error("Unknown ticket action.");
  } catch (error) {
    console.error(
      "[TICKET ACTION]",
      error
    );

    await updateOriginalResponse(
      i,
      `Ticket action failed: ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// ROLE DROPDOWNS
// ==================================================

async function changeRoles(i, group) {
  const guildId = i.guild_id;
  const userId = getUserId(i);

  const selected = new Set(
    i.data.values || []
  );

  for (const id of selected) {
    if (!group.roles.includes(id)) {
      throw new Error(
        "Invalid role selection."
      );
    }
  }

  const current = new Set(
    await getMemberRoles(guildId, userId)
  );

  for (const id of group.roles) {
    const shouldHave = selected.has(id);

    if (shouldHave === current.has(id)) {
      continue;
    }

    await botRequest(
      shouldHave ? "PUT" : "DELETE",
      `/guilds/${guildId}/members/${userId}/roles/${id}`
    );
  }
}

async function processRoleInteraction(i, group) {
  try {
    await changeRoles(i, group);

    await updateOriginalResponse(
      i,
      group.success
    );
  } catch (error) {
    console.error("[ROLE]", error);

    await updateOriginalResponse(
      i,
      "Role update failed. Please contact staff."
    ).catch(console.error);
  }
}

// ==================================================
// CLIENT ROLE
// ==================================================

async function processClientRole(i) {
  try {
    const guildId = i.guild_id;
    const userId = getUserId(i);

    const roles = await getMemberRoles(
      guildId,
      userId
    );

    if (roles.includes(CLIENT_ROLE_ID)) {
      return updateOriginalResponse(
        i,
        "You already have the client role! 🤍"
      );
    }

    await botRequest(
      "PUT",
      `/guilds/${guildId}/members/${userId}/roles/${CLIENT_ROLE_ID}`
    );

    await updateOriginalResponse(
      i,
      "You now have the client role! You can submit a vouch. 🤍"
    );
  } catch (error) {
    console.error("[CLIENT]", error);

    await updateOriginalResponse(
      i,
      "Your client role could not be added."
    ).catch(console.error);
  }
}

// ==================================================
// VERIFICATION
// ==================================================

async function processVerification(i) {
  try {
    const guildId = i.guild_id;
    const userId = getUserId(i);

    const roles = new Set(
      await getMemberRoles(guildId, userId)
    );

    if (roles.has(CHUPPYS_ROLE_ID)) {
      return updateOriginalResponse(
        i,
        "You are already verified! 🤍"
      );
    }

    const hasAge = AGE_ROLE_IDS.some(
      id => roles.has(id)
    );

    const hasPronoun = PRONOUN_ROLE_IDS.some(
      id => roles.has(id)
    );

    const pingCount = PING_ROLE_IDS.filter(
      id => roles.has(id)
    ).length;

    if (
      !hasAge ||
      !hasPronoun ||
      pingCount < 2
    ) {
      return updateOriginalResponse(
        i,
        `Please select an age role, pronoun role, and at least two ping roles in <#${ROLES_CHANNEL_ID}>.`
      );
    }

    await botRequest(
      "PUT",
      `/guilds/${guildId}/members/${userId}/roles/${CHUPPYS_ROLE_ID}`
    );

    await updateOriginalResponse(
      i,
      "You are now verified! Welcome to .gg/chuppys 🤍"
    );
  } catch (error) {
    console.error("[VERIFY]", error);

    await updateOriginalResponse(
      i,
      "Verification failed. Please contact staff."
    ).catch(console.error);
  }
}

// ==================================================
// /VOUCH
// ==================================================

async function processVouchInteraction(i) {
  try {
    if (!i.guild_id) {
      throw new Error(
        "Use /vouch inside the server."
      );
    }

    const buyerId = getUserId(i);

    const roles = await getMemberRoles(
      i.guild_id,
      buyerId
    );

    if (!roles.includes(CLIENT_ROLE_ID)) {
      throw new Error(
        "You need the client role before submitting a vouch."
      );
    }

    const options = optionsMap(i);

    const sellerId = options.seller;
    const rating = options.rating;
    const order = options.order?.trim();

    const resolved = i.data.resolved || {};

    const proof = resolved.attachments?.[
      options.proof
    ];

    const seller = resolved.users?.[sellerId];

    if (
      !sellerId ||
      seller?.bot ||
      sellerId === buyerId
    ) {
      throw new Error(
        "Please choose a valid seller."
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

    if (
      !order ||
      order.length > 500
    ) {
      throw new Error(
        "Enter an order description of 500 characters or fewer."
      );
    }

    if (
      !proof ||
      !(
        proof.content_type?.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp)$/i.test(
          proof.filename || ""
        )
      )
    ) {
      throw new Error(
        "Please attach an image as proof."
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
        `**items purchased:** ${safeText(order)}\n` +
        `**rating:** ${rating}/5\n` +
        `**proof:** 📎 ${safeText(proof.filename)}\n\n` +
        "*thank you for vouching! shop again ♡*",
      image: {
        url: proof.url
      },
      timestamp: new Date().toISOString()
    };

    await postChannelMessage(
      getVouchChannelId(sellerId),
      {
        embeds: [embed],
        allowed_mentions: { parse: [] }
      }
    );

    await updateOriginalResponse(
      i,
      "Your vouch was submitted successfully! ♡"
    );
  } catch (error) {
    console.error("[VOUCH]", error);

    await updateOriginalResponse(
      i,
      `❌ ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// /QUESTION
// ==================================================

async function processQuestionInteraction(i) {
  try {
    if (i.channel_id !== QUESTION_CHANNEL_ID) {
      throw new Error(
        `Use /question in <#${QUESTION_CHANNEL_ID}>.`
      );
    }

    const options = optionsMap(i);
    const question = options.question?.trim();
    const askerId = getUserId(i);

    if (!question) {
      throw new Error(
        "Please enter your question."
      );
    }

    const picture = options.picture
      ? i.data.resolved?.attachments?.[
          options.picture
        ]
      : null;

    if (
      picture &&
      !(
        picture.content_type?.startsWith("image/") ||
        /\.(png|jpe?g|gif|webp)$/i.test(
          picture.filename || ""
        )
      )
    ) {
      throw new Error(
        "The picture must be an image."
      );
    }

    const embed = {
      title:
        `Question from @${i.member?.user?.username || i.user?.username || "Member"}`,
      color: 0xffffff,
      description:
        `**Question**\n${safeText(question)}`,
      thumbnail: {
        url: QUESTION_EMOJI_URL
      },
      footer: {
        text:
          `.gg/chuppys • Question User ID: ${askerId}`
      },
      timestamp: new Date().toISOString()
    };

    if (picture) {
      embed.image = {
        url: picture.url
      };
    }

    await postChannelMessage(
      QUESTION_CHANNEL_ID,
      {
        embeds: [embed],
        components: [{
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
        }],
        allowed_mentions: { parse: [] }
      }
    );

    await updateOriginalResponse(
      i,
      "Your question was sent to Chuppys staff! ♡"
    );
  } catch (error) {
    console.error("[QUESTION]", error);

    await updateOriginalResponse(
      i,
      `Your question could not be sent: ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// /REQUEST
// ==================================================

async function processRequestInteraction(i) {
  try {
    if (i.channel_id !== REQUEST_CHANNEL_ID) {
      throw new Error(
        `Use /request in <#${REQUEST_CHANNEL_ID}>.`
      );
    }

    const options = optionsMap(i);
    const category = options.category;
    const items = options.items?.trim();

    if (!REQUEST_CATEGORIES.has(category)) {
      throw new Error(
        "Invalid request category."
      );
    }

    if (
      !items ||
      items.length > 1000
    ) {
      throw new Error(
        "Enter your requested items."
      );
    }

    const embed = {
      title: `${category} Request`,
      color: 0xffffff,
      description:
        `**Requested by:** <@${getUserId(i)}>\n\n` +
        `**Category:** ${category}\n\n` +
        "**What they'd like Chuppys to stock up on:**\n" +
        safeText(items),
      thumbnail: {
        url: QUESTION_EMOJI_URL
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
        allowed_mentions: { parse: [] }
      }
    );

    await updateOriginalResponse(
      i,
      `Your **${category}** request has been submitted! ♡`
    );
  } catch (error) {
    console.error("[REQUEST]", error);

    await updateOriginalResponse(
      i,
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
      "Here is a list of available commands and what they do.",

    fields: [
      {
        name: "General Commands",
        value:
          "`/help` — Displays this command menu.\n" +
          "`/question` — Submit a question.\n" +
          "`/request` — Request stock.\n" +
          "`/vouch` — Submit a vouch.\n" +
          "`,afk [reason]` — Set AFK status.\n" +
          "`,pay` — Payment methods.\n" +
          "`,client` — Client-role message."
      },

      {
        name: "Tickets",
        value:
          `Open a ticket in <#${TICKET_PANEL_CHANNEL_ID}>.\n` +
          "Categories: Purchase, Cashout, Giveaway, Partnership, Support.\n" +
          "Authorized staff can claim, close, reopen, and delete tickets."
      },

      {
        name: "Support Commands",
        value:
          "`,r @user c` — Give Chuppys role.\n" +
          "`,r @user r` — Vouch reminder.\n" +
          "`,partner` — Partnership instructions.\n" +
          "`,mod` — Moderator information.\n" +
          "`,seller` — Seller information.\n" +
          "`,promoter` — Promoter information."
      },

      {
        name: "Service Commands",
        value:
          "`,nitro` / `!nitro`\n" +
          "`,decor` / `!decor`\n" +
          "`,boosties` / `!boosties`\n" +
          "`,sellers` / `!sellers`\n" +
          "`,staff` / `!staff`"
      },

      {
        name: "Additional Commands",
        value:
          "`!vouchtut` — Vouch tutorial.\n" +
          "`!ranked` — Ranked roles.\n" +
          "`!robuxcashout` — Cashout rates.\n" +
          "`!testwelcome` — Test welcome.\n" +
          "`!testgoodbye` — Test goodbye."
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
// QUESTION BUTTONS
// ==================================================

function handleQuestionTicketButton() {
  return {
    type: 4,
    data: {
      flags: 64,
      embeds: [{
        color: 0xffffff,
        description:
          `Please open a Support ticket in <#${TICKET_PANEL_CHANNEL_ID}>.\n\n` +
          `Our Ticket Support team will assist you. ${TICKET_EMOJI}`,
        thumbnail: {
          url: QUESTION_EMOJI_URL
        },
        footer: {
          text: ".gg/chuppys"
        }
      }]
    }
  };
}

function handleQuestionReplyButton(i) {
  if (!hasStaffPermission(i)) {
    return ephemeral(
      "Only authorized staff can reply to questions."
    );
  }

  const askerId = i.data.custom_id.slice(
    QUESTION_REPLY_CUSTOM_ID.length
  );

  if (!/^\d{17,20}$/.test(askerId)) {
    return ephemeral(
      "Invalid question button."
    );
  }

  return {
    type: 9,
    data: {
      custom_id:
        `${QUESTION_MODAL_CUSTOM_ID}${askerId}:${i.message.id}`,
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
          required: true
        }]
      }]
    }
  };
}

// ==================================================
// QUESTION REPLY MODAL
// ==================================================

async function processQuestionReply(i) {
  try {
    if (!hasStaffPermission(i)) {
      throw new Error(
        "Only authorized staff can reply."
      );
    }

    const match = i.data.custom_id.match(
      /^question_reply_modal:(\d{17,20}):(\d{17,20})$/
    );

    if (!match) {
      throw new Error(
        "Invalid reply form."
      );
    }

    const askerId = match[1];
    const originalMessageId = match[2];

    const answer = i.data.components
      ?.flatMap(row => row.components || [])
      .find(
        component =>
          component.custom_id === "question_reply_text"
      )?.value?.trim();

    if (!answer) {
      throw new Error(
        "Please enter a response."
      );
    }

    const dm = await botRequest(
      "POST",
      "/users/@me/channels",
      {
        recipient_id: askerId
      }
    );

    await postChannelMessage(
      dm.id,
      {
        embeds: [{
          title: "Response to Your Question",
          color: 0xffffff,
          description:
            `${QUESTION_EMOJI} **Replied by:** <@${getUserId(i)}>\n\n` +
            `**Response:**\n${safeText(answer)}`,
          thumbnail: {
            url: QUESTION_EMOJI_URL
          },
          footer: {
            text: ".gg/chuppys"
          },
          timestamp: new Date().toISOString()
        }],
        allowed_mentions: { parse: [] }
      }
    );

    await postChannelMessage(
      QUESTION_CHANNEL_ID,
      {
        content:
          "A response was sent privately to the member.",
        message_reference: {
          message_id: originalMessageId,
          fail_if_not_exists: false
        },
        allowed_mentions: { parse: [] }
      }
    ).catch(console.warn);

    await updateOriginalResponse(
      i,
      "Your response was sent privately."
    );
  } catch (error) {
    console.error(
      "[QUESTION REPLY]",
      error
    );

    await updateOriginalResponse(
      i,
      `Could not send response: ${error.message}`
    ).catch(console.error);
  }
}

// ==================================================
// MAIN VERCEL INTERACTIONS ENDPOINT
// ==================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).send(
      "Method not allowed"
    );
  }

  let body;

  try {
    body = await getRawBody(req);
  } catch {
    return res.status(400).send(
      "Invalid request body"
    );
  }

  if (!verifyDiscordSignature(
    body,
    req.headers["x-signature-ed25519"],
    req.headers["x-signature-timestamp"],
    process.env.DISCORD_PUBLIC_KEY
  )) {
    return res.status(401).send(
      "Invalid signature"
    );
  }

  let i;

  try {
    i = JSON.parse(
      body.toString("utf8")
    );
  } catch {
    return res.status(400).send(
      "Invalid JSON"
    );
  }

  // DISCORD PING
  if (i.type === 1) {
    return res.status(200).json({
      type: 1
    });
  }

  // ==================================================
  // SLASH COMMANDS
  // ==================================================

  if (i.type === 2) {
    const command = i.data?.name;

    if (command === "help") {
      return res.status(200).json({
        type: 4,
        data: {
          flags: 64,
          embeds: [makeHelpEmbed()]
        }
      });
    }

    const handlers = {
      request: processRequestInteraction,
      question: processQuestionInteraction,
      vouch: processVouchInteraction
    };

    if (handlers[command]) {
      deferEphemeral(
        res,
        handlers[command](i)
      );

      return;
    }

    return res.status(200).json(
      ephemeral(
        "This slash command is not configured."
      )
    );
  }

  // ==================================================
  // BUTTONS AND DROPDOWNS
  // ==================================================

  if (i.type === 3) {
    const id = i.data?.custom_id || "";

    // TICKET DROPDOWN
    if (
      TICKET_SELECT_IDS.has(id) &&
      i.data?.component_type === 3
    ) {
      const type = String(
        i.data?.values?.[0] || ""
      ).toLowerCase().trim();

      if (!TICKET_TYPES[type]) {
        return res.status(200).json(
          ephemeral(
            "Please select a valid ticket category."
          )
        );
      }

      if (TICKET_TYPES[type].questions) {
        return res.status(200).json(
          ticketForm(type)
        );
      }

      deferEphemeral(
        res,
        processTicketOpen(i)
      );

      return;
    }

    // TRANSCRIPT BUTTON
    if (id.startsWith(
      TRANSCRIPT_BUTTON_PREFIX
    )) {
      deferEphemeral(
        res,
        processViewTranscript(i)
      );

      return;
    }

    // TICKET MANAGEMENT BUTTONS
    const ticketActions = {
      chuppys_ticket_claim: "claim",
      chuppys_ticket_close: "close",
      chuppys_ticket_reopen: "reopen",
      chuppys_ticket_delete: "delete"
    };

    if (ticketActions[id]) {
      deferEphemeral(
        res,
        processTicketAction(
          i,
          ticketActions[id]
        )
      );

      return;
    }

    // CLIENT ROLE
    if (id === CLIENT_ROLE_BUTTON_ID) {
      deferEphemeral(
        res,
        processClientRole(i)
      );

      return;
    }

    // VERIFY BUTTON
    if (id === VERIFY_CUSTOM_ID) {
      deferEphemeral(
        res,
        processVerification(i)
      );

      return;
    }

    // QUESTION SUPPORT BUTTON
    if (id.startsWith(
      QUESTION_TICKET_CUSTOM_ID
    )) {
      return res.status(200).json(
        handleQuestionTicketButton()
      );
    }

    // QUESTION REPLY BUTTON
    if (id.startsWith(
      QUESTION_REPLY_CUSTOM_ID
    )) {
      return res.status(200).json(
        handleQuestionReplyButton(i)
      );
    }

    // ROLE DROPDOWNS
    const group =
      Object.prototype.hasOwnProperty.call(
        ROLE_GROUPS,
        id
      )
        ? ROLE_GROUPS[id]
        : null;

    if (group) {
      deferEphemeral(
        res,
        processRoleInteraction(i, group)
      );

      return;
    }

    console.warn(
      "[INTERACTIONS] Unknown component:",
      id
    );

    return res.status(200).json(
      ephemeral(
        "This interaction is not configured."
      )
    );
  }

  // ==================================================
  // MODAL SUBMISSIONS
  // ==================================================

  if (i.type === 5) {
    const id = i.data?.custom_id || "";

    // PURCHASE / CASH OUT FORM
    if (id.startsWith(
      TICKET_MODAL_PREFIX
    )) {
      const type = id.slice(
        TICKET_MODAL_PREFIX.length
      );

      if (!TICKET_TYPES[type]?.questions) {
        return res.status(200).json(
          ephemeral(
            "Invalid ticket form."
          )
        );
      }

      deferEphemeral(
        res,
        processTicketOpen(i, type)
      );

      return;
    }

    // QUESTION REPLY FORM
    if (id.startsWith(
      QUESTION_MODAL_CUSTOM_ID
    )) {
      deferEphemeral(
        res,
        processQuestionReply(i)
      );

      return;
    }

    return res.status(200).json(
      ephemeral(
        "This form is not configured."
      )
    );
  }

  return res.status(200).json(
    ephemeral(
      "Unsupported interaction."
    )
  );
}
