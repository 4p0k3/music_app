import style from './PostsItem.module.css';
import { useNavigate } from 'react-router-dom';

function PostsItem({cover="https://placehold.co/150x200", header="header", nickname="nickname", date="01.01.2000", content="Content", type = "side"}){
    let PostsItemCover=cover;
    let PostsItemHeader=header;
    let PostsItemNickname=nickname;
    let PostsItemDate=date;
    let PostsItemContent=content;
    let PostsItemStyle = style.SidePostsItem;

    const navigate = useNavigate();

    const NavigatePost = () =>{
        navigate("/Post")
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
                    <img className = {style.PostsCover} src={PostsItemCover} alt="Обложка Релиза" />
                </div>
                <span className={style.PostsItemInfo}>
                    <h2 className={style.PostsItemHeader}>{PostsItemHeader}</h2>
                    <h3>@{PostsItemNickname} | {PostsItemDate}</h3>
                    <p className={style.PostsItemContent}>{PostsItemContent}</p>
                    
                    
                </span>
                </li>
            );    
}
export default PostsItem;