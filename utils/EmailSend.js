const nodemailer = require("nodemailer");
require("dotenv").config()
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
/**
 * Send an email
 * @param {string} email - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body (plain text)
 * @param {string} htmlMessage - Email body (HTML format)
 * @returns {boolean} - Returns true if email is sent successfully, otherwise false
 */
exports. sendEmail = async (email, subject, message, htmlMessage) => {
  try {
    const info = await transporter.sendMail({
      from: `"Support Team" <${process.env.MAIL_USER}>`,
      to: email,
      subject,
      text: message, // Plain text message
      html: htmlMessage, // HTML message
    });

    console.log(`Email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};


