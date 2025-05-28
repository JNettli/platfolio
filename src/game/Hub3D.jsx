import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

export default function Hub3D() {
    const mountRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const mountNode = mountRef.current;
        const width = 1280;
        const height = 720;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111122);

        const camera = new THREE.PerspectiveCamera(
            90,
            width / height,
            0.1,
            100
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountNode.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 100);
        pointLight.position.set(0, 8, 0);
        scene.add(pointLight);

        // Floor
        const floor = new THREE.Mesh(
            new THREE.CircleGeometry(5, 64),
            new THREE.MeshStandardMaterial({
                color: 0x605047,
                side: THREE.DoubleSide,
            })
        );
        floor.rotation.x = Math.PI / 2;
        scene.add(floor);

        // Walls
        const walls = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 4, 32, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0x8b5a2b,
                side: THREE.BackSide,
            })
        );
        walls.position.y = 1.5;
        scene.add(walls);

        // Roof
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(5, 6, 64, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0xe0fdff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
            })
        );
        roof.position.y = 6.5;
        scene.add(roof);

        // Center Column
        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 0.5, 32, 1, false),
            new THREE.MeshStandardMaterial({
                color: 0x123123,
                side: THREE.DoubleSide,
            })
        );
        column.position.y = 0;
        scene.add(column);

        // Door
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        door.position.set(0, 1, -4.9);
        scene.add(door);

        // Player
        const player = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 1, 32, 1, false),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        player.position.set(0, 0.5, -2);
        scene.add(player);

        // Input
        const keysPressed = {};
        const speed = 0.05;
        const handleKeyDown = (e) => {
            e.preventDefault();
            keysPressed[e.key.toLowerCase()] = true;
        };
        const handleKeyUp = (e) => {
            e.preventDefault();
            keysPressed[e.key.toLowerCase()] = false;
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const onClick = (event) => {
            const bounds = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
            mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(door);
            if (intersects.length > 0) navigate("/time-trial");
        };
        window.addEventListener("click", onClick);

        const particles = [];
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xf1f1f1,
        });
        const particleGeometry = new THREE.SphereGeometry(2, 8, 8);
        const maxParticleLife = 25;

        let cameraTarget = player.position.clone();
        let yVelocity = 0;
        let isGrounded = false;
        let jumpCount = 0;
        let spacePressedLastFrame = false;
        const jumpStrength = 0.16;
        const gravity = -0.008;

        const animate = () => {
            requestAnimationFrame(animate);

            const toPlayer = new THREE.Vector3()
                .copy(player.position)
                .setY(0)
                .normalize();

            const right = new THREE.Vector3()
                .crossVectors(toPlayer, new THREE.Vector3(0, 1, 0))
                .normalize();

            const forward = new THREE.Vector3()
                .crossVectors(new THREE.Vector3(0, 1, 0), right)
                .normalize();

            const moveVector = new THREE.Vector3();
            const isSprinting = keysPressed["shift"];
            const currentSpeed = isSprinting ? speed * 2 : speed;

            if (keysPressed["w"] || keysPressed["arrowup"])
                moveVector.add(forward);
            if (keysPressed["s"] || keysPressed["arrowdown"])
                moveVector.sub(forward);
            if (keysPressed["a"] || keysPressed["arrowleft"])
                moveVector.sub(right);
            if (keysPressed["d"] || keysPressed["arrowright"])
                moveVector.add(right);

            if (moveVector.length() > 0) {
                moveVector.normalize().multiplyScalar(currentSpeed);
                const newPosition = player.position.clone().add(moveVector);

                const minRadius = 1 + 0.25;
                const maxRadius = 4.5;

                const currentRadius = player.position.clone().setY(0).length();

                let newRadius = newPosition.clone().setY(0).length();

                const forwardDot = moveVector.dot(forward);
                const rightDot = moveVector.dot(right);

                if (Math.abs(forwardDot) < 0.01 && Math.abs(rightDot) > 0) {
                    const dir = newPosition.clone().setY(0).normalize();
                    newPosition.x = dir.x * currentRadius;
                    newPosition.z = dir.z * currentRadius;
                    newRadius = currentRadius;
                }

                if (newRadius < minRadius) {
                    const pushOut = newPosition
                        .clone()
                        .setY(0)
                        .normalize()
                        .multiplyScalar(minRadius);
                    newPosition.x = pushOut.x;
                    newPosition.z = pushOut.z;
                }

                if (newRadius > maxRadius) {
                    const toCenter = newPosition.clone().setY(0).normalize();
                    const tangent = new THREE.Vector3(
                        -toCenter.z,
                        0,
                        toCenter.x
                    );
                    const slide = tangent.multiplyScalar(
                        moveVector.dot(tangent)
                    );
                    const inwardPull = toCenter.multiplyScalar(
                        -(newRadius - maxRadius) * 0.1
                    );
                    newPosition.copy(
                        player.position.clone().add(slide).add(inwardPull)
                    );
                }

                player.position.copy(newPosition);

                if (isSprinting) {
                    const particle = new THREE.Mesh(
                        particleGeometry,
                        particleMaterial.clone()
                    );
                    particle.position.copy(player.position);
                    particle.position.y -= 0.2;
                    particle.material.transparent = true;
                    particle.material.opacity = 1;
                    particle.scale.set(0.01, 0.01, 0.01);

                    particle.userData = {
                        lifetime: 0,
                        maxLifetime: maxParticleLife,
                        maxScale: 0.05 + Math.random() * 0.075,
                    };

                    scene.add(particle);
                    particles.push(particle);
                }
            }

            if (keysPressed[" "] && !spacePressedLastFrame) {
                if (isGrounded || jumpCount < 2) {
                    yVelocity = jumpStrength;
                    isGrounded = false;
                    jumpCount++;
                }
            }
            spacePressedLastFrame = keysPressed[" "] ?? false;
            yVelocity += gravity;
            player.position.y += yVelocity;

            if (player.position.y <= 0.25) {
                player.position.y = 0.25;
                yVelocity = 0;
                isGrounded = true;
                jumpCount = 0;
            }

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.userData.lifetime++;

                const t = p.userData.lifetime / p.userData.maxLifetime;

                if (t < 0.5) {
                    const growT = t / 0.5;
                    const scale = p.userData.maxScale * growT;
                    p.scale.set(scale, scale, scale);
                } else {
                    p.scale.set(
                        p.userData.maxScale,
                        p.userData.maxScale,
                        p.userData.maxScale
                    );
                }

                p.material.opacity = 1 - t;

                if (p.userData.lifetime >= p.userData.maxLifetime) {
                    scene.remove(p);
                    particles.splice(i, 1);
                    p.geometry.dispose();
                    p.material.dispose();
                }
            }

            cameraTarget.lerp(player.position, 0.1);
            camera.position.set(0, 2, 0);
            camera.lookAt(cameraTarget);

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            window.removeEventListener("click", onClick);
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            if (mountNode && renderer.domElement.parentNode === mountNode) {
                mountNode.removeChild(renderer.domElement);
            }
        };
    }, [navigate]);

    return (
        <div
            ref={mountRef}
            style={{
                width: "1280px",
                height: "720px",
                overflow: "hidden",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
            }}
        />
    );
}
