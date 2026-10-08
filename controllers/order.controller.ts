import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";
import sendMail from "../utils/sendMail";
import { getAllOrdersService, newOrder } from "../services/order.service";
import { redis } from "../utils/redis";
import { IGoodie, IOrder } from "../lib/interfaces";
import GoodieModel from "../models/goodie.model";
import OrderModel from "../models/order.model";
import NotificationModel from "../models/notification.model";
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// create order
export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { goodies, name, email, number, city, district,expeditionAdresse,paymentMethod, status, initDate } =
        req.body as IOrder;

      const mailData = {
        order: {
          _id: Math.random() * 100000000,
          name: name,
          goodies: goodies,
          status: status,
          email: email,
          initDate: new Date().toLocaleDateString("in-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };

      const emailResult = await sendMail({
        email: mailData.order.email ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? "",
        subject: "Order confirmation",
        template: "order-confirmation.ejs",
        data: mailData,
      }).catch((error) => ({
        success: false,
        error: error?.message ?? String(error),
      }));

      if (!emailResult.success) {
        console.error(
          `[createOrder] order confirmation email failed for ${email}:`,
          emailResult.error
        );
      }

      const data = {
        name,
        goodies,
        email,
        city,
        district,
        expeditionAdresse,
        paymentMethod,
        number,
        status,
        initDate,
        emailStatus: emailResult.success ? "sent" : "failed",
        emailError: emailResult.success ? undefined : emailResult.error,
      };

      console.log("order i send to you", data);

      const newOrder = await OrderModel.create(data);

      await NotificationModel.create({
        user: data.name,
        title: `New Order of price ${data.goodies.reduce((acc, item) => acc + item.total, 0)} Fcfa`,
        message: `You have a new order from ${data.name} of ${data.goodies.length} goodies.`,
      });

      res.status(200).json({
        newOrder,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get All orders --- only for admin
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderModel.find().sort({ createdAt: -1 });

      res.status(200).json({
        message: orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete goodie --- only for admin
export const deleteOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const order = await OrderModel.findById(id);

      if (!order) {
        return next(new ErrorHandler("order not found", 404));
      }

      await order.deleteOne({ id });

      // await redis.del(id);

      res.status(200).json({
        message: "order deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// edit goodie
export const editOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const orderId = req.params.id;

      const orderData = await OrderModel.findById({ _id: orderId });

      const order = await OrderModel.findByIdAndUpdate(
        orderData,
        { $set: data },
        { new: true }
      );

      if (order) {
        const { _id, name, goodies, status, email, initDate } = order;

        const mailData = {
          order: {
            _id: _id,
            name: name,
            goodies: goodies,
            status: status,
            email: email,
            initDate: new Date().toLocaleDateString("in-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        };

        const emailResult = await sendMail({
          email: email,
          subject: "Order confirmation",
          template: "order-confirmation.ejs",
          data: mailData,
        }).catch((error) => ({
          success: false,
          error: error?.message ?? String(error),
        }));

        if (!emailResult.success) {
          console.error(
            `[editOrder] order confirmation email failed for ${email}:`,
            emailResult.error
          );
        }

        order.emailStatus = emailResult.success ? "sent" : "failed";
        order.emailError = emailResult.success ? undefined : emailResult.error;
        await order.save();
      }

      res.status(200).json({
        message: order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
