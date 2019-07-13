let app = new PIXI.Application({
    width: 1209,
    height: 889
});
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

//load an image and run the `setup` function when it's done
PIXI.loader
    .add("bg.png")
    .add("first_class.png")
    .load(setup);

function setup() {
    //Create the background
    let bg = new PIXI.Sprite(PIXI.loader.resources["bg.png"].texture);
    bg.anchor.x = 0;
    bg.anchor.y = 0;
    bg.position.x = 0;
    bg.position.y = 0;
    bg.scale.x = 0.7;
    bg.scale.y = 0.7;
    //Add the background to the stage
    app.stage.addChild(bg);

    let person = new PIXI.Sprite(PIXI.loader.resources["first_class.png"].texture);
    person.anchor.x = 0;
    person.anchor.y = 0;
    person.position.x = 0;
    person.position.y = 0;
    app.stage.addChild(person);

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {

}