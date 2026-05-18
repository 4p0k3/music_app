import style from './InputField.module.css';

function InputField({placeholder}){
    let InputFieldPlaceHolder = placeholder;
    return(
        <div className={style.InputField}>

            <input type="text" placeholder = {InputFieldPlaceHolder}/>
        </div>
    );
}
export default InputField;
