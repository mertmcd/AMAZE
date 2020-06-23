

// CONTAINER

// container = this.add.container(0, 0);

    // container.onResizeCallback = function (width, height) {

    //     let scale = Math.max(width / this.width, height / this.height);
    //     this.setScale(scale / 2);
    //     this.x = width / 2;
    //     this.y = height / 2;
    // }


// GRID

// grid = this.add.grid(0, 0, currentWidth, currentWidth, currentWidth / 7, currentWidth / 7, 0x808080, 0, 0xff0000, 1);

    // grid.onResizeCallback = function (width, height) {

    //     if (!isLandscape) {

    //         let scale = Math.max(width / this.width, height / this.height);
    //         this.setScale(scale / 2);
    //         this.x = width / 2;
    //         this.y = height / 2;
    //     } else {
    //         let scale = Math.max(width / this.width, height / this.height);
    //         this.setScale(scale / 2);
    //         this.x = width / 2;
    //         this.y = height / 2.01;

    //     }
   // }


// responsive rect

// rect = this.add.rectangle(0, 0, currentWidth, currentWidth, 0xD3D3D3, 1);

    // rect.onResizeCallback = function (width, height) {

    //     let scale = Math.max(width / this.width, height / this.height);
    //     this.setScale(scale / 2);
    //     this.x = width / 2;
    //     this.y = height / 2;
    //     console.log(this.x);
    // }

    

    // rect2 = this.add.rectangle(0, 0, currentWidth, currentWidth, 0x696969, 1);

    // rect2.onResizeCallback = function (width, height) {

    //     let scale = Math.max(width / this.width, height / this.height);
    //     this.setScale(scale / 2.1);
    //     this.x = width / 2;
    //     this.y = height / 2;
    // }

// geom rect

// rect = new Phaser.Geom.Rectangle(currentWidth / 10, currentHeight / 5, currentWidth / 1.3, currentWidth / 1.3, 0x808080, 1);
//     let graphics = this.add.graphics({ fillStyle: { color: 0x808080 } });
//     graphics.fillRectShape(rect);
// rect.onResizeCallback = function (width, height) {

    //     let rectPoints = Phaser.Geom.Rectangle.FromPoints(rect);
    //     let scale = Math.max(width / rectPoints[3], height / rectPoints[4]);
    //     this.setScale(scale / 2);
    //     this.x = width / 2;
    //     this.y = height / 2;
    //     let graphics = this.add.graphics({ fillStyle: { color: 0x808080 } });
    //     graphics.fillRectShape(rect);
    // }