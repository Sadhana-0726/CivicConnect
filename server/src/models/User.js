const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * Enterprise Role Configuration & Visual Metadata
 * Icons formatted with deep chocolate brown design palette styling.
 */
const ROLES_CONFIG = {
  citizen: {
    code: "citizen",
    label: "Citizen User",
    icon: "👤",
    chocolateColor: "#5C3A21", // Warm Cocoa
    description: "Public resident reporting community infrastructure issues",
  },
  department_officer: {
    code: "department_officer",
    label: "Field Inspector / Officer",
    icon: "👷",
    chocolateColor: "#4A2C11", // Deep Mocha
    description: "On-site field engineer inspecting and resolving civic tickets",
  },
  department_admin: {
    code: "department_admin",
    label: "Department Administrator",
    icon: "🏛️",
    chocolateColor: "#3E2723", // Dark Chocolate
    description: "Municipal sector lead allocating tickets and tracking SLAs",
  },
  super_admin: {
    code: "super_admin",
    label: "Super Administrator",
    icon: "⚡",
    chocolateColor: "#2D1810", // Espresso Brown
    description: "Global system governance, staff provisioning, and audit logs",
  },
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: [
        "citizen",
        "department_officer",
        "department_admin",
        "super_admin",
      ],
      default: "citizen",
    },
    department: {
      type: String,
      enum: [
        "Roads & Infrastructure",
        "Sanitation & Solid Waste",
        "Water & Sewage",
        "Electrical & Streetlights",
        "Public Safety & General",
        null,
      ],
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual field to dynamically retrieve role metadata & chocolate icon styling
userSchema.virtual("roleMeta").get(function () {
  return (
    ROLES_CONFIG[this.role] || {
      code: this.role,
      label: "User",
      icon: "👤",
      chocolateColor: "#5C3A21",
    }
  );
});

// Ensure virtual fields are included in API JSON outputs
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Encrypt password before saving (Clean async hook without next callback)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;