import { useState } from 'react'
import Header from '../Header/Header'
import Main from '../Main/Main'
import InfoArea from '../InfoArea/InfoArea'
import TextArea from '../TextArea/TextArea'
import style from './Post.module.css'
import Footer from '../Footer/Footer'
import { useNavigate } from 'react-router-dom'

function Post({}) {
  
  const navigate = useNavigate();

    const NavigateUser = () =>{
        navigate("/User")
    }
  
  const lorem = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quibusdam esse culpa eligendi alias! Eligendi sapiente placeat asperiores rerum distinctio voluptate excepturi odit maiores provident explicabo minima commodi quo, doloribus eos.";
  
  let PostImageUrl = "src/ReleasesCovers/charlixcx_brat.png";
  let UserPfpUrl = "src/ReleasesCovers/charlixcx_brat.png";
  let PostUserNickName = "okak";
  let PostUsername = "pocoyo67";
  let PostHeader = "Заголовок поста";
  let PostContent = lorem;
  let PostDate = "13.06.2008";
  
  
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
