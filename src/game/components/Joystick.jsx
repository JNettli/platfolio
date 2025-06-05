import { useEffect, useRef } from "react";
import nipplejs from "nipplejs";

const Joystick = ({ onMove }) => {
    const zoneRef = useRef(null);
    const managerRef = useRef(null);

    useEffect(() => {
        const manager = nipplejs.create({
            zone: zoneRef.current,
            mode: "static",
            position: { left: "50%", bottom: "50%" },
            color: "white",
            size: 100,
        });

        managerRef.current = manager;

        manager.on("move", (evt, data) => {
            if (data?.vector) {
                onMove({
                    x: data.vector.x,
                    y: data.vector.y,
                });
            }
        });

        manager.on("end", () => {
            onMove({ x: 0, y: 0 });
        });

        return () => manager.destroy();
    }, [onMove]);

    return (
        <div
            ref={zoneRef}
            style={{
                position: "absolute",
                bottom: "10%",
                left: "5%",
                width: "40%",
                height: "40%",
                pointerEvents: "auto",
                touchAction: "none",
            }}
        />
    );
};

export default Joystick;
