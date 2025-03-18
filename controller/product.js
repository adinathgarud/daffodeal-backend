const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();

const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const csv = require("csvtojson");
const { insertMany } = require("../model/user");

router.use(bodyParser.urlencoded({ extended: true }));
router.use(express.static(path.resolve(__dirname, "public")));

// Multer Storage Configuration
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads")); // Fixed path
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Added timestamp to prevent overwrites
  },
});

var upload = multer({ storage: storage });

// Route to Upload and Parse CSV
router.post(
  "/create-products",
  upload.single("file"),
  catchAsyncErrors(async (req, res) => {
    try {
      const shopId = req.body.shopId;
      // Validate shopId
      if (!shopId) {
        return res.status(400).json({
          success: false,
          message: "Shop ID is required",
        });
      }

      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: "Shop not found",
        });
      }
      let productData = []; // Corrected variable name


      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Convert CSV to JSON
      const jsonArray = await csv().fromFile(req.file.path);

      // Loop through CSV data and push into productData array
      jsonArray.forEach((item) => {
        productData.push({
          shopId: shopId, // Attach shop ID
          shop: shop,
          name: item.Name,
          description: item.Description,
          productDetail: item.ProductDetail,
          category: item.Category,
          color: item.Color,
          size: item.Size, // Fixed 'secure_urlize' typo
          tags: item.Tags,
          originalPrice: item.OriginalPrice,
          discountPrice: item.DiscountPrice,
          stock: item.Stock,
          images: item.Images.split(",").map((url, index) => ({
            public_id: `image-${index + 1}`, // Generate a placeholder public_id
            url: url.trim(), // Trim spaces to clean URLs
          })),
        });
      });

      await Product.insertMany(productData);

      console.log(productData); // Debugging output

      res.status(200).json({
        success: true,
        message: "CSV Imported Successfully",
        data: productData, // Return the corrected data array
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "CSV Processing Failed",
      });
    }
  })
);

// create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }


        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
          });

          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }

        const productData = req.body;
        productData.images = imagesLinks;
        productData.shop = shop;

        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product not found with this ID", 404));
      }

      // Delete all product images from Cloudinary
      // for (let i = 0; i < product.images.length; i++) {
      //   await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      // }

      // Remove product from the database
      await Product.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
module.exports = router;
