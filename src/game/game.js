import assetManager from "./assetManager";
import phaserPlusPlus from "./ppp.js";

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
let mainBoard, points, main, data;

let gameData = {};

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

    let gridSize = 7; // default
  
    points = [10, 0, 200, 0, 210, 200, 0, 200];
    mainBoard = this.add.polygon(0, 0, points, 0x808080).setOrigin(0.5);

    mainBoard.onResizeCallback = function (w, h) {

        let scale = Math.max(w / this.width, h / this.height);

        if (!isLandscape) {
            this.setScale(scale * 0.4);
            this.y = h * 0.5;
            this.x = w * 0.5;
        } else {
            this.setScale(scale * 0.4);
            this.y = h * 0.5;
            this.x = w * 0.5;
        }
    }

    

    




}




function updateGame(time, delta) {
    currentTime = time;
    deltaTime = delta;

    main.update();
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