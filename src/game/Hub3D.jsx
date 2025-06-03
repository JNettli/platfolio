import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { RGBELoader } from "three/examples/jsm/Addons.js";

export default function Hub3D() {
    const mountRef = useRef(null);
    const promptRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const mountNode = mountRef.current;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const scene = new THREE.Scene();

        let camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountNode.appendChild(renderer.domElement);

        function onWindowResize() {
            width = window.innerWidth;
            height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
        }

        window.addEventListener("resize", onWindowResize, false);

        const rgbeLoader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        rgbeLoader.load("/assets/img/bg.hdr", function (texture) {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.environment = envMap;
            scene.background = envMap;

            texture.dispose();
            pmremGenerator.dispose();
        });

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 10);
        pointLight.position.set(0, 8, 0);
        scene.add(pointLight);

        // Floor
        const floorGeometry = new THREE.CircleGeometry(25, 64);
        const floorMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x888888,
            metalness: 1,
            roughness: 0,
        });

        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Platforms
        const platforms = [];
        let hasLeftGroundLevel = false;

        function createPlatform(x, y, z, width, height, depth) {
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
                color: 0x888888,
            });
            const platform = new THREE.Mesh(geometry, material);
            platform.position.set(x, y, z);
            scene.add(platform);
            platforms.push({
                mesh: platform,
                width,
                height,
                depth,
            });
            return platform;
        }

        // X, Y, Z, Width, Height, Depth
        /*
        createPlatform(0, 2.1, -5, 2, 0.2, 3);
        createPlatform(1.5, 2.5, 0, 1, 0.2, 1);
        createPlatform(-1, 4, 0, 1.5, 0.2, 2);
        */

        function checkPlatformCollision(player, platform, yVelocity) {
            const { mesh, width, height, depth } = platform;
            const px = player.position.x;
            const py = player.position.y - 0.5;
            const pz = player.position.z;

            const halfWidth = width / 2;
            const halfHeight = height / 2;
            const halfDepth = depth / 2;

            const platformTop = mesh.position.y + halfHeight;

            const inX =
                px >= mesh.position.x - halfWidth &&
                px <= mesh.position.x + halfWidth;
            const inZ =
                pz >= mesh.position.z - halfDepth &&
                pz <= mesh.position.z + halfDepth;
            const nearY = py <= platformTop + 0.1 && py >= platformTop - 0.3;

            if (inX && inZ && nearY && yVelocity < 0.05) {
                return platformTop;
            }
            return null;
        }

        // Starfield
        const starCount = 5000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];

        const minRadius = 5;
        const maxRadius = 50;
        const minY = 100;
        const maxY = 1000;

        for (let i = 0; i < starCount; i++) {
            let x, y, z;

            while (true) {
                const angle = Math.random() * 2 * Math.PI;
                const r = minRadius + Math.random() * (maxRadius - minRadius);
                x = r * Math.cos(angle);
                z = r * Math.sin(angle);
                y = minY + Math.random() * (maxY - minY);

                const distFromCenter = Math.sqrt(x * x + z * z);
                if (distFromCenter >= minRadius) break;
            }

            starPositions.push(x, y, z);
        }

        starGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(starPositions, 3)
        );

        const starMaterial = new THREE.PointsMaterial({
            color: 0xe0fdff,
            size: 0.05,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        const starSizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            starSizes[i] = 0.05 + Math.random() * 0.2;
        }
        starGeometry.setAttribute(
            "size",
            new THREE.BufferAttribute(starSizes, 1)
        );

        // Walls
        const walls = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 0.2, 32, 1, true),
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
            })
        );
        scene.add(walls);

        // Center Column
        const column = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 16),
            new THREE.MeshPhysicalMaterial({
                color: 0x444444,
                metalness: 1,
                roughness: 0,
            })
        );
        column.position.y = 0;
        scene.add(column);

        // Door
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2, 0.1),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        door.position.set(0, 1, -8);
        scene.add(door);

        // Gallery 1
        const holidaze = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 2, 3),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        holidaze.position.set(7.6, 1.5, 0);
        scene.add(holidaze);

        // Player
        const loader = new THREE.TextureLoader();
        const spriteTexture = loader.load("/assets/sprites/sprite_sheet.png");
        const frameWidth = 1 / 18;
        const frameHeight = 1;
        let frameSequence = [];
        let frameStep = 0;
        let currentDirection = "forward";

        spriteTexture.magFilter = THREE.NearestFilter;
        spriteTexture.wrapS = THREE.RepeatWrapping;
        spriteTexture.wrapT = THREE.RepeatWrapping;
        spriteTexture.repeat.set(frameWidth, frameHeight);

        const spriteMaterial = new THREE.MeshBasicMaterial({
            map: spriteTexture,
            transparent: true,
            side: THREE.DoubleSide,
        });

        spriteMaterial.alphaTest = 0.1;
        spriteMaterial.transparent = true;

        let animationTimer = 0;
        const baseFrameDelay = 150;
        const sprintFrameDelay = 115;

        const spriteGeometry = new THREE.PlaneGeometry(1, 1);
        const player = new THREE.Mesh(spriteGeometry, spriteMaterial);
        //player.position.set(0, 0.25, -2);
        player.position.set(0, 2, 2);

        // X, Y, Z, Width, Height, Depth
        createPlatform(0, 2.1, -5, 2, 0.2, 2);
        createPlatform(4, 3.5, 0, 1, 0.2, 1);
        createPlatform(-4.1, 4, 0, 1, 0.2, 1);

        createPlatform(0, 3, 4, 1, 0.2, 1);
        createPlatform(0, 6, 4, 1, 0.2, 1);
        createPlatform(0, 9, 4, 1, 0.2, 1);
        createPlatform(0, 12, 4, 1, 0.2, 1);
        createPlatform(0, 15, 4, 1, 0.2, 1);
        createPlatform(0, 18, 4, 1, 0.2, 1);
        createPlatform(0, 21, 4, 1, 0.2, 1);
        createPlatform(0, 24, 4, 1, 0.2, 1);
        createPlatform(0, 27, 4, 1, 0.2, 1);
        createPlatform(0, 30, 4, 1, 0.2, 1);
        createPlatform(0, 33, 4, 1, 0.2, 1);
        createPlatform(0, 36, 4, 1, 0.2, 1);
        createPlatform(0, 39, 4, 1, 0.2, 1);
        createPlatform(0, 42, 4, 1, 0.2, 1);
        createPlatform(0, 45, 4, 1, 0.2, 1);
        createPlatform(0, 48, 4, 1, 0.2, 1);
        createPlatform(0, 51, 4, 1, 0.2, 1);
        createPlatform(0, 54, 4, 1, 0.2, 1);
        createPlatform(0, 57, 4, 1, 0.2, 1);
        createPlatform(0, 60, 4, 1, 0.2, 1);
        createPlatform(0, 63, 4, 1, 0.2, 1);
        createPlatform(0, 66, 4, 1, 0.2, 1);
        createPlatform(0, 69, 4, 1, 0.2, 1);
        createPlatform(0, 72, 4, 1, 0.2, 1);
        createPlatform(0, 75, 4, 1, 0.2, 1);
        createPlatform(0, 78, 4, 1, 0.2, 1);
        createPlatform(0, 81, 4, 1, 0.2, 1);
        createPlatform(0, 84, 4, 1, 0.2, 1);
        createPlatform(0, 87, 4, 1, 0.2, 1);
        createPlatform(0, 90, 4, 1, 0.2, 1);
        createPlatform(0, 93, 4, 1, 0.2, 1);
        createPlatform(0, 96, 4, 1, 0.2, 1);
        createPlatform(0, 99, 4, 1, 0.2, 1);
        createPlatform(0, 102, 4, 1, 0.2, 1);

        createPlatform(0, 995, -2, 1, 0.2, 1);

        scene.add(player);

        // Interactable Box
        const interactBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        const interactButton = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8, 1, false),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );

        interactBox.position.set(0, 0.2, 4);
        interactButton.position.set(0, 0.4, 4);
        scene.add(interactBox);
        scene.add(interactButton);

        // Input
        const keysPressed = {};
        const speed = 0.05;
        const handleKeyDown = (e) => {
            e.preventDefault();
            keysPressed[e.key.toLowerCase()] = true;

            if (e.key.toLowerCase() === "e") {
                const dist = player.position.distanceTo(
                    interactButton.position
                );
                if (dist < 1) {
                    toggleWalls();
                }
            }
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
            const intersectDoor = raycaster.intersectObject(door);
            const intersectHolidaze = raycaster.intersectObject(holidaze);
            if (intersectDoor.length > 0) navigate("/time-trial");
            if (intersectHolidaze.length > 0)
                window.open("https://jnet-holidaze.netlify.app/");
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

        let wallsVisible = false;

        function toggleWalls() {
            wallsVisible = !wallsVisible;
            walls.scale.y = !wallsVisible ? 1 : 0.0001;
        }

        const UPDATE_INTERVAL = 1000 / 60;
        let lastTime = performance.now();
        let accumulator = 0;

        function update() {
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
                const maxRadius = 7.5;

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
                    const backwardOffset = moveVector
                        .clone()
                        .normalize()
                        .multiplyScalar(-0.2);
                    const spawnPosition = player.position
                        .clone()
                        .add(backwardOffset);
                    spawnPosition.y -= 0.35;

                    particle.position.copy(spawnPosition);

                    particle.material.transparent = true;
                    particle.material.opacity = 1;
                    particle.scale.set(0.01, 0.01, 0.01);

                    particle.userData = {
                        lifetime: 0,
                        maxLifetime: maxParticleLife,
                        maxScale: 0.01 + Math.random() * 0.1,
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

            let platformTopY = null;

            for (const platform of platforms) {
                const topY = checkPlatformCollision(
                    player,
                    platform,
                    yVelocity
                );
                if (topY !== null) {
                    platformTopY = topY;
                    break;
                }
            }

            const groundY = 0.5;

            if (platformTopY !== null) {
                player.position.y = platformTopY + 0.43;
                yVelocity = 0;
                isGrounded = true;
                jumpCount = 0;

                hasLeftGroundLevel = true;
            } else if (player.position.y <= groundY) {
                player.position.y = groundY;
                yVelocity = 0;
                isGrounded = true;
                jumpCount = 0;

                hasLeftGroundLevel = false;
            } else {
                isGrounded = false;
            }

            const targetCameraY = hasLeftGroundLevel
                ? player.position.y + 2
                : 2;
            camera.position.set(
                0,
                camera.position.y + (targetCameraY - camera.position.y) * 0.1,
                0
            );

            const lookAtTarget = player.position.clone();
            lookAtTarget.y = camera.position.y;
            cameraTarget.lerp(player.position, 0.1);
            camera.lookAt(cameraTarget);

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

            let direction = "idle";
            const isMoving = moveVector.length() > 0.001;

            if (isMoving) {
                const camForward = new THREE.Vector3(0, 0, -1)
                    .applyQuaternion(camera.quaternion)
                    .setY(0)
                    .normalize();
                const camRight = new THREE.Vector3()
                    .crossVectors(camForward, new THREE.Vector3(0, 1, 0))
                    .normalize();

                const moveDir = moveVector.clone().normalize();
                const forwardDot = moveDir.dot(camForward);
                const rightDot = moveDir.dot(camRight);
                if (keysPressed["a"] || keysPressed["arrowleft"]) {
                    direction = "left";
                } else if (keysPressed["d"] || keysPressed["arrowright"]) {
                    direction = "right";
                } else if (Math.abs(forwardDot) > Math.abs(rightDot)) {
                    direction = forwardDot > 0 ? "away" : "toward";
                }

                currentDirection = direction;
            } else {
                direction = currentDirection || "toward";
            }

            if (direction !== currentDirection) {
                currentDirection = direction;

                player.scale.x = direction === "right" ? -1 : 1;

                const animationFrames = {
                    toward: [3, 0, 4, 0],
                    away: [5, 1, 6, 1],
                    left: [7, 2, 8, 2],
                    right: [7, 2, 8, 2],
                    sprintToward: [10, 9, 11, 9],
                    sprintAway: [13, 12, 14, 12],
                    sprintLeft: [16, 15, 17, 16],
                    idle: {
                        toward: 0,
                        away: 1,
                        side: 2,
                    },
                };

                if (!isMoving) {
                    let frameIndex;
                    switch (direction) {
                        case "toward":
                            frameIndex = animationFrames.idle.toward;
                            break;
                        case "away":
                            frameIndex = animationFrames.idle.away;
                            break;
                        case "left":
                        case "right":
                            frameIndex = animationFrames.idle.side;
                            break;
                    }
                    setSpriteFrame(frameIndex);
                    frameStep = 0;
                    frameSequence = [];
                } else {
                    if (isSprinting) {
                        switch (direction) {
                            case "toward":
                                frameSequence = animationFrames.sprintToward;
                                break;
                            case "away":
                                frameSequence = animationFrames.sprintAway;
                                break;
                            case "left":
                            case "right":
                                frameSequence = animationFrames.sprintLeft;
                                break;
                        }
                    } else {
                        if (direction === "toward" || direction === "away") {
                            frameSequence = animationFrames[direction];
                        } else {
                            frameSequence = animationFrames.left;
                        }
                    }
                    frameStep = 0;
                    setSpriteFrame(frameSequence[frameStep]);
                    frameStep = (frameStep + 1) % frameSequence.length;
                }

                animationTimer = 0;
            }
            const currentFrameDelay = keysPressed["shift"]
                ? sprintFrameDelay
                : baseFrameDelay;

            animationTimer += UPDATE_INTERVAL;
            if (animationTimer >= currentFrameDelay) {
                animationTimer = 0;

                const animationFrames = {
                    toward: [3, 0, 4, 0],
                    away: [5, 1, 6, 1],
                    left: [7, 2, 8, 2],
                    right: [7, 2, 8, 2],
                    sprintToward: [10, 9, 11, 9],
                    sprintAway: [13, 12, 14, 12],
                    sprintLeft: [16, 15, 17, 15],
                    idle: {
                        toward: 0,
                        away: 1,
                        side: 2,
                    },
                };

                let frameIndex = 0;

                if (!isMoving) {
                    switch (direction) {
                        case "toward":
                            frameIndex = animationFrames.idle.toward;
                            break;
                        case "away":
                            frameIndex = animationFrames.idle.away;
                            break;
                        case "left":
                        case "right":
                            frameIndex = animationFrames.idle.side;
                            break;
                    }
                    frameStep = 0;
                    frameSequence = [];
                } else {
                    if (isSprinting) {
                        switch (direction) {
                            case "toward":
                                frameSequence = animationFrames.sprintToward;
                                break;
                            case "away":
                                frameSequence = animationFrames.sprintAway;
                                break;
                            case "left":
                            case "right":
                                frameSequence = animationFrames.sprintLeft;
                                break;
                        }
                    } else {
                        if (direction === "toward" || direction === "away") {
                            frameSequence = animationFrames[direction];
                        } else {
                            frameSequence = animationFrames.left;
                        }
                    }
                    frameIndex = frameSequence[frameStep];
                    frameStep = (frameStep + 1) % frameSequence.length;
                }

                if (direction === "right") {
                    player.scale.x = -1;
                } else {
                    player.scale.x = 1;
                }

                setSpriteFrame(frameIndex);
            }

            function setSpriteFrame(index) {
                const columns = 18;
                const frameWidth = 1 / columns;

                spriteTexture.repeat.set(frameWidth, 1);
                spriteTexture.offset.x = index * frameWidth;
                spriteTexture.offset.y = 0;
            }

            const lookAt = new THREE.Vector3().copy(camera.position);
            lookAt.y = player.position.y;
            player.lookAt(lookAt);
        }

        function render() {
            animateStars(performance.now());

            const distanceToButton = player.position.distanceTo(
                interactButton.position
            );

            if (distanceToButton < 1) {
                promptRef.current.style.display = "block";

                const vector = interactButton.position.clone();
                vector.project(camera);

                const x = (vector.x * 0.5 + 0.5) * width;
                const y = (vector.y * -0.5 + 0.5) * height;

                promptRef.current.style.left = `${x}px`;
                promptRef.current.style.top = `${y}px`;
            } else {
                promptRef.current.style.display = "none";
            }

            renderer.render(scene, camera);
        }

        function animateStars(time) {
            starMaterial.opacity = 0.6 + 0.2 * Math.sin(time * 0.005);
        }

        function gameLoop(currentTime) {
            requestAnimationFrame(gameLoop);

            let delta = currentTime - lastTime;
            lastTime = currentTime;
            accumulator += delta;

            while (accumulator >= UPDATE_INTERVAL) {
                update();
                accumulator -= UPDATE_INTERVAL;
            }

            render();
        }

        gameLoop(performance.now());

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
                overflow: "hidden",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
            }}
        >
            <div
                ref={promptRef}
                id="interactionPrompt"
                style={{
                    position: "absolute",
                    color: "#E0FDFF",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    padding: "6px 10px",
                    borderRadius: "5px",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "16px",
                    pointerEvents: "none",
                    display: "none",
                    transform: "translate(-50%, -100%)",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                }}
            >
                Press E to remove walls
            </div>
        </div>
    );
}
