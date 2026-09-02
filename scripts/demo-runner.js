import { spawn } from "child_process";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log(
    "\n=============================================================",
  );
  console.log(" 🚀 RUNNING END-TO-END AUTOMATED SELF-HEALING DEMONSTRATION");
  console.log(
    "=============================================================\n",
  );

  // 1. Start Application 1 (Backend with --watch mode)
  console.log("[Demo Runner] Starting Application 1 (Demo Backend Express)...");
  const app1Process = spawn("node", ["--watch", "src/server.js"], {
    cwd: path.join(rootDir, "app1-demo-backend"),
    stdio: "pipe",
    shell: true,
  });

  app1Process.stdout.on("data", (data) =>
    console.log(`[App 1 STDOUT] ${data.toString().trim()}`),
  );
  app1Process.stderr.on("data", (data) =>
    console.error(`[App 1 STDERR] ${data.toString().trim()}`),
  );

  // 2. Start Application 2 (Self-Healing Assistant)
  console.log(
    "[Demo Runner] Starting Application 2 (AI Self-Healing Assistant)...",
  );
  const app2Process = spawn("node", ["src/index.js"], {
    cwd: path.join(rootDir, "app2-self-healing-assistant"),
    stdio: "pipe",
    shell: true,
  });

  app2Process.stdout.on("data", (data) =>
    console.log(`[App 2 STDOUT] ${data.toString().trim()}`),
  );
  app2Process.stderr.on("data", (data) =>
    console.error(`[App 2 STDERR] ${data.toString().trim()}`),
  );

  await sleep(3000);

  try {
    // 3. Trigger Buggy Endpoint
    console.log(
      "\n-------------------------------------------------------------",
    );
    console.log(
      "📌 STEP 1: Calling Buggy Endpoint: GET /api/users/u101/profile",
    );
    console.log(
      "   (User u101 has null preferences; code tries accessing displaySettings.theme)",
    );
    console.log(
      "-------------------------------------------------------------",
    );

    const res1 = await makeRequest({
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/users/u101/profile",
      method: "GET",
    });

    console.log(`\n📥 Initial Response Status: ${res1.status}`);
    console.log(
      `📥 Response Payload       :`,
      JSON.stringify(res1.body, null, 2),
    );

    if (res1.status === 500) {
      console.log(
        "\n✅ Expected 500 Internal Server Error received! Log entry emitted.",
      );
    }

    // 4. Wait for Assistant to detect, fix, commit, push to GitHub, and create PR
    console.log(
      "\n⏳ Waiting 8 seconds for App 2 AI Assistant to detect log, apply fix, commit, push to GitHub, and raise PR...",
    );
    await sleep(8000);

    // 5. Re-Test Endpoint after Healing
    console.log(
      "\n-------------------------------------------------------------",
    );
    console.log(
      "📌 STEP 2: Re-Testing Endpoint after Self-Healing: GET /api/users/u101/profile",
    );
    console.log(
      "-------------------------------------------------------------",
    );

    const res2 = await makeRequest({
      hostname: "127.0.0.1",
      port: 3000,
      path: "/api/users/u101/profile",
      method: "GET",
    });

    console.log(`\n📥 Post-Healing Status  : ${res2.status}`);
    console.log(
      `📥 Post-Healing Payload :`,
      JSON.stringify(res2.body, null, 2),
    );

    if (res2.status === 200 && res2.body.success) {
      console.log(
        "\n🎉 SUCCESS! The application healed itself and returned 200 OK with valid JSON data!",
      );
    } else {
      console.log("\n⚠️ Re-test returned unexpected response:", res2);
    }
  } catch (err) {
    console.error("Error during demo run:", err);
  } finally {
    console.log("\n[Demo Runner] Cleaning up processes...");
    app1Process.kill();
    app2Process.kill();
    process.exit(0);
  }
}

runDemo();
