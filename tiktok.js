"use strict";

// ============================================================
// CHUPPYS TIKTOK LIVE NOTIFICATIONS
// DISCORD.JS V14 / RENDER
// COMPLETE TIKTOK.JS
// ============================================================

const fs = require("node:fs");
const path = require("node:path");

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");

// ============================================================
// CONFIGURATION
// ============================================================

const LIVE_CHANNEL_ID = "1574946167274348544";

const THUMBNAIL_EMOJI_ID = "1575025948993003590";

const THUMBNAIL_URL =
  `https://cdn.discordapp.com/emojis/${THUMBNAIL_EMOJI_ID}.png`;

const EMBED_COLOR = 0xffffff;

const CHECK_INTERVAL = 60 * 1000;

const ACCOUNT_DELAY = 3000;

const FOOTER_TEXT = ".gg/chuppys";

// Optional Render persistent disk location

const DATA_DIRECTORY =
  process.env.TIKTOK_DATA_DIR || __dirname;

const DATA_FILE = path.join(
  DATA_DIRECTORY,
  "tiktok-live-data.json"
);

// ============================================================
// TIKTOK ACCOUNTS
// ============================================================

const ACCOUNTS = [
  {
    username: "minitwxn",
    displayName: "minitwxn",
    liveUrl: "https://www.tiktok.com/@minitwxn/live",
  },
  {
    username: "a04120326",
    displayName: "twxn",
    liveUrl: "https://www.tiktok.com/@a04120326/live",
  },
];

// ============================================================
// STATE
// ============================================================

const initializedClients = new WeakSet();

const connections = new Map();

let savedData = {};

let checking = false;

let TikTokConnection = null;

// ============================================================
// HELPERS
// ============================================================

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// ============================================================
// LOAD SAVED DATA
// ============================================================

function loadData() {
  try {
    fs.mkdirSync(DATA_DIRECTORY, {
      recursive: true,
    });

    if (!fs.existsSync(DATA_FILE)) {
      return {};
    }

    const raw = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  } catch (error) {
    console.error(
      "[TikTok] Failed to load data:",
      error.message
    );

    return {};
  }
}

// ============================================================
// SAVE DATA
// ============================================================

function saveData() {
  try {
    fs.mkdirSync(DATA_DIRECTORY, {
      recursive: true,
    });

    const tempFile = `${DATA_FILE}.tmp`;

    fs.writeFileSync(
      tempFile,
      JSON.stringify(savedData, null, 2),
      "utf8"
    );

    fs.renameSync(tempFile, DATA_FILE);

    return true;
  } catch (error) {
    console.error(
      "[TikTok] Failed to save data:",
      error.message
    );

    return false;
  }
}

// ============================================================
// LOAD TIKTOK CONNECTOR
// ============================================================

async function loadConnector() {
  if (TikTokConnection) {
    return TikTokConnection;
  }

  try {
    const library = await import(
      "tiktok-live-connector"
    );

    TikTokConnection =
      library.TikTokLiveConnection ||
      library.WebcastPushConnection ||
      library.default?.TikTokLiveConnection ||
      library.default?.WebcastPushConnection;

    if (!TikTokConnection) {
      throw new Error(
        "TikTok connection class was not found."
      );
    }

    return TikTokConnection;
  } catch (error) {
    console.error(
      "[TikTok] Could not load connector:",
      error.message
    );

    console.error(
      "[TikTok] Install tiktok-live-connector."
    );

    return null;
  }
}

// ============================================================
// GET TIKTOK CONNECTION
// ============================================================

async function getConnection(username) {
  if (connections.has(username)) {
    return connections.get(username);
  }

  const Connection = await loadConnector();

  if (!Connection) {
    throw new Error(
      "TikTok connector unavailable."
    );
  }

  const options = {};

  // Optional Euler Stream API key

  if (process.env.TIKTOK_SIGN_API_KEY) {
    options.signApiKey =
      process.env.TIKTOK_SIGN_API_KEY;
  }

  const connection = new Connection(
    username,
    options
  );

  connections.set(username, connection);

  return connection;
}

// ============================================================
// FETCH LIVE STATUS
// ============================================================

async function fetchLiveStatus(account) {
  const connection = await getConnection(
    account.username
  );

  let isLive;

  // Current connector versions

  if (
    typeof connection.fetchIsLive === "function"
  ) {
    isLive = await connection.fetchIsLive();
  }

  // Older connector versions

  else if (
    typeof connection.getRoomInfo === "function"
  ) {
    const room = await connection.getRoomInfo();

    if (Number(room?.status) === 2) {
      const roomId = room.id_str || room.id;

      if (!roomId) {
        throw new Error(
          "Live room ID unavailable."
        );
      }

      return {
        live: true,
        roomId: String(roomId),
      };
    }

    if (Number(room?.status) === 4) {
      return {
        live: false,
        roomId: null,
      };
    }

    throw new Error(
      "Unable to determine live status."
    );
  } else {
    throw new Error(
      "Unsupported TikTok connector version."
    );
  }

  if (isLive === false) {
    return {
      live: false,
      roomId: null,
    };
  }

  if (isLive !== true) {
    throw new Error(
      "Invalid live status received."
    );
  }

  // Fetch the unique livestream ID.
  // Every new livestream has its own room ID.

  let roomId = null;

  if (
    typeof connection.fetchRoomId === "function"
  ) {
    roomId = await connection.fetchRoomId();
  } else if (
    typeof connection.fetchRoomInfo === "function"
  ) {
    const room =
      await connection.fetchRoomInfo();

    roomId = room?.id_str || room?.id;
  }

  if (!roomId) {
    throw new Error(
      "Unable to retrieve live room ID."
    );
  }

  return {
    live: true,
    roomId: String(roomId),
  };
}

// ============================================================
// CREATE LIVE EMBED
// ============================================================

function createLiveEmbed(account) {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)

    .setTitle(
      `${account.displayName} is now live!`
    )

    .setURL(account.liveUrl)

    .setDescription(
      `Join our TikTok live by pressing the link below!\n\n` +
      `[**Click here to join live**](${account.liveUrl})`
    )

    .setThumbnail(THUMBNAIL_URL)

    .setFooter({
      text: FOOTER_TEXT,
    })

    .setTimestamp();
}

// ============================================================
// CREATE JOIN LIVE BUTTON
// ============================================================

function createLiveButton(account) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Join Live")
      .setStyle(ButtonStyle.Link)
      .setURL(account.liveUrl)
  );
}

// ============================================================
// SEND LIVE NOTIFICATION
// ============================================================

async function sendLiveNotification(
  client,
  account,
  roomId
) {
  try {
    const channel = await client.channels.fetch(
      LIVE_CHANNEL_ID
    );

    if (
      !channel ||
      !channel.isTextBased() ||
      typeof channel.send !== "function"
    ) {
      throw new Error(
        "Live announcement channel is invalid."
      );
    }

    const message = await channel.send({
      embeds: [
        createLiveEmbed(account),
      ],

      components: [
        createLiveButton(account),
      ],

      allowedMentions: {
        parse: [],
      },
    });

    // Only save the livestream after the
    // announcement has been sent successfully.

    savedData[account.username] = {
      live: true,
      lastRoomId: roomId,
      lastMessageId: message.id,
      announcedAt: new Date().toISOString(),
    };

    saveData();

    console.log(
      `[TikTok] ${account.displayName} is LIVE! ` +
      `Announcement sent: ${message.id}`
    );

    return true;
  } catch (error) {
    console.error(
      `[TikTok] Failed to announce ${account.username}:`,
      error.message
    );

    return false;
  }
}

// ============================================================
// CHECK INDIVIDUAL ACCOUNT
// ============================================================

async function checkAccount(client, account) {
  try {
    const status = await fetchLiveStatus(
      account
    );

    const previous = savedData[
      account.username
    ] || {
      live: false,
      lastRoomId: null,
    };

    // Account is offline

    if (!status.live) {
      if (previous.live) {
        savedData[account.username] = {
          ...previous,
          live: false,
          endedAt: new Date().toISOString(),
        };

        saveData();

        console.log(
          `[TikTok] ${account.displayName} ended their live.`
        );
      }

      return;
    }

    // Already announced this livestream.
    // Prevents duplicate notifications.

    if (
      previous.lastRoomId === status.roomId
    ) {
      if (!previous.live) {
        savedData[account.username] = {
          ...previous,
          live: true,
        };

        saveData();
      }

      return;
    }

    // New livestream detected

    await sendLiveNotification(
      client,
      account,
      status.roomId
    );
  } catch (error) {
    // Never mark an account offline just
    // because TikTok returns an API error.

    console.warn(
      `[TikTok] Check failed for @${account.username}:`,
      error.message
    );
  }
}

// ============================================================
// CHECK ALL ACCOUNTS
// ============================================================

async function checkAllAccounts(client) {
  // Prevent overlapping checks.

  if (checking) {
    return;
  }

  if (!client.isReady()) {
    return;
  }

  checking = true;

  try {
    for (
      let i = 0;
      i < ACCOUNTS.length;
      i++
    ) {
      await checkAccount(
        client,
        ACCOUNTS[i]
      );

      if (i < ACCOUNTS.length - 1) {
        await sleep(ACCOUNT_DELAY);
      }
    }
  } catch (error) {
    console.error(
      "[TikTok] Monitoring error:",
      error.message
    );
  } finally {
    checking = false;
  }
}

// ============================================================
// START MONITORING
// ============================================================

async function startMonitoring(client) {
  savedData = loadData();

  const connector = await loadConnector();

  if (!connector) {
    console.error(
      "[TikTok] Monitoring disabled."
    );

    return;
  }

  console.log(
    "[TikTok] Live notification system started."
  );

  console.log(
    `[TikTok] Announcement channel: ${LIVE_CHANNEL_ID}`
  );

  console.log(
    "[TikTok] Monitoring accounts:"
  );

  for (const account of ACCOUNTS) {
    console.log(
      `[TikTok] @${account.username} (${account.displayName})`
    );
  }

  // Run the first check immediately.

  await checkAllAccounts(client);

  // Continue checking automatically.

  setInterval(() => {
    checkAllAccounts(client).catch((error) => {
      console.error(
        "[TikTok] Scheduled check failed:",
        error.message
      );
    });
  }, CHECK_INTERVAL);
}

// ============================================================
// INITIALIZE MODULE
// ============================================================

function setupTikTok(client) {
  if (!client) {
    throw new Error(
      "[TikTok] Discord client is required."
    );
  }

  if (initializedClients.has(client)) {
    return;
  }

  initializedClients.add(client);

  const start = () => {
    startMonitoring(client).catch((error) => {
      console.error(
        "[TikTok] Startup failed:",
        error.message
      );
    });
  };

  if (client.isReady()) {
    start();
  } else {
    client.once(
      Events.ClientReady,
      start
    );
  }
}

// ============================================================
// EXPORT
// ============================================================

module.exports = setupTikTok;

module.exports.setupTikTok = setupTikTok;

// ============================================================
// END OF TIKTOK.JS
// ============================================================
