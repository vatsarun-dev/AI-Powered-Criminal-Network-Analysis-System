import { useState, useRef } from "react";
import { uploadFile } from "../api";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(""); // "", "uploading", "success", "error"
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStatus("");
      setError("");
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setStatus("");
      setError("");
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      await uploadFile(file, setProgress);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err.response?.data?.message || "Upload failed. Try again.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setStatus("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="file-upload">
      <h2>Upload File</h2>

      <div
        className="file-drop-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? (
          <p>{file.name}</p>
        ) : (
          <p>Drag & drop a file here, or click to select</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {status === "uploading" && (
        <div className="upload-progress">
          <div
            className="upload-progress-bar"
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}

      {status === "success" && <p style={{ color: "green" }}>Upload successful!</p>}
      {status === "error" && <p style={{ color: "red" }}>{error}</p>}

      <div className="file-upload-actions">
        <button onClick={handleUpload} disabled={!file || status === "uploading"}>
          {status === "uploading" ? "Uploading..." : "Upload"}
        </button>
        <button onClick={handleReset} disabled={status === "uploading"}>
          Reset
        </button>
      </div>
    </div>
  );
}