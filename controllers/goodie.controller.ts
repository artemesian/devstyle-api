import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinaryUpload from "../cloudinary_config";
import GoodieModel from "../models/goodie.model";
import { getAllGoodiesService } from "../services/goodie.service";
import CollectionModel from "../models/collection.model";
import { IGoodie } from "../lib/interfaces";
import mongoose from "mongoose";

// upload goodie
export const uploadGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: IGoodie = req.body;

      // data.availableColors = JSON.parse(req.body.availableColors);
      // data.backgroundColors = JSON.parse(req.body.backgroundColors);
      // data.size = JSON.parse(req.body.size);

      const collection = await CollectionModel.findOne({
        _id: data.fromCollection,
      });
      const collectionSlug = collection?.slug;
      if (!collection) {
        res.status(500).json({
          message: "collection dont exist",
        });
      }

      data.slug = collectionSlug + "-" + data.slug;

      const images = data.images;

      if (images) {
        const uploadedImages = [];

        for (const imageUrl of images) {
          const myCloud = (await uploader(imageUrl)) as {
            public_id: string;
            url: string;
            secure_url: string;
          };

          uploadedImages.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          });
        }

        data.images = uploadedImages;
      }

      const results = await GoodieModel.create(data);

      res.status(200).json({
        message: results,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

const uploader = async (path: any) =>
  await cloudinaryUpload(path, `DevStyle/Goodies`, {
    transformation: [
      {
        overlay: "devstyle_watermark",
        opacity: 10,
        gravity: "north_west",
        x: 5,
        y: 5,
        width: "0.5",
      },
      {
        overlay: "devstyle_watermark",
        opacity: 6.5,
        gravity: "center",
        width: "1.0",
        angle: 45,
      },
      {
        overlay: "devstyle_watermark",
        opacity: 10,
        gravity: "south_east",
        x: 5,
        y: 5,
        width: "0.5",
      },
    ],
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

// get single goodie --- without
export const getSingleGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodie = await GoodieModel.findOne({ slug: req.params.slug })
        .populate("fromCollection")
        .populate("size");

      res.status(200).json({
        message: goodie,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all goodies --- without
export const getAllGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodies = await GoodieModel.find({ show: true });

      res.status(200).json({
        message: goodies,
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

// Delete goodie --- only for admin
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
        message: goodie,
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
        message: goodie,
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
      const goodies = await GoodieModel.find({ show: true })
        .skip(skipCount)
        .limit(4)
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: goodies,
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

      const goodies = await GoodieModel.find({ show: true })
        .skip(skipCount)
        .sort({ views: -1, likes: -1 })
        .limit(8);

      res.status(200).json({
        message: goodies,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get hot goodies of a collection

export const getHotGoodiesOfCollection = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skipCount = parseInt(req.headers.skip as string, 10);

      const goodies = await GoodieModel.aggregate([
        {
          $match: {
            fromCollection: new mongoose.Types.ObjectId(
              req.params.collectionID
            ),
            show: true,
            _id: { $ne: new mongoose.Types.ObjectId(req.params.goodieID) },
          },
        },
        { $sample: { size: 4 } },
      ]);

      res.status(200).json({
        message: goodies,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
