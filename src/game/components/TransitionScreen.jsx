import { useEffect, useState } from "react";
import "./TransitionScreen.css";

export default function TransitionScreen({ loading }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!loading) {
            const timeout = setTimeout(() => setVisible(false), 700);
            return () => clearTimeout(timeout);
        } else {
            setVisible(true);
        }
    }, [loading]);

    return visible ? (
        <div
            className={`transition-screen ${loading ? "fade-in" : "fade-out"}`}
        >
            <div className="loading-text">Loading...</div>
        </div>
    ) : null;
}
