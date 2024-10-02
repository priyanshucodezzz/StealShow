import nodemailer from "nodemailer";
import * as aws from "@aws-sdk/client-ses";

const accessKey= process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKey || !secretAccessKey) {
  throw new Error("AWS credentials are not set in the environment variables.");
}

const ses = new aws.SES({
  apiVersion: "2012-12-01",
  region: "ap-south-1",
  credentials: {
    accessKeyId: accessKey, 
    secretAccessKey: secretAccessKey,
  },
});

const transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

export default transporter;