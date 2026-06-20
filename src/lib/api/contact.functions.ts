import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(40).optional(),
  service: z.string().min(1),
  budget: z.string().optional(),
  description: z.string().trim().min(10).max(2000),
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>",']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export const sendContactEmail = createServerFn({ method: "POST" })
  .validator(contactSchema)
  .handler(async ({ data }) => {
    const config = getServerConfig();

    if (!config.smtpHost || !config.smtpUser || !config.smtpPass || !config.smtpFrom) {
      throw new Error(
        "SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
      );
    }

    const nodemailer = await import("nodemailer");

    const transportOptions =
      config.smtpHost === "smtp.gmail.com"
        ? {
            service: "gmail",
            auth: {
              user: config.smtpUser,
              pass: config.smtpPass,
            },
          }
        : {
            host: config.smtpHost,
            port: config.smtpPort ?? 587,
            secure: config.smtpSecure ?? false,
            auth: {
              user: config.smtpUser,
              pass: config.smtpPass,
            },
          };

    const transport = nodemailer.createTransport(transportOptions);

    const recipient = config.contactRecipient;
    const subject = `New contact request from ${data.name}`;
    const text = `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company ?? "(none)"}\nPhone: ${data.phone ?? "(none)"}\nService: ${data.service}\nBudget: ${data.budget ?? "(none)"}\nDescription:\n${data.description}`;
    const html = `
      <h2>New contact request</h2>
      <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(data.company ?? "(none)")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(data.phone ?? "(none)")}</p>
      <p><strong>Service:</strong> ${escapeHtml(data.service)}</p>
      <p><strong>Budget:</strong> ${escapeHtml(data.budget ?? "(none)")}</p>
      <p><strong>Description:</strong></p>
      <p>${escapeHtml(data.description).replace(/\n/g, "<br />")}</p>
    `;

    await transport.sendMail({
      from: config.smtpFrom,
      to: recipient,
      replyTo: data.email,
      subject,
      text,
      html,
    });

    return { success: true };
  });
