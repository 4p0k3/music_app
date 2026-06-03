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
            <p className={style.PostDateAndUser}>{PostDate} | Жанр: Hyperpop</p>
            

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
      <div className={style.likeButton}>
        <MainButton text="🖤" type="main"/>
        <TextArea> <h2>Лайки: 6767</h2></TextArea>
      </div>
      <InfoArea label='Комментарии: 67'>
        <div className={style.postComment}>
          <InputField placeholder="Комментарий"/>
          <MainButton text="Отправить" type="main"/>
        </div>
        <div className={style.commentWrapper} onClick={NavigateUser}>
          <div className={style.commentContainer}>
            <img src="http://localhost:8000/view/avatar_6a16bf5b54ef0.png" alt="" className={style.commentPfp} />
            <div className={style.commentText}>
              <h2>aksdasdkjaskld</h2>
              <h3>@nickname</h3>
              <h3>01.01.2000</h3>
              <p>{lorem}</p>
            </div>
          </div>
        </div>
        
      </InfoArea>
    </Main>
    <Footer/>
    </>
  );
}

export default Post;
