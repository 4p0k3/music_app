import style from './MainButton.module.css'
import { useState } from 'react';


function MainButton({text,type="button", buttonType,callback, className}){



if (type == "main"){

    return(
        <button  type = {buttonType} onClick = {callback} className={style.MainButton}><b className={style.ButtonText}>{text}</b></button>
    );
}
else if (type == "nav"){
    return(
        <button type = {buttonType} onClick = {callback} className={style.NavButton}><b className={style.ButtonText}>{text}</b></button>
    );
}

}
export default MainButton;