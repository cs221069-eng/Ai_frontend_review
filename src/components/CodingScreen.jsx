import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";
import "./screens.css";
import { API_BASE } from "../utils/api";

const languages = [
  "javascript",
  "python",
  "cpp",
  "java",
  "csharp",
  "typescript",
  "go",
  "rust",
  "php",
  "flutter",
  "dart",
  "ruby",
  "kotlin",
  "swift",
  "sql",
  "bash",
  "node.js",
  "express.js",
  "mongodb",
  "html",
  "css",
  "json",
];

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
};

const normalizeIssues = (value) =>
  ensureArray(value)
    .map((issue) => {
      if (typeof issue === "string") {
        return { title: issue, severity: "low" };
      }

      if (issue && typeof issue === "object") {
        return {
          title: issue.title || "Untitled issue",
          severity: issue.severity || "low",
        };
      }

      return null;
    })
    .filter(Boolean);

const normalizeSuggestions = (value) =>
  ensureArray(value)
    .map((suggestion) => {
      if (typeof suggestion === "string") {
        return { title: suggestion };
      }

      if (suggestion && typeof suggestion === "object") {
        return {
          title: suggestion.title || "Untitled suggestion",
        };
      }

      return null;
    })
    .filter(Boolean);

const normalizeReview = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  return {
    ...value,
    issues: normalizeIssues(value.issues),
    suggestions: normalizeSuggestions(value.suggestions),
  };
};

const normalizeHistoryItems = (value) => {
  const items = Array.isArray(value)
    ? value
    : Array.isArray(value?.history)
      ? value.history
      : [];

  return items
    .map((item) => normalizeReview(item))
    .filter(Boolean);
};

function CodingScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [review, setReview] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState("");

  const editorLanguageMap = {
    flutter: "dart",
    "node.js": "javascript",
    "express.js": "javascript",
    mongodb: "json",
    csharp: "csharp",
  };

  const editorLanguage = editorLanguageMap[language] || language;

  const redirectToSignin = () => {
    navigate("/signin", { replace: true });
  };

  const getRequestErrorMessage = (err, fallbackMessage) => {
    if (err.response?.status === 401) {
      redirectToSignin();
      return "";
    }

    if (err.response?.status === 422) {
      return err.response?.data?.message || fallbackMessage;
    }

    return err.response?.data?.message || fallbackMessage;
  };

  const loadHistory = async (preferredId) => {
    try {
      setIsHistoryLoading(true);
      const res = await axios.get(`${API_BASE}/history`, {
        withCredentials: true,
      });

      const items = normalizeHistoryItems(res.data);
      setHistoryItems(items);

      if (!items.length) {
        setSelectedHistoryId(null);
        setReview(null);
        return;
      }

      if (preferredId) {
        const nextItem = items.find((item) => item._id === preferredId);

        if (nextItem) {
          setSelectedHistoryId(nextItem._id);
          setReview(nextItem);
        }
      }
    } catch (err) {
      console.error(err);
      const message = getRequestErrorMessage(err, "Failed to load history");
      setError(message);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const userRes = await axios.get(`${API_BASE}/users/me`, {
          withCredentials: true,
        });
        setUser(userRes.data);
        await loadHistory();
      } catch (err) {
        redirectToSignin();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    bootstrap();
  }, [navigate]);

  const resetComposer = (nextLanguage = language) => {
    setLanguage(nextLanguage);
    setSelectedHistoryId(null);
    setReview(null);
    setError("");
    setCode("");
  };

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;
    resetComposer(nextLanguage);
  };

  const handleReview = async () => {
    try {
      setIsReviewing(true);
      setError("");
      setSelectedHistoryId(null);

      const res = await axios.post(
        `${API_BASE}/openai/review`,
        { code, language },
        { withCredentials: true }
      );

      const savedReview = res.data.history;
      const normalizedReview = normalizeReview(savedReview);

      setReview(normalizedReview);
      setSelectedHistoryId(normalizedReview?._id ?? null);
      setCode(normalizedReview?.code || "");
      setLanguage(normalizedReview?.language || language);
      await loadHistory(normalizedReview?._id);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 422 && err.response?.data?.review) {
        const normalizedReview = normalizeReview(err.response.data.review);
        setReview(normalizedReview);
        setCode(normalizedReview?.code || "");
        setLanguage(normalizedReview?.language || language);
      }
      const message = getRequestErrorMessage(err, "Review failed");
      setError(message);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSelectHistory = async (item) => {
    try {
      setSelectedHistoryId(item._id);
      setReview(item);
      setCode(item.code);
      setLanguage(item.language);

      const res = await axios.get(`${API_BASE}/history/${item._id}`, {
        withCredentials: true,
      });
      setReview(normalizeReview(res.data));
    } catch (err) {
      console.error(err);
      const message = getRequestErrorMessage(err, "Failed to open review");
      setError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/users/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error(err);
    } finally {
      redirectToSignin();
    }
  };

  if (isCheckingAuth) {
    return <section className="coding-loading">Loading workspace...</section>;
  }

  return (
    <section className="coding-screen">
      <aside className="coding-sidebar">
        <div className="coding-sidebar-top">
          <div className="coding-brand">
            <div className="coding-avatar">
              <span>{user?.username?.slice(0, 1)?.toUpperCase() || "U"}</span>
            </div>

            <div>
              <h2>{user?.username || "Workspace"}</h2>
              <p className="coding-subtitle">{user?.email}</p>
            </div>
          </div>

          <button className="coding-button" onClick={() => resetComposer()}>
            New review
          </button>
        </div>

        <div className="coding-sidebar-bottom">
          <div className="coding-nav-section">Recent reviews</div>

          <div className="coding-history-list">
            {isHistoryLoading ? (
              <p className="coding-empty-state">Loading history...</p>
            ) : historyItems.length ? (
              historyItems.map((item) => (
                <button
                  key={item._id}
                  className={
                    item._id === selectedHistoryId
                      ? "coding-history-item active"
                      : "coding-history-item"
                  }
                  onClick={() => handleSelectHistory(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{formatTime(item.createdAt)}</span>
                </button>
              ))
            ) : null}
          </div>

          <button className="coding-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="coding-editor-panel">
        <div className="coding-toolbar">
          <div className="coding-toolbar-copy">
            <p className="coding-kicker">AI code review workspace</p>
            <h1>{review?.title || "Start a fresh review"}</h1>
          </div>

          <div className="coding-toolbar-actions">
            <select
              className="coding-select"
              value={language}
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            <button className="coding-clear-btn" onClick={() => resetComposer()}>
              Clear
            </button>

            <button
              className="coding-review-btn"
              onClick={handleReview}
              disabled={isReviewing}
            >
              {isReviewing ? "Reviewing..." : "Review code"}
            </button>
          </div>
        </div>

        {error ? <p className="coding-error">{error}</p> : null}

        <div className="coding-workspace">
          <div className="coding-editor">
            <Editor
              height="100%"
              language={editorLanguage}
              theme="vs-light"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                placeholder: "Paste or write your code here...",
              }}
            />
          </div>

          <aside className="coding-results">
            <div className="coding-results-header">
              <div>
                <p className="coding-kicker">Saved result</p>
                <h3>Review result</h3>
              </div>
              {review?.createdAt ? (
                <span className="coding-result-time">
                  {formatTime(review.createdAt)}
                </span>
              ) : null}
            </div>

            {review ? (
              <>
                <div className="coding-score">
                  <p className="coding-score-label">Overall score</p>
                  <div className="coding-score-row">
                    <div className="coding-score-value">
                      <strong>{review.score ?? "N/A"}</strong>
                      <span>/ 10</span>
                    </div>
                    <span className="coding-language-chip">{review.language}</span>
                  </div>
                </div>

                <div className="coding-result-block">
                  <h4>Issues</h4>
                  {review.issues?.length ? (
                    <div className="coding-card-list">
                      {review.issues.map((issue, index) => (
                        <article className="coding-card issue-card" key={index}>
                          <strong>{issue.title}</strong>
                          <span>{issue.severity}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="coding-empty-state">No issues flagged.</p>
                  )}
                </div>

                <div className="coding-result-block">
                  <h4>Suggestions</h4>
                  {review.suggestions?.length ? (
                    <div className="coding-card-list">
                      {review.suggestions.map((suggestion, index) => (
                        <article className="coding-card suggestion-card" key={index}>
                          <strong>{suggestion.title}</strong>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="coding-empty-state">
                      No suggestions available.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}

export default CodingScreen;
