// import {
//     Howl,
//     Howler
// } from 'howler';

var assetManager = {};
var scene;

import atlasSrc from "../../assets/atlas.png";
import atlasJson from "../../assets/atlas.json";
import atlas2Src from "../../assets/atlas2.png";
import atlas2Json from "../../assets/atlas2.json";
import ballSrc from "../../assets/ball.png";
import handSrc from "../../assets/hand.png";
import logoSrc from "../../assets/logo.png";

import bottomBannerSrc from "../../assets/bottomBanner.png";

assetManager.loadAssets = function (main, callback) {
  ////load image type first if there is any
  let imagesToLoad = [
    {
      type: "atlas",
      src: atlasSrc,
      json: atlasJson,
      key: "atlas",
    },
    {
      type: "atlas",
      src: atlas2Src,
      json: atlas2Json,
      key: "atlas2",
    },
    {
      type: "image",
      src: ballSrc,
      key: "ball",
    },
    {
      type: "image",
      src: logoSrc,
      key: "logo",
    },
    {
      type: "image",
      src: handSrc,
      key: "hand",
    },
    {
      type: "image",
      src: bottomBannerSrc,
      key: "bottomBanner",
    },
  ];

  //main.utility.fixJsonForTextParsing(this,"fontxml",fontJson);
  scene = this;

  if (imagesToLoad.length == 0) {
    assetsLoaded.call(scene);
    callback();
    return;
  }

  main.loadAssets(this, imagesToLoad, function () {
    assetsLoaded.call(scene);
    callback();
  });
};

function mobvistaStuffs() {
  if (app.type == "mobvista") {
    app.gameStart = function () {
      //gameStart logic
      app.main.startTimer();
      app.main.timeOfStart = new Date().getTime();

      app.playMusic();
    };

    app.gameClose = function () {
      //gameEnd logic
      this.console.log("GAME ENDED");
      if (!app.music) return;
      app.music.stop();
    };
  }
}

function assetsLoaded() {
  //Phaser.GameObjects.BitmapText.ParseFromAtlas(this, 'font','atlas', 'font', "fontxml");
  prepareAnims.call(this);
  prepareSounds.call(this);

  mobvistaStuffs();
}

function prepareAnims() {
  let animSource = {};

  for (let [key, value] of Object.entries(animSource)) {
    for (let animData of value) {
      scene.anims.create({
        key: animData.name,
        frames: scene.anims.generateFrameNumbers(key, {
          start: animData.startNo,
          end: animData.endNo === undefined ? animData.startNo : animData.endNo,
          first: animData.startNo,
        }),
        yoyo: !!animData.yoyo,
        frameRate: animData.frameRate || 30,
        repeat: animData.repeat === undefined ? -1 : animData.repeat,
      });
    }
  }
}

function prepareSounds() {
  app.playSfx = function () {};
  app.stopSfx = function () {};
  app.playMusic = function () {};
  app.stopMusic = function () {};

  if (app.data.musicSrc) {
    var music1 = new Howl({
      src: [app.data.musicSrc],
      loop: true,
      volume: 0.5,
    });

    app.playMusic = function () {
      if (!app.main.soundEnabled || music1.playing()) return;
      music1.play();
    };

    app.stopMusic = function () {
      music1.stop();
    };
  }

  if (app.data.sfxEnabled) {
    app.screamSound = new Howl({
      src: [screamSrc],
    });
  }

  if (!app.data.soundSrc) return;
  ////prepare sfx
  let sprite = {};

  const soundJson = app.data.soundJson;
  let spritemap = soundJson.spritemap;

  for (let prop in spritemap) {
    let s = spritemap[prop];
    let start = s.start * 1000;
    let duration = Math.ceil(s.end * 1000 - start);
    let loop = s.loop;
    sprite[prop] = [start, duration, loop];
  }

  var sound = new Howl({
    src: [app.data.soundSrc],
    sprite,
  });

  app.playSfx = function (name) {
    if (!app.main.soundEnabled) return;
    return sound.play(name);
  };

  app.stopSfx = function (id) {
    sound.stop(id);
  };
}

export default assetManager;
