import React from "react";
import "./Feedback.css";
import Modal from "../UI/Modal/Modal";
import Backdrop from "../UI/Backdrop/Backdrop";

const Feedback = (props) => {
   return (
      <div>
         <Backdrop showed={props.showed} clicked={props.cancalFeedback} />
         <Modal showed={props.showed}>
            <div className="FeedBack">
               <p>Feedback : </p>
               <textarea
                  placeholder="Feedback"
                  onChange={props.feedbackChange}
               ></textarea>
               <div className="FeedBack__BtnGroup">
                  <button onClick={props.cancalFeedback}>Cancle</button>
                  <button onClick={props.submitFeedback}>Submit</button>
               </div>
            </div>
         </Modal>
      </div>
   );
};

export default Feedback;
