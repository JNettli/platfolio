import React, { useEffect } from "react";
import Phaser from "phaser";

function createTimeTrialGame(containerId = "phaser-container") {
    class TimeTrialScene extends Phaser.Scene {
        constructor() {
            super("TimeTrialScene");
        }
        preload() {}
        create() {
            this.add.text(100, 100, "🏁 Time Trial Level", {
                fontSize: "32px",
                fill: "#fff",
            });
        }
        update() {}
    }

    return new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: "#222",
        parent: containerId,
        scene: [TimeTrialScene],
    });
}

export default function TimeTrialGame() {
    useEffect(() => {
        const game = createTimeTrialGame();
        return () => game.destroy(true);
    }, []);

    return (
        <div
            id="phaser-container"
            style={{ margin: "auto", width: 800, height: 600 }}
        ></div>
    );
}
