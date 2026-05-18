import style from './TextArea.module.css';


function TextArea({children, type="content"}){
    let TextAreaType = type;
    let TextAreaFontSize = "18px"


    switch(TextArea){

        case "content":
            TextAreaFontSize = "18px";
            break;
        case "header":
            TextAreaFontSize = "24px";
            break;
    }
    return(
            <div className={style.PostContainer}>

                    <p style = {{fontSize: TextAreaFontSize}} className={style.TextAreaContent}>
                        {children}
                    </p>
                    
                </div>
            </div>
            

        
        );
    

}
export default TextArea;