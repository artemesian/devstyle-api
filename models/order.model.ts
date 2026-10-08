require("dotenv").config();
import mongoose, { Model, Schema } from "mongoose";
import DiffPlugin from "mongoose-history-diff";
import { IOrder } from "../lib/interfaces";

const orderSchema: Schema<IOrder> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    goodies: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goodie",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      size: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Size",
        required: false,
      },
      color: {
        type: String,
        required: false,
      },
      price: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
    }],
    status: {
      type: String,
      default: "pending",
    },
    email: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: false,
    },

    expeditionAdresse:{
      type: String,
      required: false,
    },

    number: {
      type: Number,
      required: false,
    },
    initDate: { type: Date, default: Date.now() },

    emailStatus: {
      type: String,
      enum: ["sent", "failed"],
      required: false,
    },
    emailError: {
      type: String,
      required: false,
    },
  },

  { timestamps: true }
);

orderSchema.plugin(DiffPlugin);

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;
