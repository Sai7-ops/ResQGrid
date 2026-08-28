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
import { success } from "zod";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "https://res-q-grid-delta.vercel.app",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET;

const io = new Server(httpServer, {
  cors: {
    origin: "https://res-q-grid-delta.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.use(async (socket, next) => {
  try {
    const rawCookies = socket.handshake.headers.cookie;
    if (!rawCookies)
      return next(new Error("Authentication error: No cookies found"));

    const cookies = rawCookies.split(";").map((cookie) => cookie.trim());

    const userToken = cookies
      .find((cookie) => cookie.startsWith("user_jwt_token="))
      ?.split("=")
      .slice(1)
      .join("=");

    const agencyToken = cookies
      .find((cookie) => cookie.startsWith("agency_jwt_token="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (agencyToken) {
      const decoded = jwt.verify(agencyToken, JWT_SECRET);

      const result = await pool.query(
        `SELECT agency_id, agency_name, zone_id, primary_capabilities_tags,
              ST_AsGeoJSON(hq_coordinates)::json AS hq_location
       FROM agencies WHERE agency_id = $1`,
        [decoded.agency_id],
      );

      if (result.rowCount === 0) {
        return next(new Error("Authentication error: Agency not found"));
      }

      socket.agency = result.rows[0];
      socket.type = "agency";
      return next();
    }

    if (userToken) {
      const decoded = jwt.verify(userToken, JWT_SECRET);
      const result = await pool.query(
        `
        select user_id, mobile_no, dob, age, name, email, zone_id
        from users where user_id = $1
        `,
        [decoded.user_id],
      );
      if (result.rowCount === 0) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = result.rows[0];
      socket.type = "user";
      return next();
    }
  } catch (err) {
    console.error("🔥 SOCKET AUTH ERROR:", err.message);
    console.error(err);
    return next(new Error(`Authentication error: ${err.message}`));
  }
});

io.on("connection", (socket) => {
  console.log("🔥🔥🔥 CONNECTION HANDLER REACHED");
  console.log("Socket ID:", socket.id);

  if (socket.type === "agency") {
    const { agency_id, agency_name, zone_id, primary_capabilities_tags } =
      socket.agency;

    socket.join(`agency_${agency_id}`);
    socket.join(`agency_${zone_id}`);

    if (Array.isArray(primary_capabilities_tags)) {
      primary_capabilities_tags.forEach((tag) => {
        const sanitizedTag = tag.trim().replace(/\s+/g, "_").toUpperCase();
        socket.join(`agency_${zone_id}_${sanitizedTag}`);
      });
    }

    socket.on("SOS_ALERT_RECEIVED", async (data) => {
      const { user_id, sos_id, message } = data;
      await pool.query(
        `
        update sos_requests
        set status='acknowledged'
        where sos_id=$1
        AND status NOT IN ('resolved', 'cancelled')
        `,
        [sos_id],
      );

      io.to(`user_${user_id}`).emit("SOS_ALERT_ACKNOWLEDGED", {
        message,
        success: true,
      });
    });

    socket.on("CLAIM_SOS_CAPABILITY", async (payload, callback) => {
      const {
        sos_id,
        unit_type,
        unit_id,
        agency_id,
        user_id,
      } = payload;
      try {
        const dispatch = await pool.query(
          `INSERT INTO sos_dispatches (sos_id, agency_id, unit_type, unit_id, status, current_location)
           VALUES ($1, $2, $3, $4, 'EN ROUTE')
           ON CONFLICT (sos_id, unit_type) DO NOTHING
           RETURNING *`,
          [sos_id, agency_id, unit_type, unit_id],
        );

        const dispatchData = dispatch.rows;

        await pool.query(
          `
        update sos_requests
        set status='dispatched'
        where sos_id=$1 AND status NOT IN ('resolved', 'cancelled')
        `,
          [sos_id],
        );

        if (dispatch.rowCount === 0) {
          return (
            typeof callback === "function" &&
            callback({
              success: false,
              message: `The '${unit_type}' role for SOS #${sos_id} was already claimed by another agency.`,
            })
          );
        }

        const result = await pool.query(
          `SELECT * from agency_units where unit_id=$1`,
          [unit_id],
        );
        const unit = result.rows[0];
        const unit_name = unit.unit_name;
        const unit_location = unit.current_location;

        await pool.query(
          `UPDATE agency_units SET status = 'EN_ROUTE' WHERE unit_id = $1 AND status = 'AVAILABLE'`,
          [unit_id],
        );

        if (typeof callback === "function") {
          callback({
            success: true,
            dispatch: dispatchData.rows[0],
          });
        }

        io.to(`agency_${zone_id}`).emit("CAPABILITY_CLAIMED", {
          sos_id,
          claimed_unit_type: unit_type,
          claimed_by_agency_id: agency_id,
        });

        io.to(`user_${user_id}`).emit("CITIZEN_UNIT_EN_ROUTE", {
          sos_id,
          dispatch_id: dispatchData.dispatch_id,
          agency_name,
          unit_type,
          unit_name,
          unit_id,
          current_location: unit_location,
          status: dispatchData.status,
          assigned_at: dispatchData.assigned_at,
        });
      } catch (err) {
        console.error("Error claiming SOS capability:", err);
        if (typeof callback === "function") {
          callback({ success: false, message: "Internal server error." });
        }
      }
    });
  }

  if (socket.type === "user") {
    const { user_id, zone_id } = socket.user;

    socket.join(`user_${user_id}`);
    socket.join(`user_${zone_id}`);
  }

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
  res.cookie("agency_jwt_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 2,
  });

  return res.status(200).json({ agency });
});

const verifyAgencyJWT = (req, res, next) => {
  try {
    const token = req.cookies.agency_jwt_token;
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

const verifyUserJWT = (req, res, next) => {
  try {
    const token = req.cookies.user_jwt_token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided" });
    }
    const decodedPayload = jwt.verify(token, JWT_SECRET);
    req.user = decodedPayload;
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
  res.cookie("agency_jwt_token", token, {
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
      .status(200)
      .json({ message: "No units stored under this agency curently!" });
  const agency_units = result.rows;
  return res.status(200).json(agency_units);
});

const verifyUser = catchAsync(async (req, res) => {
  const { aadhaar_no, full_name, dob, mobile_no } = req.body;
  const result = await pool.query(
    `select * from mock_digilocker where aadhaar_no=$1 and dob=$2 and mobile_no=$3`,
    [aadhaar_no, dob, mobile_no],
  );
  if (result.rowCount === 0)
    return res.status(404).json({
      message: "The given credentials doesn't match the government database",
    });
  const user = result.rows[0];
  const maskedPhone = user.mobile_no
    .slice(-4)
    .padStart(user.mobile_no.length, "X");

  const otp = generateOTP();
  await redis.set(`otp:aadhaar_no:${aadhaar_no}`, otp, "EX", 300);
  console.log(`OTP for ${aadhaar_no}: ${otp}`);
  return res.status(200).json({ maskedPhone, user });
});

const verifyUserSmsOtp = catchAsync(async (req, res) => {
  const { aadhaar_no, otp } = req.body;

  const storedOtp = await redis.get(`otp:aadhaar_no:${aadhaar_no}`);
  if (!storedOtp)
    return res
      .status(400)
      .json({ message: "OTP has either expired or never sent" });

  if (storedOtp !== otp)
    return res.status(400).json({ message: "Invalid OTP!" });

  await redis.del(`otp:aadhaar_no:${aadhaar_no}`);

  await redis.set(`verified:user:${aadhaar_no}`, "true", "EX", 600);

  return res.status(200).json({ authorized: true });
});

const registerUser = catchAsync(async (req, res) => {
  const {
    aadhaar_no,
    mobile_no,
    dob,
    state,
    age,
    name,
    address,
    email,
    password,
  } = req.body;
  const verified = await redis.get(`verified:user:${aadhaar_no}`);

  if (!verified) {
    return res.status(403).json({
      message: "User identity has not been verified",
    });
  }
  const password_hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
  INSERT INTO users (
    aadhaar_no,
    mobile_no,
    dob,
    age,
    name,
    state,
    address,
    email,
    password_hash
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING *
  `,
    [
      aadhaar_no,
      mobile_no,
      dob,
      age,
      name,
      state,
      address,
      email,
      password_hash,
    ],
  );

  const user = result.rows[0];
  const payload = {
    user_name: user.name,
    user_id: user.user_id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  res.cookie("user_jwt_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 2,
  });

  await redis.del(`verified:user:${aadhaar_no}`);
  return res.status(200).json(user);
});

const loginUser = catchAsync(async (req, res) => {
  const { aadhaar_no, password } = req.body;
  const result = await pool.query(`select * from users where aadhaar_no=$1`, [
    aadhaar_no,
  ]);
  if (result.rowCount === 0)
    return res.status(400).json({ message: "Invalid Credentials" });
  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });
  const payload = {
    user_name: user.name,
    user_id: user.user_id,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  res.cookie("user_jwt_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 2,
  });
  return res.status(200).json(user);
});

const getMe = catchAsync(async (req, res) => {
  const user_id = req.user.user_id;
  const result = await pool.query(`select * from users where user_id=$1`, [
    user_id,
  ]);
  if (result.rowCount === 0)
    return res.status(404).json({ message: "No users found" });
  const user = result.rows[0];
  return res.status(200).json(user);
});

export const DISASTER_CAPABILITY_MAPPING = {
  flood: {
    primary: ["WATER RESCUE", "MEDICAL"],
    support: ["POLICE", "FOOD DISTRIBUTION", "SHELTER", "HEAVY CLEARANCE"],
  },
  fire: {
    primary: ["FIRE RESCUE", "MEDICAL", "POLICE"],
    support: ["SHELTER"],
  },
  earthquake: {
    primary: ["HEAVY CLEARANCE", "MEDICAL", "POLICE"],
    support: ["SHELTER", "FOOD DISTRIBUTION"],
  },
  cyclone: {
    primary: ["WATER RESCUE", "HEAVY CLEARANCE", "MEDICAL"],
    support: ["POLICE", "SHELTER", "FOOD DISTRIBUTION"],
  },
  medical_emergency: {
    primary: ["MEDICAL"],
    support: ["POLICE", "SHELTER"],
  },
  crowd_hazard: {
    primary: ["POLICE", "MEDICAL", "HEAVY CLEARANCE"],
    support: ["FOOD DISTRIBUTION", "SHELTER"],
  },
};

function getBhopalZone(longitude, latitude) {
  const CENTER_LAT = 23.25;
  const CENTER_LNG = 77.4;

  if (latitude >= CENTER_LAT) {
    if (longitude >= CENTER_LNG) {
      return {
        zone_name: "Bhopal North",
        zone_id: "bpl_N",
      };
    } else {
      return {
        zone_name: "Bhopal West",
        zone_id: "bpl_W",
      };
    }
  } else {
    if (longitude >= CENTER_LNG) {
      return {
        zone_name: "Bhopal East",
        zone_id: "bpl_E",
      };
    } else {
      return {
        zone_name: "Bhopal South",
        zone_id: "bpl_S",
      };
    }
  }
}

const triggerSos = catchAsync(async (req, res) => {
  const { latitude, longitude, disaster_type, is_victim, description } =
    req.body;
  const user_id = req.user.user_id;
  const result = await pool.query(
    `insert into sos_requests(user_id, triggered_location, disaster_type, is_victim, description) values
    ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4, $5,  $6) RETURNING sos_id,
    user_id,
    triggered_at,
    status,
    disaster_type,
    is_victim,
    description,
    ST_AsGeoJSON(triggered_location)::json AS location`,
    [user_id, longitude, latitude, disaster_type, is_victim, description],
  );
  const sos_request = result.rows[0];
  const agencies = await findNearestAgencies(
    sos_request.sos_id,
    sos_request.location.coordinates,
    sos_request.disaster_type,
  );
  if (agencies.length === 0)
    return res.status(404).json({
      message: "SOS recorded but no agencies are currently available",
    });

  const io = req.app.get("io");

  io.to(`user_${user_id}`).emit("SOS_ALERT_TRIGGERED", sos_request);

  agencies.forEach((agency) => {
    console.log("📡 EMITTING SOS TO ROOM:", `agency_${agency.agency_id}`);
    io.to(`agency_${agency.agency_id}`).emit("NEW_SOS_ALERT", {
      sos_id: sos_request.sos_id,
      user_id: sos_request.user_id,
      status: sos_request.status,
      disaster_type: sos_request.disaster_type,
      description: sos_request.description,
      location: [longitude, latitude],
      triggered_at: sos_request.triggered_at,
      matched_capabilities: agency.matched_tags,
      distance_meters: agency.distance_meters,
    });
  });

  for (const agency of agencies) {
    await pool.query(
      `INSERT INTO agency_sos_inbox 
         (sos_id, agency_id, matched_capabilities, distance_meters)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (agency_id, sos_id) DO NOTHING`,
      [
        sos_request.sos_id,
        agency.agency_id,
        agency.matched_tags,
        agency.distance_meters,
      ],
    );
  }

  res.status(200).json({
    message: "Agencies have been notified. Will be arriving shortly",
    user_id,
  });
});

export const findNearestAgencies = async (
  sos_id,
  coordinates,
  disaster_type,
) => {
  const [longitude, latitude] = coordinates;
  const requiredTags = DISASTER_CAPABILITY_MAPPING[disaster_type].primary;

  const baseQuery = (bufferKm = 0) => `
    SELECT 
      a.agency_id,
      a.agency_name,
      a.hotline_no,
      a.coverage_radius_km,
      -- Aggregate all matching capabilities this agency provides for this SOS
      ARRAY_AGG(DISTINCT tag) AS matched_tags,
      ROUND(
        ST_Distance(
          a.hq_coordinates,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
        )::numeric, 2
      ) AS distance_meters
    FROM agencies a,
         UNNEST(a.primary_capabilities_tags) AS tag
    WHERE tag = ANY($1::text[])
      AND a.is_active = true
      AND a.is_verified = true
      AND ST_DWithin(
        a.hq_coordinates,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
        (a.coverage_radius_km + ${bufferKm}) * 1000
      )
      -- Exclude agencies that have already been dispatched or declined this SOS
      AND a.agency_id NOT IN (
        SELECT agency_id 
        FROM sos_dispatches 
        WHERE sos_id = $4
      )
    GROUP BY a.agency_id, a.agency_name, a.hotline_no, a.coverage_radius_km, a.hq_coordinates
    ORDER BY distance_meters ASC;
  `;

  let result = await pool.query(baseQuery(0), [
    requiredTags,
    longitude,
    latitude,
    sos_id,
  ]);

  const foundTags = new Set(
    result.rows.flatMap((r) => r.matched_tags || r.matched_agency_tag),
  );

  const missingTags = requiredTags.filter((tag) => !foundTags.has(tag));

  if (missingTags.length > 0) {
    const fallbackResult = await pool.query(baseQuery(5), [
      missingTags,
      longitude,
      latitude,
      sos_id,
    ]);

    const existingAgencyIds = new Set(result.rows.map((r) => r.agency_id));
    const newAgencies = fallbackResult.rows.filter(
      (r) => !existingAgencyIds.has(r.agency_id),
    );

    return [...result.rows, ...newAgencies];
  }

  return result.rows;
};

const logoutUser = catchAsync(async (req, res) => {
  res.clearCookie("user_jwt_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

const logoutAgency = catchAsync(async (req, res) => {
  res.clearCookie("agency_jwt_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

const getSosAlerts = catchAsync(async (req, res) => {
  const agency_id = req.agency.agency_id;

  const result = await pool.query(
    `
    SELECT 
    i.inbox_id,
    i.sos_id,
    i.distance_meters,
    i.inserted_at,
    s.disaster_type,
    s.description,
    ST_AsGeoJSON(s.triggered_location)::json AS location,
    ARRAY(
        SELECT tag 
        FROM UNNEST(i.matched_capabilities) AS tag
        WHERE tag NOT IN (
            SELECT unit_type 
            FROM sos_dispatches 
            WHERE sos_id = i.sos_id
        )
    ) AS matched_capabilities
FROM agency_sos_inbox i
JOIN sos_requests s ON i.sos_id = s.sos_id
WHERE i.agency_id = $1
  AND s.status NOT IN ('resolved', 'cancelled')
  AND EXISTS (
      SELECT 1 
      FROM UNNEST(i.matched_capabilities) AS tag
      WHERE tag NOT IN (
          SELECT unit_type 
          FROM sos_dispatches 
          WHERE sos_id = i.sos_id
      )
  )
ORDER BY i.inserted_at DESC;
    `,
    [agency_id],
  );

  return res.status(200).json(result.rows);
});

const getUnitActiveMission = catchAsync(async (req, res) => {
  const { unit_id } = req.params;
  const result = await pool.query(
    `
    SELECT 
      s.sos_id,
      s.user_id,
      s.triggered_at, 
      s.status AS sos_status, 
      ST_AsGeoJSON(s.triggered_location)::json AS sos_location,
      s_d.dispatch_id,
      s_d.agency_id,
      s_d.assigned_at, 
      s_d.updated_at, 
      s_d.status AS dispatch_status, 
      u.unit_id,
      u.unit_name, 
      u.unit_type, 
      u.equipped_assets, 
      ST_AsGeoJSON(u.current_location)::json AS unit_location
    FROM sos_dispatches s_d 
    JOIN sos_requests s ON s_d.sos_id = s.sos_id 
    JOIN agency_units u ON s_d.unit_id = u.unit_id
    WHERE s_d.unit_id = $1
      AND s_d.status IN ('ASSIGNED', 'EN ROUTE', 'ON SCENE')
      AND s.status IN ('pending', 'acknowledged', 'dispatched')
    ORDER BY s_d.assigned_at DESC
    LIMIT 1;
    `,
    [unit_id],
  );

  return res.status(200).json(result.rows);
});

const getSosAlert = catchAsync(async (req, res) => {
  const { sos_id } = req.params;
  const result = await pool.query(
    `
    select sos_id, triggered_at, status, disaster_type, description
    from sos_requests 
    where sos_id=$1
    `,
    [sos_id],
  );
  return res.status(200).json(result.rows);
});

const getDispatchData = catchAsync(async (req, res) => {
  const { sos_id } = req.params;
  const result = await pool.query(
    `
    select d.dispatch_id, a.agency_name, a.agency_id, u.unit_name, u.unit_id
    u.unit_type, d.status, d.assigned_at, ST_AsGeoJSON(u.current_location)::json AS unit_location
    from sos_dispatches d join agencies a on d.agency_id=a.agency_id join agency_units on
    d.unit_id=u.unit_id
    where sos_id=$1
    `,
    [sos_id],
  );

  return res.status(200).json(result.rows);
});

app.get("/api/agency/units", verifyAgencyJWT, getAgencyUnits);
app.get("/api/agency/me", verifyAgencyJWT, getMyAgency);
app.get("/api/agency/sosAlerts", verifyAgencyJWT, getSosAlerts);
app.get(
  "/api/agency/unit/:unit_id/activeMission",
  verifyAgencyJWT,
  getUnitActiveMission,
);
app.post("/api/agency/verifyAgency", verifyAgency);
app.post("/api/agency/verifyAgencyPersonnel", verifyAgencyPersonnel);
app.post("/api/agency/verifyDigiOtp", verifyDigiOtp);
app.post("/api/agency/verifyEmail", verifyEmail);
app.post("/api/agency/verifyEmailOtp", verifyEmailOtp);
app.post("/api/agency/register", registerAgency);
app.post("/api/agency/login", loginAgency);
app.post("/api/agency/logout", verifyAgencyJWT, logoutAgency);
app.get("/api/user/me", verifyUserJWT, getMe);
app.get("/api/user/sosAlert/:sos_id", verifyUserJWT, getSosAlert);
app.get("/api/user/dispatchData/:sos_id", verifyUserJWT, getDispatchData);
app.post("/api/user/verifyUser", verifyUser);
app.post("/api/user/verifyUserSmsOtp", verifyUserSmsOtp);
app.post("/api/user/register", registerUser);
app.post("/api/user/login", loginUser);
app.post("/api/user/triggerSos", verifyUserJWT, triggerSos);
app.post("/api/user/logout", verifyUserJWT, logoutUser);

app.use((req, res, next) => {
  const err = new Error(`Cannot find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  next(err);
});

app.use(globalErrorHandler);

httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT} 🚀`);
});
