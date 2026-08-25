import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import dotenv from "dotenv";
import pool from "./config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { redis } from "./config/redis.js";
// import { sendOtpSMS } from "./services/smsService.js";
import { addEmailJob } from "./queues/emailQueue.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import "./queues/emailQueue.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "https://res-q-grid-delta.vercel.app" || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export const globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error("Unhandled Error 💥:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
};

const verifyAgency = catchAsync(async (req, res) => {
  const { agency_id, category } = req.body;
  const result = await pool.query(
    `select * from mock_govt_registry where agency_id=$1 and category=$2`,
    [agency_id, category],
  );
  if (result.rowCount == 0) {
    return res.status(404).json({
      message: "There exists no agency matching the following credentials",
    });
  }
  const agency = result.rows[0];
  if (agency.is_blacklisted)
    return res.status(403).json({ message: "The agency is blacklisted" });
  return res.status(200).json({ agency });
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const verifyAgencyPersonnel = catchAsync(async (req, res) => {
  const { official_id, aadhaar_no } = req.body;
  const result = await pool.query(
    `
    select * from mock_agency_authorized_personnel o join mock_digilocker d on o.aadhaar_no=d.aadhaar_no where o.official_id=$1 and o.aadhaar_no=$2
    `,
    [official_id, aadhaar_no],
  );
  if (result.rowCount == 0) {
    return res.status(404).json({
      message:
        "The credential doesn't belong to any authorized person in the agency",
    });
  }
  const official = result.rows[0];
  if (!official.is_active)
    return res
      .status(403)
      .json({ message: "The authority is no more authorized to register" });

  const otp = generateOTP();
  await redis.set(`otp:official:${official.official_id}`, otp, "EX", 300);
  console.log(`OTP for ${official.official_id}: ${otp}`);
  const maskedPhone = official.mobile_no
    .slice(-4)
    .padStart(official.mobile_no.length, "X");
  return res.status(200).json({ authorized: true, official, maskedPhone });
});

const verifyDigiOtp = catchAsync(async (req, res) => {
  const { official_id, otp } = req.body;
  const storedOtp = await redis.get(`otp:official:${official_id}`);

  if (!storedOtp) {
    return res
      .status(400)
      .json({ message: "OTP has expired or was not requested" });
  }
  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }
  await redis.del(`otp:official:${official_id}`);
  return res.status(200).json({ message: "OTP Verfied To Be True" });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await pool.query(
    `select official_agency_email from mock_govt_registry where official_agency_email=$1`,
    [email],
  );
  if (result.rowCount == 0)
    return res.status(400).json({
      message:
        "The email provided doesn't match government registered email id for the agency",
    });
  const otp = generateOTP();
  await redis.set(`otp:officialEmail:${email}`, otp, "EX", 300);
  await addEmailJob(
    email,
    "Your ResQGrid Agency Verification Code",
    `<h3>Agency Verification</h3><p>Your OTP is: <strong>${otp}</strong>. It expires in 5 minutes`,
  );
  res.status(200).json({
    message: "Email is matching government Credentials!",
  });
});

const verifyEmailOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = await redis.get(`otp:officialEmail:${email}`);
  if (!storedOtp)
    return res
      .status(400)
      .json({ message: "The OTP is expired or never requested!" });
  if (storedOtp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });
  await redis.del(`otp:officialEmail:${email}`);
  return res.status(200).json({ authorized: true });
});

const registerAgency = catchAsync(async (req, res) => {
  const {
    agency_id,
    agency_name,
    category,
    authorized_state,
    official_email,
    hotline_no,
    password,
    hq_location_address,
    latitude,
    longitude,
    coverage_radius_km,
    primary_capabilities_tags,
  } = req.body;
  const is_verified = true;
  const is_active = true;
  const password_hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `insert into agencies(agency_id, agency_name, category, authorized_state, official_email, hotline_no, password_hash, hq_location_address, hq_coordinates, coverage_radius_km, primary_capabilities_tags, is_verified, is_active)
      values($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($9, $10), 4326)::geography, $11, $12, $13, $14)
      RETURNING *, ST_AsGeoJSON(hq_coordinates)::json AS hq_location
      `,
    [
      agency_id,
      agency_name,
      category,
      authorized_state,
      official_email,
      hotline_no,
      password_hash,
      hq_location_address,
      longitude,
      latitude,
      coverage_radius_km,
      primary_capabilities_tags,
      is_verified,
      is_active,
    ],
  );
  const agency = result.rows[0];
  const payload = {
    agency_id: agency.agency_id,
    agency_name: agency.agency_name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  res.cookie("my_jwt_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 2,
  });
  return res.status(200).json({ agency });
});

const verifyJWT = (req, res, next) => {
  try {
    const token = req.cookies.my_jwt_token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided" });
    }
    const decodedPayload = jwt.verify(token, JWT_SECRET);
    req.agency = decodedPayload;
    return next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const loginAgency = catchAsync(async (req, res) => {
  const { agency_id, password } = req.body;
  const result = await pool.query(
    `select *,ST_AsGeoJSON(hq_coordinates)::json AS hq_location from agencies where agency_id=$1`,
    [agency_id],
  );
  if (result.rowCount === 0)
    return res.status(400).json({ message: "Invalid Credentials" });
  const agency = result.rows[0];
  const isMatch = await bcrypt.compare(password, agency.password_hash);
  if (!isMatch) return res.status(401).json({ message: "Invalid Credentials" });
  const payload = {
    agency_id: agency.agency_id,
    agency_name: agency.agency_name,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  res.cookie("my_jwt_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 2,
  });
  return res.status(200).json({ agency });
});

const getMyAgency = catchAsync(async (req, res) => {
  const agency_id = req.agency.agency_id;
  const result = await pool.query(
    `select *,ST_AsGeoJSON(hq_coordinates)::json AS hq_location from agencies where agency_id=$1`,
    [agency_id],
  );
  if (result.rowCount === 0)
    return res
      .status(404)
      .json({ message: "An error occured while fetching details" });
  const agency = result.rows[0];
  return res.status(200).json(agency);
});

const getAgencyUnits = catchAsync(async (req, res) => {
  const agency_id = req.agency.agency_id;
  const result = await pool.query(
    `select *, ST_AsGeoJSON(current_location)::json AS location from agency_units where agency_id=$1`,
    [agency_id],
  );
  if (result.rowCount === 0)
    return res
      .status(404)
      .json({ message: "No units stored under this agency curently!" });
  const agency_units = result.rows;
  return res.status(200).json(agency_units);
});

app.post("/api/agency/verifyAgency", verifyAgency);
app.post("/api/agency/verifyAgencyPersonnel", verifyAgencyPersonnel);
app.post("/api/agency/verifyDigiOtp", verifyDigiOtp);
app.post("/api/agency/verifyEmail", verifyEmail);
app.post("/api/agency/verifyEmailOtp", verifyEmailOtp);
app.post("/api/agency/register", registerAgency);
app.post("/api/agency/login", loginAgency);
app.get("/api/agency/me", verifyJWT, getMyAgency);
app.get("/api/agency/units", verifyJWT, getAgencyUnits);

app.use((req, res, next) => {
  const err = new Error(`Cannot find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  next(err);
});

app.use(globalErrorHandler);

httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT} 🚀`);
});
