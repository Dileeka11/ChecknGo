const nodemailer = require("nodemailer");

/**
 * Create email transporter using Gmail SMTP
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Generate HTML email template for invoice receipt
 */
const generateInvoiceHTML = (invoice) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const itemRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">${item.itemName}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.weight.toFixed(2)} kg</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">Rs. ${item.unitPrice.toFixed(0)}/kg</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">Rs. ${item.totalPrice.toFixed(2)}</td>
      </tr>
    `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">ChecknGo</h1>
          <p style="color: #d1fae5; margin: 6px 0 0; font-size: 14px;">AI-Powered Smart Checkout</p>
        </div>

        <!-- Body -->
        <div style="background: #fff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #111827; margin: 0 0 20px; font-size: 20px;">Invoice Receipt</h2>

          <!-- Invoice Info -->
          <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px; color: #374151;">
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Invoice No:</td>
                <td style="padding: 4px 0; text-align: right;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Date:</td>
                <td style="padding: 4px 0; text-align: right;">${formatDate(invoice.createdAt)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Customer:</td>
                <td style="padding: 4px 0; text-align: right;">${invoice.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: 600;">Payment:</td>
                <td style="padding: 4px 0; text-align: right; text-transform: uppercase;">${invoice.paymentMethod}</td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px 12px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #d1d5db;">Item</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 700; color: #374151; border-bottom: 2px solid #d1d5db;">Weight</th>
                <th style="padding: 10px 12px; text-align: center; font-weight: 700; color: #374151; border-bottom: 2px solid #d1d5db;">Rate</th>
                <th style="padding: 10px 12px; text-align: right; font-weight: 700; color: #374151; border-bottom: 2px solid #d1d5db;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #6b7280;">
              <span>Subtotal</span>
              <span>Rs. ${invoice.subtotal.toFixed(2)}</span>
            </div>
            ${
              invoice.discount > 0
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #10b981;">
                    <span>Discount</span>
                    <span>- Rs. ${invoice.discount.toFixed(2)}</span>
                  </div>`
                : ""
            }
            <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #111827; font-size: 20px; font-weight: 700; color: #111827;">
              <span>TOTAL</span>
              <span>Rs. ${invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #10b981; font-weight: 600; margin: 0 0 6px;">Thank you for shopping with us!</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Fresh produce, smart checkout</p>
            <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">* No returns on fresh produce *</p>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div style="text-align: center; padding: 16px; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0;">ChecknGo &copy; ${new Date().getFullYear()} | Fresh Produce Store</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send invoice receipt email to customer
 * @param {string} email - Customer email address
 * @param {Object} invoiceData - The invoice document
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
const sendInvoiceEmail = async (email, invoiceData) => {
  try {
    console.log(`📧 Attempting to send invoice email...`);
    console.log(`   To: ${email}`);
    console.log(`   Invoice: ${invoiceData.invoiceNumber}`);
    console.log(`   EMAIL_USER configured: ${!!process.env.EMAIL_USER}`);
    console.log(`   EMAIL_PASS configured: ${!!process.env.EMAIL_PASS}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️ Email credentials not configured. Skipping email send.");
      return false;
    }

    const transporter = createTransporter();
    const html = generateInvoiceHTML(invoiceData);

    const mailOptions = {
      from: `"ChecknGo" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Invoice ${invoiceData.invoiceNumber} - ChecknGo Receipt`,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `✅ Invoice email sent to ${email} for ${invoiceData.invoiceNumber}`,
    );
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to send invoice email to ${email}:`,
      error.message,
    );
    return false;
  }
};

module.exports = { sendInvoiceEmail };
