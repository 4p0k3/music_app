import style from './TextArea.module.css';

function TextArea({children, className, onClick}){
    return(
        <div className={style.TextArea} onClick={onClick}>
            <div className={className}>
                {children}
            </div>
        </div>            
);
    

}
export default TextArea;