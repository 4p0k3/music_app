import style from './User.module.css';
import InfoArea from '../InfoArea/InfoArea';
import TextArea from '../assets/TextArea/TextArea';
import Header from '../Header/Header';
import Main from '../Main/Main';
import Footer from '../assets/Footer/Footer';
import PostsItem from '../PostsItem/PostsItem';
import MainButton from '../MainButton/MainButton';
function User(){
    return(
        <>
            <Header/>
            <Main>
                <div className={style.UserContainer}>
                    <TextArea className={style.UserInfo}>
                        <img src="https://placehold.co/400x400" alt="Аватар Пользователя" className={style.UserProfilePfp}/>
                        <div className={style.UserTextWrapper}>
                            <p className={style.UserNickname}>Nickname</p>
                            <p className={style.UsernameAndDate}>
                            @username
                            13.06.2008
                            </p>
                        </div>
                        <div className={style.UserButtonsWrapper}>
                            
                        </div>

                    </TextArea>

                    <MainButton text="Создать посты" type="nav"/>

                    <InfoArea label="Посты пользователя">
                        <PostsItem/> 
                        <PostsItem/>  
                    </InfoArea>     
                </div>   
            </Main>
            <Footer/>
        </>
    );
}
export default User;