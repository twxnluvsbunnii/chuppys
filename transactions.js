
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

// ==========================================
// CHUPPYS TRANSACTION SYSTEM
// ==========================================

const DATA_FILE = path.join(__dirname, "spending.json");

const TRANSACTION_ALLOWED_ROLE_IDS = [
  "1550322075208646766",
  "1563003884656398406"
];

// Reward roles ordered from lowest to highest
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

// ==========================================
// DATA STORAGE
// ==========================================

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
  fs.writeFileSync(DATA_FILE, JSON.stringify(spendingData, null, 2));
}

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

  // Both purchases and cash-outs count toward rewards.
  // Each stored transaction amount is a positive number.
  data.total = Number(
    data.transactions
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
      .toFixed(2)
  );

  return data;
}

// ==========================================
// HELPERS
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
// REWARD ROLE SYNCHRONIZATION
// ==========================================

// Add qualifying reward roles and remove reward roles
// whose thresholds are no longer met.
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
          `Chuppys cumulative rewards total reached ${formatMoney(reward.amount)}`
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
          `Chuppys cumulative rewards total is below ${formatMoney(reward.amount)}`
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

  // Track roles the system successfully assigned and that remain present.
  // This list is informational; the actual role check is done against Discord.
  clientData.awardedRoleIds = REWARD_ROLES
    .filter(reward =>
      member.roles.cache.has(reward.roleId) &&
      clientData.total >= reward.amount
    )
    .map(reward => reward.roleId);

  saveData();

  // Notify the client of newly earned rewards.
  if (newlyAddedRoles.length > 0) {
    const roleList = newlyAddedRoles
      .map(role => `<@&${role.roleId}>`)
      .join("\n");

    try {
      await member.send({
        embeds: [
          createEmbed(
            "You've Earned New Chuppys Rewards! 🤍",
            [
              "Congratulations! You've unlocked new rewards at **.gg/chuppys**!",
              "",
              "**New reward roles:**",
              roleList,
              "",
              `**Cumulative Rewards Total:** ${formatMoney(clientData.total)}`,
              "",
              "Check your server profile to see your new roles! 🤍"
            ].join("\n")
          )
        ],
        allowedMentions: { parse: [] }
      });
    } catch {
      // The client may have DMs disabled.
    }
  }

  return { newlyAddedRoles, removedRoles, failedChanges };
}

// ==========================================
// TRANSACTION HISTORY
// ==========================================

function createHistoryEmbed(user, clientData) {
  const transactions = [...clientData.transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const historyText = transactions.length
    ? transactions.map((transaction, index) => {
        return [
          `**${index + 1}. ${getTransactionLabel(transaction.type)} — ${getSignedAmount(transaction)}**`,
          `<t:${Math.floor(transaction.timestamp / 1000)}:f>`,
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

      // Staff permission check
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
        return message.reply("❌ You cannot record transactions for a bot.");
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
      // ======================================

      if (command === ",addp" || command === ",addc") {
        const amount = parseAmount(parts[2]);

        if (amount === null) {
          return message.reply(
            "❌ Enter a valid amount.\n" +
            "Examples: `,addp @client $25` or `,addc @client $65`"
          );
        }

        const type = command === ",addp" ? "purchase" : "cashout";

        const transaction = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          amount,
          timestamp: Date.now(),
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
          `**Time:** ${formatTimestamp(transaction.timestamp)}`,
          "",
          `**Cumulative Rewards Total:** ${formatMoney(clientData.total)}`,
          "",
          "Thank you for shopping with .gg/chuppys 🤍"
        ];

        if (roleChanges.newlyAddedRoles.length > 0) {
          description.push(
            "",
            "**New reward roles:**",
            roleChanges.newlyAddedRoles
              .map(role => `<@&${role.roleId}>`)
              .join("\n")
          );
        }

        await message.channel.send({
          embeds: [
            createEmbed("Client Transactions History", description.join("\n"))
          ],
          allowedMentions: { parse: [] }
        });

        if (roleChanges.newlyAddedRoles.length > 0) {
          await message.channel.send({
            content:
              `🎉 ${user} unlocked new Chuppys reward roles!\n` +
              roleChanges.newlyAddedRoles
                .map(role => `<@&${role.roleId}>`)
                .join(" "),
            allowedMentions: { parse: [] }
          });
        }

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

        const type = command === ",removep" ? "purchase" : "cashout";

        // Remove only the most recent transaction with the
        // matching type and exact amount.
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

        // Recalculate cumulative rewards from remaining transactions.
        clientData.total = Number(
          clientData.transactions
            .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
            .toFixed(2)
        );

        saveData();

        // Add or remove reward roles to match the new total.
        const roleChanges = await syncRewardRoles(member, clientData);

        const description = [
          `**Client:** ${user}`,
          `**Removed transaction:** ${getTransactionLabel(type)}`,
          `**Amount removed:** ${getSignedAmount(removedTransaction)}`,
          `**Originally recorded:** ${formatTimestamp(removedTransaction.timestamp)}`,
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
        } else {
          description.push(
            "",
            "No reward roles needed to be removed."
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

        description.push(
          "",
          "The transaction history and reward roles have been updated. 🤍"
        );

        await message.channel.send({
          embeds: [
            createEmbed("Transaction Removed", description.join("\n"))
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
