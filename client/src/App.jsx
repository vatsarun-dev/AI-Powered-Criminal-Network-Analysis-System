import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import useLenis from "./hooks/useLenis";
import "./App.css";

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