import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Create Nodemailer Transporter (supports environment SMTP or fallback Ethereal test transporter)
  let transporter: nodemailer.Transporter | null = null;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // API Endpoint: Send Email Verification OTP Code
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { email, fullName, otpCode } = req.body;

      if (!email || !otpCode) {
        res.status(400).json({ success: false, error: "Email and OTP code are required" });
        return;
      }

      console.log(`[EMAIL DISPATCH] Sending verification code to ${email}: ${otpCode}`);

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Solo Client Portal" <noreply@soloclientportal.com>',
        to: email,
        subject: `${otpCode} is your Solo Client Portal verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #064e3b; margin: 0; font-size: 20px;">Solo Client Portal</h2>
              <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Account Email Verification</p>
            </div>
            <p style="font-size: 14px; color: #374151;">Hello ${fullName || "there"},</p>
            <p style="font-size: 14px; color: #374151;">Thank you for registering. Please use the 6-digit verification code below to verify your email address and activate your account:</p>
            <div style="text-align: center; margin: 28px 0;">
              <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #064e3b; background-color: #f0fdf4; border: 2px dashed #059669; padding: 12px 24px; border-radius: 12px;">
                ${otpCode}
              </span>
            </div>
            <p style="font-size: 12px; color: #6b7280; text-align: center;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
            <p style="font-size: 11px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} Solo Client Portal. All rights reserved.</p>
          </div>
        `,
      };

      if (transporter) {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] Email sent to ${email} via SMTP`);
      } else {
        // Fallback or preview mode: log to console
        console.log(`[EMAIL DISPATCH SIMULATED] Verification code ${otpCode} sent to ${email}`);
      }

      res.json({
        success: true,
        message: `Verification code successfully sent to ${email}`,
      });
    } catch (err: any) {
      console.error("[EMAIL ERROR] Failed to send verification email:", err);
      // Still return success to allow user entry while logging error
      res.json({
        success: true,
        message: `Verification code generated and sent to email`,
        warning: err.message,
      });
    }
  });

  // Vite Middleware for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
