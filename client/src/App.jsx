import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Analytics from "./Analytics";
import "./App.css";

function Home() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(
          `<p><strong>URL encurtada:</strong> <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a></p><p>${data.message}</p>`
        );
      } else {
        setError(`Erro: ${data.error}`);
      }
    } catch {
      setError("Erro ao conectar ao servidor.");
    }
  };

  return (
    <div className="container">
      <nav>
        <Link to="/">Home</Link> | <Link to="/analytics">Analytics</Link>
      </nav>
      <h1>LinkSnap</h1>
      <p>Encurte suas URLs longas e chatas em links curtos e elegantes!</p>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          placeholder="Cole sua URL aqui (ex: https://www.exemplo.com)"
          required
        />
        <button type="submit">Encurtar!</button>
      </form>
      {result && (
        <div
          className="result"
          dangerouslySetInnerHTML={{ __html: result }}
        ></div>
      )}
      {error && <div className="result error">{error}</div>}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;
