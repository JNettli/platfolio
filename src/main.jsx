import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Hub3D from "./game/Hub3D";
import TimeTrialGame from "./game/TimeTrial";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Hub3D />} />
                <Route path="/time-trial" element={<TimeTrialGame />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
