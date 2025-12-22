import { useState } from "react";

function TokenForm({ setTokenData }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 3) {
      return showError("Name must be at least 3 characters");
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return showError("Enter a valid mobile number");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/token", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setTokenData(data);
      localStorage.setItem("tokenData", JSON.stringify(data));
      localStorage.removeItem("deleted");
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="token-form-wrapper">
      <div className="card shadow token-card mx-auto">
        <h3 className="text-center mb-3 fw-bold">🎟 Take Your Token</h3>

        {/* Error */}
        {error && (
          <div className="alert alert-danger animated-error">{error}</div>
        )}

        <form onSubmit={submitHandler}>
          {/* Name */}
          <div className="form-floating mb-3">
            <input
              type="text"
              className={`form-control ${error ? "input-error" : ""}`}
              placeholder="Your Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
            <label>Your Name</label>
          </div>

          {/* Phone */}
          <div className="form-floating mb-3">
            <input
              type="text"
              className={`form-control ${error ? "input-error" : ""}`}
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
            />
            <label>Mobile Number</label>
          </div>

          <button
            className="btn btn-primary w-100 token-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Generating Token...
              </>
            ) : (
              "Get Token"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default TokenForm;
