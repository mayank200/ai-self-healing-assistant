import { spawn } from "child_process";
import http from "http";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askPrompt(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function startScreencast() {
  console.clear();
  console.log(
    "====================================================================",
  );
  console.log(" 🎬 SCREENCAST DEMO RUNNER (PAUSED FOR VIDEO RECORDING)");
  console.log(
    "====================================================================\n",
  );
  console.log(
    "Press ENTER at each prompt when you are ready to speak the next section.\n",
  );

  await askPrompt("👉 Press ENTER to start Application 1 & Application 2... ");

  console.log(
    "\n[1/5] Starting Application 1 (Express Backend) & Application 2 (AI Assistant)...\n",
  );

  const app1Process = spawn("node", ["--watch", "src/server.js"], {
    cwd: path.join(rootDir, "app1-demo-backend"),
    stdio: "pipe",
    shell: true,
  });
  app1Process.stdout.on("data", (data) =>
    console.log(`[App 1] ${data.toString().trim()}`),
  );

  const app2Process = spawn("node", ["src/index.js"], {
    cwd: path.join(rootDir, "app2-self-healing-assistant"),
    stdio: "pipe",
    shell: true,
  });
  app2Process.stdout.on("data", (data) =>
    console.log(`[App 2] ${data.toString().trim()}`),
  );

  await sleep(2500);

  await askPrompt(
    "\n👉 Press ENTER to trigger the buggy API endpoint (GET /api/users/u101/profile)... ",
  );

  console.log(
    "\n[2/5] Triggering Buggy Endpoint: GET http://127.0.0.1:4000/api/users/u101/profile...\n",
  );
  const res1 = await makeRequest({
    hostname: "127.0.0.1",
    port: 4000,
    path: "/api/users/u101/profile",
    method: "GET",
  });

  console.log(`📥 Initial Response Status: ${res1.status}`);
  console.log(
    `📥 Response Payload       :\n${JSON.stringify(res1.body, null, 2)}\n`,
  );

  await askPrompt(
    "👉 Press ENTER to observe AI Assistant auto-detection and self-healing... ",
  );

  console.log(
    "\n[3/5] Waiting for AI Assistant to heal code and create PR...\n",
  );
  await sleep(4500);

  await askPrompt(
    "\n👉 Press ENTER to re-test the API endpoint after healing... ",
  );

  console.log(
    "\n[4/5] Re-testing Endpoint: GET http://127.0.0.1:4000/api/users/u101/profile...\n",
  );
  const res2 = await makeRequest({
    hostname: "127.0.0.1",
    port: 4000,
    path: "/api/users/u101/profile",
    method: "GET",
  });

  console.log(`📥 Post-Healing Status  : ${res2.status}`);
  console.log(
    `📥 Post-Healing Payload :\n${JSON.stringify(res2.body, null, 2)}\n`,
  );

  if (res2.status === 200) {
    console.log("🎉 DEMONSTRATION COMPLETE: Endpoint healed successfully!");
  }

  await askPrompt(
    "\n👉 Press ENTER to finish video recording and clean up processes... ",
  );

  app1Process.kill();
  app2Process.kill();
  rl.close();
  process.exit(0);
}

startScreencast();
