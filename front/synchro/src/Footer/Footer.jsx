import style from './Footer.module.css'


function Footer(){
    return(
        <div className={style.footerWrapper}>
        <footer className={style.footerContainer}>
        <p className={style.supportMail}>Поддержка: 4p000k3@gmail.com</p>
        </footer>
        </div>
    );
    
}
export default Footer;