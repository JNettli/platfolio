import { useImperativeHandle, useState, forwardRef } from "react";

const HoverPromptsManager = forwardRef((props, ref) => {
    const [prompts, setPrompts] = useState({});

    useImperativeHandle(ref, () => ({
        showPrompt: ({ id, content, x, y }) => {
            setPrompts((prev) => ({
                ...prev,
                [id]: { content, x, y },
            }));
        },
        hidePrompt(id) {
            setPrompts((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        },
    }));

    return (
        <>
            {Object.entries(prompts).map(([id, { content, x, y }]) => (
                <div
                    key={id}
                    style={{
                        position: "absolute",
                        left: x,
                        top: y,
                        transform: "translate(-50%, -100%)",
                        backgroundColor: "rgba(0,0,0,0.6)",
                        padding: "16px 16px",
                        borderRadius: "5px",
                        color: "#E0FDFF",
                        fontFamily: "Segoe UI",
                        fontSize: "16px",
                        userSelect: "none",
                        pointerEvents: "auto",
                        whiteSpace: "nowrap",
                        display: "hidden",
                    }}
                >
                    {content}
                </div>
            ))}
        </>
    );
});

export default HoverPromptsManager;
