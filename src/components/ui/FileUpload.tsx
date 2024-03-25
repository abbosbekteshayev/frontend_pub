import {useDropzone} from "react-dropzone";

const FileUpload = ({onDrop}: { onDrop: (acceptedFiles: File[]) => void }) => {
        const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

        return (
            <div {...getRootProps()} className="file-upload">
                <input {...getInputProps()} />
                {
                    isDragActive ?
                        <p>Кидайте файлы сюда...</p> :
                        <p>Перетащите сюда несколько файлов или щелкните, чтобы выбрать файлы.</p>
                }
            </div>
        )
    }
;

export default FileUpload;
