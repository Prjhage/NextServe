import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  withCredentials: true,
});

function TokenStatus({ tokenData }) {
  const { tokenNo } = tokenData;

  const [nowServing, setNowServing] = useState(null);
  const [nextTokenNo, setNextTokenNo] = useState(null);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showTurnToast, setShowTurnToast] = useState(false);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    fetch("http://localhost:4000/api/status", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setNowServing(data.currentServing);

        const nextWaiting = data.tokens.find((t) => t.status === "waiting");
        setNextTokenNo(nextWaiting ? nextWaiting.tokenNo : null);

        const ahead = data.tokens.filter(
          (t) => t.status === "waiting" && t.tokenNo < tokenNo
        ).length;
        setPeopleAhead(ahead);

        // already completed
        if (data.currentServing !== null && tokenNo < data.currentServing) {
          setCompleted(true);
          localStorage.removeItem("tokenData");
        }
      });
  }, [tokenNo]);

  /* ---------------- SOCKET UPDATES ---------------- */
  useEffect(() => {
    socket.on("queue-update", ({ currentServing, tokens }) => {
      const myToken = tokens.find((t) => t.tokenNo === tokenNo);

      // COMPLETED → show thank you
      if (
        (myToken && myToken.status === "completed") ||
        (currentServing === null && tokens.length === 0)
      ) {
        setCompleted(true);
        localStorage.removeItem("tokenData");
        return;
      }

      setNowServing(currentServing);

      const nextWaiting = tokens.find((t) => t.status === "waiting");
      setNextTokenNo(nextWaiting ? nextWaiting.tokenNo : null);

      const ahead = tokens.filter(
        (t) => t.status === "waiting" && t.tokenNo < tokenNo
      ).length;
      setPeopleAhead(ahead);

      /* -------- YOUR TURN NOTIFICATION (ONCE ONLY) -------- */
      const alreadyCalled = localStorage.getItem("token_called_" + tokenNo);

      if (tokenNo === currentServing && !alreadyCalled) {
        //  Mobile vibration
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }

        setShowTurnToast(true);
        localStorage.setItem("token_called_" + tokenNo, "true");
      }
    });

    return () => socket.off("queue-update");
  }, [tokenNo]);

  /* ---------------- AUTO HIDE TOAST ---------------- */
  useEffect(() => {
    if (showTurnToast) {
      const timer = setTimeout(() => {
        setShowTurnToast(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showTurnToast]);

  /* ---------------- THANK YOU PAGE ---------------- */
  if (completed) {
    return (
      <div className="text-center mt-5 fade-exit">
        <h2 className="mb-3">Thank You for Visiting</h2>
        <p className="fs-5">Please come again</p>
      </div>
    );
  }

  /* ---------------- STATUS LOGIC ---------------- */
  let statusText = "Waiting";
  let statusClass = "text-warning";

  if (tokenNo === nowServing) {
    statusText = "Being Served";
    statusClass = "text-success";
  } else if (tokenNo === nextTokenNo) {
    statusText = "Next – Please Get Ready";
    statusClass = "text-primary";
  }

  return (
    <div className="container mt-4">
      {/* TOAST */}
      {showTurnToast && (
        <div className="turn-toast">
          Your turn has started. Please go to the counter.
        </div>
      )}

      {/* TOKEN CARD */}
      <div className="row justify-content-center mb-4">
        <div className="col-md-6 col-lg-5">
          <div className="card stylish-card moving-border-shine text-center status-card">
            <div className="card-body py-5">
              <p className="text-uppercase text-light opacity-75 mb-2 fw-semibold">
                Your Token Number
              </p>

              <h1
                className="display-1 fw-bolder text-white"
                style={{
                  letterSpacing: "8px",
                  textShadow: "0 0 10px rgba(0,255,255,0.8)",
                }}
              >
                {tokenNo}
              </h1>

              <span
                className={` badge status-badge px-4 py-2 mt-4 fw-bold text-uppercase ${statusClass}`}
              >
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* INFO CARDS */}
      <div className="row text-center g-3">
        <div className="col-md-4">
          <div className="card p-3 status-info-card">
            <h6>Now Serving</h6>
            <h3>{nowServing || "-"}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3 status-info-card">
            <h6>People Ahead</h6>
            <h3>{peopleAhead}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3 status-info-card">
            <h6>Status</h6>
            <h3 className={statusClass}>{statusText}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenStatus;
