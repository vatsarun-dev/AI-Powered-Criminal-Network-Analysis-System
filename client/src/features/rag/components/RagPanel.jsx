import { useState } from "react";
import { askFirQuestion } from "../api";

export default function RagPanel({ firId }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async (event) => {
    event.preventDefault();
    if (!firId || !question.trim()) return;
    setLoading(true);
    setError("");
    try {
      setResult(await askFirQuestion({ firId, question: question.trim() }));
    } catch (requestError) {
      setResult(null);
      setError(requestError.response?.data?.message || "Unable to retrieve grounded FIR evidence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rag-panel">
      <div className="rag-panel-header"><div><span className="eyebrow">FIR EVIDENCE QUERY</span><h2>Ask about this FIR</h2></div></div>
      {!firId ? <p className="investigation-empty">Select an FIR to ask questions against its uploaded evidence.</p> : (
        <form className="rag-form" onSubmit={ask}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about people, locations, evidence, or relationships" aria-label="Question about selected FIR" />
          <button type="submit" disabled={loading || !question.trim()}>{loading ? "Reviewing evidence…" : "Ask"}</button>
        </form>
      )}
      {error ? <p className="investigation-error" role="alert">{error}</p> : null}
      {result ? <div className="rag-result"><p className="rag-answer">{result.answer}</p><ul className="rag-sources">{result.sources.map((source, index) => <li key={`${source.kind}-${source.page ?? "fir"}-${index}`}><strong>[{index + 1}] {source.kind}{source.page ? ` · page ${source.page}` : ""}</strong><p>{source.excerpt}</p></li>)}</ul></div> : null}
    </section>
  );
}
