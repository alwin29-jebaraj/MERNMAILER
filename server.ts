import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure database directory and files exist
const DB_DIR = path.join(process.cwd(), "database");
const EMAILS_FILE = path.join(DB_DIR, "emails.json");
const SETTINGS_FILE = path.join(DB_DIR, "settings.json");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!fs.existsSync(EMAILS_FILE)) {
  fs.writeFileSync(EMAILS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(SETTINGS_FILE)) {
  const defaultSettings = {
    useCustomSmtp: false,
    smtpConfig: null,
    adminPasswordHash: "admin" // Simple default plaintext/hash password
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
}

// Database Helpers
function readEmails(): any[] {
  try {
    const data = fs.readFileSync(EMAILS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading emails database", err);
    return [];
  }
}

function writeEmails(emails: any[]) {
  try {
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
  } catch (err) {
    console.error("Error writing emails database", err);
  }
}

function readSettings() {
  try {
    const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading settings", err);
    return { useCustomSmtp: false, smtpConfig: null, adminPasswordHash: "admin" };
  }
}

function writeSettings(settings: any) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Error writing settings", err);
  }
}

// Middleware
app.use(express.json());

// Initialize Gemini SDK lazily if API key exists
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Cached Ethereal Account
let cachedEtherealAccount: nodemailer.TestAccount | null = null;
async function getEtherealTransporter() {
  if (!cachedEtherealAccount) {
    console.log("Generating Ethereal SMTP test account...");
    cachedEtherealAccount = await nodemailer.createTestAccount();
    console.log("Ethereal SMTP Account generated:", cachedEtherealAccount.user);
  }

  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: cachedEtherealAccount.user,
        pass: cachedEtherealAccount.pass,
      },
    }),
    fromName: "MERN Mailer Engine",
    fromAddress: cachedEtherealAccount.user,
  };
}

// API Routes

// 1. Admin Login Verification
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const settings = readSettings();
  if (password === settings.adminPasswordHash) {
    res.json({ success: true, token: "session_token_admin_approved" });
  } else {
    res.status(401).json({ success: false, error: "Invalid administrator password" });
  }
});

// 2. Get Settings
app.get("/api/settings", (req, res) => {
  const settings = readSettings();
  // Return settings without exposing sensitive password/auth details completely
  const safeSettings = {
    useCustomSmtp: settings.useCustomSmtp,
    smtpConfig: settings.smtpConfig ? {
      host: settings.smtpConfig.host,
      port: settings.smtpConfig.port,
      secure: settings.smtpConfig.secure,
      user: settings.smtpConfig.user,
      fromName: settings.smtpConfig.fromName,
      fromAddress: settings.smtpConfig.fromAddress,
      // Pass is masked
      pass: settings.smtpConfig.pass ? "••••••••••••" : ""
    } : null
  };
  res.json(safeSettings);
});

// 3. Save Settings
app.post("/api/settings", (req, res) => {
  const { useCustomSmtp, smtpConfig, adminPassword } = req.body;
  const currentSettings = readSettings();

  if (useCustomSmtp !== undefined) {
    currentSettings.useCustomSmtp = useCustomSmtp;
  }

  if (smtpConfig) {
    // If password is masked, retain current password
    const finalPass = smtpConfig.pass === "••••••••••••" && currentSettings.smtpConfig
      ? currentSettings.smtpConfig.pass
      : smtpConfig.pass;

    currentSettings.smtpConfig = {
      ...smtpConfig,
      pass: finalPass
    };
  }

  if (adminPassword) {
    currentSettings.adminPasswordHash = adminPassword;
  }

  writeSettings(currentSettings);
  res.json({ success: true, message: "Settings updated successfully" });
});

// 4. Test SMTP connection
app.post("/api/settings/verify", async (req, res) => {
  const { smtpConfig } = req.body;
  if (!smtpConfig) {
    return res.status(400).json({ success: false, error: "SMTP Configuration is required" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: Number(smtpConfig.port),
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass
      }
    });

    await transporter.verify();
    res.json({ success: true, message: "SMTP parameters verified successfully!" });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "Failed to verify SMTP parameters" });
  }
});

// 5. Get Emails History
app.get("/api/emails", (req, res) => {
  const emails = readEmails();
  // Sort by sentAt descending
  const sorted = [...emails].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  res.json(sorted);
});

// 6. Delete Email History Item
app.delete("/api/emails/:id", (req, res) => {
  const { id } = req.params;
  const emails = readEmails();
  const filtered = emails.filter(e => e.id !== id);
  writeEmails(filtered);
  res.json({ success: true, message: "Broadcast deleted from history" });
});

// 7. Get Mailer Stats
app.get("/api/stats", (req, res) => {
  const emails = readEmails();
  let totalSent = 0;
  let successfulSends = 0;
  let failedSends = 0;
  let queued = 0;

  emails.forEach(email => {
    if (email.status === "COMPLETED" || email.status === "SENDING" || email.status === "FAILED") {
      totalSent += email.recipients.length;
      successfulSends += email.successCount;
      failedSends += email.failedCount;
      if (email.status === "SENDING") {
        queued += (email.recipients.length - (email.successCount + email.failedCount));
      }
    }
  });

  const successRate = totalSent > 0 ? Number(((successfulSends / (successfulSends + failedSends)) * 100).toFixed(1)) : 100.0;

  res.json({
    totalSent: successfulSends,
    successRate: isNaN(successRate) ? 100.0 : successRate,
    queued,
    failed: failedSends
  });
});

// 8. AI Compositions - Gemini Smart Composer
app.post("/api/ai/compose", async (req, res) => {
  const { prompt, tone, audience } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Composition prompt is required" });
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = `You are a professional email copywriter expert. 
Generate a high-converting, professional bulk email.
You MUST output your response in JSON format matching the schema requested.
The email body should be in visually rich and clean styled HTML (use Tailwind inline styling or clean styled tables, make it modern with dark/light themes, rounded buttons, clean headers, and visual sections).
Do NOT include any markdown codeblocks or wrapper syntax around the JSON output, just the raw JSON object.`;

    const userPrompt = `Create a bulk email based on this user prompt: "${prompt}".
Tone of voice: ${tone || "professional"}.
Target Audience: ${audience || "subscribers"}.

You MUST structure your JSON output with two exact string keys:
1. "subject" - A catchy, highly clickable, and professional email subject line.
2. "body" - The full styled HTML body content of the email, containing beautiful spacing, a clear hero section, styled typography, and call-to-action buttons. Use standard inline CSS styles suitable for email clients (e.g., style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;").`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: "The email subject line" },
            body: { type: Type.STRING, description: "The rich HTML formatted email body" }
          },
          required: ["subject", "body"]
        }
      }
    });

    const text = result.text;
    if (!text) {
      throw new Error("Empty response generated by AI");
    }

    const aiResponse = JSON.parse(text);
    res.json(aiResponse);
  } catch (err: any) {
    console.error("Gemini AI composition error:", err);
    res.status(500).json({ error: err.message || "Failed to compose email using Gemini AI" });
  }
});

// 9. Send Bulk Email Broadcast
app.post("/api/emails", async (req, res) => {
  const { subject, body, recipients, status, isAiGenerated, aiPrompt } = req.body;

  if (!subject || !body || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "Subject, HTML Body, and at least one recipient are required." });
  }

  const emails = readEmails();
  const settings = readSettings();

  const newEmail: any = {
    id: "mail_" + Math.random().toString(36).substring(2, 11),
    subject,
    body,
    recipients,
    sentAt: new Date().toISOString(),
    status: status === "DRAFT" ? "DRAFT" : "SENDING",
    successCount: 0,
    failedCount: 0,
    logs: [],
    isAiGenerated: !!isAiGenerated,
    aiPrompt: aiPrompt || ""
  };

  emails.push(newEmail);
  writeEmails(emails);

  // If it's a draft, return immediately
  if (status === "DRAFT") {
    return res.json(newEmail);
  }

  // Handle actual nodemailer dispatch asynchronously in the background so API doesn't hang!
  // Send the initial response to the client
  res.json(newEmail);

  // Background bulk sending
  (async () => {
    console.log(`Starting background bulk send for email ID: ${newEmail.id} to ${recipients.length} recipients...`);
    
    let transporter: nodemailer.Transporter;
    let fromName = "MERN Mailer Pro";
    let fromAddress = "noreply@mernmailer.internal";

    try {
      if (settings.useCustomSmtp && settings.smtpConfig) {
        console.log("Using user-defined custom SMTP configurations...");
        transporter = nodemailer.createTransport({
          host: settings.smtpConfig.host,
          port: Number(settings.smtpConfig.port),
          secure: settings.smtpConfig.secure,
          auth: {
            user: settings.smtpConfig.user,
            pass: settings.smtpConfig.pass
          }
        });
        fromName = settings.smtpConfig.fromName || fromName;
        fromAddress = settings.smtpConfig.fromAddress || fromAddress;
      } else {
        console.log("Using auto-generated Ethereal sandbox SMTP...");
        const ethereal = await getEtherealTransporter();
        transporter = ethereal.transporter;
        fromName = ethereal.fromName;
        fromAddress = ethereal.fromAddress;
      }

      const logs: any[] = [];
      let successCount = 0;
      let failedCount = 0;
      let lastPreviewUrl = "";

      // Send emails to recipients one by one
      for (const recipient of recipients) {
        try {
          const info = await transporter.sendMail({
            from: `"${fromName}" <${fromAddress}>`,
            to: recipient,
            subject: subject,
            html: body
          });

          successCount++;
          logs.push({ email: recipient, status: "SUCCESS" });
          
          // If Ethereal test mail is used, get the preview URL
          if (!settings.useCustomSmtp) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
              lastPreviewUrl = previewUrl;
            }
          }

          // Progressively update database to allow real-time status tracking in the UI!
          const currentEmails = readEmails();
          const matchIdx = currentEmails.findIndex(e => e.id === newEmail.id);
          if (matchIdx !== -1) {
            currentEmails[matchIdx].successCount = successCount;
            currentEmails[matchIdx].failedCount = failedCount;
            currentEmails[matchIdx].logs = [...logs];
            if (lastPreviewUrl) currentEmails[matchIdx].previewUrl = lastPreviewUrl;
            writeEmails(currentEmails);
          }
        } catch (mailErr: any) {
          failedCount++;
          console.error(`Failed to send bulk email to ${recipient}:`, mailErr);
          logs.push({ email: recipient, status: "FAILED", error: mailErr.message || "Unknown SMTP delivery failure" });
          
          const currentEmails = readEmails();
          const matchIdx = currentEmails.findIndex(e => e.id === newEmail.id);
          if (matchIdx !== -1) {
            currentEmails[matchIdx].successCount = successCount;
            currentEmails[matchIdx].failedCount = failedCount;
            currentEmails[matchIdx].logs = [...logs];
            writeEmails(currentEmails);
          }
        }
      }

      // Mark dispatch fully complete
      const finalEmails = readEmails();
      const finalIdx = finalEmails.findIndex(e => e.id === newEmail.id);
      if (finalIdx !== -1) {
        finalEmails[finalIdx].status = failedCount === recipients.length ? "FAILED" : "COMPLETED";
        finalEmails[finalIdx].successCount = successCount;
        finalEmails[finalIdx].failedCount = failedCount;
        finalEmails[finalIdx].logs = logs;
        if (lastPreviewUrl) finalEmails[finalIdx].previewUrl = lastPreviewUrl;
        finalEmails[finalIdx].smtpHost = settings.useCustomSmtp && settings.smtpConfig ? settings.smtpConfig.host : "smtp.ethereal.email";
        writeEmails(finalEmails);
      }
      console.log(`Bulk broadcast ID ${newEmail.id} finished sending. Success: ${successCount}, Failed: ${failedCount}`);

    } catch (outerErr: any) {
      console.error("Outer SMTP broadcast preparation error:", outerErr);
      const errEmails = readEmails();
      const errIdx = errEmails.findIndex(e => e.id === newEmail.id);
      if (errIdx !== -1) {
        errEmails[errIdx].status = "FAILED";
        errEmails[errIdx].failedCount = recipients.length;
        errEmails[errIdx].logs = recipients.map(r => ({
          email: r,
          status: "FAILED",
          error: outerErr.message || "Failed to initialize SMTP transport connection"
        }));
        writeEmails(errEmails);
      }
    }
  })();
});


// Serve React app via Vite in development, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started at http://localhost:${PORT}`);
  });
}

startServer();
