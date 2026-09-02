import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { resend } from "../config/resend.js";

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

    const { data, error } = await resend.emails.send({
      from: "ResQGrid <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log("[Email Worker] Email sent:", {
      to,
      id: data?.id,
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
