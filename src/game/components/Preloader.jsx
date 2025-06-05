import { useEffect, useState } from "react";
import * as THREE from "three";

const Preloader = ({ onLoadComplete }) => {
    const [progress, setProgress] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const manager = new THREE.LoadingManager();

        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const percent = Math.round((itemsLoaded / itemsTotal) * 100);
            setProgress(percent);
        };

        manager.onLoad = () => {
            setTimeout(() => {
                setDone(true);
                onLoadComplete();
            }, 500);
        };

        window.loadingManager = manager;
    }, [onLoadComplete]);

    if (done) return null;

    return (
        <div className="loading-screen">
            <div className="spinner" />
            <p>Loading... {progress}%</p>
        </div>
    );
};

export default Preloader;
