import { getUserById, getUserPosts, createPost } from "../api";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useState, useEffect } from 'react';
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
import logout from "../assets/logout.svg";
import default_avatar from "../assets/default_avatar.svg"




function User(){
    //LOGOUT
    const navigate = useNavigate();
    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
    }
    //CREATE POST
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [genre, setGenre] = useState("");
    const [image, setImage] = useState(null);

async function handleCreatePost(e) {
    e.preventDefault();

    try {
        const result = await createPost(
            title,
            content,
            genre,
            image
        );

        modalPopupClose();

        // перейти на страницу нового поста
        navigate(`/Post/${result.id}`);

    } catch (error) {
        console.error(error);
    }
}

    const [modalOpen, setModalOpen] = useState(false);
    const modalPopupOpen = () =>{
        setModalOpen(true);
    }
    const modalPopupClose = () =>{
        setModalOpen(false);
    }

    

    // GET USER
    const [posts, setPosts] = useState([]);
    const { id } = useParams();
    const [user, setUser] = useState(null);
    useEffect(() => {
    async function loadUser() {
        try {
            const profile = await getUserById(id);
            setUser(profile);

            const userPosts = await getUserPosts(id);
            setPosts(userPosts);

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

    //HIDE BUTTONS
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const isOwnProfile =
        Number(currentUser.id) === Number(id);

    const lorem = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam aliquid odio ab, officiis adipisci accusamus ipsam itaque voluptatum quae odit commodi similique repellendus eos saepe! Nobis assumenda quisquam mollitia ipsa!";
    return(
        
        <>
              
            <Header/>
            <Main>
                {/* CREATE POST */}
                {(modalOpen && 
                <SignInModal label="Создать пост" onClose={modalPopupClose}>
    <form
        onSubmit={handleCreatePost}
        className={style.CreatePostContent}
    >
        <InputField
            placeholder="Заголовок поста"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={30}
        />

        <InputField
            placeholder="Текст поста"
            value={content}
            onChange={(e) => setContent(e.target.value)}
        />

        <select value={genre} onChange={(e) => setGenre(e.target.value)} required>
            <option value="">Выберите жанр</option>
            <option value="Поп">Поп</option>
            <option value="Хип-Хоп">Хип-Хоп</option>
            <option value="Рок">Рок</option>
            <option value="EDM">EDM</option>
            <option value="R&B">R&B</option>
            <option value="Hyperpop">Hyperpop</option>
        </select>

        <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
        />

        <MainButton
            text="Создать"
            type="main"
            buttonType="submit"
        />
    </form>
</SignInModal>
                )}

                <div className={style.UserContainer}>
                    <TextArea className={style.UserInfo}>
                        <img src={user_avatar} alt="Аватар Пользователя" className={style.UserProfilePfp}/>
                        <div className={style.UserTextWrapper}>
                            <p className={style.UserNickname}>{user.display_name}</p>
                            <p className={style.UsernameAndDate}>
                            @{user.username} <br />
                            Создан {new Date(user.created_at).toLocaleDateString('ru-RU')}
                            </p>
                        </div>
                        {isOwnProfile && (
                            <div className={style.UserButtonsWrapper}>
                                <button
                                    className={style.UserLogoutButton}
                                    onClick={handleLogout}
                                >
                                    <img
                                        src={logout}
                                        alt=""
                                        className={style.UserLogoutIcon}
                                    />
                                </button>
                            </div>
                        )}

                    </TextArea>
                        {isOwnProfile && (
                            <MainButton
                                text="Создать пост"
                                type="main"
                                className={style.CreatePostButton}
                                callback={modalPopupOpen}
                            />
                        )}
                    <InfoArea label="Посты пользователя">
                        {posts.map((post) => (
                            <PostsItem
                                key={post.id}
                                id={post.id}
                                cover={
                                    post.image_path
                                        ? `http://localhost:8000${post.image_path}`
                                        : "https://placehold.co/150x150"
                                }
                                header={post.title}
                                nickname={user.username}
                                date={new Date(post.created_at).toLocaleDateString("ru-RU")}
                                content={post.content}
                                likes={post.likes_count}
                                genre={post.genre}
                                type="main"
                            />
                        ))}
                    </InfoArea>   
                </div>   
            </Main>
            <Footer/>
        </>
    );
}
export default User;