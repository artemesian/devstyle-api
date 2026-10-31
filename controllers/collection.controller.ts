import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinaryUpload from "../cloudinary_config";
import CollectionModel from "../models/collection.model";
import GoodieModel from "../models/goodie.model";
import { ICloudinaryUploadResponse, ICollection } from "../lib/interfaces";

export const createCollection = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: ICollection = req.body;

      const image = data.image;

      if (image) {
        const myCloud: ICloudinaryUploadResponse = (await cloudinaryUpload(
          image,
          {
            folder: "DevStyle/Collections"
          }
        )) as ICloudinaryUploadResponse;

        data.image = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url
        };
      }

      const results = await CollectionModel.create(data);

      res.status(200).json({
        message: results
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
export const getAllCollections = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const results = await CollectionModel.find({ show: true });

    res.status(200).json({
      message: results
    });

    try {
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
export const getOneCollection = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await CollectionModel.findOne({
        slug: req.params.slug,
        show: true
      });

      res.status(200).json({
        message: results
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
export const getOneCollectionAndGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const collection = await CollectionModel.findOne({
        slug: req.params.slug,
        show: true
      });

      const goodies = await GoodieModel.find({
        fromCollection: collection?._id,
        show: true
      })
        .populate("fromCollection")
        .populate("sizes");

      res.status(200).json({
        message: {
          collection,
          goodies
        }
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
export const updateOneCollection = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await CollectionModel.findOneAndUpdate(
        { slug: req.params.slug },
        { ...req.body },
        { new: true }
      );

      res.status(200).json({
        message: results
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
export const deleteOneCollection = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const results = await CollectionModel.deleteOne({ slug: req.params.slug });

    res.status(200).json({
      message: results
    });

    try {
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update Views

export const updateViews = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const collection = await CollectionModel.findOneAndUpdate(
        { slug: req.params.slug },
        { $inc: { views: 1 } },
        { new: true }
      );

      res.status(200).json({
        message: collection
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
