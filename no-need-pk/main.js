const axios = require("axios");
const fs = require("fs");

// Fungsi utilitas yang sering digunakan harus didefinisikan di awal
function getCurrentUTCTime() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// Konfigurasi dasar
const config = {
  apiBaseUrl: "https://api.xyz.land",
  username: "Madleyym",
  playsPerDay: 5,
  autoPlayInterval: 5 * 60 * 1000, // 5 menit dalam milidetik
  resetTime: "00:00 UTC",
};

// Variable global untuk tracking
let lastPlayTime = null;
let currentPlays = 0;
let isPlaying = false;

function getTimeUntilReset() {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setUTCHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours}h ${minutes}m ${seconds}s`;
}

function updateConsoleStatus(remainingPlays) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  const nextPlayCountdown = getTimeUntilNextPlay(lastPlayTime);
  const status = `Status: ${remainingPlays} plays remaining ${nextPlayCountdown} "Countdown" | Reset in: ${getTimeUntilReset()} | Last Play: ${
    lastPlayTime || "Never"
  }`;
  process.stdout.write(status);
}

function getBearerToken() {
  try {
    const token = fs.readFileSync("token.txt", "utf8").trim();
    if (!token) throw new Error("Token is empty");
    return token;
  } catch (error) {
    console.error("Error reading token:", error.message);
    console.log(
      "Please make sure token.txt exists and contains your bearer token"
    );
    process.exit(1);
  }
}

function getTimeUntilNextPlay(lastPlayTime) {
  if (!lastPlayTime) return "0m 0s";

  const now = new Date();
  const lastPlay = new Date(lastPlayTime);
  const nextPlay = new Date(lastPlay.getTime() + 5 * 60 * 1000); // 5 menit setelah last play

  const diff = nextPlay - now;
  if (diff <= 0) return "0m 0s";

  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${minutes}m ${seconds}s`;
}

function validateResponse(response) {
  if (response.status === 401) {
    throw new Error("Bearer token tidak valid atau expired");
  }
  if (!response.data) {
    throw new Error("Invalid response from server");
  }
  return response;
}

async function playGame() {
  if (isPlaying) return;
  isPlaying = true;

  try {
    const bearerToken = getBearerToken();
    const api = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "*/*",
        Origin: "https://www.dusted.app",
        Referer: "https://www.dusted.app/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const scoreResponse = await api.get("/lasso/score");
    const initialStats = scoreResponse.data;

    console.log(`\n[${getCurrentUTCTime()}] Playing as: ${config.username}`);
    console.log("\nStats Awal:");
    console.log("Rank:", initialStats.rank || "N/A");
    console.log("Total Score:", initialStats.totalScore || 0);
    console.log("Remaining Plays:", initialStats.remainingPlays || 0);
    console.log("Daily Score:", initialStats.dailyScore || 0);

    if (initialStats.remainingPlays > 0) {
      console.log("\nPlaying Lasso...");
      const playResponse = await api.post("/lasso/play", null, {
        params: { network: "monad", chain_id: 10143 },
      });

      lastPlayTime = getCurrentUTCTime();
      currentPlays = initialStats.remainingPlays - 1;

      console.log("Hasil bermain:", {
        score: playResponse.data.score || 0,
        remainingPlays: playResponse.data.remainingPlays || 0,
      });

      const finalScoreResponse = await api.get("/lasso/score");
      const finalStats = finalScoreResponse.data;

      console.log("\nStats Akhir:");
      console.log("Rank:", finalStats.rank || "N/A");
      console.log("Total Score:", finalStats.totalScore || 0);
      console.log("Remaining Plays:", finalStats.remainingPlays || 0);
      console.log("Daily Score:", finalStats.dailyScore || 0);

      // Perbaikan di sini - Langsung jadwalkan game berikutnya
      if (finalStats.remainingPlays > 0) {
        console.log(
          `\n[${getCurrentUTCTime()}] Menjadwalkan game berikutnya dalam 5 menit...`
        );
        // Menggunakan Promise dan setTimeout
        await new Promise((resolve) =>
          setTimeout(resolve, config.autoPlayInterval)
        );
        isPlaying = false; // Reset flag
        await playGame(); // Langsung panggil game berikutnya
        return; // Pastikan fungsi berhenti di sini
      }
    } else {
      console.log("\nTidak ada remaining plays tersisa hari ini");
      console.log(`Menunggu reset pada ${config.resetTime}`);
    }

    updateConsoleStatus(currentPlays);
  } catch (error) {
    console.error(`\n[${getCurrentUTCTime()}] Error:`, error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
      if (error.response.status === 401) {
        console.log("\nToken tidak valid. Update token di token.txt");
        process.exit(1);
      }
    }
    // Retry setelah error
    console.log(`\n[${getCurrentUTCTime()}] Mencoba ulang dalam 1 menit...`);
    await new Promise((resolve) => setTimeout(resolve, 60000));
    isPlaying = false;
    await playGame();
  } finally {
    isPlaying = false;
  }
}

async function startBot() {
  console.clear();
  console.log(`[${getCurrentUTCTime()}] Starting Lasso Game Bot`);
  console.log("\nBot Configuration:");
  console.log(`- Username: ${config.username}`);
  console.log(`- Daily Reset: ${config.resetTime}`);
  console.log(`- Plays Per Day: ${config.playsPerDay}`);
  console.log(
    `- Auto Play Interval: ${config.autoPlayInterval / 60000} minutes`
  );

  setInterval(() => updateConsoleStatus(currentPlays), 1000);

  setInterval(() => {
    const now = new Date();
    if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
      console.log("\n[DAILY RESET] Starting new session...");
      currentPlays = config.playsPerDay;
      playGame();
    }
  }, 60000);

  await playGame();
}

// Error handling
process.on("uncaughtException", (error) => {
  console.error(`[${getCurrentUTCTime()}] Uncaught Exception:`, error);
  isPlaying = false;
});

process.on("unhandledRejection", (error) => {
  console.error(`[${getCurrentUTCTime()}] Unhandled Rejection:`, error);
  isPlaying = false;
});

process.on("SIGINT", () => {
  console.log("\nBot berhenti. Terima kasih!");
  process.exit(0);
});

// Jalankan bot
startBot();
