import {
  addDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  doc,
  endAt,
} from "firebase/firestore";
import { Post as IPost } from "./main";
import { auth, db } from "../../config/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState, useRef } from "react";
interface Props {
  post: IPost;
}

interface Like {
  likeId: string;
  userId: string;
}

interface Wow {
  wowId: string;
  userId: string;
}

interface Think {
  thinkId: string;
  userId: string;
}

interface Comment {
  commentId: string;
  userId: string;
  commentDesc: string;
  commentAuth: string | null;
}

export const Post = (props: Props) => {
  const { post } = props;
  const [user] = useAuthState(auth);

  const [likes, setLikes] = useState<Like[] | null>(null);
  const [wows, setWows] = useState<Wow[] | null>(null);
  const [thinks, setThinks] = useState<Think[] | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Grabs the full collection from firestore database
  const likesRef = collection(db, "likes");
  const wowsRef = collection(db, "wows");
  const thinksRef = collection(db, "thinks");
  const commentsRef = collection(db, "comments");

  // Queries the collection and grabs only those objects with the same post IDs
  const likesDoc = query(likesRef, where("postId", "==", post.id));
  const wowsDoc = query(wowsRef, where("postId", "==", post.id));
  const thinksDoc = query(thinksRef, where("postId", "==", post.id));
  const commentsDoc = query(commentsRef, where("postId", "==", post.id));

  // Await is used to pause functions execution until the getDocs function has fetched the data and stored is it 'data'
  // The setLikes useState function is then used to map through the fetched 'data', creating a new object for each one (userId & likeId)
  // The array of objects is now passed through the setLikes function, and therefor 'likes' now represents to new array
  const getLikes = async () => {
    const data = await getDocs(likesDoc);
    setLikes(
      data.docs.map((doc) => ({ userId: doc.data().userId, likeId: doc.id }))
    );
  };

  const getWows = async () => {
    const data = await getDocs(wowsDoc);
    setWows(
      data.docs.map((doc) => ({ userId: doc.data().userId, wowId: doc.id }))
    );
  };

  const getThinks = async () => {
    const data = await getDocs(thinksDoc);
    setThinks(
      data.docs.map((doc) => ({ userId: doc.data().userId, thinkId: doc.id }))
    );
  };

  const getComments = async () => {
    const data = await getDocs(commentsDoc);
    setComments(
      data.docs.map((doc) => ({
        userId: doc.data().userId,
        commentId: doc.id,
        commentDesc: doc.data().commentDesc,
        commentAuth: doc.data().commentAuth,
      }))
    );
  };

  // This function uses await to pause the execution until a newDoc is added with the userId and postId
  // This newDoc (users reaction such as 'likes' this post) is then added to the likes array with the setLikes useState function
  // Basically if there are already Docs (likes) in the array (prev = previous array content) it will add the newDocs together with the previous Docs
  // Otherwise it will just add the new Docs
  // Finally it will remove any other reaction as the user may until react in one way to each post
  const addLike = async () => {
    try {
      const newDoc = await addDoc(likesRef, {
        userId: user?.uid,
        postId: post.id,
      });
      if (user) {
        setLikes((prev) =>
          prev
            ? [...prev, { userId: user?.uid, likeId: newDoc.id }]
            : [{ userId: user.uid, likeId: newDoc.id }]
        );
      }
    } catch (err) {
      console.log(err);
    }
    removeWow();
    removeThink();
  };
  const addWow = async () => {
    try {
      const newDoc = await addDoc(wowsRef, {
        userId: user?.uid,
        postId: post.id,
      });
      if (user) {
        setWows((prev) =>
          prev
            ? [...prev, { userId: user?.uid, wowId: newDoc.id }]
            : [{ userId: user.uid, wowId: newDoc.id }]
        );
      }
    } catch (err) {
      console.log(err);
    }
    removeLike();
    removeThink();
  };

  const addThink = async () => {
    try {
      const newDoc = await addDoc(thinksRef, {
        userId: user?.uid,
        postId: post.id,
      });
      if (user) {
        setThinks((prev) =>
          prev
            ? [...prev, { userId: user?.uid, thinkId: newDoc.id }]
            : [{ userId: user?.uid, thinkId: newDoc.id }]
        );
      }
    } catch (err) {
      console.log(err);
    }
    removeLike();
    removeWow();
  };

  const addComment = async (commentDesc: string) => {
    setIsLoading(true);
    try {
      const newDoc = await addDoc(commentsRef, {
        userId: user?.uid,
        postId: post.id,
        commentDesc: commentInput,
        commentAuth: user?.displayName,
      });
      if (user) {
        setComments((prev) =>
          prev
            ? [
                ...prev,
                {
                  userId: user?.uid,
                  commentId: newDoc.id,
                  commentDesc: commentInput,
                  commentAuth: user?.displayName,
                },
              ]
            : [
                {
                  userId: user?.uid,
                  commentId: newDoc.id,
                  commentDesc: commentInput,
                  commentAuth: user?.displayName,
                },
              ]
        );
      }
      setCommentInput("");
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };

  // This first queries the collection of likes for the post in likesRef. Awaits the execution then stores the data in likeToDeleteData.
  // Stores the id of the specific like in the database as likeId. Matches the likeId to the speific like belonging to the user in the db (this is not likeToDelete)
  // deleteDoc then take the argument of likeToDelete, then using setLikes it gets the previous array of likes and returns only the likes that do NOT match the likeId
  // Therefor the like is not longer in the database and has been deleted.
  const removeLike = async () => {
    try {
      const liketoDeleteQuery = query(
        likesRef,
        where("postId", "==", post.id),
        where("userId", "==", user?.uid)
      );
      const likeToDeleteData = await getDocs(liketoDeleteQuery);
      const likeId = likeToDeleteData.docs[0].id;
      const likeToDelete = doc(db, "likes", likeId);
      await deleteDoc(likeToDelete);
      if (user) {
        setLikes(
          (prev) => prev && prev.filter((like) => like.likeId !== likeId)
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const removeWow = async () => {
    try {
      const wowToDeleteQuery = query(
        wowsRef,
        where("postId", "==", post.id),
        where("userId", "==", user?.uid)
      );
      const wowToDeleteData = await getDocs(wowToDeleteQuery);
      const wowId = wowToDeleteData.docs[0].id;
      const wowToDelete = doc(db, "wows", wowId);
      await deleteDoc(wowToDelete);
      if (user) {
        setWows((prev) => prev && prev.filter((wow) => wow.wowId !== wowId));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const removeThink = async () => {
    try {
      const thinkToDeleteQuery = query(
        thinksRef,
        where("postId", "==", post.id),
        where("userId", "==", user?.uid)
      );
      const thinkToDeleteData = await getDocs(thinkToDeleteQuery);
      const thinkId = thinkToDeleteData.docs[0].id;
      const thinkToDelete = doc(db, "thinks", thinkId);
      await deleteDoc(thinkToDelete);
      if (user) {
        setThinks(
          (prev) => prev && prev.filter((think) => think.thinkId !== thinkId)
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  const hasUserLiked = likes?.find((like) => like.userId === user?.uid);
  const hasUserWowed = wows?.find((wow) => wow.userId === user?.uid);
  const hasUserThinked = thinks?.find((think) => think.userId === user?.uid);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (commentInput.trim()) {
      addComment(commentInput);
    }
  };

  const userReaction = () => {
    if (hasUserLiked) {
      return <>&#x1F920;</>;
    } else if (hasUserWowed) {
      return <>&#x1F92F;</>;
    } else if (hasUserThinked) {
      return <>&#x1F914;</>;
    } else {
      return <>&#x1F636;</>;
    }
  };

  useEffect(() => {
    getLikes();
  }, []);

  useEffect(() => {
    getWows();
  }, []);

  useEffect(() => {
    getThinks();
  }, []);

  useEffect(() => {
    getComments();
  }, []);

  // const postContent = document.querySelector('.post-content');
  // const commentSection = document.querySelector('.comment-section') as HTMLElement;

  const bodyContentRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyContentRef.current && commentSectionRef.current) {
      const height = Math.max(
        bodyContentRef.current.scrollHeight,
        commentSectionRef.current.scrollHeight
      );
      commentSectionRef.current.style.height = height + "px";
    }
  }, []);

  return (
    <div className="body-content" ref={bodyContentRef}>
      <div className="post-content">
        <div className="header">
          <p className="username">@{post.username}</p>
          <p className="user-reaction">{userReaction()}</p>
        </div>
        <div className="banana">
          <h1 className="title">{post.title}</h1>
          <p className="post-description"> {post.description} </p>
        </div>
        <div className="body">
          <div className="footer">
            <div className="reactions">
              <div className="reaction">
                {likes && <p>{likes?.length}</p>}
                <button
                  onClick={hasUserLiked ? removeLike : addLike}
                  className="like-btn"
                >
                  &#x1F920;
                </button>
              </div>
              <div className="reaction">
                {thinks && <p>{thinks?.length}</p>}
                <button
                  onClick={hasUserThinked ? removeThink : addThink}
                  className="like-btn"
                >
                  &#x1F914;
                </button>
              </div>
              <div className="reaction">
                {wows && <p>{wows?.length}</p>}
                <button
                  onClick={hasUserWowed ? removeWow : addWow}
                  className="like-btn"
                >
                  &#x1F92F;
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="comment-section" ref={commentSectionRef}>
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            placeholder="Add a comment...."
            className="submit-comment"
            value={commentInput}
            onChange={handleChange}
          />
          <input
            type="submit"
            className="submit-comment-btn"
            value="&#x1F5E3;"
          />
        </form>
        <div className="comments-display">
          {comments &&
            comments.map((comment) => (
              <div key={comment.commentId} className="each-comment">
                <p>
                  @{comment.commentAuth}: {comment.commentDesc}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
