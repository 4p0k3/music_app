import { useState } from 'react'
import Header from '../Header/Header'
import Main from '../Main/Main'
import InfoArea from '../InfoArea/InfoArea'
import TextArea from '../assets/TextArea/TextArea'
import style from './Post.module.css'
import Footer from '../assets/Footer/Footer'
import { useNavigate } from 'react-router-dom'

function Post({postImage, userPfp, nickname, username, header, content, date}) {
  
  const navigate = useNavigate();

    const NavigateUser = () =>{
        navigate("/User")
    }
  
  const lorem = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.";
  
  let PostImageUrl = postImage;
  let UserPfpUrl = userPfp;
  let PostUserNickName = nickname;
  let PostUsername = username;
  let PostHeader = header;
  let PostContent = content;
  let PostDate = date;
  
  
  return (
    <>
    <Header/>
    <Main>
      <div className={style.HeaderContent}>
          <div className={style.HeaderInfo}>
            <TextArea className={style.PostHeader}>
              {PostHeader}
            </TextArea>
            <p className={style.PostDateAndUser}>{PostDate}</p>
            <TextArea onClick={NavigateUser} className={style.PostUser}>
            <img src={UserPfpUrl} alt="Изображение профиля" className={style.PostUserPfp}/>
              <div className={style.PostUserText}>
                <p className={style.PostHeader}>{PostUserNickName}</p>
                <p className={style.PostDateAndUser}>@{PostUsername}</p>
              </div>
            </TextArea>
          </div>
        
        <img src={PostImageUrl} alt="Изображение профиля" className={style.PostImage}/>
        
        
      </div>
      <div className={style.PostContent}>
          <TextArea className={style.PostText}>
           {PostContent}
          </TextArea>
      </div>
      
    </Main>
    <Footer/>
    </>
  );
}

export default Post;
