const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

// ==================================================
// RENDER SERVER
// ==================================================

const PORT = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });

    res.end("Chuppys bot is running!");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web server running on port ${PORT}`);
  });

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

// ==================================================
// CONFIG
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN?.trim();

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";
const WELCOME_ROLE_ID = "1531039846871728248";

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

// ==================================================
// PAYMENT INFORMATION
// ==================================================

const PAYMENT_INFO = {
  cashapp: "$yysluvv",
  paypal: "PayPal.me/twxnsrevenge",
  applepay: "929-554-5969",
  zelle: "631-401-8951"
};

// ==================================================
// READY
// ==================================================

client.once(Events.ClientReady, (bot) => {
  console.log("====================================");
  console.log("🤍 CHUPPYS BOT IS ONLINE");
  console.log(`🤖 ${bot.user.tag}`);
  console.log(`🆔 ${bot.user.id}`);
  console.log(`🏠 SERVERS: ${bot.guilds.cache.size}`);
  console.log("====================================");
});

// ==================================================
// MESSAGE RECEIVER TEST
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  console.log(
    `💬 MESSAGE RECEIVED: "${message.content}" | USER: ${message.author.tag}`
  );

  if (message.author.bot) return;

  if (!message.guild) return;

  const content = message.content.trim();

  // ==================================================
  // ,PAY
  // ==================================================

  if (content.toLowerCase().startsWith(",pay")) {
    console.log("💰 PAY COMMAND DETECTED");

    const parts = content.split(/\s+/);

    if (parts.length < 2) {
      await message.reply(
        "❌ Please enter an amount.\nExample: `,pay 25`"
      );
      return;
    }

    let amount = parts[1]
      .replace("$", "")
      .trim();

    if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
      await message.reply(
        "❌ Invalid amount.\nExample: `,pay 25`"
      );
      return;
    }

    const numberAmount = Number(amount);

    if (!Number.isFinite(numberAmount) || numberAmount <= 0) {
      await message.reply(
        "❌ Amount must be greater than $0."
      );
      return;
    }

    amount = numberAmount.toFixed(2);

    console.log(`💰 PAYMENT AMOUNT: $${amount}`);

    // ==================================================
    // BUTTONS
    // ==================================================

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`payment_cashapp_${amount}`)
        .setLabel("﹕𐔌・cash app 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_paypal_${amount}`)
        .setLabel("﹕𐔌・paypal 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_applepay_${amount}`)
        .setLabel("﹕𐔌・apple pay 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_zelle_${amount}`)
        .setLabel("﹕𐔌・zelle 〃・꒱")
        .setStyle(ButtonStyle.Secondary)
    );

    // ==================================================
    // EMBED
    // ==================================================

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 payment methods")
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `select your preferred payment method below.`
      )
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    try {
      await message.channel.send({
        embeds: [embed],
        components: [row]
      });

      console.log("✅ PAYMENT MENU SENT");
    } catch (error) {
      console.error("❌ PAYMENT SEND ERROR:");
      console.error(error);
    }

    return;
  }

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (content.toLowerCase() === "!testwelcome") {
    console.log("🧪 TEST WELCOME DETECTED");

    try {
      const channel =
        await message.guild.channels.fetch(
          WELCOME_CHANNEL_ID
        );

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🤍 welcome to .gg/chuppys")
        .setDescription(
          `welcome ${message.author}!\n\n` +
          `we hope you enjoy your stay here 🤍`
        )
        .setThumbnail(
          message.author.displayAvatarURL({
            dynamic: true
          })
        )
        .setImage(WELCOME_IMAGE)
        .setFooter({
          text: ".gg/chuppys"
        })
        .setTimestamp();

      await channel.send({
        content:
          `<@&${WELCOME_ROLE_ID}> ${message.author}`,
        embeds: [embed]
      });

      await message.reply(
        "✅ Test welcome message sent."
      );
    } catch (error) {
      console.error(error);

      await message.reply(
        "❌ Test welcome failed."
      );
    }

    return;
  }

  // ==================================================
  // TEST GOODBYE
  // ==================================================

  if (content.toLowerCase() === "!testgoodbye") {
    console.log("🧪 TEST GOODBYE DETECTED");

    try {
      const channel =
        await message.guild.channels.fetch(
          GOODBYE_CHANNEL_ID
        );

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🤍 goodbye")
        .setDescription(
          `${message.author} has left **.gg/chuppys**.\n\n` +
          `we'll miss you 🤍`
        )
        .setThumbnail(
          message.author.displayAvatarURL({
            dynamic: true
          })
        )
        .setFooter({
          text: ".gg/chuppys"
        })
        .setTimestamp();

      await channel.send({
        embeds: [embed]
      });

      await message.reply(
        "✅ Test goodbye message sent."
      );
    } catch (error) {
      console.error(error);

      await message.reply(
        "❌ Test goodbye failed."
      );
    }

    return;
  }
});

// ==================================================
// PAYMENT BUTTONS
// ==================================================

client.on(
  Events.InteractionCreate,
  async (interaction) => {
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    let method;
    let information;

    if (id.startsWith("payment_cashapp_")) {
      method = "cash app";
      information = PAYMENT_INFO.cashapp;
    }

    if (id.startsWith("payment_paypal_")) {
      method = "paypal";
      information = PAYMENT_INFO.paypal;
    }

    if (id.startsWith("payment_applepay_")) {
      method = "apple pay";
      information = PAYMENT_INFO.applepay;
    }

    if (id.startsWith("payment_zelle_")) {
      method = "zelle";
      information = PAYMENT_INFO.zelle;
    }

    if (!method) return;

    const amount = id
      .replace(`payment_${method.replace(" ", "")}_`, "")
      .replace("payment_applepay_", "")
      .replace("payment_cashapp_", "")
      .replace("payment_paypal_", "")
      .replace("payment_zelle_", "");

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle(`🤍 ${method}`)
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `**${method}:** ${information}\n\n` +
        `send **$${amount}** using the information above.`
      )
      .setFooter({
        text: ".gg/chuppys"
      });

    try {
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    } catch (error) {
      console.error(
        "❌ BUTTON ERROR:"
      );
      console.error(error);
    }
  }
);

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  console.log(
    `👋 MEMBER JOINED: ${member.user.tag}`
  );

  try {
    const channel =
      await member.guild.channels.fetch(
        WELCOME_CHANNEL_ID
      );

    const role =
      await member.guild.roles.fetch(
        WELCOME_ROLE_ID
      );

    if (role) {
      await member.roles.add(role);
    }

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 welcome to .gg/chuppys")
      .setDescription(
        `welcome ${member}!\n\n` +
        `we hope you enjoy your stay here 🤍`
      )
      .setThumbnail(
        member.user.displayAvatarURL({
          dynamic: true
        })
      )
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    await channel.send({
      content:
        `<@&${WELCOME_ROLE_ID}> ${member}`,
      embeds: [embed]
    });

    console.log("✅ WELCOME SENT");
  } catch (error) {
    console.error("❌ WELCOME ERROR:");
    console.error(error);
  }
});

// ==================================================
// GOODBYE
// ==================================================

client.on(
  Events.GuildMemberRemove,
  async (member) => {
    console.log(
      `👋 MEMBER LEFT: ${member.user.tag}`
    );

    try {
      const channel =
        await member.guild.channels.fetch(
          GOODBYE_CHANNEL_ID
        );

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🤍 goodbye")
        .setDescription(
          `${member.user} has left **.gg/chuppys**.\n\n` +
          `we'll miss you 🤍`
        )
        .setThumbnail(
          member.user.displayAvatarURL({
            dynamic: true
          })
        )
        .setFooter({
          text: ".gg/chuppys"
        })
        .setTimestamp();

      await channel.send({
        embeds: [embed]
      });

      console.log("✅ GOODBYE SENT");
    } catch (error) {
      console.error("❌ GOODBYE ERROR:");
      console.error(error);
    }
  }
);

// ==================================================
// CONNECTION LOGS
// ==================================================

client.on("shardConnecting", (id) => {
  console.log(
    `🔌 Shard ${id} connecting...`
  );
});

client.on("shardReady", (id) => {
  console.log(
    `✅ Shard ${id} ready.`
  );
});

client.on("shardError", (error, id) => {
  console.error(
    `❌ Shard ${id} error:`
  );
  console.error(error);
});

client.on("shardReconnecting", (id) => {
  console.log(
    `🔄 Shard ${id} reconnecting...`
  );
});

client.on("warn", (warning) => {
  console.warn(
    `⚠️ ${warning}`
  );
});

// ==================================================
// ERRORS
// ==================================================

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "❌ UNHANDLED REJECTION:"
    );
    console.error(error);
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "❌ UNCAUGHT EXCEPTION:"
    );
    console.error(error);
  }
);

// ==================================================
// TOKEN
// ==================================================

if (!TOKEN) {
  console.error(
    "❌ DISCORD_BOT_TOKEN IS MISSING!"
  );

  process.exit(1);
}

console.log(
  `🔐 Discord token found (${TOKEN.length} characters)`
);

console.log(
  "🔌 Connecting to Discord..."
);

// ==================================================
// LOGIN
// ==================================================

client
  .login(TOKEN)
  .then(() => {
    console.log(
      "✅ Discord login successful."
    );
  })
  .catch((error) => {
    console.error(
      "❌ DISCORD LOGIN FAILED:"
    );
    console.error(error);
  });
