import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import {
  organization as organizationPlugin,
  admin as adminPlugin,
  // magicLink as magicLinkPlugin, // TODO: Enable in future if needed
  emailOTP as emailOTPPlugin,
} from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    camelCase: true, // Match our camelCase schema
  }),

  // Base URL for generating magic links and verification URLs
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Disable password auth - passwordless only
  emailAndPassword: {
    enabled: false,
  },

  plugins: [
    // TODO: Magic Link authentication (disabled for now, may enable in future)
    // magicLinkPlugin({
    //   sendMagicLink: async ({ email, url }) => {
    //     const { Resend } = await import("resend");
    //     const resend = new Resend(process.env.RESEND_API_KEY);
    //
    //     await resend.emails.send({
    //       from: "MyPak Connect <noreply@mypak.kavop.com>",
    //       to: email,
    //       subject: "Sign in to MyPak Connect",
    //       html: `
    //         <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    //           <h2 style="color: #1a1a1a;">Sign in to MyPak Connect</h2>
    //           <p style="color: #666; line-height: 1.5;">Click the button below to sign in:</p>
    //           <a href="${url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Sign In</a>
    //           <p style="color: #999; font-size: 14px;">Or copy this link: ${url}</p>
    //           <p style="color: #999; font-size: 14px;">This link expires in 15 minutes.</p>
    //         </div>
    //       `,
    //     });
    //   },
    //   expiresIn: 60 * 15, // 15 minutes
    //   storeToken: "hashed", // Store tokens hashed for security
    // }),

    // Email OTP authentication (6-digit code)
    emailOTPPlugin({
      async sendVerificationOTP({ email, otp, type }) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const subjectMap = {
          "sign-in": "Your sign-in code for MyPak - Kavop",
          "email-verification": "Verify your email for MyPak - Kavop",
          "forget-password": "Reset your password for MyPak - Kavop",
        };

        await resend.emails.send({
          from: "MyPak - Kavop <noreply@mypak.kavop.com>",
          to: email,
          subject: subjectMap[type],
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f9fafb;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">

                        <!-- Header -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              MyPak - Kavop
                            </h1>
                          </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 32px;">
                            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              ${type === "sign-in" ? "Sign in to MyPak - Kavop" : type === "email-verification" ? "Verify your email" : "Reset your password"}
                            </h2>

                            <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              Enter this code to continue:
                            </p>

                            <!-- OTP Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" style="padding: 24px 0;">
                                  <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 24px; display: inline-block; border: 2px solid #3b82f6;">
                                    <span style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #1e3a8a; font-family: 'Courier New', monospace;">
                                      ${otp}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            </table>

                            <p style="margin: 24px 0 8px 0; color: #64748b; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              <strong>This code expires in 5 minutes.</strong>
                            </p>

                            <p style="margin: 0; color: #94a3b8; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              If you didn't request this, you can safely ignore this email.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              © ${new Date().getFullYear()} MyPak - Kavop. All rights reserved.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
        });
      },
      otpLength: 6, // 6-digit code
      expiresIn: 60 * 5, // 5 minutes
    }),

    // Multi-tenancy with organizations
    organizationPlugin({
      async sendInvitationEmail(data) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "MyPak - Kavop <noreply@mypak.kavop.com>",
          to: data.email,
          subject: `Join ${data.organization.name} on MyPak - Kavop`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; background-color: #f9fafb;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">

                        <!-- Header -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              MyPak - Kavop
                            </h1>
                          </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 32px;">
                            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              You've been invited!
                            </h2>

                            <p style="margin: 0 0 24px 0; color: #64748b; font-size: 16px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              ${data.inviter.user.name} invited you to join <strong style="color: #0f172a;">${data.organization.name}</strong> on MyPak - Kavop.
                            </p>

                            <!-- Accept Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" style="padding: 24px 0;">
                                  <a href="${process.env.BETTER_AUTH_URL}/api/auth/organization/accept-invitation?id=${data.invitation.id}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                    Accept Invitation
                                  </a>
                                </td>
                              </tr>
                            </table>

                            <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              If you didn't expect this invitation, you can safely ignore this email.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                              © ${new Date().getFullYear()} MyPak - Kavop. All rights reserved.
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
        });
      },
    }),

    // Admin impersonation
    adminPlugin({
      impersonationSessionDuration: 60 * 60, // 1 hour
      adminRoles: ["admin"], // Only users with role="admin" can impersonate
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24 * 7, // Auto-renews every 7 days
  },
});
