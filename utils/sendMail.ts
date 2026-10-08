require("dotenv").config();
import { Resend } from "resend";
import ejs from "ejs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "orders@dev-style.com";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

export interface SendMailResult {
  success: boolean;
  error?: string;
}

const isTestMode = (): boolean => process.env.EMAIL_TEST_MODE === "true";

// In test mode every send is redirected to EMAIL_TEST_RECIPIENT so testing
// never reaches a real customer or the real admin inbox.
const resolveRecipient = (intended: string): string => {
  if (!isTestMode()) return intended;

  const testRecipient = process.env.EMAIL_TEST_RECIPIENT;
  if (!testRecipient) {
    throw new Error(
      "EMAIL_TEST_MODE is enabled but EMAIL_TEST_RECIPIENT is not set"
    );
  }
  return testRecipient;
};

const sendMail = async (options: EmailOptions): Promise<SendMailResult> => {
  const { email, subject, template, data } = options;

  // get the path to the email template file
  const templatePath = path.join(__dirname, "../mails", template);

  // Render the email template with EJS (unchanged from the Nodemailer version)
  const html: string = await ejs.renderFile(templatePath, data);

  if (isTestMode()) {
    console.log(
      `[sendMail] EMAIL_TEST_MODE active - redirecting all sends to ${process.env.EMAIL_TEST_RECIPIENT} ` +
        `(intended customer: ${email}, intended admin: ${process.env.ADMIN_NOTIFICATION_EMAIL})`
    );
  }

  const customerRecipient = resolveRecipient(email);

  const { error: customerError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: customerRecipient,
    subject,
    html,
  });

  if (customerError) {
    const message = customerError.message ?? String(customerError);
    console.error("[sendMail] customer email failed to send:", customerError);
    return { success: false, error: `customer email failed: ${message}` };
  }

  const adminAddress = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminAddress) {
    console.error(
      "[sendMail] ADMIN_NOTIFICATION_EMAIL is not set - skipping admin notification copy"
    );
    return {
      success: false,
      error: "admin email failed: ADMIN_NOTIFICATION_EMAIL is not set",
    };
  }

  const adminRecipient = resolveRecipient(adminAddress);

  const { error: adminError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: adminRecipient,
    subject: "New order received",
    html,
  });

  if (adminError) {
    const message = adminError.message ?? String(adminError);
    console.error("[sendMail] admin notification email failed to send:", adminError);
    return { success: false, error: `admin email failed: ${message}` };
  }

  return { success: true };
};

export default sendMail;
