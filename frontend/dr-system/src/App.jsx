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

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const predict = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("file", image);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://127.0.0.1:8000/predict",
        formData
      );

      setResult(res.data);
    } catch (err) {
      alert("Prediction Failed");
    }

    setLoading(false);
  };

  const chartData = result
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
        <p>Diabetic Retinopathy (DR) detection system</p>
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
              alt=""
              className="preview"
            />
          )}

          <button onClick={predict}>
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

                <h3>
                  {result.prediction}
                </h3>

                <p>
                  Confidence:
                  <strong>
                    {" "}
                    {result.confidence}%
                  </strong>
                </p>

              </div>

              <div className="risk">

                {result.prediction ===
                "No_DR" ? (
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

      {/* Probability Chart */}

      {result && (
        <div className="card chart-card">

          <h2>
            Prediction Probability
          </h2>

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