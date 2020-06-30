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
let mainBoard, triangle, ball, points, main, data;
let ballActive = false;
let fillBox;
let fillPath;
let gameData = {};
let lineArrayVertical = [];
let lineArrayHorizontal = [];
let gridPoints = [];
let rows;
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

  // DRAWING MAINBOARD

  // points = [10, 0, 200, 0, 210, 200, 0, 200];

  points = [10, 0, columns * 28.5, 0, columns * 28.5 + 10, rows * 30, 0, rows * 30];

  mainBoard = scene.add.polygon(0, 0, points, darkGray).setOrigin(0.5);

  //console.log(mainBoard);

  mainBoard.onResizeCallback = function (w, h) {
    let scale = Math.min((w * 0.7) / this.width, (h * 0.7) / this.height);
    this.setScale(scale);
    this.y = h * 0.5;
    this.x = w * 0.5;
  };

  // TEXT AND BUTTON

  let text = this.add
    .text(0, 0, "LEVEL 1", {
      fontFamily: "ui_font_1",
      fontSize: 40,
      color: htmlDarkGray,
      strokeThickness: 1.5,
      stroke: htmlDarkGray,
    })
    .setOrigin(0.5);

  text.onResizeCallback = function () {
    this.setScale(mainBoard.displayWidth / 3 / this.width);
    this.x = currentWidth / 2;
    this.y = mainBoard.getTopCenter().y / 2;
  };

  let btn = button.addButton(this, "atlas", "button", "PLAY NOW", "#FFFFFF", main.gotoLink);

  btn.onResizeCallback = function () {
    this.setScale(mainBoard.displayWidth / 2 / this.width);
    this.y = (mainBoard.getBottomCenter().y + currentHeight) / 2;
    this.x = currentWidth / 2;
  };

  let tween2 = scene.tweens.add({
    targets: btn,
    duration: 400,
    ease: "Linear",
    repeat: -1,
    scaleX: {from: btn.scaleX * 0.6, to: btn.scaleX * 0.65},
    scaleY: {from: btn.scaleY * 0.6, to: btn.scaleY * 0.65},
    yoyo: true,
  });

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

  //console.log(gridPoints);

  // FILLING BOXES

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

  //console.log(boardData);
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
      };
      row.push(box);
      //console.log(box);

      // If box is white
      if (!currentBox) {
        // color white
        fillBox.fillPoints([gridPoints[upperLeftPoint], gridPoints[upperRightPoint], gridPoints[lowerRightPoint], gridPoints[lowerLeftPoint]], true);

        // draw white line top
        drawInsideBorder(gridPoints[upperLeftPoint], gridPoints[upperRightPoint], offWhite);

        if (i < rows - 1) bottomBox = boardData[i + 1][j];

        // draw gray line bottom
        if (bottomBox) drawInsideBorder(gridPoints[lowerLeftPoint], gridPoints[lowerRightPoint], lightGray);
      }
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
  //console.log(boxPositions);

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

  ball = this.add.image(0, 0, "ball").setOrigin(0.5);
  ball.setTint(mustardYellow);
  ball.lastPosition = boxPositions[0][0];
  fillPath.fillPoints([ball.lastPosition.upperLeftPoint, ball.lastPosition.upperRightPoint, ball.lastPosition.lowerRightPoint, ball.lastPosition.lowerLeftPoint], true);

  ball.onResizeCallback = function () {
    // let scale = Math.min(w / this.width, h / this.height);
    this.setScale(mainBoard.scale / 6);
    console.log(ball.lastPosition);

    this.x = mainBoard.x - mainBoard.displayWidth / 2 + (ball.lastPosition.upperLeftPoint.x * mainBoard.scale + ball.lastPosition.upperRightPoint.x * mainBoard.scale) / 2;
    this.y = mainBoard.y - mainBoard.displayHeight / 2 + (ball.lastPosition.lowerLeftPoint.y * mainBoard.scale + ball.lastPosition.upperLeftPoint.y * mainBoard.scale) / 2;
    // this.x = mainBoard.x - mainBoard.displayWidth / 2 + (gridPoints[0].x * mainBoard.scale + gridPoints[8].x * mainBoard.scale) / 2;
    // this.y = mainBoard.y - mainBoard.displayHeight / 2 + (gridPoints[1].y * mainBoard.scale + gridPoints[0].y * mainBoard.scale) / 2;
  };
}

function moveBall(direction) {
  targetPosition = {x: ball.x, y: ball.y};
  let targetIndex;
  let position;
  let row;
  let column;
  //fillPath.fillPoints([gridPoints[0], gridPoints[8], gridPoints[9], gridPoints[1]], true);

  if (ballActive) return;
  ballActive = true;
  let boxCount = 0;

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

      boxCount = Math.abs(currentBallPosition.column - targetIndex);
      position = boxPositions[currentBallPosition.row][targetIndex];
      targetPosition.x = ((position.lowerRightPoint.x + position.lowerLeftPoint.x) / 2) * mainBoard.scale + mainBoard.x - mainBoard.displayWidth / 2;
      targetPosition.y = ball.y;

      break;

    case "right":
      row = boxPositions[currentBallPosition.row];
      targetIndex = row.length - 1;

      for (let i = 0; i < row.length; i++) {
        let box = row[i];
        // boxCount++;
        if (box.value === 0) {
          targetIndex = i - 1;
          break;
        }
      }
      boxCount = Math.abs(currentBallPosition.column - targetIndex);

      position = boxPositions[currentBallPosition.row][targetIndex];
      targetPosition.x = ((position.upperRightPoint.x + position.upperLeftPoint.x) / 2) * mainBoard.scale + mainBoard.x - mainBoard.displayWidth / 2;
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
      console.log(position);

      break;

    default:
  }

  ball.lastPosition = position;
  let dur = 30; // paint duration

  for (let i = 1; i < boxCount + 1; i++) {
    // 1
    let pos;

    if (direction === "right") pos = boxPositions[currentBallPosition.row][currentBallPosition.column + i];
    else if (direction === "left") pos = boxPositions[currentBallPosition.row][currentBallPosition.column - i];
    else if (direction === "up") pos = boxPositions[currentBallPosition.row - i][currentBallPosition.column];
    else if (direction === "down") pos = boxPositions[currentBallPosition.row + i][currentBallPosition.column];

    scene.time.delayedCall(dur * i, () => {
      fillPath.fillPoints([pos.upperLeftPoint, pos.upperRightPoint, pos.lowerRightPoint, pos.lowerLeftPoint], true);
    });
  }

  let tri;
  let initialPos = {x: ball.getCenter().x, y: ball.getCenter().y + ball.displayHeight / 2};
  let initialPos2 = {x: ball.getCenter().x + ball.displayHeight / 2, y: ball.getCenter().y};

  scene.tweens.killTweensOf(ball);

  let tween = scene.tweens.add({
    targets: ball,
    x: targetPosition.x,
    y: targetPosition.y,

    onStart: function () {
      ball.setDepth(5);
      if (direction === "left" || direction === "right")
        tri = scene.add.triangle(0, 0, ball.getCenter().x, ball.getCenter().y, ball.getTopCenter().x, ball.getTopCenter().y, ball.getBottomCenter().x, ball.getBottomCenter().y, offWhite).setOrigin(0.5).setDepth(2);
      else tri = scene.add.triangle(0, 0, ball.getCenter().x, ball.getCenter().y, ball.getRightCenter().x, ball.getRightCenter().y, ball.getLeftCenter().x, ball.getLeftCenter().y, offWhite).setOrigin(0.5).setDepth(2);
    },

    onUpdate: function () {
      if (direction === "left" || direction === "right") tri.setTo(initialPos.x, initialPos.y, ball.getCenter().x, ball.getCenter().y + ball.displayHeight, ball.getCenter().x, ball.getCenter().y);
      else tri.setTo(initialPos2.x, initialPos2.y, ball.getCenter().x + ball.displayHeight, ball.getCenter().y, ball.getCenter().x, ball.getCenter().y);
    },

    onComplete: function () {
      ballActive = false;
      if (direction === "left" || direction === "right") currentBallPosition.column = targetIndex;
      else currentBallPosition.row = targetIndex;
      tri.destroy();
    },

    ease: "Linear",
    duration: boxCount * dur,
    repeat: 0,
    yoyo: false,
  });
}

let prevX;
let prevY;

function updateGame(time, delta) {
  currentTime = time;
  deltaTime = delta;

  main.update();

  let pointer = this.input.activePointer;

  if (pointer.isDown) {
    // console.log(pointer);
    // console.log("ballActive: ", ballActive);
    console.log("pointerx= " + pointer.x, "pointery= " + pointer.y, "prevX= " + prevX, "prevY: " + prevY);

    if (pointer.x !== prevX || pointer.y !== prevY) {
      if (Math.abs(pointer.x - prevX) > Math.abs(pointer.y - prevY)) {
        if (pointer.x - prevX > 5 && Math.abs(pointer.y - prevY) !== 0) {
          moveBall("right");
          console.log("right");
        } else if (pointer.x - prevX < 5 && Math.abs(pointer.y - prevY) !== 0) {
          moveBall("left");
          console.log("left");
        }
      } else {
        if (pointer.y - prevY < 5 && Math.abs(pointer.x - prevX) !== 0) {
          moveBall("up");
          console.log("up");
        } else if (pointer.y - prevY > 5 && Math.abs(pointer.x - prevX) !== 0) {
          moveBall("down");
          console.log("down");
        }
      }
    }
    prevX = pointer.x;
    prevY = pointer.y;
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
