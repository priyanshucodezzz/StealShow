import nodemailer from 'nodemailer';

const transporterGmail = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.MAIL_PASSWORD,
    }
});

export default transporterGmail ;