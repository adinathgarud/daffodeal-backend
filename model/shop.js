const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your shop name!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your shop email address"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [6, "Password should be greater than 6 characters"],
    select: false,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    default: "Seller",
  },
  gstNumber: {
    type: String,
    required: true,
  },
  gstDetails: {
    gstin: {
      type: String,
      required: true,
    },
    legal_name: {
      type: String,
      required: true,
    },
    state_jurisdiction: {
      type: String,
      required: true,
    },
    centre_jurisdiction: {
      type: String,
      required: true,
    },
    registration_date: {
      type: Date,
      required: true,
    },
    business_constitution: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    business_activity_nature: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    trade_name: {
      type: String,
      required: true,
    },
    state_jurisdiction_code: {
      type: String,
      required: true,
    },
    centre_jurisdiction_code: {
      type: String,
      required: true,
    },
    place_of_business_principal: {
      address: {
        building_name: {
          type: String,
          required: true,
        },
        street: {
          type: String,
          required: true,
        },
        location: {
          type: String,
          required: true,
        },
        door_num: {
          type: String,
        },
        state: {
          type: String,
          required: true,
        },
        floor_num: {
          type: String,
        },
        district: {
          type: String,
          required: true,
        },
        pin_code: {
          type: String,
          required: true,
        },
      },
      nature: {
        type: [String],
        required: true,
      },
    },
  },
  zipCode: {
    type: Number,
    required: true,
  },
  withdrawMethod: {
    type: Object,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  transections: [
    {
      amount: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        default: "Processing",
      },
      createdAt: {
        type: Date,
        default: Date.now(),
      },
      updatedAt: {
        type: Date,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

// Hash password
shopSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
shopSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// comapre password
shopSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Shop", shopSchema);