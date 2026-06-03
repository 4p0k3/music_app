import { useParams } from "react-router-dom";
import { useState, useEffect } from 'react';
import { getUserById } from "../api";
import { register } from "../api";
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
import settings from "../assets/settings.svg";
import default_avatar from "../assets/default_avatar.svg"




function User(){

    //CREATE POST MODAL OPEN/CLOSE
    const [modalOpen, setModalOpen] = useState(false);
    const modalPopupOpen = () =>{
        setModalOpen(true);
    }
    const modalPopupClose = () =>{
        setModalOpen(false);
    }

    // GET USER
    const { id } = useParams();
    const [user, setUser] = useState(null);
    useEffect(() => {
        async function loadUser() {
            try {
                 
                const profile = await getUserById(id);
                setUser(profile);
                    
            } catch (error) {
                console.error(error);
            }
        }

        loadUser();
    }, [id]);

    //CHECK USER ENDPOINT
    if (!user) {
    return <div>Загрузка...</div>;
    }

    //CHECK USER AVATAR AND SET DEFAULT
    const user_avatar = user.avatar_url ? `http://localhost:8000${user.avatar_url}` : default_avatar;




    const lorem = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam aliquid odio ab, officiis adipisci accusamus ipsam itaque voluptatum quae odit commodi similique repellendus eos saepe! Nobis assumenda quisquam mollitia ipsa!";
    return(
        
        <>
              
            <Header/>
            <Main>
                {/* CREATE POST */}
                {(modalOpen && 
                <SignInModal label="Создать пост" onClose={modalPopupClose}>
                    <div className={style.CreatePostContent}>
                        <InputField placeholder="Заголовок поста"></InputField>
                        <InputField placeholder="Текст поста"></InputField>
                        <InputField placeholder="Жанр"></InputField>
                        <input type="file" id="myFile" name="filename"></input>
                        <MainButton text="Создать" type="main" callback={modalPopupClose}></MainButton>
                    </div>
                </SignInModal>
                )}

                <div className={style.UserContainer}>
                    <TextArea className={style.UserInfo}>
                        <img src={user_avatar} alt="Аватар Пользователя" className={style.UserProfilePfp}/>
                        <div className={style.UserTextWrapper}>
                            <p className={style.UserNickname}>{user.display_name}</p>
                            <p className={style.UsernameAndDate}>
                            @{user.username} <br />
                            </p>
                        </div>
                        <div className={style.UserButtonsWrapper}>
                            <button className={style.UserSettingsButton}>
                                <img src={settings} alt="" className={style.UserSettingsIcon}/>
                            </button>  
                             
                        </div>

                    </TextArea>
                        <MainButton text="Создать пост" type="main" className={style.CreatePostButton} callback={modalPopupOpen}/>
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