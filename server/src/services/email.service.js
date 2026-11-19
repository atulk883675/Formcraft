
const { Resend } = require("resend");

const env = require("../config/env");

const resend = new Resend(env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return data;
};

module.exports = sendEmail;
