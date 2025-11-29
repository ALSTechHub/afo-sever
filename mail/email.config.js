import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
   tls: {
    rejectUnauthorized: false, 
  }, 
  logger: true,
  debug: true
});
transporter.verify((error, success) => {
  if (error) {
    console.error('Error with EMAIL connection:', error);
  } else {
    console.log(' Server is ready to take  messages');
  }
});

export const mailSender = {
  email: process.env.EMAIL_FROM_ADDRESS || "info@wilmasconsultventures.co.ke",
  name: process.env.EMAIL_FROM_NAME || "Wilmas Consult Ventures",
};

export default transporter;
