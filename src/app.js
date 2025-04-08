const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

canvas.height = 400;
canvas.width = Math.min(window.screen.width - 100, 800);

window.addEventListener("resize", (e) => {
    canvas.width = Math.min(window.screen.width - 50, 800);
});

const player = {
    x: 190,
    y: 50,
    w: 30,
    h: 30,
    speed: 1,
    falling: true,
};

const platforms = [
    {
        x: 155,
        y: 305,
        w: 480,
        h: 8,
    },
    {
        x: 465,
        y: 205,
        w: 100,
        h: 8,
    },
    {
        x: 235,
        y: 205,
        w: 100,
        h: 8,
    },
    {
        x: 360,
        y: 125,
        w: 80,
        h: 8,
    },
    {
        x: 155,
        y: 305,
        w: 8,
        h: 200,
    },
    {
        x: 635,
        y: 305,
        w: 8,
        h: 200,
    },
];

const portals = [
    {
        x: 200,
        y: 100,
        w: 30,
        h: 30,
    },
];

const action = {
    up: false,
    down: false,
    left: false,
    right: false,
};

document.addEventListener("keydown", (e) => {
    if (
        [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "a",
            "d",
            "w",
            "s",
            " ",
        ].includes(e.key)
    ) {
        e.preventDefault();
    }
    if (e.key == "ArrowLeft" || e.key == "a") {
        action.left = true;
    }
    if (e.key == "ArrowRight" || e.key == "d") {
        action.right = true;
    }
    if (
        (e.key == "ArrowUp" || e.key == " " || e.key == "w") &&
        !player.falling
    ) {
        player.speed = -10;
        player.falling = true;
        action.up = true;
    }
    if (e.key == "ArrowDown" || e.key == "s") {
        action.down = true;
    }
});
document.addEventListener("keyup", (e) => {
    if (
        [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "a",
            "d",
            "w",
            "s",
            " ",
        ].includes(e.key)
    ) {
        e.preventDefault();
    }
    if (e.key == "ArrowLeft" || e.key == "a") {
        action.left = false;
    }
    if (e.key == "ArrowRight" || e.key == "d") {
        action.right = false;
    }
    if (e.key == "ArrowUp" || e.key == " " || e.key == "w") {
        action.up = false;
    }
    if (e.key == "ArrowDown" || e.key == "s") {
        action.down = false;
    }
});

function drawPlayer() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(player.x, player.y, player.w, player.h);
}

function drawPortals() {
    for (const portal of portals) {
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(portal.x, portal.y, portal.w, portal.h);
        ctx.fillStyle = "#000000";
    }
}

function drawPlatform() {
    for (const platform of platforms) {
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    }
}

function groundCheck() {
    if (player.y >= canvas.height - player.h) {
        player.falling = false;
        player.y = canvas.height - player.h;
    }
}

function portalCheck() {
    for (const portal of portals) {
        if (
            player.x + player.w > portal.x &&
            player.x < portal.x + portal.w &&
            player.y + player.h > portal.y &&
            player.y < portal.y
        ) {
            console.log("Warping!");
        }
    }
}

function platformCheck() {
    let onPlatform = false;

    for (const platform of platforms) {
        if (
            player.x + player.w > platform.x &&
            player.x < platform.x + platform.w &&
            player.y + player.h <= platform.y &&
            player.y + player.h + player.speed >= platform.y
        ) {
            if (!action.down && player.y + player.h <= platform.y) {
                player.falling = false;
                player.y = platform.y - player.h;
                player.speed = 0;
            }
            onPlatform = true;
        }
    }

    if (!onPlatform) {
        player.falling = true;
    }
}

function horizontalPlatformCheck() {
    for (const platform of platforms) {
        if (
            player.x + player.w > platform.x &&
            player.x < platform.x + platform.w &&
            player.y + player.h > platform.y &&
            player.y < platform.y + platform.h
        ) {
            if (player.x + player.w - 6 <= platform.x) {
                player.x = platform.x - player.w;
            } else if (player.x + 6 >= platform.x + platform.w) {
                player.x = platform.x + platform.w;
            }
        }
    }
}

function isOnPlatform() {
    for (const platform of platforms) {
        if (
            player.x + player.w > platform.x &&
            player.x < platform.x + platform.w &&
            Math.abs(player.y + player.h - platform.y) <= 0.5
        ) {
            return true;
        }
    }
    return false;
}

function move() {
    const moveSpeed = 5;
    const gravity = 0.4;

    if ((action.up || action.jump) && (!player.falling || isOnPlatform())) {
        player.speed = -10;
        player.falling = true;
        console.log("Jumping!");
    }
    if (action.left) {
        player.x -= moveSpeed;
        horizontalPlatformCheck();
    }
    if (action.right) {
        player.x += moveSpeed;
        horizontalPlatformCheck();
    }
    if (action.down) {
        player.falling = true;
    }
    if (player.falling) {
        player.speed += gravity;
        player.y += player.speed;
    }
    platformCheck();
    groundCheck();
    portalCheck();

    if (!isOnPlatform() && player.y + player.h < canvas.height) {
        player.falling = true;
    }
}

let lastTime = 0;

function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 16.67;
    lastTime = timestamp;

    move(deltaTime);
    drawPlayer();
    drawPlatform();
    drawPortals();
    window.requestAnimationFrame(gameLoop);
}

window.requestAnimationFrame(gameLoop);
