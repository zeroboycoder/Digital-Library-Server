import React, { Component } from "react";
import { connect } from "react-redux";
import "./EbookDetail.css";
import * as actions from "../../store/action/rootActions";
import SearchEbookByInputName from "../../components/SearchEbookByInputName/SearchEbookByInputName";
import SuggestionBook from "../../components/SuggestionBook/SuggestionBook";
import CommentBox from "../../components/Comment/CommentBox/CommentBox";
import { checkValidation } from "../../util/helper";
import Spinner from "../../components/UI/Spinner/Spinner";

class EbookDetail extends Component {
   state = {
      params: null,
      comments: [],
      commentForm: {
         email: {
            validation: {
               isRequired: true,
               isEmail: true,
            },
            value: "",
            isValid: false,
            errMsg: "Email isn't valid.",
         },
         comment: {
            validation: {
               isRequired: true,
            },
            value: "",
            isValid: false,
            errMsg: "Comment is required.",
         },
      },
   };

   componentDidMount() {
      const book_id = this.props.match.params.book_id;
      this.setState({ params: this.props.history.location.pathname });
      this.props.onFetchDetailOfEbook(book_id);
   }

   componentDidUpdate() {
      const newParms = this.props.history.location.pathname;
      if (this.state.params !== newParms) {
         const book_id = this.props.match.params.book_id;
         this.setState({ params: newParms });
         this.props.onFetchDetailOfEbook(book_id);
         return true;
      } else {
         return false;
      }
   }

   inputChangeHandler = (event, key) => {
      const value = event.target.value;
      const updateCommentForm = { ...this.state.commentForm };
      updateCommentForm[key].value = value;
      updateCommentForm[key].isTouch = true;
      updateCommentForm[key].isValid = checkValidation(
         value,
         updateCommentForm[key].validation
      );
      this.setState({ commentForm: updateCommentForm });
   };

   formSubmitHandler = (event) => {
      event.preventDefault();
      const book_id = this.props.detail_of_ebook._id;
      const data = {
         email: this.state.commentForm.email.value,
         comment: this.state.commentForm.comment.value,
      };
      const updateCommentForm = this.state.commentForm;
      updateCommentForm.email.value = "";
      updateCommentForm.comment.value = "";
      this.props.onAddComment(book_id, data);
      this.setState({ commentForm: updateCommentForm });
   };

   render() {
      let ebookDetail = null;
      // Whether Show Spinner or Result page by checking loading
      if (this.props.loading) {
         ebookDetail = <Spinner />;
      } else {
         // if not loading
         // then check detail of ebook
         if (this.props.detail_of_ebook) {
            const bookInfo = (
               <div className="row BookInfo">
                  <div className="col col-12 col-md-4 BookInfo__BookCover">
                     <img
                        src={require(`../../assets/data/${this.props.detail_of_ebook.bookCoverName}`)}
                        alt={this.props.detail_of_ebook.bookName}
                     />
                  </div>
                  <div className="col col-12 col-md-8 BookInfo__Info">
                     <h1>{this.props.detail_of_ebook.bookName}</h1>
                     <p className="BookInfo__Info__ReleasedYear">
                        Release Year: {this.props.detail_of_ebook.releasedYear}
                     </p>
                     <p>Author: {this.props.detail_of_ebook.author}</p>
                     <p>File Size: {this.props.detail_of_ebook.fileSize} MB</p>
                     <p>
                        Page Number: {this.props.detail_of_ebook.pages} Pages
                     </p>
                     <p className="BookInfo__Info__Desc">
                        {this.props.detail_of_ebook.description}
                     </p>
                     {this.props.token ? (
                        <div className="BookInfo__Info__Btn">
                           {this.props.token && (
                              <button
                                 className="BookInfo__Info__Btn__Delete"
                                 onClick={() =>
                                    this.props.onDeleteEbook(
                                       this.props.detail_of_ebook._id,
                                       this.props.detail_of_ebook.bookCoverName,
                                       this.props.detail_of_ebook.pdfName,
                                       this.props
                                    )
                                 }
                              >
                                 <i className="fas fa-trash"></i>Delete
                              </button>
                           )}
                           <a
                              href={require(`../../assets/data/${this.props.detail_of_ebook.pdfName}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                           >
                              <button className="BookInfo__Info__Btn__Download">
                                 <i className="fas fa-book-open"></i>
                                 Read
                              </button>
                           </a>
                        </div>
                     ) : (
                        <p
                           className="text-danger text-center"
                           style={{ textDecoration: "underline" }}
                        >
                           This book is paid book. You have to log in as TUMLM
                           student to read.
                        </p>
                     )}
                  </div>
               </div>
            );

            // Suggestion
            let suggestions = [];
            if (this.props.suggestionBooks.length <= 0) {
               suggestions.push(
                  <h2 key="NoSugBook">No suggestion books yet.</h2>
               );
            } else {
               suggestions.push(
                  this.props.suggestionBooks.map((suggestionBook) => {
                     return (
                        <SuggestionBook
                           key={suggestionBook._id}
                           {...suggestionBook}
                        />
                     );
                  })
               );
            }

            // comment
            const showComment = this.props.comments.map((commentObj) => {
               const emailArr = commentObj.email.split("@");
               return (
                  <div
                     className="EbookDetail__Comment__ShowComment"
                     key={commentObj._id}
                  >
                     <div>
                        <i className="fas fa-user-circle"></i>
                     </div>
                     <div>
                        <p className="EbookDetail__Comment__ShowComment__Email">
                           {emailArr[0]}
                           {this.props.token && <span>@{emailArr[1]}</span>}
                        </p>
                        <p className="EbookDetail__Comment__ShowComment__Comment">
                           {commentObj.comment}
                        </p>
                     </div>
                  </div>
               );
            });

            ebookDetail = (
               <div className="EbookDetail">
                  {/* Search Bar */}
                  <div className="SearchEbookByInputNameBox">
                     <SearchEbookByInputName history={this.props.history} />
                  </div>
                  <hr className="Tag__hr" />
                  {/* Book info */}
                  {bookInfo}
                  {/* Suggestion book */}
                  <div className="EbookDetail__Suggestion__Section">
                     <div className="EbookDetail__Suggestions">
                        <h1>Suggestions</h1>
                        <div className="EbookDetail__Suggestions__Books">
                           {suggestions}
                        </div>
                     </div>
                  </div>
                  {/* Comment */}
                  <div className="EbookDetail__Comment">
                     <div className="EbookDetail__Comment__Title">
                        <h1>Comments</h1>
                     </div>
                     <CommentBox
                        commentForm={this.state.commentForm}
                        changedEmail={(e) =>
                           this.inputChangeHandler(e, "email")
                        }
                        changedComment={(e) =>
                           this.inputChangeHandler(e, "comment")
                        }
                        formSubmitted={this.formSubmitHandler}
                     />
                     {showComment}
                  </div>
               </div>
            );
         }
      }
      return ebookDetail;
   }
}

const stateToProps = (state) => {
   return {
      detail_of_ebook: state.ebook.detail_of_ebook,
      suggestionBooks: state.ebook.suggestionBooks,
      loading: state.ebook.loading,
      comments: state.ebook.comments,
      token: state.auth.token,
      role: state.auth.role,
   };
};

const dispatchToProps = (dispatch) => {
   return {
      onFetchDetailOfEbook: (book_id) =>
         dispatch(actions.onFetchDetailOfEbook(book_id)),
      onAddComment: (book_id, data) =>
         dispatch(actions.onAddComment(book_id, data)),
      onDeleteEbook: (book_id, bookCoverName, pdfName, props) =>
         dispatch(
            actions.onDeleteEbook(book_id, bookCoverName, pdfName, props)
         ),
   };
};

export default connect(stateToProps, dispatchToProps)(EbookDetail);
