import {
    getPostById,
    toggleLike,
    getComments,
    createComment,
    deleteComment
} from "../api";
import { useEffect } from "react";
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Header/Header'
import Main from '../Main/Main'
import InfoArea from '../InfoArea/InfoArea'
import TextArea from '../TextArea/TextArea'
import style from './Post.module.css'
import Footer from '../Footer/Footer'
import MainButton from '../MainButton/MainButton'
import PostsItem from '../PostsItem/PostsItem'
import InputField from '../InputField/InputField'
import default_avatar from "../assets/default_avatar.svg";


function Post() {
  //COMMENTS
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  async function handleComment() {
    if (!commentText.trim()) return;

    try {
        await createComment(post.id, commentText);

        const commentsData = await getComments(post.id);

        setComments(commentsData);
        setCommentText("");
    } catch (error) {
        console.error(error);
    }
  }
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );
  async function handleDeleteComment(commentId) {
      try {
          await deleteComment(commentId);

          setComments((prev) =>
              prev.filter((comment) => comment.id !== commentId)
          );
      } catch (error) {
          console.error(error);
      }
  }
  //LIKE
  async function handleLike() {
    try {
        const result = await toggleLike(post.id);

        setPost((prev) => ({
            ...prev,
            likes_count: result.likes_count,
        }));
    } catch (error) {
        console.error(error);
    }
  }

    const navigate = useNavigate();
    const { id } = useParams();

    const [post, setPost] = useState(null);

    useEffect(() => {
    async function loadPost() {
        try {
            const data = await getPostById(id);

            console.log("POST:", data);

            setPost(data);
            const commentsData = await getComments(id);
            setComments(commentsData);
        } catch (error) {
            console.error(error);
        }
    }

    loadPost();
}, [id]);

    if (!post) {
        return <div>Загрузка...</div>;
    }

    const NavigateUser = () => {
        navigate(`/User/${post.author_id}`);
    };
  
  return (
    <>
    <Header/>
    <Main>
      <div className={style.HeaderContent}>
          <div className={style.HeaderInfo}>
            <TextArea className={style.PostHeader}>
              {post.title}
            </TextArea>
            <p className={style.PostDateAndUser}>{new Date(post.created_at).toLocaleDateString("ru-RU")} | Жанр: {post.genre}</p>
            

            <TextArea onClick={NavigateUser} className={style.PostUser}>
            <img src={post.avatar_url ? `http://localhost:8000${post.avatar_url}` : default_avatar } alt="" className={style.PostUserPfp}/>
              <div className={style.PostUserText}>
                <p className={style.PostHeader}>
                 {post.display_name}
                </p>

                <p className={style.PostDateAndUser}>
                  @{post.username}
                </p>
              </div>
            </TextArea>
          </div>
        
        <img
    src={`http://localhost:8000${post.image_path}`} alt="" className={style.PostImage}/>
        
        
      </div>
      <div className={style.PostContent}>
          <TextArea className={style.PostText}>
           {post.content}
          </TextArea>
      </div>
      <div className={style.likeButton}>
        <MainButton text="🖤" type="main" callback={handleLike}/>
        <TextArea> <h2>{post.likes_count}</h2></TextArea>
      </div>
      <InfoArea label={`Комментарии: ${comments.length}`}>
        <div className={style.postComment}>
          <InputField
              placeholder="Комментарий"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
          />
          <MainButton
              text="Отправить"
              type="main"
              callback={handleComment}
          />
        </div>
        {comments.map((comment) => (
          <div
              key={comment.id}
              className={style.commentWrapper}
              onClick={() => navigate(`/User/${comment.author_id}`)}
          >
              <div className={style.commentContainer}>
                  <img
                      src={
                          comment.author_avatar
                              ? `http://localhost:8000${comment.author_avatar}`
                              : default_avatar
                      }
                      alt=""
                      className={style.commentPfp}
                  />

                  <div className={style.commentText}>
                      <h2>{comment.author}</h2>
                      <h3>
                          {new Date(comment.created_at)
                              .toLocaleDateString("ru-RU")}
                      </h3>

                      <p>{comment.content}</p>

                      {Number(comment.author_id) === Number(currentUser.id) && (
                        <button
                            onClick={() =>
                                handleDeleteComment(comment.id)
                            }
                        >
                            Удалить
                        </button>
                      )}
                  </div>
              </div>
          </div>
      ))}
        
      </InfoArea>
    </Main>
    <Footer/>
    </>
  );
}

export default Post;
