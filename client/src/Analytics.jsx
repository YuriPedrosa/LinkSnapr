import { useState } from "react";
import { Link } from "react-router-dom";

function Analytics() {
  const [shortCode, setShortCode] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAnalytics(null);

    try {
      const response = await fetch(`/api/analytics/${shortCode}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
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
      <h1>Analytics de Link</h1>
      <p>Insira o código curto para ver as estatísticas.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={shortCode}
          onChange={(e) => setShortCode(e.target.value)}
          placeholder="Código curto (ex: abc123)"
          required
        />
        <button type="submit">Ver Analytics</button>
      </form>
      {analytics && (
        <div className="result">
          <h2>Estatísticas</h2>
          <p>
            <strong>URL Original:</strong> {analytics.originalUrl}
          </p>
          <p>
            <strong>Código Curto:</strong> {analytics.shortCode}
          </p>
          <p>
            <strong>Cliques:</strong> {analytics.clicks}
          </p>
          <p>
            <strong>Criado em:</strong>{" "}
            {new Date(analytics.createdAt).toLocaleString()}
          </p>
          {analytics.expiresAt && (
            <p>
              <strong>Expira em:</strong>{" "}
              {new Date(analytics.expiresAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
      {error && <div className="result error">{error}</div>}
    </div>
  );
}

export default Analytics;
