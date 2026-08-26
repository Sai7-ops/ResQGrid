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
    const parsedCookies = parse(rawCookies);
    const token = rawCookies
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("my_jwt_token="))
      ?.split("=")
      .slice(1)
      .join("=");

    if (!token)
      return next(new Error("Authentication error: No token provided"));
    const decoded = jwt.verify(token, JWT_SECRET);

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
    return next();
  } catch (err) {
    console.error("🔥 SOCKET AUTH ERROR:", err.message);
    console.error(err);
    return next(new Error(`Authentication error: ${err.message}`));
  }
});

io.on("connection", (socket) => {
  const { agency_id, agency_name, zone_id, primary_capabilities_tags } =
    socket.agency;

  console.log("🔌 AGENCY SOCKET CONNECTED");
  console.log("Agency ID:", agency_id);
  console.log("Socket ID:", socket.id);
  console.log("Room:", `agency_${agency_id}`);
  socket.join(`agency_${agency_id}`);
  socket.join(zone_id);

  if (Array.isArray(primary_capabilities_tags)) {
    primary_capabilities_tags.forEach((tag) => {
      const sanitizedTag = tag.trim().replace(/\s+/g, "_").toUpperCase();
      socket.join(`${zone_id}_${sanitizedTag}`);
    });
  }

  socket.on("CLAIM_SOS_CAPABILITY", async (payload, callback) => {
    const { sos_id, unit_type, unit_id } = payload;
    try {
      const insertDispatch = await pool.query(
        `INSERT INTO sos_dispatches (sos_id, agency_id, unit_type, unit_id, status)
           VALUES ($1, $2, $3, $4, 'en_route')
           ON CONFLICT (sos_id, unit_type) DO NOTHING
           RETURNING *`,
        [sos_id, agency_id, unit_type, unit_id],
      );

      if (insertDispatch.rowCount === 0) {
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
      const unit_name = result.rows[0].unit_name;

      await pool.query(
        `UPDATE agency_units SET status = 'EN ROUTE' WHERE unit_id = $1 AND status = 'AVAILABLE'`,
        [unit_id],
      );

      if (typeof callback === "function") {
        callback({
          success: true,
          dispatch: insertDispatch.rows[0],
        });
      }

      io.emit("CAPABILITY_CLAIMED", {
        sos_id,
        claimed_unit_type: unit_type,
        claimed_by_agency_id: agency_id,
      });

      io.to(`sos_user_${sos_id}`).emit("CITIZEN_UNIT_EN_ROUTE", {
        sos_id,
        agency_name,
        unit_type,
        unit_name,
      });
    } catch (err) {
      console.error("Error claiming SOS capability:", err);
      if (typeof callback === "function") {
        callback({ success: false, message: "Internal server error." });
      }
    }
  });

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

const verifyUserJWT = (req, res, next) => {
  try {
    const token = req.cookies.my_jwt_token;
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
  res.cookie("my_jwt_token", token, {
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
  res.cookie("my_jwt_token", token, {
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
        zone_id: "Bpl_N",
      };
    } else {
      return {
        zone_name: "Bhopal West",
        zone_id: "Bpl_W",
      };
    }
  } else {
    if (longitude >= CENTER_LNG) {
      return {
        zone_name: "Bhopal East",
        zone_id: "Bpl_E",
      };
    } else {
      return {
        zone_name: "Bhopal South",
        zone_id: "Bpl_S",
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
  agencies.forEach((agency) => {
    console.log("📡 EMITTING SOS TO ROOM:", `agency_${agency.agency_id}`);
    io.to(`agency_${agency.agency_id}`).emit("NEW_SOS_ALERT", {
      sos_id: sos_request.sos_id,
      disaster_type: sos_request.disaster_type,
      description: sos_request.description,
      location: [longitude, latitude],
      triggered_at: sos_request.triggered_at,
      matched_capabilities: agency.matched_tags,
      distance_meters: agency.distance_meters,
    });
  });
  res
    .status(200)
    .json({ message: "Agencies have been notified. Will be arriving shortly" });
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

const logout = catchAsync(async (req, res) => {
  res.clearCookie("my_jwt_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
});

app.get("/api/agency/units", verifyJWT, getAgencyUnits);
app.get("/api/agency/me", verifyJWT, getMyAgency);
app.post("/api/agency/verifyAgency", verifyAgency);
app.post("/api/agency/verifyAgencyPersonnel", verifyAgencyPersonnel);
app.post("/api/agency/verifyDigiOtp", verifyDigiOtp);
app.post("/api/agency/verifyEmail", verifyEmail);
app.post("/api/agency/verifyEmailOtp", verifyEmailOtp);
app.post("/api/agency/register", registerAgency);
app.post("/api/agency/login", loginAgency);
app.post("/api/agency/logout", verifyJWT, logout);
app.get("/api/user/me", verifyUserJWT, getMe);
app.post("/api/user/verifyUser", verifyUser);
app.post("/api/user/verifyUserSmsOtp", verifyUserSmsOtp);
app.post("/api/user/register", registerUser);
app.post("/api/user/login", loginUser);
app.post("/api/user/triggerSos", verifyUserJWT, triggerSos);
app.post("/api/user/logout", verifyUserJWT, logout);

app.use((req, res, next) => {
  const err = new Error(`Cannot find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  next(err);
});

app.use(globalErrorHandler);

httpServer.listen(PORT, () => {
  console.log(`Listening on port ${PORT} 🚀`);
});
