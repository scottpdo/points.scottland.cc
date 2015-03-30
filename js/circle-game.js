var jitterz = {};

jitterz.points = [];

// CONFIG
jitterz.numPoints = 100;

var w = window.innerWidth,
    h = window.innerHeight,
    c = Math.cos,
    s = Math.sin,
    inc = 2 * Math.PI / jitterz.numPoints;

var cx = w / 2,
    cy = h / 2,
    r = w > h ? h * 0.25 : w * 0.25,
    targetR = 0.95 * r,
    numLoops = 10, // number of times to loop around the circle (for a multitude of points)
    closeness = r * 0.75, // how close should the cursor have to be for a point to move toward it
    jitterFactor = r / 150, // how far the points jitter
    biasFactor = 0.4; // the smaller, the less attracted to the cursor points are

var timer = false,
    timerInterval,
    successTime = false,
    currentLevel = 0,
    gameOver = true;

function shapeReset() {
    fill(255, 255, 255, 80);
    strokeWeight(0);
}

var levels = [
    {
        shape: function() {
            ellipse(cx, cy, 2 * targetR, 2 * targetR);
        },
        test: function(px) {
            return distance(px, [cx, cy] ) < targetR;
        }
    },
    {
        shape: function() {
            rect(cx - r, cy - r / 4, 2 * r, r / 2);
        },
        test: function(px) {
            return px[0] > cx - r && px[0] < cx + r && px[1] > cy - r / 4 && px[1] < cy + r / 4;
        }
    },
    {
        shape: function() {
            ellipse(cx, cy, 2 * targetR, 2 * targetR);
            fill(0);
            ellipse(cx, cy, targetR, targetR);
        },
        test: function(px) {
            return distance(px, [cx, cy] ) < targetR && distance(px, [cx, cy] ) > targetR / 2;
        }
    },
    {
        shape: function() {
            rect(cx - 3 * r / 4, cy - r / 4, r / 2, r / 2);
            rect(cx - r / 4, cy - 3 * r / 4, r / 2, 3 * r / 2);
            rect(cx + r / 4, cy - r / 4, r / 2, r / 2);
        },
        test: function(px) {
            var x = Math.abs(px[0] - cx),
                y = Math.abs(px[1] - cy);
            return x < 3 * r / 4 && y < 3 * r / 4 && !( x > r / 4 && y > r / 4 );
        }
    }
];

// add a shapeReset to each level's shape() method
levels.forEach(function(level) {

    var dummy = level.shape;

    level.shape = function() {
        shapeReset();
        dummy();
    };
});

// map the distance (0 - closeness) to 0-255 for color mapping
function mapCloseness(dist) {
    return (closeness - dist) * 255 / closeness;
}

function normalizeColor(value) {
    if ( value < 80 ) value = 80;
    if ( value > 255 ) value = 255;

    return value;
}

function setup() {

    createCanvas( w, h );
    background(0);

    for ( var i = 0; i < jitterz.numPoints - 1; i += inc ) {
        jitterz.points.push([cx + r * c(i), cy + r * s(i)]);
    }

    var p = document.createElement('p');
    p.style.width = (w / 2).toString() + 'px';

    p.innerHTML = 'Though they tend toward chaos, the points wish to be ' +
        'within the bounded area.';
    document.body.appendChild(p);

    p.style.left = (cx - p.clientWidth / 2).toString() + 'px';
    p.style.top = (cy - p.clientHeight).toString() + 'px';

    setTimeout(startTimer, 2000);
}

function startTimer() {

    var p = document.getElementsByTagName('p')[0];
    setTimeout(function() {
        p.innerHTML += '<br>Move them.';
    }, 4000);

    setTimeout(function() {
        p.parentNode.removeChild(p);
    }, 6000);

    textFont('Helvetica Neue');

    timerInterval = setInterval(function(){
        timer++;
    }, 1000);
}

function writeText(str) {
    textSize(32);
    fill(255);
    text(str, 20, 45);
}

function time(again) {

    var minutes, seconds, theTime;

    minutes = Math.floor(timer / 60);
    seconds = timer % 60;

    minutes = minutes.toString();
    seconds = seconds.toString();

    theTime = minutes + ':' + ( seconds.length === 2 ? seconds : '0' + seconds );

    if ( again ) {
        writeText(theTime);
        setTimeout(time, 1000);
    } else {
        return theTime;
    }
}

function drawLines() {

    clear();
    background(0);

    levels[currentLevel].shape();
    time(true);

    var pt = 0,
        inc = 2 * Math.PI / jitterz.numPoints,
        dist,
        numberInside = 0,
        ratioInside = 0;

    var r, g, b, a;
    a = 100;

    for ( var i = 0; i < numLoops * 2 * Math.PI; i += inc ) {

        r = g = b = 255;

        dist = distance(jitterz.points[pt], [mouseX, mouseY]);

        strokeWeight(1.5);

        // if in the target, add to the number inside
        if ( levels[currentLevel].test(jitterz.points[pt]) ) {
            numberInside++;
        // if not, red pixels remain high but others are low
        } else {
            g = b = 60;
        }

        if ( dist < closeness ) {

            r -= mapCloseness(dist);
            g -= mapCloseness(dist);
            b += 0.5 * mapCloseness(dist);
        }

        // make sure they stay within 0-255 range
        r = normalizeColor(r);
        g = normalizeColor(g);
        b = normalizeColor(b);

        stroke(r, g, b, a);

        // point
        ellipse(jitterz.points[pt][0], jitterz.points[pt][1], 1, 1);

        line(
            jitterz.points[pt][0],
            jitterz.points[pt][1],
            jitterz.points[pt + 1][0],
            jitterz.points[pt + 1][1]
        );
        pt++;
    }

    // draw the ratio of success rectangle
    ratioInside = numberInside / (jitterz.numPoints * numLoops);

    strokeWeight(0);
    fill(255);

    // If success is above 99%, set success fill and successTime
    if ( ratioInside >= 0.99 ) {
        fill(0, 255, 100);
        if ( !successTime ) successTime = timer;
    }

    if ( !!successTime && timer - successTime >= 5 ) {
        currentLevel++;
        successTime = false;
    }

    rect(w - 40, ( 1 - ratioInside ) * h, w, h);
}

function distance(pt, mouse) {

    var dx = mouse[0] - pt[0],
        dy = mouse[1] - pt[1];

    return Math.sqrt( dx * dx + dy * dy );
}

// since everything should be relative to the radius
function normalize(distance) {
    return distance / (0.005 * r);
}

function jitter() {
    if ( jitterz.points.length > 0 ) {

        var dist,
            nd,
            close = 0,
            atPoint = false;

        jitterz.points.forEach(function(pt) {

            dist = distance(pt, [mouseX, mouseY]);
            nd = normalize(dist);

            pt[0] += ( Math.random() * 2 - 1 ) * jitterFactor;
            pt[1] += ( Math.random() * 2 - 1 ) * jitterFactor;

            // weird maths happen if the distance is 0 (since dividing by 0)
            if ( Math.abs(mouseX - pt[0]) <= 1 && Math.abs(mouseY - pt[1]) <= 1 ) atPoint = true;

            if ( dist < closeness ) {
                pt[0] += atPoint ? 0 : biasFactor * (mouseX - pt[0]) / nd;
                pt[1] += atPoint ? 0 : biasFactor * (mouseY - pt[1]) / nd;
            }
        });

        drawLines();
    }
}

function keyTyped() {

    if ( key === ' ' ) {
        currentLevel++;
    }
}

function success() {
    clear();
    background(0);
    clearInterval(timerInterval);

    writeText('You won!\nIt took you ' + time() + '.');

        /* text('Share with your friends:', 20, 140);

    if ( mouseX > 20 && mouseX < 300 && mouseY > 150 && mouseY < 180 ) {
        fill(0, 0, 255);
    }

    text('Facebook:', 20, 180); */
}

function mouseClicked() {
    /* if ( gameOver ) {
        if ( mouseX > 20 && mouseX < 300 && mouseY > 150 && mouseY < 180 ) {
            window.location.href = 'https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fwww.scottland.cc;
        }
    } */
}

function draw() {
    if ( !levels[currentLevel] ) {
        success();
    } else if ( !!timer && timer >= 0 ) {
        jitter();
    }
}
