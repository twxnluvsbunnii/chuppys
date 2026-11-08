const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

// ==========================================
// CHUPPYS TRANSACTION SYSTEM
// ==========================================

// ==========================================
// PERMANENT DATA STORAGE
// ==========================================

// Configure SPENDING_DATA_DIR=/var/data in Render.
// Mount a Render Persistent Disk at /var/data.

const DATA_DIR =
  process.env.SPENDING_DATA_DIR || __dirname;

const DATA_FILE = path.join(DATA_DIR, "spending.json");
const OLD_DATA_FILE = path.join(__dirname, "spending.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Migrate existing transaction history if needed.
if (
  DATA_FILE !== OLD_DATA_FILE &&
  !fs.existsSync(DATA_FILE) &&
  fs.existsSync(OLD_DATA_FILE)
) {
  fs.copyFileSync(OLD_DATA_FILE, DATA_FILE);
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
      return {};
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Could not load spending.json:", error);
    return {};
  }
}

let spendingData = loadData();

function saveData() {
  try {
    const temporaryFile = `${DATA_FILE}.tmp`;

    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(spendingData, null, 2)
    );

    fs.renameSync(temporaryFile, DATA_FILE);
  } catch (error) {
    console.error("Could not save spending.json:", error);
    throw error;
  }
}

// ==========================================
// PERMISSIONS
// ==========================================

const TRANSACTION_ALLOWED_ROLE_IDS = [
  "1550322075208646766",
  "1563003884656398406"
];

// ==========================================
// REWARD TIERS
// ==========================================

const REWARD_ROLES = [
  { amount: 5, roleId: "1550373612144304219" },
  { amount: 10, roleId: "1550373695204360252" },
  { amount: 25, roleId: "1550373843170889728" },
  { amount: 50, roleId: "1550373983336144936" },
  { amount: 75, roleId: "1550374079385575454" },
  { amount: 150, roleId: "1550374377130827856" },
  { amount: 250, roleId: "1550374524640436235" },
  { amount: 400, roleId: "1561439464327483583" },
  { amount: 550, roleId: "1550374678449754163" },
  { amount: 750, roleId: "1562961485091573902" },
  { amount: 1000, roleId: "1550374791217680485" }
];

const CHUPPYS_EMOJI =
  "https://cdn.discordapp.com/emojis/1561398288593330326.png?size=128&quality=lossless";

const REWARD_NOTIFICATION_EMOJI =
  "<:chuppybye:1561103844832846014>";

// ==========================================
// DATA HELPERS
// ==========================================

function getClientData(userId) {
  if (!spendingData[userId]) {
    spendingData[userId] = {
      total: 0,
      transactions: [],
      awardedRoleIds: []
    };
  }

  const data = spendingData[userId];

  if (!Array.isArray(data.transactions)) {
    data.transactions = [];
  }

  if (!Array.isArray(data.awardedRoleIds)) {
    data.awardedRoleIds = [];
  }

  data.total = Number(
    data.transactions
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      )
      .toFixed(2)
  );

  return data;
}

// ==========================================
// GENERAL HELPERS
// ==========================================

function hasTransactionPermission(member) {
  return TRANSACTION_ALLOWED_ROLE_IDS.some(roleId =>
    member.roles.cache.has(roleId)
  );
}

function parseAmount(input) {
  if (!input) return null;

  const cleaned = input.replace(/[$,\s]/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return null;
  }

  const amount = Number(cleaned);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Number(amount.toFixed(2));
}

function formatMoney(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function getTransactionLabel(type) {
  return type === "purchase" ? "Purchase" : "Cash-out";
}

function getSignedAmount(transaction) {
  const sign = transaction.type === "purchase" ? "−" : "+";
  return `${sign}${formatMoney(transaction.amount)}`;
}

// ==========================================
// OPTIONAL CUSTOM DATE
// ==========================================

// Supported formats:
// MM/DD/YYYY
// YYYY-MM-DD
//
// If no date is provided, the current date/time
// will automatically be used.

function parseOptionalDate(input) {
  if (!input) {
    return {
      timestamp: Date.now(),
      dateOnly: false
    };
  }

  let year;
  let month;
  let day;

  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const parts = input.split("/");

    month = Number(parts[0]);
    day = Number(parts[1]);
    year = Number(parts[2]);
  }

  // YYYY-MM-DD
  else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {
    const parts = input.split("-");

    year = Number(parts[0]);
    month = Number(parts[1]);
    day = Number(parts[2]);
  } else {
    return null;
  }

  // Validate the calendar date.
  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  // Store at noon UTC so the date remains the
  // same calendar day in the New York timezone.
  return {
    timestamp: Date.UTC(year, month - 1, day, 12, 0, 0),
    dateOnly: true
  };
}

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  }).format(new Date(timestamp));
}

function getDiscordTimestamp(transaction) {
  const unix = Math.floor(transaction.timestamp / 1000);

  return transaction.dateOnly
    ? `<t:${unix}:D>`
    : `<t:${unix}:f>`;
}

function getDisplayDate(transaction) {
  if (transaction.dateOnly) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(transaction.timestamp));
  }

  return formatTimestamp(transaction.timestamp);
}

function createEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(CHUPPYS_EMOJI)
    .setFooter({ text: ".gg/chuppys" })
    .setTimestamp();
}

// ==========================================
// PRIVATE REWARD DM
// ==========================================

async function sendRewardDM(member) {
  try {
    await member.send({
      embeds: [
        createEmbed(
          "New .gg/chuppys Rewards! 🤍",
          [
            `${REWARD_NOTIFICATION_EMOJI} You've unlocked new .gg/chuppys roles!`,
            "",
            `Please check your server profile ${REWARD_NOTIFICATION_EMOJI}`
          ].join("\n")
        )
      ],
      allowedMentions: { parse: [] }
    });
  } catch {
    // The client may have DMs disabled.
  }
}

// ==========================================
// REWARD ROLE SYNCHRONIZATION
// ==========================================

async function syncRewardRoles(member, clientData) {
  const newlyAddedRoles = [];
  const removedRoles = [];
  const failedChanges = [];

  for (const reward of REWARD_ROLES) {
    const role = member.guild.roles.cache.get(reward.roleId);

    if (!role) {
      console.error(`Reward role not found: ${reward.roleId}`);
      failedChanges.push(reward);
      continue;
    }

    const qualifies = clientData.total >= reward.amount;
    const alreadyHasRole = member.roles.cache.has(reward.roleId);

    if (qualifies && !alreadyHasRole) {
      try {
        await member.roles.add(
          role,
          `Chuppys cumulative rewards reached ${formatMoney(reward.amount)}`
        );

        newlyAddedRoles.push({
          amount: reward.amount,
          roleId: reward.roleId,
          name: role.name
        });
      } catch (error) {
        console.error(`Could not add reward role ${role.name}:`, error);
        failedChanges.push(reward);
      }
    } else if (!qualifies && alreadyHasRole) {
      try {
        await member.roles.remove(
          role,
          `Chuppys cumulative rewards fell below ${formatMoney(reward.amount)}`
        );

        removedRoles.push({
          amount: reward.amount,
          roleId: reward.roleId,
          name: role.name
        });
      } catch (error) {
        console.error(`Could not remove reward role ${role.name}:`, error);
        failedChanges.push(reward);
      }
    }
  }

  clientData.awardedRoleIds = REWARD_ROLES
    .filter(reward =>
      member.roles.cache.has(reward.roleId) &&
      clientData.total >= reward.amount
    )
    .map(reward => reward.roleId);

  saveData();

  if (newlyAddedRoles.length > 0) {
    await sendRewardDM(member);
  }

  return {
    newlyAddedRoles,
    removedRoles,
    failedChanges
  };
}

// ==========================================
// TRANSACTION HISTORY EMBED
// ==========================================

function createHistoryEmbed(user, clientData) {
  const transactions = [...clientData.transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const historyText = transactions.length
    ? transactions.map((transaction, index) => {
        return [
          `**${index + 1}. ${getTransactionLabel(transaction.type)} — ${getSignedAmount(transaction)}**`,
          getDiscordTimestamp(transaction),
          `Staff: <@${transaction.staffId}>`
        ].join("\n");
      }).join("\n\n")
    : "No transactions recorded yet.";

  return createEmbed(
    "Client Transactions History",
    [
      `**Client:** ${user}`,
      "",
      historyText,
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      `**Cumulative Rewards Total:** ${formatMoney(clientData.total)}`,
      "",
      "Thank you for shopping with .gg/chuppys 🤍"
    ].join("\n")
  );
}

// ==========================================
// COMMAND HANDLER
// ==========================================

module.exports = function (client) {
  client.on("messageCreate", async message => {
    try {
      if (!message.guild || message.author.bot) return;

      const parts = message.content.trim().split(/\s+/);
      const command = parts[0].toLowerCase();

      const validCommands = [
        ",addp",
        ",addc",
        ",removep",
        ",removec",
        ",history"
      ];

      if (!validCommands.includes(command)) return;

      if (!hasTransactionPermission(message.member)) {
        return message.reply(
          "❌ You don't have permission to use transaction commands."
        );
      }

      const user = message.mentions.users.first();

      if (!user) {
        return message.reply(
          "❌ Please mention a client.\n" +
          "Example: `,addp @client $25`"
        );
      }

      if (user.bot) {
        return message.reply(
          "❌ You cannot record transactions for a bot."
        );
      }

      const member = await message.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!member) {
        return message.reply(
          "❌ That client must be a member of this server."
        );
      }

      const clientData = getClientData(user.id);

      // ======================================
      // ,history @client
      // ======================================

      if (command === ",history") {
        saveData();

        return message.channel.send({
          embeds: [createHistoryEmbed(user, clientData)],
          allowedMentions: { parse: [] }
        });
      }

      // ======================================
      // ,addp / ,addc
      //
      // Optional date:
      // ,addp @client $25 10/15/2026
      // ,addc @client $65 2026-09-20
      // ======================================

      if (command === ",addp" || command === ",addc") {
        const amount = parseAmount(parts[2]);

        if (amount === null) {
          return message.reply(
            "❌ Enter a valid amount.\n" +
            "Examples:\n" +
            "`,addp @client $25`\n" +
            "`,addp @client $25 10/15/2026`\n" +
            "`,addc @client $65 09/20/2026`"
          );
        }

        const customDate = parseOptionalDate(parts[3]);

        if (!customDate) {
          return message.reply(
            "❌ Invalid date.\n" +
            "Use `MM/DD/YYYY` or `YYYY-MM-DD`.\n" +
            "Example: `,addp @client $25 10/15/2026`"
          );
        }

        const type =
          command === ",addp" ? "purchase" : "cashout";

        const transaction = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          amount,
          timestamp: customDate.timestamp,
          dateOnly: customDate.dateOnly,
          staffId: message.author.id
        };

        clientData.transactions.push(transaction);

        clientData.total = Number(
          (clientData.total + amount).toFixed(2)
        );

        saveData();

        const roleChanges = await syncRewardRoles(member, clientData);

        const description = [
          `**Client:** ${user}`,
          `**Transaction:** ${getTransactionLabel(type)}`,
          `**Amount:** ${getSignedAmount(transaction)}`,
          `**Recorded by:** ${message.author}`,
          `**Date:** ${getDisplayDate(transaction)}`,
          "",
          `**Cumulative Rewards Total:** ${formatMoney(clientData.total)}`
        ];

        if (roleChanges.newlyAddedRoles.length > 0) {
          description.push(
            "",
            "**New reward roles:**",
            roleChanges.newlyAddedRoles
              .map(role => `<@&${role.roleId}>`)
              .join("\n"),
            "",
            `${REWARD_NOTIFICATION_EMOJI} ${user} unlocked new .gg/chuppys roles!`,
            `Please check your server profile ${REWARD_NOTIFICATION_EMOJI}`
          );
        }

        description.push(
          "",
          "Thank you for shopping with .gg/chuppys 🤍"
        );

        await message.channel.send({
          embeds: [
            createEmbed(
              "Client Transactions History",
              description.join("\n")
            )
          ],
          allowedMentions: { parse: [] }
        });

        if (roleChanges.failedChanges.length > 0) {
          await message.channel.send(
            "⚠️ Some reward roles could not be updated. Check the bot's permissions and role hierarchy."
          );
        }

        return;
      }

      // ======================================
      // ,removep / ,removec
      // ======================================

      if (command === ",removep" || command === ",removec") {
        const amount = parseAmount(parts[2]);

        if (amount === null) {
          return message.reply(
            "❌ Enter a valid amount.\n" +
            "Examples: `,removep @client $25` or `,removec @client $65`"
          );
        }

        const type =
          command === ",removep" ? "purchase" : "cashout";

        // Remove only the newest matching transaction.
        let transactionIndex = -1;

        for (let i = clientData.transactions.length - 1; i >= 0; i--) {
          const transaction = clientData.transactions[i];

          if (
            transaction.type === type &&
            Number(transaction.amount) === amount
          ) {
            transactionIndex = i;
            break;
          }
        }

        if (transactionIndex === -1) {
          return message.reply(
            `❌ No matching ${getTransactionLabel(type).toLowerCase()} ` +
            `of ${formatMoney(amount)} was found for ${user}.`
          );
        }

        const [removedTransaction] =
          clientData.transactions.splice(transactionIndex, 1);

        clientData.total = Number(
          clientData.transactions
            .reduce(
              (sum, transaction) =>
                sum + Number(transaction.amount || 0),
              0
            )
            .toFixed(2)
        );

        saveData();

        const roleChanges = await syncRewardRoles(member, clientData);

        const description = [
          `**Client:** ${user}`,
          `**Removed transaction:** ${getTransactionLabel(type)}`,
          `**Amount removed:** ${getSignedAmount(removedTransaction)}`,
          `**Originally recorded:** ${getDisplayDate(removedTransaction)}`,
          `**Removed by:** ${message.author}`,
          "",
          `**Updated Cumulative Rewards Total:** ${formatMoney(clientData.total)}`
        ];

        if (roleChanges.removedRoles.length > 0) {
          description.push(
            "",
            "**Reward roles removed:**",
            roleChanges.removedRoles
              .map(role => `<@&${role.roleId}> — $${role.amount} tier`)
              .join("\n")
          );
        }

        if (roleChanges.newlyAddedRoles.length > 0) {
          description.push(
            "",
            "**Reward roles added:**",
            roleChanges.newlyAddedRoles
              .map(role => `<@&${role.roleId}> — $${role.amount} tier`)
              .join("\n")
          );
        }

        if (
          roleChanges.removedRoles.length === 0 &&
          roleChanges.newlyAddedRoles.length === 0
        ) {
          description.push("", "No reward roles needed to be changed.");
        }

        await message.channel.send({
          embeds: [
            createEmbed(
              "Transaction Removed",
              description.join("\n")
            )
          ],
          allowedMentions: { parse: [] }
        });

        if (roleChanges.failedChanges.length > 0) {
          await message.channel.send(
            "⚠️ Some reward roles could not be updated. Check the bot's permissions and role hierarchy."
          );
        }

        return;
      }
    } catch (error) {
      console.error("Chuppys transaction command error:", error);

      try {
        await message.reply(
          "❌ Something went wrong while processing that transaction. " +
          "Please check the bot logs."
        );
      } catch {
        // The message or channel may no longer be available.
      }
    }
  });
};
