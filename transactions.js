
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const STAFF_ROLE_ID = "1550322075208646766";
const EMOJI = "<:chuppynewinv:1561398288593330326>";
const THUMBNAIL =
  "https://cdn.discordapp.com/emojis/1561398288593330326.png?size=128&quality=lossless";
const DATA_FILE = path.join(__dirname, "spending.json");

const REWARD_TIERS = [
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

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "{}", "utf8");
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {};
    }

    return data;
  } catch (error) {
    console.error("[Transactions] Failed to load data:", error);
    return {};
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[Transactions] Failed to save data:", error);
    return false;
  }
}

function getAccount(data, guildId, userId) {
  data[guildId] ??= {};
  data[guildId][userId] ??= {
    rewardTotal: 0,
    transactions: []
  };

  const account = data[guildId][userId];

  if (!Number.isFinite(account.rewardTotal)) {
    account.rewardTotal = 0;
  }

  if (!Array.isArray(account.transactions)) {
    account.transactions = [];
  }

  return account;
}

function money(amount) {
  return `$${Number(amount).toFixed(2).replace(/\.00$/, "")}`;
}

function nyDate(timestamp) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(timestamp));
}

function parseAmount(content) {
  const match = content.match(
    /(?:^|\s)\$?(\d+(?:\.\d{1,2})?)(?:\s|$)/
  );

  if (!match) return null;

  const amount = Number(match[1]);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

async function findMember(message) {
  const mentioned = message.mentions.members.first();

  if (mentioned) return mentioned;

  const match = message.content.match(/\b(\d{17,20})\b/);

  if (!match) return null;

  try {
    return await message.guild.members.fetch(match[1]);
  } catch {
    return null;
  }
}

async function awardRoles(member, total) {
  const added = [];

  for (const tier of REWARD_TIERS) {
    if (total < tier.amount) continue;
    if (member.roles.cache.has(tier.roleId)) continue;

    const role = member.guild.roles.cache.get(tier.roleId);

    if (!role) {
      console.warn(`[Transactions] Missing reward role: ${tier.roleId}`);
      continue;
    }

    try {
      await member.roles.add(
        role,
        `Chuppys cumulative reward total: ${money(total)}`
      );

      added.push(role);
    } catch (error) {
      console.error(`[Transactions] Could not add role ${tier.roleId}:`, error);
    }
  }

  return added;
}

function transactionEmbed(member, transaction, account, addedRoles) {
  const purchase = transaction.type === "purchase";
  const signedAmount = `${purchase ? "−" : "+"}${money(transaction.amount)}`;

  const roleText = addedRoles.length
    ? `\n\n**New reward role${addedRoles.length > 1 ? "s" : ""}:** ` +
      addedRoles.map(role => `<@&${role.id}>`).join(", ")
    : "";

  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle("Client Transactions History")
    .setDescription(
      `${EMOJI} Thank you for shopping with **.gg/chuppys**!\n\n` +
      `**Client:** ${member}\n` +
      `**Transaction:** ${purchase ? "Purchase" : "Cash-out"}\n` +
      `**History amount:** ${signedAmount}\n` +
      `**Cumulative reward total:** ${money(account.rewardTotal)}` +
      roleText
    )
    .setThumbnail(THUMBNAIL)
    .setFooter({ text: ".gg/chuppys" })
    .setTimestamp(new Date(transaction.timestamp));
}

function historyEmbed(member, account) {
  const recent = account.transactions.slice(-10).reverse();

  const history = recent.length
    ? recent.map((transaction, index) => {
        const purchase = transaction.type === "purchase";
        const sign = purchase ? "−" : "+";
        const unix = Math.floor(
          new Date(transaction.timestamp).getTime() / 1000
        );

        return (
          `**${recent.length - index}. ${purchase ? "Purchase" : "Cash-out"} — ` +
          `${sign}${money(transaction.amount)}**\n` +
          `<t:${unix}:f> · ${nyDate(transaction.timestamp)}`
        );
      }).join("\n\n")
    : "No transactions have been recorded yet.";

  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle("Client Transactions History")
    .setDescription(
      `${EMOJI} Thank you for shopping with **.gg/chuppys**!\n\n` +
      `**Client:** ${member}\n` +
      `**Cumulative reward total:** ${money(account.rewardTotal)}\n\n` +
      `**Recent transactions (up to 10):**\n${history}`
    )
    .setThumbnail(THUMBNAIL)
    .setFooter({ text: ".gg/chuppys" })
    .setTimestamp();
}

module.exports = function setupTransactions(client) {
  if (!client || typeof client.on !== "function") {
    throw new TypeError("[Transactions] A Discord client is required.");
  }

  if (client.__chuppysTransactionsLoaded) {
    console.warn("[Transactions] Already loaded.");
    return;
  }

  client.__chuppysTransactionsLoaded = true;
  loadData();

  client.on("messageCreate", async message => {
    try {
      if (!message.guild || message.author.bot) return;

      const content = message.content.trim();
      const lower = content.toLowerCase();

      const isPurchase = lower.startsWith(",addp ");
      const isCashout = lower.startsWith(",addc ");
      const isHistory = lower.startsWith(",history ");

      if (!isPurchase && !isCashout && !isHistory) return;

      if (!message.member.roles.cache.has(STAFF_ROLE_ID)) {
        await message.reply({
          content: "You don't have permission to use transaction commands.",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      const member = await findMember(message);

      if (!member) {
        await message.reply({
          content:
            "Mention a client or provide their user ID.\n\n" +
            "Examples: `,addp @client $25`, `,addc @client $65`, " +
            "` ,history @client`",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      const data = loadData();
      const account = getAccount(data, message.guild.id, member.id);

      if (isHistory) {
        if (!saveData(data)) {
          await message.reply("Could not access spending.json.");
          return;
        }

        await message.channel.send({
          embeds: [historyEmbed(member, account)]
        });
        return;
      }

      const amount = parseAmount(content);

      if (amount === null) {
        await message.reply({
          content:
            "Enter an amount greater than $0.\n" +
            "Example: `,addp @client $25` or `,addc @client $65`",
          allowedMentions: { repliedUser: false }
        });
        return;
      }

      const transaction = {
        type: isPurchase ? "purchase" : "cashout",
        amount,
        timestamp: new Date().toISOString(),
        staffId: message.author.id
      };

      // Both transaction types increase the reward total.
      // The +/- sign affects only how the transaction is displayed.
      account.rewardTotal = Math.round(
        (account.rewardTotal + amount) * 100
      ) / 100;

      account.transactions.push(transaction);

      if (!saveData(data)) {
        await message.reply(
          "Could not save this transaction. Check file permissions."
        );
        return;
      }

      const addedRoles = await awardRoles(member, account.rewardTotal);

      await message.channel.send({
        embeds: [
          transactionEmbed(member, transaction, account, addedRoles)
        ]
      });
    } catch (error) {
      console.error("[Transactions] Command error:", error);

      await message.channel.send(
        "Something went wrong processing this transaction."
      ).catch(() => {});
    }
  });

  console.log("[Transactions] Commands loaded successfully.");
};
