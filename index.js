import tls from "tls";
import fs from "fs";
import WebSocket from "ws";
const token = ""; // token
const server = ""; // server id
const guilds = new Map();
let mfa = "";
fs.watchFile("mfa.txt", { interval: 250 }, () => {
    mfa = fs.readFileSync("mfa.txt", "utf-8").trim();
});
mfa = fs.readFileSync("mfa.txt", "utf-8").trim();
const tlsSocket = tls.connect({
    host: "canary.discord.com",
    port: 443,
    servername: "canary.discord.com",
    rejectUnauthorized: false,
    session: null,
    sessionTimeout: 0
});
tlsSocket.on("error", () => process.exit());
tlsSocket.on("end", () => process.exit());
tlsSocket.on("data", (data) => {
    const response = data.toString();
});
const ws = new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json");
ws.on("message", (data) => {
    const { t, d, op } = JSON.parse(data);
    if (op === 10) {
        ws.send(JSON.stringify({
            op: 2,
            d: { token, intents: 1, properties: { os: "", browser: "", device: "" } }
        }));
        setInterval(() => ws.send(JSON.stringify({ op: 1, d: null })), 30000);
    }
    if (t === "READY") {
        d.guilds.forEach(({ id, vanity_url_code }) => {
            if (vanity_url_code) guilds.set(id, vanity_url_code);
        });
    }
    if (t === "GUILD_UPDATE") {
        const code = guilds.get(d.guild_id);
        if (code && code !== d.vanity_url_code) {
            patch(code);
        }
    }
});
ws.on("close", () => process.exit());
function patch(code) {
    const startRequest = process.hrtime();
    const body = JSON.stringify({ code });
    const headers = [
        `PATCH /api/v9/guilds/${server}/vanity-url HTTP/1.1`,
        "Host: canary.discord.com",
        `Authorization: ${token}`,
        "User-Agent: Discord/999",
        "X-Super-Properties: eyJicm93c2VyIjoiQ2hyb21lIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiQ2hyb21lIiwiY2xpZW50X2J1bWxkX251bWJlciI6MzU1NjI0fQ==",
        "Content-Type: application/json",
        "Connection: keep-alive",
        mfa ? `X-Discord-MFA-Authorization: ${mfa}` : "",
        `Content-Length: ${Buffer.byteLength(body)}`
    ].filter(Boolean).join("\r\n");
    const request = headers + "\r\n\r\n" + body;
    tlsSocket.write(request);
    tlsSocket.write(request);
    const endRequest = process.hrtime(startRequest);
}
