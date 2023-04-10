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
import { useEffect, useState } from "react";
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

export const Post = (props: Props) => {
  const { post } = props;
  const [user] = useAuthState(auth);

  const [likes, setLikes] = useState<Like[] | null>(null);
  const [wows, setWows] = useState<Wow[] | null>(null);

  const likesRef = collection(db, "likes");
  const wowsRef = collection(db, "wows");

  const likesDoc = query(likesRef, where("postId", "==", post.id));
  const wowsDoc = query(wowsRef, where("postId", "==", post.id));

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
  };

  const removeLike = async () => {
    try {
      const liketoDeleteQuery = query(
        likesRef,
        where("postId", "==", post.id),
        where("userId", "==", user?.uid)
      );
      const likeToDeleteData = await getDocs(liketoDeleteQuery);
      const likeId = likeToDeleteData.docs[0].id;
      const liketoDelete = doc(db, "likes", likeId);
      await deleteDoc(liketoDelete);
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
      const wowtoDeleteQuery = query(
        wowsRef,
        where("postId", "==", post.id),
        where("userId", "==", user?.uid)
      );
      const wowToDeleteData = await getDocs(wowtoDeleteQuery);
      const wowId = wowToDeleteData.docs[0].id;
      const wowtoDelete = doc(db, "wows", wowId);
      await deleteDoc(wowtoDelete);
      if (user) {
        setWows((prev) => prev && prev.filter((wow) => wow.wowId !== wowId));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const hasUserLiked = likes?.find((like) => like.userId === user?.uid);
  const hasUserWowed = wows?.find((wow) => wow.userId === user?.uid);

  const userReaction = () => {
    if (hasUserLiked) {
      return <>&#x1F920;</>;
    } else if (hasUserWowed) {
      return <>&#x1F92F;</>;
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


  return (
    <div className="justify-center">
      <div className="post">
        <div className="header">
          <p className="username">@{post.username}</p>
          <p className="user-reaction">{userReaction()}</p>
        </div>
        <div className="title">
          <h1>{post.title}</h1>
        </div>
        <div className="body">
          <div className="justify-center">
            <p className="post-description"> {post.description} </p>
          </div>
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
                {wows && <p>{wows?.length}</p>}
                <button
                  onClick={hasUserWowed ? removeWow : addWow}
                  className="like-btn"
                >
                  &#x1F92F;
                </button>
              </div>
            </div>
            <div className="comment">
              <input
                className="submit-comment"
                placeholder="Add a comment...."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
