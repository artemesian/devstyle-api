import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/size.model";
import axios from "axios";
import GoodieModel from "../models/goodie.model";
import { createGoodie, getAllGoodiesService } from "../services/goodie.service";
import CollectionModel from "../models/collection.model";
import fs from "fs";
const cloudinary = require("../cloudinary_config");

// upload goodie
export const uploadGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    let urls = [];
    try {
      const data = req.body;


      const collection = await CollectionModel.findOne({
        _id: data.fromCollection
      });
      const collectionSlug = collection?.slug;
      if (!collection) {
        res.status(500).json({
          message: "collection dont exist"
        });
      }

      data.slug = collectionSlug + "-" + data.slug;

      const images = data.images;
      if (images) {
        console.log("les image existe :", images);
        const uploadedImages = [];
        for (const image of images) {
          const myCloud = await uploader(image);
          uploadedImages.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url
          });
        }
        data.images = uploadedImages;
      }

      const results = await GoodieModel.create(data);

      res.status(201).json({
        success: true,
        message: data
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

const uploader = async (path: any) =>
  await cloudinary.uploads(path, `DevStyle/Goodies`, {
    transformation: [
      {
        overlay: "devstyle_watermark",
        opacity: 10,
        gravity: "north_west",
        x: 5,
        y: 5,
        width: "0.5"
      },
      {
        overlay: "devstyle_watermark",
        opacity: 6.5,
        gravity: "center",
        width: "1.0",
        angle: 45
      },
      {
        overlay: "devstyle_watermark",
        opacity: 10,
        gravity: "south_east",
        x: 5,
        y: 5,
        width: "0.5"
      }
    ]
  });

// edit goodie
export const editGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get single goodie --- without purchasing
export const getSingleGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodie = GoodieModel.findOne({ _id: req.params.id });
      res.status(200).json({
        success: true,
        message: goodie
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all goodies --- without purchasing
export const getAllGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodies = await GoodieModel.find();

      res.status(200).json({
        success: true,
        goodies
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all goodies --- only for admin
export const getAdminAllGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllGoodiesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete Course --- only for admin
export const deleteGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update Likes

export const updateLikes = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodie = await GoodieModel.findOneAndUpdate(
        { slug: req.params.slug },
        { $inc: { likes: 1 } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: goodie
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update Views

export const updateViews = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodie = await GoodieModel.findOneAndUpdate(
        { slug: req.params.slug },
        { $inc: { views: 1 } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: goodie
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get new goodies

export const getNewGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skipCount = parseInt(req.headers.skip as string, 10);
      const goodies = await GoodieModel.find()
        .skip(skipCount)
        .limit(4)
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        messge: goodies
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get hot goodies

export const getHotGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skipCount = parseInt(req.headers.skip as string, 10);

      const goodies = await GoodieModel.find()
        .skip(skipCount)
        .sort({ views: -1, likes: -1 })
        .limit(8);

      res.status(201).json({
        success: true,
        message: goodies
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
