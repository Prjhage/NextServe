import { useEffect, useState } from "react";
import TokenForm from "./components/TokenForm";
import TokenStatus from "./components/TokenStatus";

function App() {
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("tokenData");
    if (saved) {
      setTokenData(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        {!tokenData ? (
          <TokenForm setTokenData={setTokenData} />
        ) : (
          <TokenStatus setTokenData={setTokenData} tokenData={tokenData} />
        )}
      </div>
    </div>
  );
}

export default App;
