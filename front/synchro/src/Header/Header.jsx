import { register, login, getUserById } from "../api";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import style from './Header.module.css';
import MainButton from '../MainButton/MainButton';
import SearchBar from '../SearchBar/SearchBar';
import InputField from '../InputField/InputField';
import SignInModal from '../SingInModal/SignInModal';
import signInModalStyle from '../SingInModal/SignInModal.module.css';
import InfoArea from '../InfoArea/InfoArea';
import logo from "../assets/SynchroLogo/synchro_black.svg"

function Header(){

    //GENRE DROPDOWN
    function navigateGenre(genre) {
        navigate(`/AllPosts?genre=${encodeURIComponent(genre)}`);
        setGenresDropdown(false);
    }
    
    //SEARCH
    const [search, setSearch] = useState("");
    function handleSearch(e) {
        e.preventDefault();

        if (!search.trim()) {
            navigate("/AllPosts");
            return;
        }

        navigate(
            `/AllPosts?search=${encodeURIComponent(search)}`
        );
    }
    
    //MODAL OPEN/CLOSE
    const [modalLoginOpen, setModalLoginOpen] = useState(false);
    const modalLoginPopupOpen = () =>{
        setLoginError(""); // Очищаем ошибку при открытии
        setModalLoginOpen(true);
    }
    const modalLoginPopupClose = () =>{
        setModalLoginOpen(false);
        setLoginError("");
    }
    
    const [modalRegistrationOpen, setModalRegistrationOpen] = useState(false);
    const modalRegistrationPopupOpen = () =>{
        setRegisterError(""); // Очищаем ошибку при открытии
        setModalRegistrationOpen(true);
    }
    const modalRegistrationPopupClose = () =>{
        setModalRegistrationOpen(false);
        setRegisterError("");
        setRegexWarning(false);
        setPasswordMatchWarning(false);
    }

    // REGISTRATION
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [passwordsMatchWarning, setPasswordMatchWarning] = useState(false);
    const [regexWarning, setRegexWarning] = useState(false);
    const [avatar, setAvatar] = useState(null);
    const [registerError, setRegisterError] = useState(""); // Стейт для ошибки сервера при регистрации

    async function handleRegister(e) {
        e.preventDefault();
        setRegisterError(""); // Очищаем предыдущую ошибку сервера
        
        if (/[а-яёА-ЯЁ]/.test(password) || /[а-яёА-ЯЁ]/.test(username)) {
            setRegexWarning(true);
            return;
        } else {
            setRegexWarning(false);
            if (password !== passwordConfirm) {
                setPasswordMatchWarning(true);
                return;
            } else {
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
            modalRegistrationPopupClose();

        } catch (error) {
            console.error("REGISTRATION ERROR:", error);
            // Выводим ошибку бэкенда в форму
            setRegisterError(error.message || "Ошибка при регистрации");
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
    
    // LOGIN
    const [loginError, setLoginError] = useState(""); // Стейт для ошибки сервера при логине
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        setLoginError(""); // Очищаем предыдущую ошибку сервера

        try {
            const result = await login(
                loginUsername,
                loginPassword  
            );

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
            // Выводим ошибку бэкенда в форму
            setLoginError(error.message || "Неверный логин или пароль");
        }
    }

    return(
        <>
        <header>
            <div className={style.HeaderContent}>
                <img src={logo} alt="SYNCHRO" onClick={NavigateHome} className={style.headerLogo}/>
                <form onSubmit={handleSearch}>
                    <SearchBar
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>
                <MainButton callback={currentUser? () => navigate(`/User/${currentUser.id}`): modalLoginPopupOpen} text={currentUser? (currentUser.display_name || currentUser.username || 'Профиль'): "Вход"} type="main"/>
            </div>
            <nav>
                <div className={style.genresDropdownContainer}>
                 
                    <MainButton text="Жанры" type="nav" callback={genresDropdownToggle}/>

                    {(isGenresDropdownOpen &&
                        <div className={style.genresDropdown}>
                            <InfoArea label = "Жанры">
                                <div
                                    className={style.genresDropdownItem}
                                    onClick={() => navigateGenre("Поп")}
                                >
                                    <h2>Поп</h2>
                                </div>

                                <div
                                    className={style.genresDropdownItem}
                                    onClick={() => navigateGenre("Хип-Хоп")}
                                >
                                    <h2>Хип-Хоп</h2>
                                </div>

                                <div
                                    className={style.genresDropdownItem}
                                    onClick={() => navigateGenre("Рок")}
                                >
                                    <h2>Рок</h2>
                                </div>

                                <div
                                    className={style.genresDropdownItem}
                                    onClick={() => navigateGenre("EDM")}
                                >
                                    <h2>EDM</h2>
                                </div>

                                <div
                                    className={style.genresDropdownItem}
                                    onClick={() => navigateGenre("R&B")}
                                >
                                    <h2>R&B</h2>
                                </div>

                                <div
                                    className={style.genresDropdownItem}
                                    onClick={() => navigateGenre("Hyperpop")}
                                >
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
        <SignInModal label="Вход" onClose={modalLoginPopupClose}>
            <form onSubmit={handleLogin} className={signInModalStyle.inputContainer}>
                <InputField placeholder="Логин" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} minLength={5} maxLength={30}/>
                <InputField placeholder="Пароль" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} minLength={8}/>
                
                {/* Вывод ошибки логина */}
                {(loginError && 
                    <p style={{ color: '#ff4d4f', margin: '5px 0', fontSize: '14px', textAlign: 'center' }}>
                        {loginError}
                    </p>
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
        <SignInModal label="Регистрация" onClose={modalRegistrationPopupClose}>
            <form onSubmit={handleRegister} className={signInModalStyle.inputContainer}>
                <InputField placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} minLength={5} maxLength={30}/>
                <InputField placeholder="Отображаемое имя" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30}/>
                <InputField placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8}/>
                <InputField placeholder="Подтвердите пароль" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" minLength={8}/>
                
                {/* Локальные предупреждения */}
                {(passwordsMatchWarning &&
                    <p style={{ color: '#ff4d4f', margin: '5px 0', fontSize: '14px', textAlign: 'center' }}>Пароли не совпадают!</p>
                )}
                {(regexWarning &&
                    <p style={{ color: '#ff4d4f', margin: '5px 0', fontSize: '14px', textAlign: 'center' }}>Используйте только латиницу, цифры и спецсимволы!</p>
                )}         
                
                <input type="file" accept="image/png, image/jpeg" onChange={(e) => setAvatar(e.target.files[0])}/>
                 
                {/* Вывод серверной ошибки при регистрации */}
                {(registerError &&
                    <p style={{ color: '#ff4d4f', margin: '5px 0', fontSize: '14px', textAlign: 'center' }}>{registerError}</p>
                )}

                <MainButton text="Регистрация" type="main" buttonType="submit"/>
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