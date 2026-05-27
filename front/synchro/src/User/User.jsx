import { useState } from 'react';
import style from './User.module.css';
import InfoArea from '../InfoArea/InfoArea';
import TextArea from '../TextArea/TextArea';
import Header from '../Header/Header';
import Main from '../Main/Main';
import Footer from '../Footer/Footer';
import PostsItem from '../PostsItem/PostsItem';
import MainButton from '../MainButton/MainButton';
import SignInModal from '../SingInModal/SignInModal';
import InputField from '../InputField/InputField';
import userData from '../data/users.json';




function User(){
    const [user,setUser] = useState(userData);
    const lorem = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam aliquid odio ab, officiis adipisci accusamus ipsam itaque voluptatum quae odit commodi similique repellendus eos saepe! Nobis assumenda quisquam mollitia ipsa!";
    const [modalLoginOpen, setModalLoginOpen] = useState(false);
        const modalLoginPopupOpen = () =>{
            setModalLoginOpen(true);
        }
        const modalLoginPopupClose = () =>{
            setModalLoginOpen(false);
        }

    return(
        <>

            <Header/>
            <Main>
                {/* CREATE POST */}
                {(modalLoginOpen && 
                <SignInModal label="Создать пост" onClose={modalLoginPopupClose}>
                    <div className={style.CreatePostContent}>
                        <InputField placeholder="Заголовок поста"></InputField>
                        <InputField placeholder="Текст поста"></InputField>
                        <input type="file" id="myFile" name="filename"></input>
                        <MainButton text="Создать" type="main" callback={modalLoginPopupClose}></MainButton>
                    </div>
                </SignInModal>
                )}

                <div className={style.UserContainer}>
                    <TextArea className={style.UserInfo}>
                        <img src={user.pfpUrl} alt="Аватар Пользователя" className={style.UserProfilePfp}/>
                        <div className={style.UserTextWrapper}>
                            <p className={style.UserNickname}>{user.nickname}</p>
                            <p className={style.UsernameAndDate}>
                            @{user.username} <br />
                            {user.creationDate}
                            </p>
                        </div>
                        <div className={style.UserButtonsWrapper}>
                            <button className={style.UserSettingsButton}>
                                <img src="src\assets\settings.svg" alt="" className={style.UserSettingsIcon}/>
                            </button>  
                             
                        </div>

                    </TextArea>
                        <MainButton text="Создать пост" type="main" className={style.CreatePostButton} callback={modalLoginPopupOpen}/>
                    <InfoArea label="Посты пользователя">
                        <PostsItem type="main" content={lorem}/> 
                        <PostsItem type="main" content={lorem}/>  
                    </InfoArea>     
                </div>   
            </Main>
            <Footer/>
        </>
    );
}
export default User;