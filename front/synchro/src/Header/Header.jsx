import { register, login, getUserById } from "../api";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import style from './Header.module.css';
import MainButton from '../MainButton/MainButton';
import SearchBar from '../SearchBar/SearchBar';
import InputField from '../InputField/InputField';
import inputFieldStyle from '../InputField/InputField.module.css'
import SignInModal from '../SingInModal/SignInModal';
import signInModalStyle from '../SingInModal/SignInModal.module.css';
import InfoArea from '../InfoArea/InfoArea';
import logo from "../assets/SynchroLogo/synchro_black.svg"

function Header(){

    

    //MODAL OPEN/CLOSE
    const [modalLoginOpen, setModalLoginOpen] = useState(false);
    const modalLoginPopupOpen = () =>{
        setModalLoginOpen(true);
    }
    const modalLoginPopupClose = () =>{
        setModalLoginOpen(false);
    }
    const [modalRegistrationOpen, setModalRegistrationOpen] = useState(false);
    const modalRegistrationPopupOpen = () =>{
        setModalRegistrationOpen(true);
    }
    const modalRegistrationPopupClose = () =>{
        setModalRegistrationOpen(false);
    }

    // REGISTRATION
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [passwordsMatchWarning, setPasswordMatchWarning] = useState(false);
    const [regexWarning, setRegexWarning] = useState(false);
    const [avatar, setAvatar] = useState(null);

    async function handleRegister(e) {
        e.preventDefault();

        console.log("username:", username);
        
        if (/[а-яёА-ЯЁ]/.test(password) || /[а-яёА-ЯЁ]/.test(username)) {
            setRegexWarning(true);
            return;
        }
        else{
            setRegexWarning(false);
            if (password !== passwordConfirm) {
                setPasswordMatchWarning(true);
                return;
            }
            else{
                setPasswordMatchWarning(false);
            }
        }
        
        
        try {
            await register(
                username,
                displayName,
                password,
                avatar
            );

            const result = await login(
            username,
            password
            );

            navigate(`/User/${result.id}`);

            console.log(result.message);
            modalRegistrationPopupClose();

        } catch (error) {
            console.log(error.message);
        }
        
    }
    

    const [isGenresDropdownOpen, setGenresDropdown] = useState(false);
    const genresDropdownToggle = () =>{
        setGenresDropdown(prev => !prev);
    }
    const navigate = useNavigate();

    const NavigateAllPosts = () =>{
        navigate("/AllPosts")
    }
     const NavigateHome = () =>{
        navigate("/")
    }
    const NavigateUserProfile = () =>{
        navigate(`/User/${result.id}`)
    }

    // LOGIN
    const [isPasswordWrong, setPasswordWarning] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
    });
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

 async function handleLogin(e) {
    e.preventDefault();

    try {
        const result = await login(
            loginUsername,
            loginPassword  
        );
        setPasswordWarning(false);

        const user = await getUserById(result.id);

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

        setCurrentUser(user);

        modalLoginPopupClose();

        navigate(`/User/${result.id}`);

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        
        setPasswordWarning(true);
    }
}

    return(
        <>
        <header>
            <div className={style.HeaderContent}>
                <img src={logo} alt="SYNCHRO" onClick={NavigateHome} className={style.headerLogo}/>
                <SearchBar/>
                <MainButton callback={currentUser? () => navigate(`/User/${currentUser.id}`): modalLoginPopupOpen} text={currentUser? currentUser.display_name: "Вход"} type="main"/>
            </div>
            <nav>
                <div className={style.genresDropdownContainer}>
                 
                    <MainButton text="Жанры" type="nav" callback={genresDropdownToggle}/>

                    {(isGenresDropdownOpen &&
                        <div className={style.genresDropdown}>
                            <InfoArea label = "Жанры">
                                <div className={style.genresDropdownItem}>
                                    <h2>Поп</h2>
                                </div>
                                <div className={style.genresDropdownItem}>
                                    <h2>Хип-Хоп</h2>
                                </div>
                                <div className={style.genresDropdownItem}>
                                    <h2>Рок</h2>
                                </div>
                                <div className={style.genresDropdownItem}>
                                    <h2>EDM</h2>
                                </div>
                                <div className={style.genresDropdownItem}>
                                    <h2>R&B</h2>
                                </div>
                                <div className={style.genresDropdownItem}>
                                    <h2>Hyperpop</h2>
                                </div>
                            </InfoArea>
                        </div>
                    )}
                </div>
                
                <MainButton text="Все посты" type="nav" callback={NavigateAllPosts}/>
            </nav>
        </header>
        
        {/* LOGIN MODAL */}
        {(modalLoginOpen && 
        <SignInModal label="Вход" onClose={() => {modalLoginPopupClose(); setPasswordWarning(false)}}>
            <form onSubmit={handleLogin} className={signInModalStyle.inputContainer}>
                <InputField placeholder="Логин" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} maxLength={30}/>
                <InputField placeholder="Пароль" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} minLength={8}/>
                {(isPasswordWrong && 
                    <p>Неверный логин или пароль!</p>
                )}
                <MainButton text="Вход" type="main" buttonType="submit"/>
                
            </form>  
        <div className={signInModalStyle.modalBottomOptions}>
            <a><p onClick={() => {modalRegistrationPopupOpen(); modalLoginPopupClose();}}>Регистрация</p></a>
        </div>
        </SignInModal>
        )}
        {/* REGISTRATION MODAL */}
        {(modalRegistrationOpen && 
        <SignInModal label="Регистрация" onClose={() =>{modalRegistrationPopupClose(); setPasswordConfirm(false); setRegexWarning(false)}}>
        {/* <div className={signInModalStyle.inputContainer}> */}
            <form onSubmit={handleRegister} className={signInModalStyle.inputContainer}>
                <InputField placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30}/>
                <InputField placeholder="Отображаемое имя" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30}/>
                <InputField placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} max/>
                <InputField placeholder="Подтвердите пароль" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" minLength={8}/>
                {(passwordsMatchWarning &&
                    <p>Пароли не совпадают!</p>
                )}
                {(regexWarning &&
                    <p>Используйте только латиницу, цифры и спецсимволы!</p>
                )}         
                <input type = "file" accept="image/png, image/jpeg" onChange={(e) => setAvatar(e.target.files[0])}/>
                 {/* </div> */}
                
                
                <MainButton text="Регистраиця" type="main" buttonType="submit"/>
        </form> 
        <div className={signInModalStyle.modalBottomOptions}>
            <a onClick={() => {modalRegistrationPopupClose(); modalLoginPopupOpen();}}><p>Логин</p></a>
        </div>
        </SignInModal>
        )}
        </>
    );
    
}
export default Header;