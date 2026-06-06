import style from './InputField.module.css';
function InputField({placeholder,onChange, type="text", minLength=3, maxLength}){
    let InputFieldPlaceHolder = placeholder;
    return(
        <div className={style.InputField}>

            <input type={type} placeholder = {InputFieldPlaceHolder} onChange={onChange} required={true} minLength={minLength} maxLength={maxLength}/>
        </div>
    );
}
export default InputField;
