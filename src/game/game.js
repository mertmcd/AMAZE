import assetManager from "./assetManager";
import phaserPlusPlus from "./ppp.js";
import button from "../utils/button";

if (![true].last) {
    Object.defineProperty(Array.prototype, "last", {
        get: function () {
            return this[this.length - 1];
        },
        set: function (e) {
            this[this.length - 1] = e;
        },
    });
}

if (![true, true].pairs) {
    Object.defineProperty(Array.prototype, "pairs", {
        value: function (func) {
            for (let i = 0; i < this.length - 1; i++) {
                for (let j = i; j < this.length - 1; j++) {
                    func([this[i], this[j + 1]]);
                }
            }
        },
    });
}

if (![true].random) {
    Object.defineProperty(Array.prototype, "random", {
        get: function () {
            return this[Math.floor(Math.random() * this.length)];
        },
    });
}

let gameScene = {
    key: "game-scene",
    active: true,
    create: createGame,
    update: updateGame,
};
let uiScene = {
    key: "ui-scene",
    active: true,
    create: createUi,
};

let lastWidth, lastHeight, aspectRatio;
let currentWidth, currentHeight, squareness, isLandscape;
let currentTime, deltaTime;
let mainBoard, ball, points, main, data;
let ballActive = false;
let gameData = {};
let lineArrayVertical = [];
let lineArrayHorizontal = [];

/** @type {Phaser.Scene} */
let scene;
/** @type {Phaser.Scene} */
let ui;

function createGame() {
    this.input.on("pointerdown", function () {
        main.interacted();
    });

    if (scene) {
        gameData.isRestarted = true;
        startGame.call(this);
        return;
    } else {
        gameData.isRestarted = false;
    }

    main = app.main;
    data = app.data;

    lastWidth = main.lastWidth;
    lastHeight = main.lastHeight;

    scene = this;
    scene.lastWidth = lastWidth;
    scene.lastHeight = lastHeight;

    assetManager.loadAssets.call(this, main, () => {
        phaserPlusPlus.upgradePhaser();
        startGame.bind(this)();
    });

    main.game.events.on("gameresized", function (w, h) {
        resizeAll(w, h);
    });

    main.game.events.on("postresized", function (w, h) { });

    main.game.events.on("gamecontinue", function (w, h) {
        if (data.soundEnabled) {
            if (app.type != "mobvista") {
                window.Howler && (window.Howler.mute(false));
            }
            main.game.soundOn = true;
        }
    });

    main.game.events.on("gamepaused", function (w, h) {
        if (data.soundEnabled) {
            if (app.type != "mobvista") {
                window.Howler && (window.Howler.mute(true));
            }
            main.game.soundOn = false;
        }
    });

    scene.add.text(0, 0, "", {
        fontFamily: "ui_font_1",
    });
}

function startGame() {
    if (data.soundEnabled) {
        if (app.type != "mobvista") app.playMusic();
        main.game.soundOn = true;
    }

    ///// C O D E   B E L O W \\\\\

    let darkGray = 0x4E4E58; // Color of the open mainboard
    let htmlDarkGray = '#4E4E58'; // Color of the text
    let offWhite = 0xFFFFFF; // Color of the closed mainboard
    let lightGray = 0x797B87; // Color of the grids.
    let mustardYellow = 0xF5AC3D; // Color of the ball and trail to be painted.
    let boardData = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];
    let rows = boardData.length;
    let columns = boardData[0].length;

    // DRAWING MAINBOARD

    // points = [10, 0, 200, 0, 210, 200, 0, 200];

    points = [10, 0, columns * 28.5, 0, columns * 28.5 + 10, rows * 30, 0, rows * 30];

    mainBoard = scene.add.polygon(0, 0, points, darkGray).setOrigin(0.5);

    mainBoard.onResizeCallback = function (w, h) {
        let scale = Math.min(w * 0.7 / this.width, h * 0.7 / this.height);
        this.setScale(scale);
        this.y = h * 0.5;
        this.x = w * 0.5;
    }

    //console.log(mainBoard);

    // TEXT AND BUTTON

    let text = this.add.text(0, 0, 'LEVEL 1', { fontFamily: 'ui_font_1', fontSize: 40, color: htmlDarkGray, strokeThickness: 1.5, stroke: htmlDarkGray }).setOrigin(0.5);

    text.onResizeCallback = function () {
        this.setScale(mainBoard.displayWidth / 3 / this.width);
        this.x = currentWidth / 2;
        this.y = mainBoard.getTopCenter().y / 2;
    }


    let btn = button.addButton(this, 'atlas', 'button', 'PLAY NOW', '#FFFFFF', main.gotoLink,);

    btn.onResizeCallback = function () {
        this.setScale(mainBoard.displayWidth / 2 / this.width);
        this.y = (mainBoard.getBottomCenter().y + currentHeight) / 2;
        this.x = currentWidth / 2;

    }

    let fixedPathData = [];


    for (let i = 0; i < mainBoard.pathData.length - 2; i += 2) {

        fixedPathData.push({
            x: mainBoard.pathData[i],
            y: mainBoard.pathData[i + 1]
        });
    }

    // LINE ADJUSTMENTS

    // Vertical Line Adjustments

    let upperWidth = Math.abs(fixedPathData[0].x - fixedPathData[1].x);
    let lowerWidth = Math.abs(fixedPathData[3].x - fixedPathData[2].x);

    let startPointTop = fixedPathData[0].x;
    let startPointBottom = fixedPathData[3].x;

    let upperInterval = upperWidth / columns;
    let lowerInterval = lowerWidth / columns;

    // Horizontal Line Adjustments

    let edgeHeight = Math.abs(fixedPathData[0].y - fixedPathData[3].y);
    let edgeWidth = Math.abs(fixedPathData[0].x - fixedPathData[3].x);

    let startPointLeft = fixedPathData[0].y;
    let startPointRight = fixedPathData[1].y;

    let sideIntervalY = edgeHeight / rows;
    let sideIntervalX = edgeWidth / rows;

    // DRAWING LINES

    // Drawing Vertical Lines

    for (let i = 0; i < columns + 1; i++) {

        let line = this.add.line(0, 0, startPointTop + upperInterval * i, 0 - 0.2, startPointBottom + lowerInterval * i, mainBoard.displayHeight + 0.2, lightGray).setOrigin(0);
        line.setLineWidth(0.4);
       // console.log(line.width, i);

        line.onResizeCallback = function (w, h) {
            this.setScale(mainBoard.scale);
            this.y = mainBoard.getBounds().y;
            this.x = mainBoard.getBounds().x;
           // console.log(mainBoard.getBounds().x)
        }
        lineArrayVertical.push(line);
        
    }
    //console.log(lineArrayVertical);
    lineArrayVertical[0].setVisible(false);
    lineArrayVertical[columns].setVisible(false);

    // Drawing Horizontal Lines

    for (let i = 0; i < rows + 1; i++) {

        let line = this.add.line(0, 0, startPointTop - sideIntervalX * i - 0.2, startPointLeft + sideIntervalY * i, startPointTop + upperWidth + sideIntervalX * i + 0.2, startPointRight + sideIntervalY * i, lightGray).setOrigin(0);
        line.setLineWidth(0.4);

        line.onResizeCallback = function (w, h) {
            this.setScale(mainBoard.scale);
            this.y = mainBoard.getBounds().y;
            this.x = mainBoard.getBounds().x;
        }
        line.onResizeCallback(scene.lastWidth, scene.lastHeight);
        lineArrayHorizontal.push(line);

        console.log(lineArrayHorizontal[i].geom.x1)
    }
    
    lineArrayHorizontal[0].setVisible(false);
    lineArrayHorizontal[rows].setVisible(false);


    // SETTING OF THE POINTS ARRAY OF INTERSECTED LINES

    let gridPoints = [];

    for (let i = 0; i < columns + 1; i++) {
        for (let j = 0; j < rows + 1; j++) {

            let out = [];
            let intersection = Phaser.Geom.Intersects.LineToLine(lineArrayVertical[i].geom, lineArrayHorizontal[j].geom, out);
            gridPoints.push(out);
        }
    }

    //console.log(gridPoints);

    // FILLING BOXES

    let graphics = this.add.graphics({ fillStyle: { color: offWhite } });

    graphics.onResizeCallback = function (w, h) {
        this.setScale(mainBoard.scale);
        this.y = mainBoard.getBounds().y;
        this.x = mainBoard.getBounds().x;
    }

    //console.log(boardData);
    for (let i = 0; i < rows; i++) {
        let startPoint = i;
        for (let j = 0; j < columns; j++) {
            let currentBox = boardData[i][j];
            let bottomBox = null;


            let upperLeftPoint = startPoint;
            // if (upperLeftPoint === rows + (i * rows)) continue;


            let upperRightPoint = upperLeftPoint + rows + 1;
            let lowerLeftPoint = upperLeftPoint + 1;
            let lowerRightPoint = upperRightPoint + 1;

            // If box is white
            if (!currentBox) {
                // color white
                graphics.fillPoints([gridPoints[upperLeftPoint], gridPoints[upperRightPoint], gridPoints[lowerRightPoint], gridPoints[lowerLeftPoint]], true);

                // draw white line top
                drawInsideBorder(gridPoints[upperLeftPoint], gridPoints[upperRightPoint], offWhite);

                if (i < rows - 1)
                    bottomBox = boardData[i + 1][j];

                // draw gray line bottom
                if (bottomBox)
                    drawInsideBorder(gridPoints[lowerLeftPoint], gridPoints[lowerRightPoint], lightGray);
            }
            startPoint += rows + 1;

            if (i === 0 && currentBox)
                drawTopBorder(gridPoints[upperLeftPoint], gridPoints[upperRightPoint], lightGray);

            if (j === 0 && currentBox) {
                if (i === rows - 1) {
                    gridPoints[lowerLeftPoint].y += 4;
                    drawLeftBorder(gridPoints[upperLeftPoint], gridPoints[lowerLeftPoint], lightGray);
                    gridPoints[lowerLeftPoint].y -= 4;
                }
                else
                    drawLeftBorder(gridPoints[upperLeftPoint], gridPoints[lowerLeftPoint], lightGray);
            }


            if (j === columns - 1 && currentBox) {
                if (i === rows - 1) {
                    gridPoints[lowerRightPoint].y += 4;
                    drawRightBorder(gridPoints[upperRightPoint], gridPoints[lowerRightPoint], lightGray);
                    gridPoints[lowerRightPoint].y -= 4;
                }
                else
                    drawRightBorder(gridPoints[upperRightPoint], gridPoints[lowerRightPoint], lightGray);
            }
        }
    }

    function drawInsideBorder(startPoint, endPoint, color) {
        let border = scene.add.line(0, 0, startPoint.x, startPoint.y - 2, endPoint.x, endPoint.y - 2, color).setOrigin(0);
        border.onResizeCallback = function (w, h) {
            this.setScale(mainBoard.scale);
            this.y = mainBoard.getBounds().y;
            this.x = mainBoard.getBounds().x;
        }
        border.setLineWidth(2);
    }

    function drawTopBorder(startPoint, endPoint, color) {
        let border = scene.add.line(0, 0, startPoint.x, startPoint.y - 2, endPoint.x, endPoint.y - 2, color).setOrigin(0);
        border.onResizeCallback = function (w, h) {
            this.setScale(mainBoard.scale);
            this.y = mainBoard.getBounds().y;
            this.x = mainBoard.getBounds().x;
        }
        border.setLineWidth(2);
    }

    function drawLeftBorder(startPoint, endPoint, color) {
        let border = scene.add.line(0, 0, startPoint.x - 1, startPoint.y - 4, endPoint.x - 1, endPoint.y - 4, color).setOrigin(0);
        border.onResizeCallback = function (w, h) {
            this.setScale(mainBoard.scale);
            this.y = mainBoard.getTopCenter().y;
            this.x = mainBoard.getTopLeft().x;
        }
        border.setLineWidth(2);
    }

    function drawRightBorder(startPoint, endPoint, color) {
        let border = scene.add.line(0, 0, startPoint.x + 1, startPoint.y - 4, endPoint.x + 1, endPoint.y - 4, color).setOrigin(0);
        border.onResizeCallback = function (w, h) {
            this.setScale(mainBoard.scale);
            this.y = mainBoard.getBounds().y;
            this.x = mainBoard.getBounds().x;
        }
        border.setLineWidth(2);
    }

    ball = this.add.image(0, 0, 'ball').setOrigin(0.5);
    ball.setTint(mustardYellow);

    ball.onResizeCallback = function (w, h) {

        let scale = Math.min(w / this.width, h / this.height);
        this.setScale(mainBoard.scale / 6);
        this.y = lineArrayHorizontal[3].y + this.displayHeight / 2;
        this.x = lineArrayVertical[3].x + this.displayWidth;

        ball.x = mainBoard.x - mainBoard.width * mainBoard.scale / 2 + this.displayWidth / 2 + upperInterval;
        ball.y = mainBoard.y - mainBoard.height * mainBoard.scale / 2 + this.displayHeight / 2;
       // console.log(scene.lastWidth, "scene.lastWidth");
       // console.log(lineArrayHorizontal[0].x, "lineArrayHorizontal[0]");
        setTimeout(() => {
           // console.log(lineArrayHorizontal[7].x, "lineArrayHorizontal[7]");
        }, 1000)
    }

}

function moveBall(direction) {

    let targetPosition = { x: ball.x, y: ball.y }

    switch (direction) {

        case "left":
            for (let i = 0; i < 7; i++) {

            }
            targetPosition.x = 0
            targetPosition.y = ball.y
            // cell boyama
            break;

        case "right":
            targetPosition.x = 400,
                targetPosition.y = ball.y
            // cell boyama
            break;

        case "up":
            targetPosition.x = ball.x,
                targetPosition.y = 0
            // cell boyama
            break;

        case "down":
            targetPosition.x = ball.x,
                targetPosition.y = 0
            // cell boyama
            break;

        default:
        // code block
    }

    let tween = scene.tweens.add({
        targets: ball,
        x: targetPosition.x,
        y: targetPosition.y,
        onComplete: function () {
            ballActive = false;
        },
        ease: 'Linear',
        duration: 100,
        repeat: 0,
        yoyo: false
    });

    // function mert (x, y) {
    //     x = currentWidth / 8;
    //     y = currentHeight / 10;
    // }


}

function updateGame(time, delta) {

    currentTime = time;
    deltaTime = delta;

    main.update();

    let pointer = this.input.activePointer;


    if (pointer.isDown) {
        console.log(pointer);

        if (pointer.downX + 10 - pointer.x < 0 && !ballActive) {
            ballActive = true;
            moveBall('right');
            console.log('right');
        }
        else if (pointer.downX - 10 - pointer.x > 0 && !ballActive) {
            ballActive = true;
            moveBall('left');
            console.log('left');

        }
        else if (pointer.downY + 10 - pointer.y > 0 && !ballActive) {
            ballActive = true;
            moveBall('up');
            console.log('up');

        }
        else if (pointer.downY - 10 - pointer.y < 0 && !ballActive) {
            ballActive = true;
            moveBall('down');
            console.log('down');

        }

    }
}

function resizeAll(w, h) {
    lastWidth = w;
    lastHeight = h;

    scene.lastWidth = lastWidth;
    scene.lastHeight = lastHeight;

    currentWidth = w;
    currentHeight = h;

    scene.resizeWidth = w;
    scene.resizeHeight = h;
    ui.resizeWidth = w;
    ui.resizeHeight = h;

    aspectRatio = lastWidth / lastHeight;
    squareness = aspectRatio > 1 ? 1 / aspectRatio : aspectRatio;
    isLandscape = w > h;

    scene.aspectRatio = aspectRatio;
    scene.squareness = squareness;
    scene.isLandscape = isLandscape;
    ui.aspectRatio = aspectRatio;
    ui.squareness = squareness;
    ui.isLandscape = isLandscape;

    scene.resizeManager.resize(w, h);
    ui.resizeManager.resize(w, h);
}

function createUi() {
    ui = this;
}

function initTimer(callback) {
    if (data.gameTimeEnabled) {
        scene.time.delayedCall(data.gameTime * 1000, () => {
            if (!data.gameFinished) {
                data.gameFinished = true;
                callback && callback();
            }
        });
    }
}

function initClickTracker(callback) {
    if (data.clickCounterEnabled) {
        data.clicked = 0;
        scene.input.on("pointerdown", () => {
            data.clicked++;
            if (data.clicked >= data.clickCount) {
                if (!data.gameFinished) {
                    data.gameFinished = true;
                    callback && callback();
                }
            }
        });
    }
}

function endGame() {
    scene.time.delayedCall(200, () => {
        if (data.endCardFullScreenClick) {
            scene.input.on("pointerdown", main.gotoLink);
        }
    });

    scene.time.delayedCall(2000, () => {
        if (data.goToMarketDirectly) {
            main.gotoLink();
        }
    });
}

export {
    gameScene,
    uiScene
};
