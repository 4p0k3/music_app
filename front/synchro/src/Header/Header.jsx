import { register } from "../api";
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
    
    //HANDLE REGISTER
    async function handleRegister() {
        console.log("username:", username);
        console.log("displayName:", displayName);
        console.log("password:", password);

        try {
            const result = await register(
                username,
                displayName,
                password
            );

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

    return(
        <>
        <header>
            <div className={style.HeaderContent}>
                <img src={logo} alt="SYNCHRO" onClick={NavigateHome} className={style.headerLogo}/>
                <SearchBar/>
                <MainButton  callback={modalLoginPopupOpen} text="Вход" type="main"/>
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
        <SignInModal label="Вход" onClose={modalLoginPopupClose}>
        <div className={signInModalStyle.inputContainer}>
            <InputField placeholder="Логин"/>
            <InputField placeholder="Пароль" type="password"/>
        </div>
        <MainButton callback={modalLoginPopupClose} text="Вход" type="main"/>
        <div className={signInModalStyle.modalBottomOptions}>
            <a><p onClick={() => {modalRegistrationPopupOpen(); modalLoginPopupClose();}}>Регистрация</p></a>
        </div>
        </SignInModal>
        )}
        {/* REGISTRATION MODAL */}
        {(modalRegistrationOpen && 
        <SignInModal label="Регистрация" onClose={modalRegistrationPopupClose}>
        {/* <div className={signInModalStyle.inputContainer}> */}
            <form action={handleRegister} className={signInModalStyle.inputContainer}>
            <InputField placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)}/>
            <InputField placeholder="Отображаемое имя" value={username} onChange={(e) => setDisplayName(e.target.value)}/>
            <InputField placeholder="Пароль" value={username} onChange={(e) => setPassword(e.target.value)} type="password"/>
           
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