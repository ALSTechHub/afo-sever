/* import transporter, { mailSender }  from "./email.config.js";
import { bookingCancelledTemplate, bookingCompletedTemplate, bookingConfirmationTemplate, bookingConfirmedTemplate, leadConfirmationTemplate, passwordResetEmailTemplate, passwordResetSuccessTemplate, paymentConfirmationTemplate, rentOverdueTemplate, rentReminderTemplate, tenantWelcomeTemplate } from "./email.template.js";

const companyDetails = {
  name: 'Wilmas Consult Ventures',
  address: 'Beaver House, Nairobi',
  phone: '+254 743 447230',
  email: 'wilmasconsultventures@gmail.com',
  website: 'https://wilmasconsultventures.co.ke',
  logo: 'https://wilmasconsultventures.co.ke/wilmas.png',
  accountsEmail: 'wilmasconsultventures@gmail.com',
  paymentLink: 'https://wilmasconsultventures.co.ke/payments'
};

export const sendPasswordResetEmail = async (user, resetURL) => {
  try {
    const html = passwordResetEmailTemplate(user, resetURL, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
   console.log('Email sent successfully:', info);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
export const sendPasswordResetSuccessEmail = async (user) => {
  try {
    const html = passwordResetSuccessTemplate(user, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: user.email,
      subject: `Your ${companyDetails.name} password has been reset`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset success email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    throw error;
  }
};


export const sendBookingConfirmationEmail = async (booking) => {
  try {
    const html = bookingConfirmationTemplate(booking, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: booking.email,
      subject: `Booking Received - ${booking.referenceNumber} • ${companyDetails.name}`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

export const sendBookingStatusUpdateEmail = async (booking) => {
  try {
    let html;
    let subject;

    switch (booking.status) {
      case 'confirmed':
        html = bookingConfirmedTemplate(booking, companyDetails);
        subject = `Booking Confirmed - ${booking.referenceNumber} • ${companyDetails.name}`;
        break;
      case 'completed':
        html = bookingCompletedTemplate(booking, companyDetails);
        subject = `Service Completed - ${booking.referenceNumber} • ${companyDetails.name}`;
        break;
      case 'cancelled':
        html = bookingCancelledTemplate(booking, companyDetails);
        subject = `Booking Cancelled - ${booking.referenceNumber} • ${companyDetails.name}`;
        break;
      default:
        return;
    }

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: booking.email,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Booking ${booking.status} email sent successfully:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending booking status update email:', error);
    throw error;
  }
};
export const sendLeadConfirmationEmail = async (lead) => {
  try {
    const html = leadConfirmationTemplate(lead, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: lead.email,
      subject: `Property Interest Received - ${lead.property.title} • ${companyDetails.name}`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Lead confirmation email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending lead confirmation email:', error);
    throw error;
  }
};
export const sendRentReminderEmail = async (tenantData, daysRemaining) => {
  try {
    const html = rentReminderTemplate(tenantData, daysRemaining, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: tenantData.email,
      subject: `Rent Payment Reminder - ${daysRemaining} Days Remaining • ${companyDetails.name}`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Rent reminder email sent to ${tenantData.email}:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending rent reminder email:', error);
    throw error;
  }
};

export const sendRentOverdueEmail = async (tenantData) => {
  try {
    const html = rentOverdueTemplate(tenantData, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: tenantData.email,
      subject: `Rent Payment Overdue - Immediate Action Required • ${companyDetails.name}`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Rent overdue email sent to ${tenantData.email}:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending rent overdue email:', error);
    throw error;
  }
};

export const sendTenantWelcomeEmail = async (tenantData) => {
  try {
    const html = tenantWelcomeTemplate(tenantData, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: tenantData.email,
      subject: `Welcome to ${tenantData.propertyName} • ${companyDetails.name}`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Tenant welcome email sent to ${tenantData.email}:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending tenant welcome email:', error);
    throw error;
  }
};

export const sendPaymentConfirmationEmail = async (paymentData) => {
  try {
    const html = paymentConfirmationTemplate(paymentData, companyDetails);

    const mailOptions = {
      from: `"${mailSender.name}" <${mailSender.email}>`,
      to: paymentData.tenantEmail,
      subject: `Rent Payment Confirmed - Receipt #${paymentData.transactionNumber} • ${companyDetails.name}`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Payment confirmation email sent to ${paymentData.tenantEmail}:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
}; */