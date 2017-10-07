var p5 = require("p5");

const allFiles = (ctx => {
    let keys = ctx.keys();
    let values = keys.map(ctx);
    return keys.reduce((o, k, i) => { o[k] = values[i]; return o; }, {});
})(require.context('./images', true, /.*/));

require("./css/style.css");
require("./index.html");

Math.random=(function(rand) {
  var salt=0;
  document.addEventListener('mousemove',function(event) {
    salt=event.pageX*event.pageY;
    });
return function() {
	var rando = (rand()+(1/(1+salt)))%1;
	return rando;
};
})(Math.random);

var buzzy = true;

var background_color = "#535e54";
var pipe_color = "#0a6d0d";
var pipe_inside = "#002301";

var p;

var conf = {
  xPadding: 0.02,
  yPadding: 0.2,
	r: 3,
	c: 4,
	w: 1600, h: 800, frequentie: 0.5, players: [], scores: {},
	resized: function() {
    var boundingBox = document.getElementById("game").getBoundingClientRect();
		var height = boundingBox.height;
		var width = boundingBox.width;

		conf.scaleX = width/conf.w;
		conf.scaleY = height/conf.h;

    if(conf.scaleX < conf.scaleY){
      conf.scaleY = conf.scaleX;
    }else{
      conf.scaleX = conf.scaleY;
    }

		conf.width = (conf.w - 2*conf.xPadding*conf.w)/conf.c;
		conf.height = (conf.h - 3*conf.yPadding*conf.h/2)/conf.r;

		if(p !== undefined){
			p.resize();
		}
	}, width: 1, height:1,
	scaleX: 1, scaleY: 1
};

function chance(time){
	var chance = 1 - Math.E ** (-time / conf.frequentie);
	return chance;
}

function drawScore(){
  var string = "";
  for(var name in conf.scores){
    if(conf.scores.hasOwnProperty(name)){
      string += "<li><a>"+name+": "+ conf.scores[name]+"</a></li>";
    }
  }
	document.getElementById("score").innerHTML = string;
}

function negativeCircleBlock(p, width, height){
	p.push();
	p.translate(-width/2, 0);
	p.noStroke();
	p.beginShape();
	p.vertex(0,0);
	p.bezierVertex(0, 1.2*height, width, 1.2*height, width, 0);
	//p.vertex(0, 2*r);
	p.vertex(width, height+2);
	p.vertex(0, height+2);
	p.endShape(p.CLOSE);
	p.pop();
}

function bottomCircleBlock(p, width, height){
	p.push();
	p.translate(-width/2,0);
	p.noStroke();
	p.beginShape();
	p.vertex(0,0);
	p.bezierVertex(0, 1.2*height, width, 1.2*height, width, 0);
	p.vertex(width, -2);
	p.vertex(0, -2);
	p.endShape(p.CLOSE);
	p.pop();
}

function readTextFile(fileName){
    var rawFile = new XMLHttpRequest();
    var text = "";
    rawFile.open("GET", fileName, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status === 0)
            {
                text = rawFile.responseText;
            }
        }
    };
    rawFile.send(null);
    return text;
}

class Place {
	constructor(r, c){
		this.r = r;
		this.c = c;
		this.active = false;
    this.goScore = false;
	}

	start(time){
		if(!this.active){
			this.active = true;
			this.partOne = true;
			this.partTwo = false;
			this.startTime = time;
			this.endTime = time + 1;
			this.gotScore = false;

			var i = Math.floor(Math.random() * conf.players.length);

			var player = conf.players[i];
			this.name = player.name;
			this.img = player.image;

			this.getClimax = function() { return conf.height/6 - 0.3*conf.width - 15; };
		}
	}

	act(p, time) { // calculate place
		if(this.active){
			this.y = p.map(time, this.startTime, this.endTime, conf.height/6+0.3*conf.width, this.getClimax());
			if(this.partOne && time > this.endTime){
				this.startTime = this.endTime + 0.5;
				this.partOne = false;
				this.partTwo = true;
			}else if(this.partTwo && time > this.startTime){
				this.active = false;
				this.partTwo = false;
			}
		}
	}

	draw(p){ // draw on place
		p.push();
		var x = conf.xPadding*conf.w + this.c * conf.width;
		var y = conf.yPadding*conf.h + this.r * conf.height;
		p.translate(x, y);
		p.fill(background_color);
		p.rect(0, 0, conf.width, conf.height);
		p.translate(conf.width/2, conf.height/2);
		p.fill(pipe_inside);
		p.ellipse(0, 0 , 2*conf.width/3, conf.height/3);

		if(this.active){
			p.push();
			p.translate(0, this.y);
      //console.log("c: "+this.c+" r: "+this.r);
      //console.log("tx: "+(x + conf.width/2)+" ty: "+(y+conf.height/2+this.y));
			var w = 0.6*conf.width;
			p.image(this.img, -w/2, -w/2, w, w);
			p.pop();
		}
		p.fill(background_color);
		p.rect(-conf.width/3, conf.height/6, 2*conf.width/3, 2*conf.height);

		// shaft
		p.fill(pipe_color);
		negativeCircleBlock(p, 2*conf.width/3, conf.height/6);
		p.rect(-conf.width/3, conf.height/6, 2*conf.width/3, conf.height/8);
		p.translate(0, conf.height/8+conf.height/6);
		bottomCircleBlock(p, 2*conf.width/3, conf.height/6);
		//p.ellipse(0, 7*conf.height/24, 2*conf.width/3, conf.height/3);

		p.pop();
	}

	clickedOn(mx, my, time){
		mx = mx - (conf.xPadding*conf.w + this.c * conf.width + conf.width /2);
		my = my - (conf.yPadding*conf.h + this.r * conf.height + conf.height/2);

		var inEllipse = ((mx**2/(conf.width/3)**2) + (my**2 / (conf.height/6) ** 2) <= 1) || my < 0;

		my -= this.y;
		var dist = mx ** 2 + my **2;
		var r = (0.3*conf.width)**2;

		if(this.active && inEllipse && dist <= r){
			if(this.partOne){
				var end = [this.y].slice()[0];
				this.getClimax = function() {return end; };
				this.partOne = false;
				this.startTime = time + (time - this.startTime)/2;
				this.endTime = time;
				this.partTwo = true;
				if(!  this.gotScore){
					p.scored(this.name);
					this.gotScore = true;
				}
			}else if(this.partTwo){
				if(! this.gotScore){
					this.gotScore = true;
					p.scored(this.name);
				}
			}
		}
	}
}

function printActives(){
	if(p !== undefined){
		for(var b of p.blocks){
			console.log(b.active);
		}
	}
}

var s = function( p ) {
	p.preload = function(){
    /*
		var text = readTextFile("./images/");
    console.log(text);
    var parser = new DOMParser();
    var doc = parser.parseFromString(text, "text/html");
    for(var a of doc.body.getElementsByTagName("a")){
      if(a.text.indexOf(".")>=0){
        var name = a.text;
        console.log("name:");
        console.log(name);
        conf.players.push({name: name.replace(/\..+$/, ''), image: p.loadImage("./images/"+name)});
        conf.scores[name.replace(/\..+$/, '')] = 0;
      }
    } */
    for(var key in allFiles){
      if(allFiles.hasOwnProperty(key)){
        var value = allFiles[key];
        var name = value.replace(/^.*\//, "").replace(/\..+$/, "");
        conf.players.push({name: name, image: p.loadImage(value)});
        conf.scores[name] = 0;
      }
    }
	};

  p.setup = function() {
		p.frameRate(30);
		p.blocks = [];
		for (var r = 0; r < conf.r; r++) {
			for (var c = 0; c < conf.c; c++) {
				p.blocks.push(new Place(r,c));
			}
		}
    p.createCanvas(conf.w*conf.scaleX, conf.h*conf.scaleY);
		conf.resized();
		p.time = 0;
  };

	p.resize = function() {
		p.resizeCanvas(conf.w*conf.scaleX, conf.h*conf.scaleY);
		p.draw();
	};

	p.scored = function(name){
		conf.scores[name] ++;
	};

  p.draw = function() {
		p.clear();
		p.noStroke();
    p.fill(background_color);
    p.rect(0, 0, conf.w, conf.h);

		if(p.frameRate()){
			p.time += 1 / p.frameRate();
			if (Math.random() < chance(1/p.frameRate())) {
				var i = Math.floor(Math.random() * p.blocks.length);
				p.blocks[i].start(p.time);
			}
			p.scale(conf.scaleX, conf.scaleY);
	    for(var b of p.blocks){
				b.act(p, p.time);
				b.draw(p);
			}
		}
		drawScore();
  };

	p.mouseClicked = function(){
    var boundingBox = document.getElementById("game").getBoundingClientRect();
    var scaleX = conf.w/boundingBox.width;
    var scaleY = conf.h/boundingBox.height;
    var mx = p.mouseX*scaleX;
    var my = p.mouseY*scaleY;
		for(var b of p.blocks){
			b.clickedOn(mx, my, p.time);
		}
	};

};

p = new p5(s, document.getElementById("game"));

window.onresize = function(){
	conf.resized();
};

document.addEventListener('keydown', function(event) {
    if(event.keyCode === 32) {
			if(buzzy){
				if(p !== undefined){
					p.noLoop();
					buzzy = false;
				}
			}else{
				if(p !== undefined){
					p.loop();
					buzzy = true;
				}
			}
    }
		if(event.keyCode === 90){
			printActives();
		}
});
