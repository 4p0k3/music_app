import style from './MainButton.module.css'
import { useState } from 'react';


function MainButton({text,type, callback, className}){
let buttonText = text;
let buttonType = type;

if (buttonType == "main"){

    return(
        <button  onClick = {callback} className={style.MainButton}><b>{buttonText}</b></button>
    );
}
else if (buttonType == "nav"){
    return(
        <button onClick = {callback} className={style.NavButton}><b>{buttonText}</b></button>
    );
}

}
export default MainButton;