import { useEffect } from "react";
import Phaser from "phaser";

function createTimeTrialGame(containerId = "phaser-container") {
    class TimeTrialScene extends Phaser.Scene {
        constructor() {
            super("TimeTrialScene");
        }

        preload() {
            this.load.image("player", "/assets/img/github.png");
        }

        create() {
            this.startZone = this.add
                .rectangle(100, 300, 100, 100, 0x00ff00)
                .setOrigin(0.5);
            this.finishZone = this.add
                .rectangle(700, 300, 100, 100, 0xff0000)
                .setOrigin(0.5);

            this.player = this.physics.add.sprite(100, 300, "player");
            this.player.setScale(0.2);
            this.player.setCollideWorldBounds(true);

            this.keys = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D,
            });

            this.cursors = this.input.keyboard.createCursorKeys();

            this.timerStarted = false;
            this.timer = 0;
            this.timerText = this.add.text(10, 10, "Time: 0.00", {
                fontSize: "24px",
                fill: "#ffffff",
            });

            this.physics.add.overlap(
                this.player,
                this.finishZone,
                this.handleFinish,
                null,
                this
            );
        }

        update(time, delta) {
            const speed = 200;
            const body = this.player.body;

            body.setVelocity(0);
            if (this.cursors.left.isDown) {
                body.setVelocityX(-speed);
                this.startTimer();
            } else if (this.cursors.right.isDown) {
                body.setVelocityX(speed);
                this.startTimer();
            }

            if (this.cursors.up.isDown) {
                body.setVelocityY(-speed);
                this.startTimer();
            } else if (this.cursors.down.isDown) {
                body.setVelocityY(speed);
                this.startTimer();
            }

            if (this.timerStarted) {
                this.timer += delta / 1000;
                this.timerText.setText(`Time: ${this.timer.toFixed(2)}`);
            }

            if (this.cursors.left.isDown || this.keys.left.isDown) {
                body.setVelocityX(-speed);
                this.startTimer();
            } else if (this.cursors.right.isDown || this.keys.right.isDown) {
                body.setVelocityX(speed);
                this.startTimer();
            }

            if (this.cursors.up.isDown || this.keys.up.isDown) {
                body.setVelocityY(-speed);
                this.startTimer();
            } else if (this.cursors.down.isDown || this.keys.down.isDown) {
                body.setVelocityY(speed);
                this.startTimer();
            }
        }

        startTimer() {
            if (!this.timerStarted) {
                this.timerStarted = true;
            }
        }

        handleFinish(player, finishZone) {
            if (this.timerStarted) {
                this.timerStarted = false;
                this.timerText.setText(
                    `Finished! Time: ${this.timer.toFixed(2)}s`
                );
                this.physics.pause();
            }
        }
    }

    return new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: "#222",
        parent: containerId,
        physics: {
            default: "arcade",
            arcade: {
                debug: false,
            },
        },
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
