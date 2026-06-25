import { useState } from "react";
import axios from "axios";

import {
  Upload,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const predict = async () => {
    if (!image) {
      alert("Please upload an image");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", image);

      const res = await axios.post(
        `${API_URL}/predict`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(res.data);
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.error ||
        "Prediction Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.probabilities
    ? Object.entries(result.probabilities).map(
        ([name, value]) => ({
          name,
          value,
        })
      )
    : [];

  return (
    <div className="app">

      <header>
        <h1>DR Vision AI</h1>
        <p>An Automated Deep Learning-Based Diabetic Retinopathy Identification and Severity Grading System</p>
      </header>

      <div className="grid">

        {/* Upload Card */}
        <div className="card">

          <h2>
            <Upload size={18} />
            Upload Retina Scan
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
          />

          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="preview"
            />
          )}

          <button
            onClick={predict}
            disabled={loading}
          >
            {loading
              ? "Analyzing..."
              : "Analyze Retina"}
          </button>

        </div>

        {/* Result Card */}
        <div className="card">

          <h2>
            <Activity size={18} />
            Diagnosis Result
          </h2>

          {result && (
            <>
              <div className="result-box">

                <h3>{result.prediction}</h3>

                <p>
                  Confidence:
                  <strong>
                    {" "}
                    {result.confidence}%
                  </strong>
                </p>

              </div>

              <div className="risk">

                {result.prediction === "No_DR" ? (
                  <span className="green">
                    <ShieldCheck />
                    Low Risk
                  </span>
                ) : (
                  <span className="red">
                    <AlertTriangle />
                    Requires Attention
                  </span>
                )}

              </div>
            </>
          )}

        </div>

      </div>

      {/* Chart */}
      {result && (
        <div className="card chart-card">

          <h2>Prediction Probability</h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>

        </div>
      )}

      {/* Recommendation */}
      {result && (
        <div className="card">

          <h2>
            Clinical Recommendation
          </h2>

          <p>
            {result.prediction === "No_DR"
              ? "No diabetic retinopathy detected."
              : "Patient should be reviewed by an ophthalmologist for further assessment."}
          </p>

        </div>
      )}

    </div>
  );
}

export default App;
