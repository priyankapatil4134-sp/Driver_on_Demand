
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");

exports.register = async (req, res) => {
  try {
    const {
      role,
      full_name,
      phone,
      email,
      address,
      license_number,
      experience_years,
      password
    } = req.body;

    if (!["Customer", "Driver"].includes(role)) {
      return res.status(400).json({
        message: "Only Customer or Driver can register"
      });
    }

    if (!full_name || !phone || !password || password.length < 8) {
      return res.status(400).json({
        message: "Name, phone and password (min 8 characters) are required"
      });
    }

    if (role === "Customer" && (!email || !address)) {
      return res.status(400).json({
        message: "Email and address are required"
      });
    }

    if (role === "Driver" && !license_number) {
      return res.status(400).json({
        message: "License number is required"
      });
    }

    const normalizedEmail = email?.trim().toLowerCase() || undefined;
    const normalizedPhone = phone.trim();
    const normalizedLicense = license_number?.trim();

    const existingConditions = [{ phone: normalizedPhone }];

    if (normalizedEmail) {
      existingConditions.push({ email: normalizedEmail });
    }

    const existing = await User.findOne({
      $or: existingConditions
    });

    if (existing) {
      return res.status(409).json({
        message: "Phone or email already registered"
      });
    }

    if (role === "Driver") {
      const existingLicense = await Driver.findOne({
        license_number: normalizedLicense
      });

      if (existingLicense) {
        return res.status(409).json({
          message: "License number already registered"
        });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      role,
      full_name: full_name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      address: address?.trim() || undefined,
      license_number: normalizedLicense || undefined,
      password_hash
    });

    try {
      if (role === "Customer") {
        await Customer.create({
          user_id: user._id,
          name: user.full_name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          status: "active"
        });
      }

      if (role === "Driver") {
        await Driver.create({
          user_id: user._id,
          name: user.full_name,
          phone: user.phone,
          email: user.email || undefined,
          license_number: user.license_number,
          experience_years: Number(experience_years) || 0,
          status: "available"
        });
      }
    } catch (profileError) {
      await User.findByIdAndDelete(user._id);
      throw profileError;
    }

    return res.status(201).json({
      message: "Registration successful. You can login now."
    });
  } catch (err) {
    console.error("Register error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Phone, email or license number already registered"
      });
    }

    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { role, identifier, password } = req.body;

    if (!["Admin", "Customer", "Driver"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected"
      });
    }

    if (!identifier || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const normalizedIdentifier = identifier.trim();
    const query = { role };

    if (role === "Driver") {
      query.phone = normalizedIdentifier;
    } else {
      query.email = normalizedIdentifier.toLowerCase();
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    if (user.status && user.status !== "active") {
      return res.status(403).json({
        message: "This account is not active. Please contact the administrator."
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    let profile = null;

    if (role === "Customer") {
      profile = await Customer.findOne({
        user_id: user._id
      }).lean();
    }

    if (role === "Driver") {
      profile = await Driver.findOne({
        user_id: user._id
      }).lean();
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const responseUser = {
      id: user._id.toString(),
      role: user.role,
      full_name: user.full_name,
      name: profile?.name || user.full_name,
      phone: profile?.phone || user.phone || "",
      email: profile?.email || user.email || "",
      address: profile?.address || user.address || "",
      license_number:
        profile?.license_number || user.license_number || "",
      experience_years: profile?.experience_years ?? 0,
      status: profile?.status || user.status || "active"
    };

    return res.json({
      token,
      user: responseUser
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
