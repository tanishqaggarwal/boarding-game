let app = new PIXI.Application({
    width: 1209,
    height: 889
});
c = new Charm(PIXI);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

//load images and run the `setup` function when it's done
PIXI.loader
    .add("bg.png")
    .add("first_class.png")
    .add("normal_person.png")
    .load(setup);

/**
 * Represents physical location of a seat in various ways,
 * including as a PIXI Sprite object.
 */
class Seat {
    constructor(row, column, x, y) {
        // Seat number data
        this.row = row;
        this.column = column;
        this.column_no = column.charCodeAt(0);
        this.number = this.column + this.row;
        
        // Seat position
        this.x = x;
        this.y = y;

        // Making the seat clickable.
        var graphics = new PIXI.Graphics();
        graphics.drawRect(x - 6, y - 5, 12, 12);
        var texture = graphics.generateTexture();
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;
        this.sprite.position.x = x;
        this.sprite.position.y = y;

        // Number of frames for the walking allowed animation. Based
        // on distance from the front of the plane
        this.walk_frames = (600 + Math.abs(this.x - 275) + Math.abs(this.y - 288)) / 12;

        // Game data
        this.taken = false;
    }

    is_within_clickable_area(x, y) {
        return (x >= this.x1)
            && (x <= this.x2)
            && (y > this.y1)
            && (y < this.y2);
    }

    path_to_seat_from(current_position) {
        var path_from_person_to_gate = [
            [current_position.x, current_position.y],
            [342, 645],
        ]
        var path_from_gate_to_seat = [
            [210, 645],
            [210, 288],
            [this.x, 288],
            [this.x, this.y],
        ]
        return path_from_person_to_gate.concat(path_from_gate_to_seat);
    }
}

/**
 * Game state variables
 */
// List of seat objects
seats_list = []
// List of persons
persons_list = []
// Pointer to next person that will be boarding (or is currently boarding)
next_person = {}

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

    /*
    * Generate set of people sprites.
    */
    for(var i = 0; i < 10; i++) {
        var img = i < 2 ? "first_class.png" : "normal_person.png";
        let person = new PIXI.Sprite(PIXI.loader.resources[img].texture);
        if (i < 24) person.first_class = true;
        person.anchor.x = 0.5;
        person.anchor.y = 0.5;
        person.position.x = Math.random() * 580 + 380;
        person.position.y = Math.random() * 200 + 600;
        person.scale.x = 0.7;
        person.scale.y = 0.7;
        persons_list.push(person);
        app.stage.addChild(person);
    }
    persons_list.reverse();
    next_person = persons_list.pop();

    /*
    * Generate set of available seats
    */
    for (var i = 0; i < 16; i++) {
        // D1-F16
        for (var j = 0; j < 3; j++) {
            var x = 275 + i * 18;
            var y = 236 + j * 17;
            var seat = new Seat(1 + i, String.fromCharCode("F".charCodeAt(0) - j), x, y);
            seats_list.push(seat);
        }
        // D18-F35
        for (var j = 0; j < 3; j++) {
            var x = 594 + i * 18;
            var y = 236 + j * 17;
            var seat = new Seat(18 + i, String.fromCharCode("F".charCodeAt(0) - j), x, y);
            seats_list.push(seat);
        }
        // A1-C16
        for (var j = 0; j < 3; j++) {
            var x = 275 + i * 18;
            var y = 307 + j * 17;
            var seat = new Seat(1 + i, String.fromCharCode("C".charCodeAt(0) - j), x, y);
            seats_list.push(seat);
        }
        // A18-C35
        for (var j = 0; j < 3; j++) {
            var x = 594 + i * 18;
            var y = 307 + j * 17;
            var seat = new Seat(18 + i, String.fromCharCode("C".charCodeAt(0) - j), x, y);
            seats_list.push(seat);
        }
    }
    // D17-E17 (Emergency row)
    for (var i = 0; i < 2; i++) {
        var x = 569;
        var y = 253 + i * 17;
        var seat = new Seat(17, String.fromCharCode("E".charCodeAt(0) - i), x, y);
        seats_list.push(seat);
    }
    // C17-B17 (Emergency row)
    for (var i = 0; i < 2; i++) {
        var x = 569;
        var y = 307 + i * 17;
        var seat = new Seat(17, String.fromCharCode("C".charCodeAt(0) - i), x, y);
        seats_list.push(seat);
    }

    // Create timer text and timer object
    let time_header = new PIXI.Text("Boarding Time", {fontFamily: "Arial", fontSize: 36});
    time_header.position.x = 750;
    time_header.position.y = 100;
    let time_value = new PIXI.Text("", { fontFamily: "Arial", fontSize: 36, fill:"red" });
    time_value.position.x = 750;
    time_value.position.y = 150;
    let stopwatch = new Stopwatch(time_value);
    app.stage.addChild(time_header);
    app.stage.addChild(time_value);

    // Generate callback functions for clicks on seats
    for(const seat of seats_list) {
        app.stage.addChild(seat.sprite);
        seat.sprite.click = function() {
            // If there are no more people to seat
            if (!next_person) return;
            else if (next_person.is_assigned_seat) return;
            else if (seat.taken) return;
            else {
                stopwatch.start();
                next_person.is_assigned_seat = true;
                
                var stop_timer = false;
                if (persons_list.length == 0) stop_timer = true;
                c.walkPath(
                    next_person,
                    seat.path_to_seat_from(next_person),
                    seat.walk_frames,
                    function onComplete() {
                        if (stop_timer) stopwatch.stop();
                    }
                );
                seat.taken = true;
                next_person = persons_list.pop();
            }
        }
    }

    // Start game animation
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    c.update();
}