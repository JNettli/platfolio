import React, { createContext, useContext, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Routes,
    Route,
    useNavigate,
    useLocation,
} from "react-router-dom";
import Hub3D from "./game/Hub3D";
import TimeTrialGame from "./game/TimeTrial";
import TransitionScreen from "./game/components/TransitionScreen";

const NavigationContext = createContext();

export function useRouteTransition() {
    return useContext(NavigationContext);
}

function AppRouter() {
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [transitionPath, setTransitionPath] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [location]);

    const transitionTo = (path) => {
        setLoading(true);
        setTransitionPath(path);

        setTimeout(() => {
            navigate(path);
        }, 700);
    };

    return (
        <NavigationContext.Provider value={{ transitionTo }}>
            <TransitionScreen loading={loading} />
            <Routes location={location}>
                <Route path="/" element={<Hub3D />} />
                <Route path="/time-trial" element={<TimeTrialGame />} />
            </Routes>
        </NavigationContext.Provider>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AppRouter />
        </BrowserRouter>
    </React.StrictMode>
);
