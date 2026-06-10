
import style from './PostsItem.module.css';
import { useNavigate } from 'react-router-dom';

function PostsItem({id,cover = "https://placehold.co/150x150",header = "header",nickname = "nickname",date = "01.01.2000",content = "Content",likes = 0,genre = "",type = "side",callback}){
    let PostsItemStyle = style.SidePostsItem;

    const navigate = useNavigate();

    const NavigatePost = () =>{
        navigate(`/Post/${id}`);
    }

        switch (type){
            case "side":
                PostsItemStyle = style.SidePostsItem;
                break;
            case "main":
                PostsItemStyle = style.MainPostsItem;
                break;
        }
        return(
                <li className={PostsItemStyle} onClick={NavigatePost}>
                <div className={style.PostsCoverContainer}>
                    <img className = {style.PostsCover} src={cover} alt="Обложка Релиза" />
                </div>
                <span className={style.PostsItemInfo}>
                    <h2 className={style.PostsItemHeader}>{header}</h2>
                    <h3>@{nickname} | {date} | Лайки: {likes} | Жанр: {genre}</h3>
                    <p className={style.PostsItemContent}>{content}</p>
                    
                    
                </span>
                </li>
            );    
}
export default PostsItem;