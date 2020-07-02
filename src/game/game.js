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
let gameFinished;
let lastWidth, lastHeight, aspectRatio;
let currentWidth, currentHeight, squareness, isLandscape;
let currentTime, deltaTime;
let mainBoard, text, text2, btn, hand, ball, points, main, data;
let ballActive = false;
let fillBox;
let fillPath;
let upperInterval;
let gameData = {};
let lineArrayVertical = [];
let lineArrayHorizontal = [];
let gridPoints = [];
let rows;
let prevX;
let prevY;
let columns;
let currentBox;
let bottomBox;
let targetPosition = {};
let boxPositions = [];
let boardData;
let currentBallPosition = {column: 0, row: 0};
let darkGray = 0x4e4e58; // Color of the ball path
let htmlDarkGray = "#4E4E58"; // Color of the text
let offWhite = 0xffffff; // Color of the closed paths
let lightGray = 0x797b87; // Color of the grids.
let mustardYellow = 0xf5ac3d; // Color of the ball and trail to be painted.
let htmlRed = "#BD0606";
let orange = 0xff863d;
let ballParticle;
let boxCount;

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

  main.game.events.on("postresized", function (w, h) {});

  main.game.events.on("gamecontinue", function (w, h) {
    if (data.soundEnabled) {
      if (app.type != "mobvista") {
        window.Howler && window.Howler.mute(false);
      }
      main.game.soundOn = true;
    }
  });

  main.game.events.on("gamepaused", function (w, h) {
    if (data.soundEnabled) {
      if (app.type != "mobvista") {
        window.Howler && window.Howler.mute(true);
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

  boardData = [
    [1, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0],
    [1, 0, 0, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 0, 0],
  ];

  rows = boardData.length;
  columns = boardData[0].length;

  // DRAW AND SCALE MAINBOARD

  // points = [10, 0, 200, 0, 210, 200, 0, 200];

  points = [10, 0, columns * 28.5, 0, columns * 28.5 + 10, rows * 30, 0, rows * 30];

  mainBoard = scene.add.polygon(0, 0, points, darkGray).setOrigin(0.5);

  mainBoard.onResizeCallback = function (w, h) {
    let scale = Math.min((w * 0.7) / this.width, (h * 0.7) / this.height);
    this.setScale(scale);
    this.y = h * 0.5;
    this.x = w * 0.5;
  };

  // ADD TEXTS

  text = this.add
    .text(0, 0, "LEVEL 1", {
      fontFamily: "ui_font_1",
      fontSize: 40,
      color: htmlDarkGray,
      strokeThickness: 1.5,
      stroke: htmlDarkGray,
    })
    .setOrigin(0.5);

  text.onResizeCallback = function () {
    this.setScale(mainBoard.displayWidth / 4 / this.width);
    this.x = currentWidth / 2;
    this.y = mainBoard.getTopCenter().y / 2;
  };

  text2 = this.add
    .text(0, 0, "TAP TO NEXT LEVEL", {
      fontFamily: "ui_font_1",
      fontSize: 50,
      color: htmlRed,
      strokeThickness: 1.5,
      stroke: htmlRed,
    })
    .setOrigin(0.5)
    .setInteractive();
  text2.setVisible(false);
  text2.on("pointerdown", function () {
    main.gotoLink();
  });

  text2.onResizeCallback = function () {
    this.setScale(mainBoard.displayWidth / this.width);
    this.y = (mainBoard.getBottomCenter().y + currentHeight) / 2;
    this.x = currentWidth / 2;
  };

  // ADD BUTTON

  btn = button.addButton(this, "atlas", "button", "PLAY NOW", "#FFFFFF", main.gotoLink);

  btn.onResizeCallback = function () {
    this.setScale(mainBoard.displayWidth / this.width);
    this.y = (mainBoard.getBottomCenter().y + currentHeight) / 2;
    this.x = currentWidth / 2;
  };

  // BUTTON TWEENS

  let buttonTween = scene.tweens.add({
    targets: btn,
    duration: 400,
    ease: "Linear",
    repeat: -1,
    scaleX: {from: btn.scaleX * 0.6, to: btn.scaleX * 0.65},
    scaleY: {from: btn.scaleY * 0.6, to: btn.scaleY * 0.65},
    yoyo: true,
  });

  let textTween = scene.tweens.add({
    targets: text2,
    duration: 400,
    ease: "Linear",
    repeat: -1,
    scaleX: {from: text2.scaleX, to: text2.scaleX * 1.1},
    scaleY: {from: text2.scaleY, to: text2.scaleY * 1.1},
    yoyo: true,
  });

  //////////////////

  let fixedPathData = [];

  for (let i = 0; i < mainBoard.pathData.length - 2; i += 2) {
    fixedPathData.push({
      x: mainBoard.pathData[i],
      y: mainBoard.pathData[i + 1],
    });
  }

  // LINE ADJUSTMENTS

  // Vertical Line Adjustments

  let upperWidth = Math.abs(fixedPathData[0].x - fixedPathData[1].x);
  let lowerWidth = Math.abs(fixedPathData[3].x - fixedPathData[2].x);

  let startPointTop = fixedPathData[0].x;
  let startPointBottom = fixedPathData[3].x;

  upperInterval = upperWidth / columns;
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
    let line = this.add
      .line(0, 0, startPointTop + upperInterval * i, -0.2, startPointBottom + lowerInterval * i, mainBoard.displayHeight + 0.2, lightGray)
      .setDepth(1)
      .setOrigin(0);
    line.setLineWidth(0.3);

    line.onResizeCallback = function (w, h) {
      this.setScale(mainBoard.scale);
      this.y = mainBoard.getTopLeft().y;
      this.x = mainBoard.getBounds().x;
    };
    lineArrayVertical.push(line);
  }
  // console.log(lineArrayVertical);0
  lineArrayVertical[0].setVisible(false);
  lineArrayVertical[columns].setVisible(false);

  // Drawing Horizontal Lines

  for (let i = 0; i < rows + 1; i++) {
    let line = this.add
      .line(0, 0, startPointTop - sideIntervalX * i - 0.2, startPointLeft + sideIntervalY * i, startPointTop + upperWidth + sideIntervalX * i + 0.2, startPointRight + sideIntervalY * i, lightGray)
      .setDepth(1)
      .setOrigin(0);
    line.setLineWidth(0.3);

    line.onResizeCallback = function (w, h) {
      this.setScale(mainBoard.scale);

      this.y = mainBoard.getBounds().y;
      this.x = mainBoard.getBounds().x;
    };
    line.onResizeCallback(scene.lastWidth, scene.lastHeight);
    lineArrayHorizontal.push(line);
  }

  lineArrayHorizontal[0].setVisible(false);
  lineArrayHorizontal[rows].setVisible(false);

  // SETTING OF THE POINTS ARRAY OF INTERSECTED LINES

  for (let i = 0; i < columns + 1; i++) {
    for (let j = 0; j < rows + 1; j++) {
      let out = [];
      let intersection = Phaser.Geom.Intersects.LineToLine(lineArrayVertical[i].geom, lineArrayHorizontal[j].geom, out);
      gridPoints.push(out);
    }
  }

  // FILLING BOXES AND PATHS

  fillBox = this.add.graphics({fillStyle: {color: offWhite}}).setDepth(1);

  fillBox.onResizeCallback = function (w, h) {
    this.setScale(mainBoard.scale);
    this.y = mainBoard.getBounds().y;
    this.x = mainBoard.getBounds().x;
  };

  fillPath = this.add.graphics({fillStyle: {color: mustardYellow}});

  fillPath.onResizeCallback = function (w, h) {
    this.setScale(mainBoard.scale);
    this.y = mainBoard.getBounds().y;
    this.x = mainBoard.getBounds().x;
  };

  for (let i = 0; i < rows; i++) {
    let startPoint = i;
    let row = [];
    for (let j = 0; j < columns; j++) {
      currentBox = boardData[i][j];
      bottomBox = null;

      let upperLeftPoint = startPoint;

      let upperRightPoint = upperLeftPoint + rows + 1;
      let lowerLeftPoint = upperLeftPoint + 1;
      let lowerRightPoint = upperRightPoint + 1;

      let box = {
        value: currentBox,
        upperLeftPoint: gridPoints[upperLeftPoint],
        upperRightPoint: gridPoints[upperRightPoint],
        lowerLeftPoint: gridPoints[lowerLeftPoint],
        lowerRightPoint: gridPoints[lowerRightPoint],
        color: i === 0 && j === 0, // variable
      };
      row.push(box);

      // If box is white:

      if (!currentBox) {
        // Fill White
        fillBox.fillPoints([gridPoints[upperLeftPoint], gridPoints[upperRightPoint], gridPoints[lowerRightPoint], gridPoints[lowerLeftPoint]], true);
        // Shift White Line Top
        drawInsideBorder(gridPoints[upperLeftPoint], gridPoints[upperRightPoint], offWhite);
        if (i < rows - 1) bottomBox = boardData[i + 1][j];
        // Shift Gray Line Bottom
        if (bottomBox) drawInsideBorder(gridPoints[lowerLeftPoint], gridPoints[lowerRightPoint], lightGray);
      }

      // DRAWING BORDERS OF THE MAINBOARD

      startPoint += rows + 1;

      if (i === 0 && currentBox) drawTopBorder(gridPoints[upperLeftPoint], gridPoints[upperRightPoint], lightGray);

      if (j === 0 && currentBox) {
        if (i === rows - 1) {
          gridPoints[lowerLeftPoint].y += 4;
          drawLeftBorder(gridPoints[upperLeftPoint], gridPoints[lowerLeftPoint], lightGray);
          gridPoints[lowerLeftPoint].y -= 4;
        } else drawLeftBorder(gridPoints[upperLeftPoint], gridPoints[lowerLeftPoint], lightGray);
      }

      if (j === columns - 1 && currentBox) {
        if (i === rows - 1) {
          gridPoints[lowerRightPoint].y += 4;
          drawRightBorder(gridPoints[upperRightPoint], gridPoints[lowerRightPoint], lightGray);
          gridPoints[lowerRightPoint].y -= 4;
        } else drawRightBorder(gridPoints[upperRightPoint], gridPoints[lowerRightPoint], lightGray);
      }
    }

    boxPositions.push(row);
  }

  function drawInsideBorder(startPoint, endPoint, color) {
    let border = scene.add
      .line(0, 0, startPoint.x, startPoint.y - 2, endPoint.x, endPoint.y - 2, color)
      .setOrigin(0)
      .setDepth(1);
    border.onResizeCallback = function (w, h) {
      this.setScale(mainBoard.scale);
      this.y = mainBoard.getBounds().y;
      this.x = mainBoard.getBounds().x;
    };
    border.setLineWidth(2);
  }

  function drawTopBorder(startPoint, endPoint, color) {
    let border = scene.add.line(0, 0, startPoint.x, startPoint.y - 2, endPoint.x, endPoint.y - 2, color).setOrigin(0);

    border.onResizeCallback = function (w, h) {
      this.setScale(mainBoard.scale);
      this.y = mainBoard.getBounds().y;
      this.x = mainBoard.getBounds().x;
    };
    border.setLineWidth(2);
  }

  function drawLeftBorder(startPoint, endPoint, color) {
    let border = scene.add.line(0, 0, startPoint.x - 1, startPoint.y - 4, endPoint.x - 1, endPoint.y - 4, color).setOrigin(0);

    border.onResizeCallback = function (w, h) {
      this.setScale(mainBoard.scale);
      this.y = mainBoard.getTopCenter().y;
      this.x = mainBoard.getTopLeft().x;
    };
    border.setLineWidth(2);
  }

  function drawRightBorder(startPoint, endPoint, color) {
    let border = scene.add.line(0, 0, startPoint.x + 1, startPoint.y - 4, endPoint.x + 1, endPoint.y - 4, color).setOrigin(0);
    //.setDepth(1);
    border.onResizeCallback = function (w, h) {
      this.setScale(mainBoard.scale);
      this.y = mainBoard.getBounds().y;
      this.x = mainBoard.getBounds().x;
    };
    border.setLineWidth(2);
  }

  // ADD BALL

  ball = this.add.image(0, 0, "ball").setOrigin(0.5);
  ball.setTint(mustardYellow);
  ball.lastPosition = boxPositions[0][0];
  console.log(boxPositions[6][0].upperRightPoint.x);

  fillPath.fillPoints([ball.lastPosition.upperLeftPoint, ball.lastPosition.upperRightPoint, ball.lastPosition.lowerRightPoint, ball.lastPosition.lowerLeftPoint], true);

  ball.onResizeCallback = function () {
    this.setScale(mainBoard.scale / 6);
    this.lastScale = this.scale;
    this.y = mainBoard.y - mainBoard.displayHeight / 2 + (ball.lastPosition.lowerLeftPoint.y * mainBoard.scale + ball.lastPosition.upperLeftPoint.y * mainBoard.scale) / 2;
    this.x = mainBoard.x - mainBoard.displayWidth / 2 + (ball.lastPosition.upperLeftPoint.x * mainBoard.scale + ball.lastPosition.upperRightPoint.x * mainBoard.scale) / 2;
  };

  hand = this.add.image(0, 0, "hand").setOrigin(0.5).setDepth(1);
  hand.setTintFill(offWhite);

  hand.onResizeCallback = function () {
    this.setScale(mainBoard.scale / 8);
    this.y = ball.getCenter().y + ball.displayHeight / 2;
    this.x = ball.getCenter().x + ball.displayWidth / 6;

    let handTween = scene.tweens.add({
      targets: hand,
      x: hand.x + 200,
      y: hand.y,
      alpha: {from: 1, to: 0},
      ease: "Linear",

      duration: 1000,
      repeat: -1,
      yoyo: false,
    });

    scene.tweens.killTweensOf(hand);
  };
}

function moveBall(direction) {
  let targetIndex;
  let position;
  let row;
  let column;

  hand.setVisible(false);

  if (ballActive) return window.b();
  ballActive = true;

  boxCount = 0;

  switch (direction) {
    case "left":
      row = boxPositions[currentBallPosition.row];
      targetIndex = 0;

      for (let i = currentBallPosition.column - 1; i > 0; i--) {
        let box = row[i];

        if (box.value === 0) {
          targetIndex = i + 1;
          break;
        }
      }
      targetPosition = {x: ball.x, y: ball.y};
      boxCount = Math.abs(currentBallPosition.column - targetIndex);
      position = boxPositions[currentBallPosition.row][targetIndex];
      targetPosition.x = ((position.lowerRightPoint.x + position.lowerLeftPoint.x) / 2) * mainBoard.scale + mainBoard.x - mainBoard.displayWidth / 2;
      targetPosition.y = ball.y;

      break;

    case "right":
      row = boxPositions[currentBallPosition.row];
      targetIndex = row.length - 1;

      for (let i = currentBallPosition.column; i < row.length; i++) {
        let box = row[i];

        if (box.value === 0) {
          targetIndex = i - 1;
          break;
        }
      }
      boxCount = Math.abs(currentBallPosition.column - targetIndex);
      position = boxPositions[currentBallPosition.row][targetIndex];
      targetPosition.x = ((position.upperLeftPoint.x + position.upperRightPoint.x) / 2) * mainBoard.scale + mainBoard.x - mainBoard.displayWidth / 2;

      targetPosition.y = ball.y;

      break;

    case "down":
      column = boxPositions;
      targetIndex = column.length - 1;

      for (let i = currentBallPosition.row; i < column.length; i++) {
        let box = column[i][currentBallPosition.column];
        if (box.value === 0) {
          targetIndex = i - 1;
          break;
        }
      }

      boxCount = Math.abs(currentBallPosition.row - targetIndex);

      position = boxPositions[targetIndex][currentBallPosition.column];
      targetPosition.x = ball.x;
      targetPosition.y = mainBoard.y - mainBoard.displayHeight / 2 + ((position.upperLeftPoint.y + position.lowerLeftPoint.y) / 2) * mainBoard.scale;

      break;

    case "up":
      column = boxPositions;
      targetIndex = 0;

      for (let i = currentBallPosition.row - 1; i > -1; i--) {
        let box = column[i][currentBallPosition.column];
        if (box.value === 0) {
          targetIndex = i + 1;
          break;
        }
      }
      boxCount = Math.abs(currentBallPosition.row - targetIndex);

      position = boxPositions[targetIndex][currentBallPosition.column];
      targetPosition.x = ball.x;
      targetPosition.y = mainBoard.y - mainBoard.displayHeight / 2 + ((position.upperLeftPoint.y + position.lowerLeftPoint.y) / 2) * mainBoard.scale;
      break;

    default:
  }

  ball.lastPosition = position;

  let dur = 30; // paint duration

  for (let i = 1; i < boxCount + 1; i++) {
    let pos;

    if (direction === "right") pos = boxPositions[currentBallPosition.row][currentBallPosition.column + i];
    else if (direction === "left") pos = boxPositions[currentBallPosition.row][currentBallPosition.column - i];
    else if (direction === "up") pos = boxPositions[currentBallPosition.row - i][currentBallPosition.column];
    else if (direction === "down") pos = boxPositions[currentBallPosition.row + i][currentBallPosition.column];

    pos.color = true;

    scene.time.delayedCall(dur * i, () => {
      if (pos) fillPath.fillPoints([pos.upperLeftPoint, pos.upperRightPoint, pos.lowerRightPoint, pos.lowerLeftPoint], true);
    });
  }

  let tri;
  let initialPos = {x: ball.getCenter().x, y: ball.getCenter().y + ball.displayHeight / 2};
  let initialPos2 = {x: ball.getCenter().x + ball.displayHeight / 2, y: ball.getCenter().y};

  let ballTween = scene.tweens.add({
    targets: ball,
    x: targetPosition.x,
    y: targetPosition.y,
    ease: "Linear",
    duration: boxCount * dur,
    repeat: 0,
    yoyo: false,

    onStart: function () {
      ball.setDepth(3);
      if (direction === "left" || direction === "right")
        tri = scene.add.triangle(0, 0, ball.getCenter().x, ball.getCenter().y, ball.getTopCenter().x, ball.getTopCenter().y, ball.getBottomCenter().x, ball.getBottomCenter().y, offWhite).setOrigin(0.5).setDepth(2).setAlpha(0.7);
      else tri = scene.add.triangle(0, 0, ball.getCenter().x, ball.getCenter().y, ball.getRightCenter().x, ball.getRightCenter().y, ball.getLeftCenter().x, ball.getLeftCenter().y, offWhite).setOrigin(0.5).setDepth(2).setAlpha(0.7);
    },

    onUpdate: function () {
      if (direction === "left" || direction === "right") tri.setTo(initialPos.x, initialPos.y, ball.getCenter().x, ball.getCenter().y + ball.displayHeight, ball.getCenter().x, ball.getCenter().y);
      else tri.setTo(initialPos2.x, initialPos2.y, ball.getCenter().x + ball.displayWidth, ball.getCenter().y, ball.getCenter().x, ball.getCenter().y);
    },

    onComplete: function () {
      ballActive = false;
      if (direction === "left" || direction === "right") currentBallPosition.column = targetIndex;
      else currentBallPosition.row = targetIndex;
      tri.destroy();
    },
  });

  const props = {};

  if (boxCount) {
    if (direction === "left" || direction === "right") {
      props.scaleX = {from: ball.lastScale, to: ball.lastScale * 2.5};
    } else {
      props.scaleY = {from: ball.lastScale, to: ball.lastScale * 2.5};
    }

    let ballTween2 = scene.tweens.add({
      targets: ball,
      ...props,
      ease: "Linear",
      duration: (boxCount * dur) / 2,
      repeat: 0,
      yoyo: true,
    });
  }
}

// CONFETTI EMITTER

window.t = function () {
  window.confettiEmitter = scene.add
    .particles("atlas2")
    .setDepth(6)
    .createEmitter({
      frame: ["1", "2", "3", "4", "5"],
      x: {
        onEmit: function () {
          return Math.random() * lastWidth;
        },
      },
      y: -100,
      rotate: {start: 0, end: 360},
      quantity: 3,
      frequency: 20,
      scale: {start: 1, end: 0.2},
      lifespan: 2000,
      gravityY: 800,
    });
};

// BALL PARTICLE EMITTER

window.b = function () {
  if (!ballParticle) {
    ballParticle = scene.add
      .particles("ball")
      .setDepth(9)
      .createEmitter({
        x: {
          onEmit: function () {
            return ball.getCenter().x;
          },
        },
        y: {
          onEmit: function () {
            return ball.getCenter().y;
          },
        },
        speed: {min: -100, max: -50},
        tint: orange,
        angle: {min: 0, max: 360},
        scale: {start: 0.1, end: 0},
        blendMode: "SCREEN",
        frequency: -1,
        quantity: 10,
        lifespan: 500,
      });
  } else {
    ballParticle.emitParticleAt(ball.getCenter().x, ball.getCenter().y);
  }
};

function polyShadow(i, j, delay) {
  let box = boxPositions[i][j]; // 6 -0
  let dots = [
    0,
    0,
    Math.abs(box.upperRightPoint.x - box.upperLeftPoint.x),
    0,
    Math.abs(box.upperRightPoint.x - box.upperLeftPoint.x),
    Math.abs(box.upperRightPoint.y - box.lowerRightPoint.y),
    0,
    Math.abs(box.upperRightPoint.y - box.lowerRightPoint.y),
  ];

  let polygon = scene.add.polygon(0, 0, dots, lightGray).setDepth(0).setOrigin(0.5, 1).setAlpha(0);
  console.log(polygon);

  polygon.onResizeCallback = function () {
    this.setScale(mainBoard.scale);
    this.y = mainBoard.getTopCenter().y + boxPositions[i][j].lowerRightPoint.y * mainBoard.scale;
    this.x = mainBoard.getLeftCenter().x + boxPositions[i][j].upperRightPoint.x * mainBoard.scale;

    if (this.polyTween) this.polyTween.remove();

    this.polyTween = scene.tweens.add({
      targets: polygon,
      delay: delay,
      alpha: {from: 0.3, to: 0},
      scaleX: {from: 0, to: 3}, // to be updated
      x: mainBoard.getLeftCenter().x + box.upperLeftPoint.x * mainBoard.scale + polygon.displayWidth / 2,
      ease: "Linear",
      duration: 500,
      repeat: -1,
      yoyo: false,
    });
  };

  polygon.onResizeCallback();
}

function isGameEnd() {
  let end = boxPositions.some((row) => {
    return row.some((box) => box.value === 1 && box.color === false);
  });
  return end;
}

function updateGame(time, delta) {
  currentTime = time;
  deltaTime = delta;

  main.update();

  let pointer = this.input.activePointer;

  if (pointer.isDown && !gameFinished) {
    if (pointer.x !== prevX || pointer.y !== prevY) {
      if (Math.abs(pointer.x - prevX) > Math.abs(pointer.y - prevY)) {
        if (pointer.x - prevX > 15) {
          moveBall("right");
        } else if (pointer.x - prevX < -15) {
          moveBall("left");
        }
      } else {
        if (pointer.y - prevY < -15) {
          moveBall("up");
        } else if (pointer.y - prevY > 15) {
          moveBall("down");
        }
      }
    }
    prevX = pointer.x;
    prevY = pointer.y;

    let endGame = isGameEnd();

    if (!endGame) {
      for (let i = rows - 1; i >= 0; i--) {
        for (let j = 0; j < columns; j++) {
          if (boardData[i][j] === 1) polyShadow(i, j, Math.min(rows - 1 - i, j) * 300);
        }
      }
      text.text = "LEVEL 1 CLEARED";
      text.setScale(1.5);
      window.t();
      btn.setVisible(false);
      text2.setVisible(true);
      gameFinished = true;
    }
  } else {
    prevX = undefined;
    prevY = undefined;
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

export {gameScene, uiScene};
