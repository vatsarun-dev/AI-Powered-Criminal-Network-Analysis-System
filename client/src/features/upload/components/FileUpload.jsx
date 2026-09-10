import { useRef, useState } from "react";

import { uploadFile } from "../api";

const acceptedFiles = {
  FIR: ".pdf,application/pdf",
  CDR: ".csv,text/csv",
  IPDR: ".csv,text/csv",
};

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("FIR");
  const [caseId, setCaseId] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const selectFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setStatus("");
    setError("");
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file || !caseId.trim()) {
      setError("Choose a file and provide the case ID before uploading.");
      return;
    }

    setStatus("uploading");
    setError("");
    try {
      await uploadFile({ file, type, caseId: caseId.trim(), onProgress: setProgress });
      setStatus("success");
    } catch (requestError) {
      setStatus("error");
      setError(requestError.response?.data?.message || "Upload failed. Try again.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setCaseId("");
    setProgress(0);
    setStatus("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="file-upload">
      <h2>Upload File</h2>

      <label className="upload-field">
        <span>Document type</span>
        <select
          value={type}
          disabled={status === "uploading"}
          onChange={(event) => {
            setType(event.target.value);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          <option value="FIR">FIR (PDF)</option>
          <option value="CDR">CDR (CSV)</option>
          <option value="IPDR">IPDR (CSV)</option>
        </select>
      </label>

      <label className="upload-field">
        <span>Case ID</span>
        <input
          value={caseId}
          disabled={status === "uploading"}
          onChange={(event) => setCaseId(event.target.value)}
          placeholder="Existing case ID"
        />
      </label>

      <div
        className="file-drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          selectFile(event.dataTransfer.files?.[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <p>{file ? file.name : `Drag a ${type === "FIR" ? "PDF" : "CSV"} here, or click to select`}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFiles[type]}
          onChange={(event) => selectFile(event.target.files?.[0])}
          style={{ display: "none" }}
        />
      </div>

      {status === "uploading" ? <div className="upload-progress"><div className="upload-progress-bar" style={{ width: `${progress}%` }} /><span>{progress}%</span></div> : null}
      {status === "success" ? <p style={{ color: "green" }}>Upload successful!</p> : null}
      {status === "error" ? <p style={{ color: "red" }}>{error}</p> : null}

      <div className="file-upload-actions">
        <button type="button" onClick={handleUpload} disabled={!file || !caseId.trim() || status === "uploading"}>{status === "uploading" ? "Uploading..." : "Upload"}</button>
        <button type="button" onClick={handleReset} disabled={status === "uploading"}>Reset</button>
      </div>
    </div>
  );
}
