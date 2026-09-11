import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import useLenis from "./hooks/useLenis";
import "./styles/dashboard.css";
import "./styles/upload.css";
import "./styles/graph.css";
import "./styles/map.css";
import "./App.css";
import "./styles/art-direction.css";

function App() {
  useLenis();

  return (
    <BrowserRouter>
      <div className="app">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
