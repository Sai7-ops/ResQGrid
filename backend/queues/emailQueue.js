import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { transporter } from "../config/mailer.js";

export const emailQueue = new Queue("emailQueue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 4,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const addEmailJob = async (to, subject, html) => {
  return await emailQueue.add("sendEmail", { to, subject, html });
};

export const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    const { to, subject, html } = job.data;
    const info = await transporter.sendMail({
      from: `"ResQGrid System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("[Email Worker] SMTP response:", {
      to,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  },
  {
    connection: redis,
    concurrency: 10,
    limiter: {
      max: 20,
      duration: 1000,
    },
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[Email Worker] Job ${job.id} delivered to ${job.data.to}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Email Worker] Job ${job?.id} failed: ${err.message}`);
});
