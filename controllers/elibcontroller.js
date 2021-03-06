require("dotenv").config();
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const ebookDatas = require("../model/ebookModel");

// Storing the data in web server
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "../client", "src", "assets", "data"));
   },
   filename: (req, file, cb) => {
      cb(null, file.originalname);
   },
});

// File filtering
const filter = (req, file, cb) => {
   const vaildFileType = /jpg|png|jpeg|pdf/;
   const mimetype = vaildFileType.test(file.mimetype);
   mimetype ? cb(null, true) : cb(null, false);
};

// Upload the files
const uploadFile = multer({
   storage,
   fileFilter: filter,
}).array("files", 2);

// ====================================================================================
// Fetch Ebooks (Get all ebooks, searchs ebook by category, search ebooks by input name)
// ====================================================================================
exports.fetchEbooks = (req, res) => {
   // Set category name for return to client
   const searchedCategory = req.params.searched_category;
   let searchedParams;
   // Set category name to convert short-term
   let categoryName = req.params.searched_category;
   // Set type
   const type = req.params.type;
   let totalEbooks;
   const ebooksPerPage = 12;
   let page = +req.query._page || 1;
   /* Search Ebook by input name, /ebooks/search?_q='string' */
   const _q = req.query._q;

   // Convert categoryName to short-term
   switch (categoryName) {
      case "civil":
         categoryName = "civil";
         break;
      case "electronic":
         categoryName = "ec";
         break;
      case "electrical-power":
         categoryName = "ep";
         break;
      case "mechnical":
         categoryName = "mech";
         break;
      case "information-technology":
         categoryName = "it";
         break;
      default:
         break;
   }

   /* type is not null
   then searchedParams === type
   else searchedParams === categoryName(short-term) */
   type !== "null" ? (searchedParams = type) : (searchedParams = categoryName);

   // Search Ebooks by Category
   if (searchedParams) {
      ebookDatas
         .find({ tags: { $in: [searchedParams] } })
         .countDocuments()
         .then((count) => {
            totalEbooks = count;
            return ebookDatas
               .find({ tags: { $in: [searchedParams] } })
               .sort({ _id: -1 })
               .skip((page - 1) * ebooksPerPage)
               .limit(ebooksPerPage);
         })
         .then((ebooks) => {
            // Retrieve specific tags from database
            let tags = [];
            ebookDatas.find({ tags: { $in: [categoryName] } }).then((books) => {
               books.forEach((book) => {
                  book.tags.forEach((bookTag) => {
                     tags.includes(bookTag) ? null : tags.push(bookTag);
                  });
               });
               // For Pagination
               const pagination = {
                  hasNextPage: totalEbooks > ebooksPerPage * page,
                  hasPreviousPage: page >= 2,
                  nextPage: page + 1,
                  previousPage: page - 1,
                  currentPage: page,
                  lastPage: Math.ceil(totalEbooks / ebooksPerPage),
               };
               return res.status(200).json({
                  tags: tags,
                  categoryName: searchedCategory,
                  ebook_datas: ebooks,
                  pagination,
               });
            });
         })
         .catch((err) => res.status(400).json({ errMsg: err }));
   }
   // Search Ebook By Input Name
   if (_q) {
      const splitQuery = _q.split("-");
      const query = splitQuery.join(" ").toLowerCase();
      let searchedResult = [];
      const pattern = new RegExp(query + "+");
      ebookDatas
         .find()
         .sort({ _id: -1 })
         .then((ebooks) => {
            ebooks.map((ebook) => {
               if (pattern.test(ebook.bookName.toLowerCase())) {
                  searchedResult.push(ebook);
               } else {
                  ebook.tags.includes(query)
                     ? searchedResult.push(ebook)
                     : null;
               }
            });
            return res.status(200).json({ ebook_datas: searchedResult });
         })
         .catch((err) => {
            res.status(400).json({ errMsg: err });
         });
   }
   // Get All Ebooks
   if (!searchedParams && !_q) {
      ebookDatas
         .find()
         .countDocuments()
         .then((count) => {
            totalEbooks = count;
            return ebookDatas
               .find()
               .sort({ _id: -1 })
               .skip((page - 1) * ebooksPerPage)
               .limit(ebooksPerPage);
         })
         .then((ebooks) => {
            const pagination = {
               hasNextPage: totalEbooks > ebooksPerPage * page,
               hasPreviousPage: page >= 2,
               nextPage: page + 1,
               previousPage: page - 1,
               currentPage: page,
               lastPage: Math.ceil(totalEbooks / ebooksPerPage),
            };
            return res.status(200).json({
               ebook_datas: ebooks,
               pagination,
            });
         })
         .catch((err) => {
            console.log(err);
            return res.status(400).json({ errMsg: err });
         });
   }
};

// ============
// Add Ebooks
// ============
exports.addEbooks = (req, res) => {
   // Check Uploaded book is existing or not by bookname
   const bookName = req.body.bookName;
   ebookDatas.findOne({ bookName }).then((book) => {
      // If book found, return err msg
      if (book) {
         return res.status(400).json({ errMsg: "This book is existing" });
      }
   });
   // If incoming book is not existing
   // Add ebook
   uploadFile(req, res, (err) => {
      if (err) {
         if (err.code === "NetworkingError") {
            return res.status(400).json({ errMsg: "Network is required." });
         }
         console.log("_error : ", err);
         return res.status(err.statusCode).json({ errMsg: err.message });
      }
      const bookName = req.body.bookName;
      const author = req.body.author;
      const reqTags = req.body.tags.split(" ");
      const tags = reqTags.map((tag) => tag.toLowerCase());
      const releasedYear = req.body.releasedYear;
      const pages = req.body.pages;
      const description = req.body.description;
      const paid = req.body.paid;
      const fileSize = (req.files[1].size / 1000000).toFixed(1);
      let category;
      // Check the category of book
      const categories = ["civil", "ec", "ep", "mp", "it"];
      tags.forEach((tag) => {
         categories.includes(tag) ? (category = tag) : null;
      });

      const dataSummary = {
         bookName,
         author,
         tags,
         releasedYear,
         pages,
         fileSize,
         paid,
         category,
         description,
         bookCoverName: req.files[0].filename,
         pdfName: req.files[1].filename,
      };
      new ebookDatas(dataSummary)
         .save()
         .then((ebookData) => {
            return res.status(200).json({ data: ebookData });
         })
         .catch((err) => {
            console.log(err);
            return res
               .status(500)
               .json({ msg: "Can't add data to DB", errMsg: err });
         });
   });
};

// ============
// Delete Ebook
// ============
exports.deleteEbook = (req, res) => {
   const bookId = req.params.bookId;
   const bookCoverName = req.params.bookCoverName;
   const pdfName = req.params.pdfName;
   const filePath = path.resolve(
      __dirname,
      "../client",
      "src",
      "assets",
      "data"
   );
   ebookDatas
      .deleteOne({ _id: bookId })
      .then(() => {
         try {
            fs.unlinkSync(`${filePath}/${bookCoverName}`);
            fs.unlinkSync(`${filePath}/${pdfName}`);
         } catch (error) {
            console.log(error);
         }
         res.status(200).json({ message: "success" });
      })
      .catch((err) => res.status(400).json({ errMsg: err }));
};

// ===================
// Get Detail Of Ebook
// ===================
exports.getDetailOfEbook = (req, res) => {
   const book_id = req.params.book_id;
   let possibleBookTypes = ["civil", "ec", "ep", "mech", "it"];
   let bookType;
   let remainTags = [];
   let suggestionBooks = [];
   ebookDatas
      .findById(book_id)
      .then((ebook) => {
         // If not found ebook
         if (ebook === null) {
            return res.status(404).json({ errMsg: "We can't find this book" });
         }
         // Check the book type
         possibleBookTypes.forEach((posBookType) => {
            ebook.tags.includes(posBookType) ? (bookType = posBookType) : "";
         });
         // set the tags except the booktype
         remainTags = ebook.tags.filter((tag) => tag !== bookType);
         // Retrieve the book with remain tags
         ebookDatas
            .find({ tags: { $in: remainTags } })
            .sort({ _id: -1 })
            .limit(6)
            .then((resultBooks) => {
               suggestionBooks = resultBooks.filter(
                  (resultBook) => resultBook._id.toString() !== book_id
               );
               return res
                  .status(200)
                  .json({ ebook: ebook, suggestionBooks: suggestionBooks });
            });
      })
      .catch((err) => {
         console.log(err);
         return res.status(404).json({ errMsg: "We can't find this book" });
      });
};
