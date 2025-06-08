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

    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(location);
    const [nextPath, setNextPath] = useState(null);

    const transitionTo = (path) => {
        setLoading(true);
        setNextPath(path);
    };

    useEffect(() => {
        if (loading && nextPath) {
            const timeout = setTimeout(() => {
                navigate(nextPath);
                setCurrentLocation({ pathname: nextPath });
                setNextPath(null);
            }, 700);
            return () => clearTimeout(timeout);
        }
    }, [loading, nextPath, navigate]);

    useEffect(() => {
        if (!nextPath && loading) {
            const timeout = setTimeout(() => {
                setLoading(false);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [nextPath, loading]);

    return (
        <NavigationContext.Provider value={{ transitionTo }}>
            <TransitionScreen loading={loading} />
            <Routes location={currentLocation}>
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
