import { useState } from "react";
import { Brain, Send } from "lucide-react";

import { queryRag } from "../api";

export default function RagPanel({ entityId }) {
  const [query, setQuery] = useState("");
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitQuery = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    try {
      setResult(
        await queryRag({
          query: query.trim(),
          caseId: caseId.trim(),
          entityId,
        }),
      );
    } catch (requestError) {
      setResult(null);
      setError(
        requestError.response?.data?.message ||
          "The investigator assistant is unavailable.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rag-panel" aria-labelledby="rag-heading">
      <div className="rag-panel-header">
        <div>
          <span className="eyebrow">EVIDENCE ASSISTANT</span>
          <h2 id="rag-heading">
            <Brain size={18} /> Ask the investigation
          </h2>
        </div>
        <span className="mono">GROUNDED / SOURCED</span>
      </div>

      <form className="rag-form" onSubmit={submitQuery}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What connections are supported by the evidence?"
          aria-label="Investigation question"
        />
        <input
          value={caseId}
          onChange={(event) => setCaseId(event.target.value)}
          placeholder="Optional case ID"
          aria-label="Optional case ID"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          aria-label="Ask evidence assistant"
        >
          <Send size={16} />
          {loading ? "Searching" : "Ask"}
        </button>
      </form>

      {error ? (
        <p className="investigation-error" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="rag-result">
          <p className="rag-answer">{result.answer}</p>
          <div className="rag-result-meta">
            <span>{result.sources?.length || 0} evidence sources</span>
            <span>{result.graphContext?.nodes?.length || 0} graph nodes</span>
          </div>
          {result.sources?.length ? (
            <ul className="rag-sources">
              {result.sources.map((source, index) => (
                <li
                  key={`${source.sourceDocumentId}-${source.pageNumber}-${index}`}
                >
                  <strong>
                    {source.documentType || "SOURCE"} / page {source.pageNumber}
                  </strong>
                  <span>{source.sourceDocumentId}</span>
                  <p>{source.evidence}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
