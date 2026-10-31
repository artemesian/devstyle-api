import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinaryUpload from "../cloudinary_config";
import GoodieModel from "../models/goodie.model";
import { getAllGoodiesService } from "../services/goodie.service";
import CollectionModel from "../models/collection.model";
import mongoose from "mongoose";
import { ICloudinaryUploadResponse, IGoodie } from "../lib/interfaces";
const cloudinary = require("../cloudinary_config");

// upload goodie
export const uploadGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: IGoodie = req.body;

      console.log("data", data);

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
        console.log("les image existe :", images);
        const uploadedImages = [];
        for (const image of images) {
          const myCloud: ICloudinaryUploadResponse = (await uploader(
            image,
          )) as ICloudinaryUploadResponse;

          uploadedImages.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          });
        }
        data.mainImage = uploadedImages[0];
        data.images = uploadedImages;
        data.mainImage = uploadedImages[0];
      }

      const results = await GoodieModel.create(data);

      res.status(200).json({
        message: data,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
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
        width: "0.4",
      },
      {
        overlay: "devstyle_watermark",
        opacity: 4.5,
        gravity: "center",
        width: "0.5",
        angle: 45,
      },
      {
        overlay: "devstyle_watermark",
        opacity: 10,
        gravity: "south_east",
        x: 5,
        y: 5,
        width: "0.4",
      },
    ],
  });

// edit goodie
export const editGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      console.log("data", data);
      const images = data.images;
      console.log("images", images);
      const goodieId = req.params.id;

      const goodieData = await GoodieModel.findById({ _id: goodieId });

      // if (images && images[0] instanceof String) {
      //   const uploadedImages = [];
      //   for (const image of images) {
      //     const myCloud: ICloudinaryUploadResponse = (await uploader(
      //       image
      //     )) as ICloudinaryUploadResponse;

      //     uploadedImages.push({
      //       public_id: myCloud.public_id,
      //       url: myCloud.secure_url,
      //     });
      //   }
      //   data.images = uploadedImages;
      //   data.mainImage = uploadedImages[0];
      // }

      if (images) {
        console.log("les image existe :", images);
        const uploadedImages = [];
        for (const image of images) {
          const myCloud: ICloudinaryUploadResponse = (await uploader(
            image,
          )) as ICloudinaryUploadResponse;

          uploadedImages.push({
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          });
        }
        data.images = uploadedImages;
        data.mainImage = uploadedImages[0];
      }

      const goodie = await GoodieModel.findByIdAndUpdate(
        goodieId,
        { $set: data },
        { new: true },
      );

      res.status(200).json({
        message: goodie,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get single goodie --- without
export const getSingleGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodie = await GoodieModel.findOne({ slug: req.params.slug })
        .populate("fromCollection")
        .populate("sizes");

      res.status(200).json({
        message: goodie,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get all goodies --- without
export const getAllGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodies = await GoodieModel.find({ show: true })
        .populate("fromCollection")
        .populate("sizes");
      // sort by alphabetical order
      goodies.sort((a, b) => a.name.localeCompare(b.name));
      
      res.status(200).json({
        message: goodies,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get search all goodies

export const getSearchAllGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodies = await GoodieModel.find({ show: true })
        .populate("fromCollection")
        .populate("sizes");

      res.status(200).json({
        message: goodies,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// get all goodies --- only for admin
export const getAdminAllGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllGoodiesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Delete goodie --- only for admin
export const deleteGoodie = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const goodie = await GoodieModel.findById(id);

      if (!goodie) {
        return next(new ErrorHandler("goodie not found", 404));
      }

      await goodie.deleteOne({ id });

      // await redis.del(id);

      res.status(200).json({
        message: "goodie deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// update Likes

export const updateLikes = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodie = await GoodieModel.findOneAndUpdate(
        { slug: req.params.slug },
        { $inc: { likes: 1 } },
        { new: true },
      );

      res.status(200).json({
        message: goodie,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// update Views

export const updateViews = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodie = await GoodieModel.findOneAndUpdate(
        { slug: req.params.slug },
        { $inc: { views: 1 } },
        { new: true },
      );

      res.status(200).json({
        message: goodie,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// get new goodies

export const getNewGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skipCount = parseInt(req.headers.skip as string, 10);
      const goodies = await GoodieModel.find({ show: true })
        .populate("fromCollection")
        .populate("sizes")
        .skip(skipCount)
        .limit(4)
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: goodies,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// get hot goodies

export const getHotGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skipCount = parseInt(req.headers.skip as string, 10);

      const goodies = await GoodieModel.find({ show: true })
        .populate("fromCollection")
        .populate("sizes")
        .skip(skipCount)
        .sort({ views: -1, likes: -1 })
        .limit(8);

      res.status(200).json({
        message: goodies,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// get hot goodies of a collection

export const getHotGoodiesOfCollection = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const goodies = await GoodieModel.aggregate([
        {
          $match: {
            fromCollection: new mongoose.Types.ObjectId(
              req.params.collectionID,
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
  },
);


export const resetGoodies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await GoodieModel.updateMany({}, { views: 0, likes: 0 });
      res.status(200).json({
        message: "Goodies views and likes reset to zero",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);


export const applyCollectionDiscount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { collectionID, discountPercentage } = req.params;

      await GoodieModel.updateMany(
        { fromCollection: new mongoose.Types.ObjectId(collectionID) },
        [
          {
            $set: {
              inPromo: true,
              promoPercentage: parseFloat(discountPercentage),
            }
          }
        ]
      );

      res.status(200).json({
        message: `Applied ${discountPercentage}% discount to all goodies in collection ${collectionID}`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const disableCollectionDiscount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { collectionID } = req.params;

      await GoodieModel.updateMany(
        { fromCollection: new mongoose.Types.ObjectId(collectionID) },
        [
          {
            $set: {
              inPromo: false,
              promoPercentage: 0,
            }
          }
        ]
      );

      res.status(200).json({
        message: `Disabled discount for all goodies in collection ${collectionID}`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

