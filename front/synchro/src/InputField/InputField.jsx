import style from './InputField.module.css';
function InputField({placeholder,onChange, type="text", minLength=3}){
    let InputFieldPlaceHolder = placeholder;
    return(
        <div className={style.InputField}>

            <input type={type} placeholder = {InputFieldPlaceHolder} onChange={onChange} required={true} minLength={minLength} maxLength={30}/>
        </div>
    );
}
export default InputField;
