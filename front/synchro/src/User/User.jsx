
import { getUserById, getUserPosts, createPost, updateUser, deletePost } from "../api";
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
import ContentField from '../ContentField/ContentField';
import InputField from '../InputField/InputField';
import logout from "../assets/logout.svg";
import edit from "../assets/edit.svg";
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
    
    const [editModalOpen, setEditModalOpen] = useState(false);
    const editModalPopupClose = () =>{
        setEditModalOpen(false);
    }
    const [newUsername, setNewUsername] = useState("");
    const [newDisplayName, setNewDisplayName] = useState("");
  async function handleEditProfile(e) {
        e.preventDefault();

        try {
            const formData = new FormData();
            formData.append("username", newUsername);
            formData.append("display_name", newDisplayName);

            if (newAvatar) {
                formData.append("avatar", newAvatar);
            }

            const result = await updateUser(formData);

            setUser((prev) => ({
                ...prev,
                username: result.user.username,
                display_name: result.user.display_name,
                avatar_url: result.user.avatar_url,
            }));

            setEditModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    }
    const [newAvatar, setNewAvatar] = useState(null);
        const editModalPopupOpen = () => {
        setNewUsername(user.username);
        setNewDisplayName(user.display_name);
        setNewAvatar(null);
        setEditModalOpen(true);
    };
    //DELETE OWN POST
    async function handleDeletePost(postId) {
        try {
            await deletePost(postId);

            // убираем пост из UI без перезагрузки
            setPosts((prev) => prev.filter((p) => p.id !== postId));

        } catch (error) {
            console.error(error);
        }
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
    try{
        document.title = user.display_name;
    } 
    catch(error){
    //   console.log(error)
    }
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
            {/* EDIT PROFILE */}
            {editModalOpen && (
                <SignInModal label="Изменить данные" onClose={editModalPopupClose}>
                    <form onSubmit={handleEditProfile} className={style.CreatePostContent}>
                        <InputField
                            placeholder="Юзернейм"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            minLength={5}
                            maxLength={30}
                            required={false}
                        />

                        <InputField
                            placeholder="Отображаемое имя"
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            minLength={5}
                            maxLength={30}
                            required={false}
                        />
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={(e) => setNewAvatar(e.target.files[0])}
                            required={false}
                        />
                        <MainButton
                            buttonType="submit"
                            text="Изменить"
                            type="main"
                        />
                    </form>
                </SignInModal>
            )}  
                {/* CREATE POST */}
                {(modalOpen && 
                <SignInModal label="Создать пост" onClose={modalPopupClose} >
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

        <ContentField
            placeholder="Текст поста"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={7}
            maxLength={5000}
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
                                    onClick={editModalPopupOpen}
                                >
                                
                                    <img
                                        src={edit}
                                        alt=""
                                        className={style.UserLogoutIcon}
                                    />
                                </button>
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
                        <div key={post.id} className={style.PostWrapper}>
                            <PostsItem
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

                            {isOwnProfile && (
                                <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className={style.DeletePostBtn}
                                >
                                    Удалить
                                </button>
                            )}
                        </div>
                    ))}
                    </InfoArea>   
                </div>   
            </Main>
            <Footer/>
        </>
    );
}
export default User;