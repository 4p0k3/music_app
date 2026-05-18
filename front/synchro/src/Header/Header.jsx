import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import style from './Header.module.css';
import MainButton from '../MainButton/MainButton';
import SearchBar from '../SearchBar/SearchBar';
import InputField from '../InputField/InputField';
import inputFieldStyle from '../InputField/InputField.module.css'
import SignInModal from '../assets/SingInModal/SignInModal';
import signInModalStyle from '../assets/SingInModal/SignInModal.module.css';
function Header(){
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
                <img src="src\SynchroLogo\synchro_black.svg" alt="SYNCHRO" onClick={NavigateHome} className={style.headerLogo}/>
                <SearchBar/>
                <MainButton callback={modalLoginPopupOpen} text="Вход" type="main"/>
            </div>
            <nav>
                <MainButton text="Жанры" type="nav"/>
                <MainButton text="Все посты" type="nav" callback={NavigateAllPosts}/>
            </nav>
        </header>
        
        {/* LOGIN MODAL */}
        {(modalLoginOpen && 
        <SignInModal label="Вход" onClose={modalLoginPopupClose}>
        <div className={signInModalStyle.inputContainer}>
            <InputField placeholder="Логин"/>
            <InputField placeholder="Пароль"/>
        </div>
        <MainButton callback={modalLoginPopupClose} text="Вход" type="main"/>
        <div className={signInModalStyle.modalBottomOptions}>
            <a><p onClick={() => {modalRegistrationPopupOpen(); modalLoginPopupClose();}}>Регистрация</p></a>
            <a><p>Забыли пароль?</p></a>
        </div>
        </SignInModal>
        )}
        {/* REGISTRATION MODAL */}
        {(modalRegistrationOpen && 
        <SignInModal label="Регистрация" onClose={modalRegistrationPopupClose}>
        <div className={signInModalStyle.inputContainer}>
            <InputField placeholder="Логин"/>
            <InputField placeholder="Пароль"/>
        </div>
        <MainButton callback={modalRegistrationPopupClose} text="Регистраиця" type="main"/>
        <div className={signInModalStyle.modalBottomOptions}>
            <a onClick={() => {modalRegistrationPopupClose(); modalLoginPopupOpen();}}><p>Логин</p></a>
            <a href=""><p>Забыли пароль?</p></a>
        </div>
        </SignInModal>
        )}
        </>
    );
    
}
export default Header;