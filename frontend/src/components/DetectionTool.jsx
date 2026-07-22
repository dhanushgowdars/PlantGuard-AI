import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Import necessary icons
import { 
  FaExclamationCircle, 
  FaShieldAlt, 
  FaFlask, 
  FaSeedling, 
  FaLeaf, 
  FaUpload, 
  FaRedo, 
  FaCheckCircle 
} from 'react-icons/fa';
import './DetectionTool.css'; 

const DetectionTool = () => {
  // --- State variables ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing Plant...");
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Dynamic Loading Text Effect ---
  useEffect(() => {
    let interval;
    if (isLoading) {
      const steps = ["Analyzing Plant...", "Running AI Model...", "Generating Recommendation..."];
      let stepIndex = 0;
      interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length;
        setLoadingText(steps[stepIndex]);
      }, 1200); 
    } else {
      setLoadingText("Analyzing Plant...");
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // --- Functions ---
  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setPredictionResult(null);
      setError(null);
    } else {
      setError('Invalid file type. Please upload an image (JPG, PNG, etc.).');
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const handleDragOver = (event) => { event.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (event) => { event.preventDefault(); setIsDragging(false); };
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!selectedFile) {
      setError('Please choose an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPredictionResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('https://plantguard-ai-ft03.onrender.com/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = response.data;
      const confidenceValue = parseFloat(result.confidence);
      if (confidenceValue < 50) {
        setError(`Model is not confident (Confidence: ${result.confidence}). Please try a clearer image.`);
      } else {
        setPredictionResult(result);
      }
    } catch (err) {
      console.error("Error during prediction:", err);
      setError('Analysis failed. Please ensure the backend server is running and accessible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setPredictionResult(null);
    setError(null);
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const getSeverityClass = (severity = '') => {
    switch (severity.toLowerCase()) {
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-medium'; // Fallback
    }
  };

  // Helper to nicely format prediction names
  const formatPredictionName = (rawName) => {
    const parts = rawName.split('___');
    if (parts.length === 2) {
      return {
        crop: parts[0].replace(/_/g, ' '),
        disease: parts[1].replace(/_/g, ' ')
      };
    }
    return { crop: 'Plant', disease: rawName.replace(/_/g, ' ') };
  };

  // Metadata Generation
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const rawDate = new Date();
  const reportId = `PG-${rawDate.getFullYear()}${(rawDate.getMonth()+1).toString().padStart(2, '0')}${rawDate.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

  return (
    <div className="container dt-container">
      <h1 className="page-header">Plant Disease Detection</h1>
      <p className="section-subtitle">
        Upload a clear image of the affected plant leaf for an AI-powered diagnosis.
      </p>

      {/* ===== Upload Card ===== */}
      <div className="card upload-card">
         <h2>Upload Plant Image</h2>
         <label
           htmlFor="file-upload"
           className={`upload-area ${isDragging ? 'dragging' : ''}`}
           onDragOver={handleDragOver}
           onDragLeave={handleDragLeave}
           onDrop={handleDrop}
         >
           {preview ? (
             <img src={preview} alt="Selected Plant" className="image-preview" />
           ) : (
             <div className="upload-placeholder">
               <FaUpload size={40} color="#cbd5e1" />
               <p>Drag & drop your image here, or <strong>click to upload</strong></p>
               <input id="file-upload" type="file" onChange={handleFileChange} accept="image/*" className="file-input"/>
             </div>
           )}
         </label>

         {!predictionResult && !isLoading && !error ? (
           <button onClick={handleAnalyzeClick} disabled={!selectedFile} className="cta-button analyze-button">
             Analyze Image
           </button>
         ) : (isLoading || predictionResult || error) ? (
            <button onClick={handleReset} className="cta-button reset-button">
              <FaRedo /> Upload New Image
            </button>
         ) : null }
      </div>

      {/* ===== Results Card ===== */}
      {(isLoading || predictionResult || error) && (
          <div className="card results-card">
            
            {isLoading && (
              <div className="loading-container">
                <div className="loader"></div>
                <p className="loading-text">{loadingText}</p>
              </div>
            )}
            
            {error && !isLoading && <p className="error-message">{error}</p>}

            {predictionResult && !isLoading && (() => {
              const { crop, disease } = formatPredictionName(predictionResult.prediction);
              const confNum = parseFloat(predictionResult.confidence);
              const confLabel = confNum >= 90 ? "High Confidence Prediction" : (confNum >= 70 ? "Moderate Confidence" : "Low Confidence");

              return (
                <div className="results-content">
                  
                  {/* Document Header (Logo & Meta) */}
                  <div className="report-header">
                    <div className="brand-logo">
                      <FaLeaf className="brand-icon" />
                      <h2>PlantGuard AI</h2>
                    </div>
                    <div className="report-meta-header">
                      <span><strong>Report ID:</strong> {reportId}</span>
                      <span><strong>Date:</strong> {today}</span>
                    </div>
                  </div>

                  <h2 className="report-title">AI Diagnosis Report</h2>
                  <hr className="section-divider" />

                  {/* Top Section: Image & Stats */}
                  <div className="diagnosis-top-section">
                    <div className="diagnosis-image-container">
                      <p className="column-label">Uploaded Image</p>
                      <img src={preview} alt="Analyzed Plant" className="diagnosis-image" />
                    </div>

                    <div className="diagnosis-stats">
                      <p className="column-label">AI Prediction</p>
                      <h3 className="detected-title">
                        <FaCheckCircle className="success-icon" /> Disease Detected
                      </h3>
                      <div className="disease-names">
                        <span className="crop-name">{crop}</span>
                        <span className="disease-name">{disease}</span>
                      </div>

                      <div className="confidence-wrapper">
                        <p>AI Confidence</p>
                        <h4 className="confidence-score">{predictionResult.confidence}</h4>
                        <div className="confidence-bar">
                          <div className="confidence-level" style={{ width: predictionResult.confidence }}></div>
                        </div>
                        <p className="confidence-label">{confLabel}</p>
                      </div>

                      <div className="meta-grid">
                        <div className="meta-item">
                          <p>Severity</p>
                          {predictionResult.details?.severity ? (
                             <span className={`severity-tag ${getSeverityClass(predictionResult.details.severity)}`}>
                               {predictionResult.details.severity}
                             </span>
                          ) : <span className="meta-value">Unknown</span>}
                        </div>
                        <div className="meta-item">
                          <p>AI Status</p>
                          <span className="meta-value status-success">✓ Successfully analyzed</span>
                        </div>
                        <div className="meta-item">
                          <p>Generated By</p>
                          <span className="meta-value">PlantGuard AI</span>
                        </div>
                        <div className="meta-item">
                          <p>Version</p>
                          <span className="meta-value">v1.0</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="section-divider" />

                  {/* Summary Table & Overview Card */}
                  <div className="overview-container">
                    <div className="summary-table-wrapper">
                      <table className="summary-table">
                        <tbody>
                          <tr><td>Disease</td><td>{crop} {disease}</td></tr>
                          <tr><td>Confidence</td><td>{predictionResult.confidence}</td></tr>
                          <tr><td>Severity</td><td>{predictionResult.details?.severity || "Unknown"}</td></tr>
                          <tr><td>Category</td><td>{predictionResult.details?.category || "Pathogen / Fungal"}</td></tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="details-section description-card">
                      <h4><FaLeaf /> Disease Overview</h4>
                      <p>{predictionResult.details?.description || "No description available for this specific disease."}</p>
                    </div>
                  </div>

                  <hr className="section-divider" />

                  {/* Details Grid */}
                  <div className="details-grid">
                      <div className="details-section precaution-card">
                        <h4><FaShieldAlt /> Precautions</h4>
                        <ul>
                          {predictionResult.details?.precautions?.length > 0 ?
                            predictionResult.details.precautions.map((item, index) => (
                              <li key={index}>
                                <FaExclamationCircle className="list-icon precaution-icon" />
                                <span>{item}</span>
                              </li>
                            )) : <li>No specific precautions listed.</li>}
                        </ul>
                      </div>

                      <div className="details-section risk-card">
                        <h4><FaExclamationCircle /> Risk Factors</h4>
                        <ul>
                          {predictionResult.details?.risk_factors?.length > 0 ?
                            predictionResult.details.risk_factors.map((item, index) => (
                               <li key={index}>
                                 <FaExclamationCircle className="list-icon risk-icon" />
                                 <span>{item}</span>
                               </li>
                            )) : <li>No specific risk factors listed.</li>}
                        </ul>
                      </div>

                      <div className="details-section chemical-card">
                        <h4><FaFlask /> Chemical Treatments</h4>
                        <ul>
                          {predictionResult.details?.treatment?.chemical?.length > 0 ?
                            predictionResult.details.treatment.chemical.map((item, index) => (
                               <li key={index}>
                                  <FaFlask className="list-icon chemical-icon" />
                                  <span>{item}</span>
                                </li>
                            )) : <li>No chemical treatments recommended.</li>}
                        </ul>
                      </div>

                      <div className="details-section organic-card">
                        <h4><FaSeedling /> Organic Remedies</h4>
                        <ul>
                          {predictionResult.details?.treatment?.organic?.length > 0 ?
                            predictionResult.details.treatment.organic.map((item, index) => (
                               <li key={index}>
                                 <FaSeedling className="list-icon organic-icon" />
                                 <span>{item}</span>
                               </li>
                            )) : <li>No specific organic remedies recommended.</li>}
                        </ul>
                      </div>
                  </div>

                  {/* Document Footer (Print & Web) */}
                  <div className="document-footer">
                    <p><strong>Generated by PlantGuard AI</strong></p>
                    <p>This report is for informational purposes only and does not replace professional agricultural advice.</p>
                    <p>Generated on: {today}</p>
                  </div>

                  {/* Action Buttons (Hidden on Print) */}
                  <div className="action-buttons">
                    <button className="cta-button download-button" onClick={handleDownload}>
                      📄 Download PDF Report
                    </button>
                    <button className="cta-button analyze-another-button" onClick={handleReset}>
                      <FaRedo /> Analyze Another Image
                    </button>
                  </div>

                </div>
              );
            })()}
          </div>
      )}
    </div>
  );
};

export default DetectionTool;