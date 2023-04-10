import {
  addDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  doc,
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

export const Post = (props: Props) => {
  const { post } = props;
  const [user] = useAuthState(auth);

  const [likes, setLikes] = useState<Like[] | null>(null);

  const likesRef = collection(db, "likes");

  const likesDoc = query(likesRef, where("postId", "==", post.id));

  const getLikes = async () => {
    const data = await getDocs(likesDoc);
    setLikes(
      data.docs.map((doc) => ({ userId: doc.data().userId, likeId: doc.id }))
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

  const hasUserLiked = likes?.find((like) => like.userId === user?.uid);

  useEffect(() => {
    getLikes();
  }, []);

  return (
    <div className="justify-center">
      <div className="post">
        <p className="username">@{post.username}</p>
        <div className="title">
          <h1>{post.title}</h1>
        </div>
        <div className="body">
          <p> {post.description} </p>
          <div className="footer">
            <div className="reactions">
              <div className="reaction">
                {likes && <p>{likes?.length}</p>}
                <button
                  onClick={hasUserLiked ? removeLike : addLike}
                  className="like-btn"
                >
                  {hasUserLiked ? <>&#x1F920;</> : <>&#x1F636;</>}
                </button>
              </div>
              <div className="reaction">
                <p>*</p>
                <button className="like-btn">&#x1F92F;</button>
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
