import "./Images.css";
import React, {useState, useRef} from "react";
import uploadIcon from "./upload-solid.svg";
import downloadIcon from "./download-solid.svg";
import {OptimizeSvg} from "./OptimizeSvg";

export default function Images() {
    const fileInputField = useRef(null);
    const outputFileContainer = useRef(null);
    const [inputFile, setInputFile] = useState(null);
    const [outputFile, setOutputFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const preventDefaultFn = e => {
        e.preventDefault();
    };

    const onDragEnter = e => {
        setDragging(true);
    };

    const onDragLeave = e => {
        setDragging(false);
    };

    const fileDrop = e => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length === 1) {
            handleInputFile(files[0]);
        }
    };

    const handleNewFileUpload = e => {
        const {files} = e.target;
        if (files.length === 1) {
            handleInputFile(files[0]);
        }
    };

    const setWidthAndHeight = (w, h) => {
        setWidth(w);
        setHeight(h);
    };

    const handleInputFile = file => {
        setInputFile(file);
        OptimizeSvg(
            URL.createObjectURL(file),
            setOutputFile,
            setWidthAndHeight
        );
    };

    // Simulates click of hidden input element for all upload actions
    const handleUploadAction = () => {
        fileInputField.current.click();
    };

    const didUploadSvgFile =
        inputFile &&
        inputFile.type.split("/")[0] === "image" &&
        inputFile.type.split("/")[1].indexOf("svg") !== -1;

    // Set the output file preview
    if (didUploadSvgFile && outputFile) {
        outputFileContainer.current.innerHTML = outputFile;
    }

    return (
        <div className="Images">
            <input
                style={{display: "none"}}
                type="file"
                ref={fileInputField}
                onChange={handleNewFileUpload}
            />
            {didUploadSvgFile ? (
                <div className="Images-input">
                    <img
                        className="input-svg-preview"
                        src={URL.createObjectURL(inputFile)}
                        alt="input svg"
                        width={width}
                        height={height}
                    />
                    <img
                        src={uploadIcon}
                        className="upload-button cursor-pointer"
                        onClick={handleUploadAction}
                        alt="upload file"
                        width="40"
                        height="40"></img>
                </div>
            ) : (
                <div
                    className={`file-upload-area cursor-pointer${
                        dragging ? " hovering" : ""
                    }`}
                    onClick={handleUploadAction}
                    onDragOver={preventDefaultFn}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={fileDrop}>
                    <p>Drag and drop your files</p>
                    <br />
                    <p>Click anywhere to choose from files</p>
                </div>
            )}
            <div className={`Images-output${outputFile ? "" : " hide"}`}>
                <span
                    className="output-svg-preview"
                    ref={outputFileContainer}></span>
                <img
                    src={downloadIcon}
                    className="download-button cursor-pointer"
                    onClick={handleUploadAction}
                    alt="download file"
                    width="40"
                    height="40"
                    color="#ffffff"
                />
            </div>
        </div>
    );
}
