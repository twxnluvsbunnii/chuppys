
"use strict";

// CHUPPYS TICKET SYSTEM — discord.js v14 / Render
// Usage: require("./tickets")(client);
// Command export: require("./tickets").command
// Run only ONE bot instance. Keep data and transcripts private.

const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder,
  TextInputStyle, ChannelType, PermissionFlagsBits, AttachmentBuilder,
  Events, MessageFlags
} = require("discord.js");

const IDS = Object.freeze({
  panel: "1530811385678790716",
  logs: "1570913954333728808",
  transcripts: "1571112508922531870",
  data: "1571112668037644388",
  owner: "1530988662970650865",
  admin: "1531800870444994641",
  mod: "1531800784700706887",
  support: "1563003884656398406",
  seller: "1550322075208646766",
  verified: "1550230619127021568"
});

const BRAND = ".gg/chuppys";
const EMOJI = "<:chuppyhi:1561103471325745242>";
const EPHEMERAL = MessageFlags.Ephemeral;
const STATE_PREFIX = "CHUPPYS_PRIVATE_TICKET_METADATA_V3:";
const LEGACY_PREFIXES = [
  "CHUPPYS_PRIVATE_TICKET_METADATA_V2:",
  "CHUPPYS_TICKET_STATE_V4:",
  "CHUPPYS_TICKET_STATE_V3:",
  "CHUPPYS_TICKET_STATE_V2:"
];
const COUNTER_PREFIX = "CHUPPYS_GLOBAL_TICKET_COUNTER_V1:";
const OLD_COUNTER_PREFIX = "CHUPPYS_TICKET_COUNTERS_V1:";

const SELECT_IDS = new Set([
  "chuppys_ticket_select", "chuppys_ticket_category",
  "chuppys_tickets", "ticket_select", "ticket_category",
  "ticket_open", "ticket_create"
]);

const SELECT_ID = "chuppys_ticket_select";
const FORM_PREFIX = "chuppys_ticket_form:";
const CLOSE_PREFIX = "chuppys_ticket_close_modal:";
const OLD_TRANSCRIPT_PREFIX = "chuppys_transcript:";

const BUTTONS = {
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
};

const STAFF = [
  IDS.owner, IDS.admin, IDS.mod, IDS.support, IDS.seller
];

const CLAIMED_STAFF = [IDS.owner, IDS.mod];

const ACCESS = {
  purchase: STAFF,
  cashout: STAFF,
  giveaway: [IDS.owner, IDS.admin, IDS.mod, IDS.support],
  partnership: [IDS.owner, IDS.admin, IDS.mod, IDS.support],
  support: [IDS.owner, IDS.admin, IDS.mod, IDS.support]
};

const PINGS = {
  purchase: [IDS.owner, IDS.verified, IDS.seller, IDS.support],
  cashout: [IDS.owner, IDS.verified, IDS.seller, IDS.support],
  giveaway: [],
  partnership: [],
  support: [IDS.owner, IDS.admin, IDS.mod, IDS.support]
};

const TYPES = {
  purchase: {
    name: "Purchase",
    categoryEnv: "PURCHASE_TICKET_CATEGORY_ID",
    description: "Please provide your purchase details.",
    questions: [
      "What are you purchasing?",
      "Who are you buying from?",
      "Payment method?",
      "Roblox user?"
    ]
  },
  cashout: {
    name: "Cash Out",
    categoryEnv: "CASHOUT_TICKET_CATEGORY_ID",
    description: "Please provide your cash out details.",
    questions: [
      "What are you cashing out?",
      "How much are you looking for?",
      "Payment method?",
      "Roblox user?"
    ]
  },
  giveaway: {
    name: "Giveaway",
    categoryEnv: "GIVEAWAY_TICKET_CATEGORY_ID",
    description: "Please provide details about the giveaway you won."
  },
  partnership: {
    name: "Partnership",
    categoryEnv: "PARTNERSHIP_TICKET_CATEGORY_ID",
    description: "Please provide your partnership information."
  },
  support: {
    name: "Support",
    categoryEnv: "SUPPORT_TICKET_CATEGORY_ID",
    description: "Please explain what you need help with."
  }
};

const command = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Post or update the Chuppys ticket panel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const cache = new Map();
let queue = Promise.resolve();
let initialization = null;
let initialized = false;
let globalCounter = 0;
let counterMessageId = null;

// ==================================================
// HELPERS
// ==================================================

function queued(task) {
  const result = queue.then(task);
  queue = result.catch(() => {});
  return result;
}

function formatNumber(n) {
  return String(n).padStart(4, "0");
}

function ticketName(type, number, closed = false) {
  return `${closed ? "closed-" : ""}${type}-${formatNumber(number)}`
    .slice(0, 100);
}

function safe(value, max = 1000) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .replace(/```/g, "''' ")
    .slice(0, max);
}

function html(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function discordStamp(value) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms)
    ? `<t:${Math.floor(ms / 1000)}:F>`
    : "Unknown";
}

function role(interaction, id) {
  const roles = interaction.member?.roles;
  return roles?.cache
    ? roles.cache.has(id)
    : Array.isArray(roles) && roles.includes(id);
}

function admin(interaction) {
  return Boolean(
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  );
}

function manager(interaction) {
  return admin(interaction) ||
    Boolean(interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )) ||
    STAFF.some(id => role(interaction, id));
}

function authorizedForClaim(interaction, state) {
  return !state.claimedBy ||
    state.claimedBy === interaction.user.id ||
    admin(interaction) ||
    role(interaction, IDS.owner) ||
    role(interaction, IDS.mod);
}

async function reply(interaction, content) {
  if (interaction.deferred) {
    return interaction.editReply({ content });
  }
  if (interaction.replied) {
    return interaction.followUp({ content, flags: EPHEMERAL });
  }
  return interaction.reply({ content, flags: EPHEMERAL });
}

function ticketEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: BRAND });
}

async function textChannel(guild, id, label) {
  const channel = await guild.channels.fetch(id);
  if (!channel?.isTextBased() || !channel.messages || !channel.send) {
    throw new Error(`${label} channel unavailable: ${id}`);
  }
  return channel;
}

function channelLink(guildId, channelId) {
  return `https://discord.com/channels/${guildId}/${channelId}`;
}

function transcriptButton(url) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("View Transcript")
      .setEmoji("📄")
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );
}

function viewTicketButton(guildId, channelId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("View Ticket")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Link)
      .setURL(channelLink(guildId, channelId))
  );
}

function controls(closed) {
  const row = new ActionRowBuilder();

  if (closed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTONS.reopen)
        .setLabel("Reopen")
        .setEmoji("🔓")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(BUTTONS.delete)
        .setLabel("Delete")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTONS.claim)
        .setLabel("Claim")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(BUTTONS.close)
        .setLabel("Close")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return [row];
}

// ==================================================
// TICKET PANEL
// ==================================================

function panelPayload() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
    .setPlaceholder("Select a ticket category")
    .addOptions(
      Object.entries(TYPES).map(([value, settings]) => ({
        label: settings.name,
        value,
        description: `Open a ${settings.name} ticket`
      }))
    );

  return {
    embeds: [
      ticketEmbed(
        `${EMOJI} .gg/chuppys Tickets`,
        "Welcome to the Chuppys ticket system!\n\n" +
        "Select the category that matches what you need assistance with.\n\n" +
        "**Purchase** — Purchase assistance\n" +
        "**Cash Out** — Cashout assistance\n" +
        "**Giveaway** — Giveaway claims\n" +
        "**Partnership** — Partnerships\n" +
        "**Support** — General assistance\n\n" +
        "Our team will assist you as soon as possible."
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(menu)
    ],
    allowedMentions: { parse: [] }
  };
}

// ==================================================
// PERSISTENT STORAGE
// ==================================================

function parseState(message) {
  const content = message?.content || "";
  const prefix = [STATE_PREFIX, ...LEGACY_PREFIXES]
    .find(p => content.startsWith(p));

  if (!prefix) return null;

  try {
    const data = JSON.parse(content.slice(prefix.length));

    if (!data.channelId || !data.ownerId || !TYPES[data.type]) {
      return null;
    }

    const number = Number(data.number);

    if (!Number.isSafeInteger(number) || number < 1) {
      return null;
    }

    return {
      channelId: String(data.channelId),
      ownerId: String(data.ownerId),
      type: data.type,
      number,
      status: data.status === "closed" ? "closed" : "open",
      claimedBy: data.claimedBy || null,
      controlMessageId: data.controlMessageId || null,
      closeReason: data.closeReason || "Done",
      transcriptUrl: data.transcriptUrl || null,
      createdAt: data.createdAt || null
    };
  } catch {
    return null;
  }
}

async function scan(channel, callback, limitPages = 200) {
  let before;

  for (let page = 0; page < limitPages; page++) {
    const messages = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    if (!messages.size) return;

    for (const message of messages.values()) {
      await callback(message);
    }

    if (messages.size < 100) return;

    before = messages.last().id;
  }

  console.warn(`[TICKETS] Scan limit reached in ${channel.id}.`);
}

async function saveState(channel, entry) {
  const storage = await textChannel(
    channel.guild, IDS.data, "Ticket data"
  );

  const content = STATE_PREFIX + JSON.stringify(entry.state);

  let message = entry.storageMessageId
    ? await storage.messages.fetch(entry.storageMessageId)
      .catch(() => null)
    : null;

  if (message) {
    await message.edit({
      content,
      allowedMentions: { parse: [] }
    });
  } else {
    message = await storage.send({
      content,
      allowedMentions: { parse: [] }
    });
    entry.storageMessageId = message.id;
  }

  cache.set(channel.id, entry);
}

async function init(guild) {
  if (initialized) return;
  if (initialization) return initialization;

  initialization = (async () => {
    const dataChannel = await textChannel(
      guild, IDS.data, "Ticket data"
    );

    const logChannel = await textChannel(
      guild, IDS.logs, "Ticket log"
    );

    let highest = 0;
    let counterMessage = null;
    const seenData = new Set();

    const processMessage = (message, inData) => {
      if (message.author.id !== guild.client.user.id) return;

      const state = parseState(message);

      if (state) {
        highest = Math.max(highest, state.number);

        if (!cache.has(state.channelId)) {
          cache.set(state.channelId, {
            state,
            storageMessageId: inData ? message.id : null
          });
        }

        if (inData) seenData.add(state.channelId);
      }

      if (message.content.startsWith(COUNTER_PREFIX)) {
        const value = Number(
          message.content.slice(COUNTER_PREFIX.length)
        );

        if (Number.isSafeInteger(value) && value >= 0) {
          highest = Math.max(highest, value);
          if (inData && !counterMessage) {
            counterMessage = message;
          }
        }
      }

      if (!inData && message.content.startsWith(OLD_COUNTER_PREFIX)) {
        try {
          const old = JSON.parse(
            message.content.slice(OLD_COUNTER_PREFIX.length)
          );

          const values = Object.values(old)
            .map(Number)
            .filter(n => Number.isSafeInteger(n) && n >= 0);

          highest = Math.max(
            highest,
            values.reduce((sum, n) => sum + n, 0)
          );
        } catch {
          // Ignore malformed legacy counter.
        }
      }
    };

    await scan(
      dataChannel,
      message => processMessage(message, true)
    );

    if (logChannel.id !== dataChannel.id) {
      await scan(
        logChannel,
        message => processMessage(message, false)
      );
    }

    await guild.channels.fetch();

    for (const channel of guild.channels.cache.values()) {
      const match = channel.name?.match(
        /^(?:closed-)?(?:purchase|purchasing|cashout|giveaway|partnership|support)-(\d+)$/
      );

      if (match) {
        highest = Math.max(highest, Number(match[1]));
      }
    }

    globalCounter = highest;

    if (counterMessage) {
      counterMessageId = counterMessage.id;

      const stored = Number(
        counterMessage.content.slice(COUNTER_PREFIX.length)
      );

      if (stored < highest) {
        await counterMessage.edit({
          content: COUNTER_PREFIX + highest
        });
      }
    } else {
      const msg = await dataChannel.send({
        content: COUNTER_PREFIX + highest,
        allowedMentions: { parse: [] }
      });

      counterMessageId = msg.id;
    }

    // Migrate active legacy records into private storage.
    for (const [id, entry] of cache) {
      if (entry.storageMessageId || seenData.has(id)) continue;

      const channel = await guild.channels.fetch(id)
        .catch(() => null);

      if (channel?.type === ChannelType.GuildText) {
        await saveState(channel, entry);
      }
    }

    initialized = true;

    console.log(
      `[TICKETS] Counter preserved at ${globalCounter}; loaded ${cache.size} states.`
    );
  })();

  try {
    await initialization;
  } finally {
    initialization = null;
  }
}

async function nextNumber(guild) {
  await init(guild);

  const dataChannel = await textChannel(
    guild, IDS.data, "Ticket data"
  );

  const msg = await dataChannel.messages.fetch(counterMessageId);

  const value = msg.content.startsWith(COUNTER_PREFIX)
    ? Number(msg.content.slice(COUNTER_PREFIX.length))
    : NaN;

  globalCounter = Math.max(
    globalCounter,
    Number.isSafeInteger(value) && value >= 0 ? value : 0
  );

  const next = globalCounter + 1;

  await msg.edit({
    content: COUNTER_PREFIX + next
  });

  globalCounter = next;
  return next;
}

async function loadState(channel) {
  await init(channel.guild);

  const entry = cache.get(channel.id);

  if (entry) {
    if (channel.topic) {
      await channel.setTopic(null).catch(() => {});
    }
    return entry;
  }

  if (!channel.topic) return null;

  let data = null;

  try {
    const raw = channel.topic.startsWith("chuppys-ticket:")
      ? channel.topic.slice("chuppys-ticket:".length)
      : channel.topic;

    if (raw.trim().startsWith("{")) {
      data = JSON.parse(raw);
    }
  } catch {
    // Not a legacy ticket.
  }

  if (!data?.ownerId || !TYPES[data.type]) return null;

  const number = Number(data.number);

  if (!Number.isSafeInteger(number) || number < 1) {
    return null;
  }

  const migrated = {
    state: {
      channelId: channel.id,
      ownerId: String(data.ownerId),
      type: data.type,
      number,
      status: data.status === "closed" ? "closed" : "open",
      claimedBy: data.claimedBy || null,
      controlMessageId: data.controlMessageId || null,
      closeReason: data.closeReason || "Done",
      transcriptUrl: data.transcriptUrl || null,
      createdAt: data.createdAt || null
    },
    storageMessageId: null
  };

  await saveState(channel, migrated);
  await channel.setTopic(null);

  return migrated;
}

async function existingTicket(guild, userId, type) {
  await init(guild);

  for (const entry of cache.values()) {
    if (
      entry.state.ownerId !== userId ||
      entry.state.type !== type ||
      entry.state.status === "closed"
    ) {
      continue;
    }

    const channel = await guild.channels.fetch(
      entry.state.channelId
    ).catch(() => null);

    if (channel) return channel;
  }

  return null;
}

// ==================================================
// PRIVATE TICKET PERMISSIONS
// ==================================================

function permissions(guild, state) {
  const allowed = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AttachFiles
  ];

  const readOnly = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.ReadMessageHistory
  ];

  const roles = state.claimedBy
    ? CLAIMED_STAFF
    : ACCESS[state.type];

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: guild.client.user.id,
      allow: [
        ...allowed,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    },
    ...[...new Set(roles)]
      .filter(id => guild.roles.cache.has(id))
      .map(id => ({
        id,
        allow: state.status === "closed" ? readOnly : allowed,
        ...(state.status === "closed"
          ? {
              deny: [
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles
              ]
            }
          : {})
      }))
  ];

  overwrites.push({
    id: state.ownerId,
    allow: state.status === "closed" ? readOnly : allowed,
    ...(state.status === "closed"
      ? {
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles
          ]
        }
      : {})
  });

  if (state.claimedBy && state.claimedBy !== state.ownerId) {
    overwrites.push({
      id: state.claimedBy,
      allow: state.status === "closed" ? readOnly : allowed,
      ...(state.status === "closed"
        ? {
            deny: [
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.AttachFiles
            ]
          }
        : {})
    });
  }

  return overwrites;
}

async function applyPermissions(channel, state) {
  await channel.permissionOverwrites.set(
    permissions(channel.guild, state),
    "Ticket access updated"
  );

  if (channel.topic) {
    await channel.setTopic(null);
  }
}

async function category(guild, type) {
  const envName = TYPES[type].categoryEnv;
  const configured = process.env[envName];

  if (configured) {
    const result = await guild.channels.fetch(configured);

    if (result?.type !== ChannelType.GuildCategory) {
      throw new Error(`${envName} is not a valid category.`);
    }

    return result;
  }

  await guild.channels.fetch();

  return guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory &&
      c.name === `chuppys-${type}`
  ) || guild.channels.create({
    name: `chuppys-${type}`,
    type: ChannelType.GuildCategory
  });
}

// ==================================================
// TICKETY-STYLE TICKET LOGS
// ==================================================

async function userInfo(guild, id) {
  const user = id
    ? await guild.client.users.fetch(id).catch(() => null)
    : null;

  return {
    id: id || "Unknown",
    mention: id ? `<@${id}>` : "Unknown",
    username: user?.username || "Unknown"
  };
}

async function logEmbed(
  guild, state, executorId, action, reason, count
) {
  const [creator, executor] = await Promise.all([
    userInfo(guild, state.ownerId),
    userInfo(guild, executorId)
  ]);

  const title = {
    opened: "Ticket Created",
    claimed: "Ticket Claimed",
    closed: "Ticket Closed",
    reopened: "Ticket Reopened",
    deleted: "Ticket Deleted"
  }[action] || "Ticket Updated";

  const verb = {
    opened: "created",
    claimed: "claimed",
    closed: "closed",
    reopened: "reopened",
    deleted: "deleted"
  }[action] || "updated";

  const lines = [
    `**Ticket Name:** ${ticketName(
      state.type,
      state.number,
      action === "deleted" ||
      (state.status === "closed" && action !== "reopened")
    )}`,
    `**Ticket Number:** #${state.number}`,
    `**Ticket ID:** ${state.channelId}`,
    `**Category:** ${TYPES[state.type]?.name || state.type}`
  ];

  if (action === "opened" && state.createdAt) {
    lines.push(`**Created At:** ${discordStamp(state.createdAt)}`);
  }

  if (["closed", "deleted"].includes(action)) {
    lines.push(`**Reason:** ${safe(reason || "Done", 450)}`);
  }

  if (Number.isSafeInteger(count)) {
    lines.push(`**Messages:** ${count}`);
  }

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(title)
    .setDescription(`${executor.mention} ${verb} a ticket.`)
    .addFields(
      {
        name: "Ticket Information",
        value: lines.join("\n")
      },
      {
        name: "Creator Information",
        value:
          `**Creator:** ${creator.mention}\n` +
          `**Creator Username:** @${safe(creator.username, 100)}\n` +
          `**Creator ID:** ${creator.id}`
      }
    );

  if (action !== "opened") {
    embed.addFields({
      name: "Executor Information",
      value:
        `**Executor:** ${executor.mention}\n` +
        `**Executor Username:** @${safe(executor.username, 100)}\n` +
        `**Executor ID:** ${executor.id}`
    });
  }

  return embed
    .setFooter({ text: `${BRAND} | Ticket System` })
    .setTimestamp();
}

async function sendLog(
  guild, state, executorId, action, opts = {}
) {
  try {
    const logChannel = await textChannel(
      guild, IDS.logs, "Ticket log"
    );

    const embed = await logEmbed(
      guild,
      state,
      executorId,
      action,
      opts.reason,
      opts.messageCount
    );

    if (opts.transcriptUrl) {
      embed.addFields({
        name: "Transcript",
        value: "Use **View Transcript** to open the saved conversation."
      });
    }

    const components = opts.transcriptUrl
      ? [transcriptButton(opts.transcriptUrl)]
      : action === "deleted"
        ? []
        : [viewTicketButton(guild.id, state.channelId)];

    return await logChannel.send({
      embeds: [embed],
      components,
      allowedMentions: { parse: [] }
    });

  } catch (err) {
    console.error(`[TICKETS] ${action} log failed:`, err);
    return null;
  }
}

// ==================================================
// HTML TRANSCRIPTS
// ==================================================

async function allMessages(channel) {
  const result = [];
  let before;

  for (;;) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    if (!batch.size) break;

    result.push(...batch.values());

    if (batch.size < 100) break;

    before = batch.last().id;
  }

  return result.sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );
}

function transcriptHtml(channel, state, messages) {
  const rows = messages.map(msg => {
    const author = html(msg.author?.username || "Unknown");
    const id = html(msg.author?.id || "Unknown");

    const date = html(
      new Date(msg.createdTimestamp).toLocaleString(
        "en-US",
        {
          timeZone: "UTC",
          timeZoneName: "short"
        }
      )
    );

    const body = msg.content
      ? `<div class="body">${html(msg.content)}</div>`
      : "";

    const embeds = msg.embeds.map(embed => {
      const fields = (embed.fields || [])
        .map(f =>
          `<p><strong>${html(f.name)}</strong><br>${html(f.value)}</p>`
        )
        .join("");

      return (
        `<div class="embed">` +
        `<strong>${html(embed.title || "Embed")}</strong>` +
        `<div class="body">${html(embed.description || "")}</div>` +
        `${fields}</div>`
      );
    }).join("");

    const attachments = [...msg.attachments.values()]
      .map(a => {
        const url = String(a.url || "");

        if (!/^https:\/\//i.test(url)) return "";

        return (
          `<div class="attachment">📎 ` +
          `<a href="${html(url)}" target="_blank" ` +
          `rel="noopener noreferrer">` +
          `${html(a.name || "Attachment")}</a></div>`
        );
      })
      .join("");

    return (
      `<article>` +
      `<div class="author">${author} ` +
      `<small>${id} · ${date}</small></div>` +
      `${body}${embeds}${attachments}</article>`
    );
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ticket #${state.number} transcript</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;
  background:#111018;
  color:#ececf1;
  font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif
}
header{
  padding:30px max(20px,calc((100% - 850px)/2));
  background:#201e2c;
  border-bottom:3px solid #5865f2
}
h1{margin:0 0 8px;font-size:25px}
.meta{color:#b7b5c4;font-size:13px}
main{max-width:850px;margin:auto;padding:16px 20px 50px}
article{border-bottom:1px solid #302d3b;padding:17px 0}
.author{font-weight:700;color:#fff}
.author small{
  font-weight:400;
  color:#a8a5b7;
  font-size:12px;
  margin-left:6px
}
.body{
  white-space:pre-wrap;
  overflow-wrap:anywhere;
  margin-top:5px
}
.embed{
  border-left:4px solid #5865f2;
  background:#23212f;
  padding:12px 16px;
  margin-top:9px;
  border-radius:5px
}
.embed p{white-space:pre-wrap;overflow-wrap:anywhere}
.attachment{margin-top:7px}
a{color:#88baff}
a:hover{text-decoration:none}
</style>
</head>
<body>
<header>
<h1>${html(BRAND)} · Ticket Transcript</h1>
<div class="meta">
Ticket: ${html(channel.name)} · #${state.number} ·
${html(TYPES[state.type]?.name || state.type)}
<br>
Channel ID: ${html(channel.id)} ·
Creator ID: ${html(state.ownerId)} ·
Claimed by: ${html(state.claimedBy || "Nobody")}
<br>
Generated: ${html(new Date().toISOString())} ·
Messages: ${messages.length}
</div>
</header>
<main>${rows || "<p>No messages.</p>"}</main>
</body>
</html>`;
}

async function saveTranscript(channel, state) {
  const storage = await textChannel(
    channel.guild,
    IDS.transcripts,
    "Ticket transcript"
  );

  const messages = await allMessages(channel);
  const document = transcriptHtml(channel, state, messages);
  const buffer = Buffer.from(document, "utf8");

  if (buffer.length > 7 * 1024 * 1024) {
    throw new Error(
      "Transcript exceeds 7 MB. Archive older messages before closing this ticket."
    );
  }

  const filename = `transcript-${state.type}-${state.number}.html`;

  const attachment = new AttachmentBuilder(
    buffer,
    { name: filename }
  );

  const message = await storage.send({
    content:
      `**Ticket Transcript**\n` +
      `Ticket: ${safe(channel.name, 100)}\n` +
      `Ticket Number: #${state.number}\n` +
      `Creator ID: ${state.ownerId}\n` +
      `Messages: ${messages.length}`,
    files: [attachment],
    allowedMentions: { parse: [] }
  });

  return {
    url: message.url,
    messageCount: messages.length
  };
}

// ==================================================
// TICKET FORMS
// ==================================================

function ticketForm(type) {
  const settings = TYPES[type];

  const modal = new ModalBuilder()
    .setCustomId(FORM_PREFIX + type)
    .setTitle(`${settings.name} Ticket`);

  settings.questions.forEach((question, i) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`answer_${i}`)
          .setLabel(question.slice(0, 45))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(250)
      )
    );
  });

  return modal;
}

function closeModal(id) {
  return new ModalBuilder()
    .setCustomId(CLOSE_PREFIX + id)
    .setTitle("Close Ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("close_reason")
          .setLabel("Reason for closing")
          .setPlaceholder("Done")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500)
      )
    );
}

// ==================================================
// CREATE TICKET
// ==================================================

async function createTicket(interaction, type, answers = []) {
  return queued(async () => {
    const guild = interaction.guild;
    const settings = TYPES[type];

    if (!settings) {
      throw new Error("Invalid ticket type.");
    }

    const already = await existingTicket(
      guild,
      interaction.user.id,
      type
    );

    if (already) {
      return {
        channel: already,
        existing: true
      };
    }

    const parent = await category(guild, type);
    const number = await nextNumber(guild);

    const state = {
      channelId: null,
      ownerId: interaction.user.id,
      type,
      number,
      status: "open",
      claimedBy: null,
      controlMessageId: null,
      closeReason: "Done",
      transcriptUrl: null,
      createdAt: new Date().toISOString()
    };

    const channel = await guild.channels.create({
      name: ticketName(type, number),
      type: ChannelType.GuildText,
      parent: parent.id,
      topic: null,
      permissionOverwrites: permissions(guild, state),
      reason: `Ticket opened by ${interaction.user.id}`
    });

    state.channelId = channel.id;

    const entry = {
      state,
      storageMessageId: null
    };

    await saveState(channel, entry);

    const details = settings.questions && answers.length
      ? settings.questions.map(
          (q, i) => `**${q}**\n${safe(answers[i], 250)}`
        ).join("\n\n")
      : settings.description;

    const pingRoles = PINGS[type].filter(
      id => guild.roles.cache.has(id)
    );

    const welcome = await channel.send({
      content: [
        `<@${interaction.user.id}>`,
        ...pingRoles.map(id => `<@&${id}>`)
      ].join(" "),

      embeds: [
        ticketEmbed(
          `${EMOJI} ${settings.name} Ticket #${formatNumber(number)}`,
          `Welcome <@${interaction.user.id}>!\n\n` +
          `${details}\n\n` +
          "Please wait for our team to assist you."
        )
      ],

      components: controls(false),

      allowedMentions: {
        parse: [],
        users: [interaction.user.id],
        roles: pingRoles
      }
    });

    state.controlMessageId = welcome.id;

    await saveState(channel, entry);

    await sendLog(
      guild,
      state,
      interaction.user.id,
      "opened"
    );

    return {
      channel,
      existing: false
    };
  });
}

// ==================================================
// UPDATE BUTTONS
// ==================================================

async function updateControls(channel, state) {
  if (!state.controlMessageId) return;

  const msg = await channel.messages.fetch(
    state.controlMessageId
  ).catch(() => null);

  if (msg) {
    await msg.edit({
      components: controls(state.status === "closed")
    });
  }
}

// ==================================================
// CLAIM TICKET
// ==================================================

async function claim(interaction, channel, entry) {
  const state = entry.state;

  if (state.status === "closed") {
    return reply(
      interaction,
      "Reopen this ticket before claiming it."
    );
  }

  if (state.claimedBy) {
    return reply(
      interaction,
      state.claimedBy === interaction.user.id
        ? "You already claimed this ticket."
        : `This ticket is already claimed by <@${state.claimedBy}>.`
    );
  }

  state.claimedBy = interaction.user.id;

  await applyPermissions(channel, state);
  await saveState(channel, entry);

  await channel.send({
    embeds: [
      ticketEmbed(
        `${EMOJI} Ticket Claimed`,
        `Claimed by <@${interaction.user.id}>.\n\n` +
        "Only the customer, claimer, moderators, owners, " +
        "and administrators retain access."
      )
    ],
    allowedMentions: { parse: [] }
  });

  await sendLog(
    channel.guild,
    state,
    interaction.user.id,
    "claimed"
  );

  return reply(
    interaction,
    "Ticket claimed successfully. Other sellers and support staff no longer have role-wide access."
  );
}

// ==================================================
// CLOSE TICKET
// ==================================================

async function close(interaction, channel, entry, reason) {
  const state = entry.state;

  if (state.status === "closed") {
    return reply(interaction, "This ticket is already closed.");
  }

  const transcript = await saveTranscript(channel, state);

  state.status = "closed";
  state.closeReason = reason || "Done";
  state.transcriptUrl = transcript.url;

  await applyPermissions(channel, state);

  await channel.setName(
    ticketName(state.type, state.number, true)
  );

  await saveState(channel, entry);
  await updateControls(channel, state);

  await channel.send({
    embeds: [
      ticketEmbed(
        `${EMOJI} Ticket Closed`,
        `Closed by <@${interaction.user.id}>.\n\n` +
        `**Reason:** ${safe(state.closeReason, 450)}\n\n` +
        "Staff can reopen or delete this ticket."
      )
    ],
    allowedMentions: { parse: [] }
  });

  await sendLog(
    channel.guild,
    state,
    interaction.user.id,
    "closed",
    {
      reason: state.closeReason,
      transcriptUrl: transcript.url,
      messageCount: transcript.messageCount
    }
  );

  return reply(
    interaction,
    "Ticket closed successfully. HTML transcript saved."
  );
}

// ==================================================
// REOPEN TICKET
// ==================================================

async function reopen(interaction, channel, entry) {
  const state = entry.state;

  if (state.status !== "closed") {
    return reply(interaction, "This ticket is already open.");
  }

  state.status = "open";

  await applyPermissions(channel, state);

  await channel.setName(
    ticketName(state.type, state.number)
  );

  await saveState(channel, entry);
  await updateControls(channel, state);

  await channel.send({
    embeds: [
      ticketEmbed(
        `${EMOJI} Ticket Reopened`,
        `Reopened by <@${interaction.user.id}>.`
      )
    ],
    allowedMentions: { parse: [] }
  });

  await sendLog(
    channel.guild,
    state,
    interaction.user.id,
    "reopened"
  );

  return reply(
    interaction,
    "Ticket reopened successfully."
  );
}

// ==================================================
// DELETE TICKET
// ==================================================

async function removeTicket(interaction, channel, entry) {
  const state = entry.state;

  if (state.status !== "closed") {
    return reply(
      interaction,
      "Close the ticket before deleting it."
    );
  }

  const transcript = await saveTranscript(channel, state);

  state.transcriptUrl = transcript.url;

  await saveState(channel, entry);

  await sendLog(
    channel.guild,
    state,
    interaction.user.id,
    "deleted",
    {
      reason: state.closeReason,
      transcriptUrl: transcript.url,
      messageCount: transcript.messageCount
    }
  );

  await reply(
    interaction,
    "HTML transcript saved. Deleting ticket..."
  );

  await channel.delete(
    `Ticket deleted by ${interaction.user.id}`
  );

  cache.delete(channel.id);
}

// ==================================================
// PANEL COMMAND
// ==================================================

async function panel(interaction) {
  if (
    !admin(interaction) &&
    !interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )
  ) {
    return reply(
      interaction,
      "You need Manage Server permission to update the panel."
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const channel = await textChannel(
    interaction.guild,
    IDS.panel,
    "Ticket panel"
  );

  const messages = await channel.messages.fetch({
    limit: 100
  });

  const existing = messages.find(
    msg =>
      msg.author.id === interaction.client.user.id &&
      msg.components.some(
        row => row.components.some(
          component => SELECT_IDS.has(component.customId)
        )
      )
  );

  if (existing) {
    await existing.edit(panelPayload());
  } else {
    await channel.send(panelPayload());
  }

  return reply(
    interaction,
    `Ticket panel ${existing ? "updated" : "posted"} in <#${IDS.panel}>.`
  );
}

// ==================================================
// TICKET SELECTION
// ==================================================

async function select(interaction) {
  const type = String(
    interaction.values[0] || ""
  ).toLowerCase();

  if (!TYPES[type]) {
    return reply(
      interaction,
      "Please select a valid category."
    );
  }

  if (TYPES[type].questions) {
    return interaction.showModal(ticketForm(type));
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result = await createTicket(interaction, type);

  return reply(
    interaction,
    result.existing
      ? `You already have an open ticket: ${result.channel}`
      : `${EMOJI} Your **${TYPES[type].name}** ticket has been created!\n\n${result.channel}`
  );
}

// ==================================================
// PURCHASE AND CASHOUT FORMS
// ==================================================

async function form(interaction) {
  const type = interaction.customId.slice(FORM_PREFIX.length);

  if (!TYPES[type]?.questions) {
    return reply(interaction, "Invalid ticket form.");
  }

  const answers = TYPES[type].questions.map(
    (_, i) => interaction.fields.getTextInputValue(`answer_${i}`)
  );

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result = await createTicket(
    interaction,
    type,
    answers
  );

  return reply(
    interaction,
    result.existing
      ? `You already have an open ticket: ${result.channel}`
      : `${EMOJI} Your **${TYPES[type].name}** ticket has been created!\n\n${result.channel}`
  );
}

// ==================================================
// BUTTON ACTION DETECTION
// ==================================================

function actionFor(customId) {
  for (const [action, id] of Object.entries(BUTTONS)) {
    if (customId === id) return action;
  }

  if (customId.startsWith("chuppys_ticket:")) {
    const legacy = customId.slice(
      "chuppys_ticket:".length
    );

    if (["claim", "close", "reopen", "delete"].includes(legacy)) {
      return legacy;
    }
  }

  return null;
}

// ==================================================
// HANDLE TICKET ACTIONS
// ==================================================

async function action(interaction, name) {
  if (!manager(interaction)) {
    return reply(
      interaction,
      "Only authorized ticket staff can manage tickets."
    );
  }

  const channel = interaction.channel;
  const entry = await loadState(channel);

  if (!entry) {
    return reply(
      interaction,
      "This is not a recognized Chuppys ticket."
    );
  }

  if (!authorizedForClaim(interaction, entry.state)) {
    return reply(
      interaction,
      "Only the claimer, moderators, or owners can manage this claimed ticket."
    );
  }

  if (name === "close") {
    if (entry.state.status === "closed") {
      return reply(
        interaction,
        "This ticket is already closed."
      );
    }

    return interaction.showModal(closeModal(channel.id));
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queued(async () => {
    const latest = await loadState(channel);

    if (!latest) {
      return reply(
        interaction,
        "Ticket data could not be found."
      );
    }

    if (!authorizedForClaim(interaction, latest.state)) {
      return reply(
        interaction,
        "This ticket is now claimed by someone else."
      );
    }

    if (name === "claim") {
      return claim(interaction, channel, latest);
    }

    if (name === "reopen") {
      return reopen(interaction, channel, latest);
    }

    if (name === "delete") {
      return removeTicket(interaction, channel, latest);
    }

    return reply(
      interaction,
      "Unknown ticket action."
    );
  });
}

// ==================================================
// CLOSE MODAL SUBMISSION
// ==================================================

async function closeForm(interaction) {
  const id = interaction.customId.slice(CLOSE_PREFIX.length);

  if (id !== interaction.channelId) {
    return reply(
      interaction,
      "This close form belongs to another ticket."
    );
  }

  if (!manager(interaction)) {
    return reply(
      interaction,
      "Only authorized ticket staff can close tickets."
    );
  }

  const reason = interaction.fields
    .getTextInputValue("close_reason")
    .trim() || "Done";

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queued(async () => {
    const entry = await loadState(interaction.channel);

    if (!entry) {
      return reply(
        interaction,
        "Ticket data could not be found."
      );
    }

    if (!authorizedForClaim(interaction, entry.state)) {
      return reply(
        interaction,
        "You cannot close another staff member's claimed ticket."
      );
    }

    return close(
      interaction,
      interaction.channel,
      entry,
      reason
    );
  });
}

// ==================================================
// LEGACY TRANSCRIPT BUTTON SUPPORT
// ==================================================

async function oldTranscript(interaction) {
  if (interaction.channelId !== IDS.logs) {
    return reply(
      interaction,
      "Transcript buttons only work in ticket logs."
    );
  }

  const allowed =
    admin(interaction) ||
    role(interaction, IDS.owner) ||
    role(interaction, IDS.support);

  if (!allowed) {
    return reply(
      interaction,
      "Only authorized ticket staff can access transcripts."
    );
  }

  const attachment = interaction.message.attachments.find(
    a =>
      a.name?.startsWith("transcript-") &&
      (a.name.endsWith(".txt") || a.name.endsWith(".html"))
  );

  return reply(
    interaction,
    attachment
      ? `**View Transcript:** ${interaction.message.url}`
      : "This older transcript button has no attached transcript. Check the original log message."
  );
}

// ==================================================
// INSTALL THE TICKET SYSTEM
// ==================================================

function setupTickets(client) {
  if (client.__chuppysTicketsInstalled) return;

  client.__chuppysTicketsInstalled = true;

  client.once(Events.ClientReady, async () => {
    try {
      if (!process.env.DISCORD_GUILD_ID) {
        throw new Error("DISCORD_GUILD_ID is missing.");
      }

      const guild = await client.guilds.fetch(
        process.env.DISCORD_GUILD_ID
      );

      await init(guild);

      console.log(
        `[TICKETS] Ready. Next global ticket: #${globalCounter + 1}`
      );
    } catch (err) {
      console.error(
        "[TICKETS] Initialization failed:",
        err
      );
    }
  });

  client.on(Events.InteractionCreate, async interaction => {
    const isPanel =
      interaction.isChatInputCommand() &&
      interaction.commandName === "ticketpanel";

    const isSelect =
      interaction.isStringSelectMenu() &&
      SELECT_IDS.has(interaction.customId);

    const isForm =
      interaction.isModalSubmit() &&
      interaction.customId.startsWith(FORM_PREFIX);

    const isClose =
      interaction.isModalSubmit() &&
      interaction.customId.startsWith(CLOSE_PREFIX);

    const buttonAction = interaction.isButton()
      ? actionFor(interaction.customId)
      : null;

    const isLegacyTranscript =
      interaction.isButton() &&
      interaction.customId.startsWith(OLD_TRANSCRIPT_PREFIX);

    if (
      !isPanel &&
      !isSelect &&
      !isForm &&
      !isClose &&
      !buttonAction &&
      !isLegacyTranscript
    ) {
      return;
    }

    try {
      if (!interaction.inGuild()) {
        return reply(
          interaction,
          "Tickets only work inside the server."
        );
      }

      if (isPanel) {
        return await panel(interaction);
      }

      if (isSelect) {
        return await select(interaction);
      }

      if (isForm) {
        return await form(interaction);
      }

      if (isClose) {
        return await closeForm(interaction);
      }

      if (isLegacyTranscript) {
        return await oldTranscript(interaction);
      }

      if (buttonAction) {
        return await action(interaction, buttonAction);
      }
    } catch (err) {
      console.error(
        "[TICKETS] Interaction error:",
        err
      );

      await reply(
        interaction,
        `Ticket error: ${safe(err.message, 900)}`
      ).catch(console.error);
    }
  });

  console.log(
    "[TICKETS] Chuppys ticket system installed."
  );
}

// ==================================================
// EXPORTS
// ==================================================

module.exports = setupTickets;
module.exports.command = command;
