import React from 'react';
import {Control, useController} from "react-hook-form";
import {useDropzone} from "react-dropzone";
import {FaUpload} from "react-icons/fa6";

type UploadFileFieldProps = {
    id: string;
    label: string;
    required?: boolean;
    disabled?: boolean;
    accept: string;
    maxFileSize: number;
    maxFiles?: number;
    control: Control
    onDrop: (acceptedFiles: File[]) => void;
}

const UploadFileField = ({
                             control,
                             onDrop,
                             id,
                             label,
                             required = true,
                             disabled = false,
                             accept,
                             maxFiles = 1,
                             maxFileSize
                         }: UploadFileFieldProps) => {
    const {fieldState: {error}} = useController({control, name: id, rules: required});
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, accept, maxFiles, maxFileSize, disabled})
    return (
        <>
            <div {...getRootProps()} className="file-upload flex-column">
                <input {...getInputProps()} required={required}/>
                {
                    isDragActive ?
                        <p>Кидайте файлы сюда...</p> :
                        <p className="text-center"><b>{label}</b>
                            <br/>
                            Перетащите сюда несколько файлов или щелкните, чтобы выбрать файлы. <br/>
                            <small className="text-muted">Макс. {maxFiles} file{maxFiles > 1 ? 's' : ''},
                                макс {maxFileSize / 1024 / 1024} МБ каждый,
                                формат поддержки: <b>{accept}</b></small>
                        </p>
                }
                <FaUpload className="text-primary fs-3"/>
            </div>
            {error && (
                <div className="invalid-feedback d-block">{error.message}</div>
            )}
        </>
    );
};

export default UploadFileField;