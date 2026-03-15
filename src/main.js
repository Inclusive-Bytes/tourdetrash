import kaplay from "kaplay";
import * as exports from "./websocket.js"
import { conveyor } from "./Conveyor.js";


var itemRef=0

const k = kaplay();

k.setBackground(255,255,255)

var allsprites = []


const FALLING_STATE = 1
const CONVEYOR_STATE = 2
const TRASHING_STATE = 3
const RECYCLING_STATE = 4

var conveyorSpeed = 2

const recycleBinXpos = 1050 
const trashBinXpos = 1200 


loadSound("ping", "src/sprites/ping.mp3")
loadSound("wrong", "src/sprites/wrong.mp3")
loadMusic("backmusic", "src/sprites/background.mp3")

k.loadSprite("pistonblock","src/sprites/PistonBlock.png")
k.loadSprite("chute","src/sprites/chute.png")
k.loadSprite("piston","src/sprites/Piston.png")
k.loadSprite("trash","src/sprites/trash.png")
k.loadSprite("recycle","src/sprites/recyclebin.png")
k.loadSprite("recycleadd","src/sprites/recycleadd.png")
k.loadSprite("gameover","src/sprites/GameOver.png")
k.loadSprite("background","src/sprites/Background.png")
k.loadSprite("logo","src/sprites/logo.png")
k.loadSprite("convback","src/sprites/convback.png")
k.loadSprite("gear", "src/sprites/gears.png", {
    sliceX:2,
    sliceY:3})
k.loadSprite("coke","src/sprites/Coke.png", {
    sliceX:2,
    sliceY:2})

k.loadSprite("tin","src/sprites/tin.png", {
    sliceX:2,
    sliceY:2})

k.loadSprite("crisps","src/sprites/Walkers.png", {
    sliceX:2,
    sliceY:2})

k.loadSprite("milk","src/sprites/Milk.png", {
    sliceX:2,
    sliceY:2})

k.loadSprite("sprite","src/sprites/Sprite.png", {
    sliceX:2,
    sliceY:2})

k.loadSprite("box","src/sprites/box.png", {
    sliceX:2,
    sliceY:2})

k.loadSprite("butter","src/sprites/butter.png", {
    sliceX:2,
    sliceY:2})


k.loadSprite("kicker", "src/sprites/KickerPiston.png", {
    sliceX:3,
    sliceY:1})    
k.loadSprite("conveyorTest", "src/sprites/Conveyor.png",{
    sliceX:1,
    sliceY:6
})

k.loadSprite("flame", "src/sprites/Flames.png", {
    sliceX:7,
    sliceY:1,
anims:{flame:{frames:[0,1,2,,3,2,1,3,2,3,4,,3,4,3,4,5,6,5,6,4,5,6,5,4,3,,4,3,4,3,2,3,2,1,2,1,2,1,0,1,0], loop:true, speed: 20}}})

const NUM_CONVEYOR_SLICES = 4
const GAME_TIME_LENGTH = 90
var gameTime = 0

var ips
var index

var theScore
var gameOver = false


var pingHandle
var wrongHandle


function getRandomInt(min, max) // Random int between min (inclusive) and max (inclusive)
{
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}


class Widget
{

    draw()
    {}

    squish()
    {}
}

class WSManager
{

    constructor()
    {
        ips=new Map()
        index=0
    }        
    initConnections()
    {
        exports.setOnMessageCallback(this.onMessage)
   
        exports.startWebsocket(`ws://192.168.4.1/ws`,index)



    }

    onMessage(event)
    {
        var message = JSON.parse(event.data)
        if(message != null)
        {
            if(message.type != undefined && message.type == "connectedips")
            {
                var connectedIps = message.ipAddresses
                if(connectedIps != undefined && connectedIps.length)
                {
                    connectedIps.forEach((ipaddr) =>
                    {
                        if(exports.findIP(ipaddr) == false)
                        {
                            index++
                            exports.startWebsocket(`ws://${ipaddr}/ws`,index)
                        }
                    })
                }
            }
        }

    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////

var flickerDriver = 0

function getFlashColor()
{
        var col
        flickerDriver += 0.7
        var state = Math.floor(flickerDriver) 
        state &= 3
        if (state == 0) 
        {
            col= rgb(255, 215, 0)   // gold
        }            
        else if(state == 1)
        {
            col = rgb(0, 0, 255) // blue   
        }
        else if(state== 2)
        {
            col = rgb(255, 255, 255) // white
        }
        else
        {
            col =  rgb(0, 0, 0) 
        }
        return col
}


class NumberWidget extends Widget
{
     constructor(x,y, destx, desty, value)
    {
        super()
        this._xpos = x
        this._ypos = y
        this.target = vec2(destx, desty)
        this.value = value
        var prefix = ""

        if(value >0)
        {
            prefix = "+"
        }

        this.text = k.add([
        text(prefix + value,  {font: "jersey"}),
        pos(x, y),
        scale(2),
        anchor("center"),
        color(0,0,0),
        {
            target : this.target,
            speed: 800,
        },
        outline(10,BLACK),
        {
            update() {
                const dir = this.target.sub(this.pos).unit(); 
                this.move(dir.scale(this.speed));
            }
        },
        z(200)])
        
        this.destx = destx
        this.desty = desty
    }  


    
    draw()
    {

   
        // toggle every 0.1 seconds
        if(this.value < 0)
        {
            this.text.color = rgb(180,0,0)
        }
        else
        {
             this.text.color = getFlashColor()
        }

        // Calculate distance to target
        const diff = this.text.target.sub(this.text.pos);

        // stop if close
        var targetDistance = diff.len()
        if (targetDistance < 50) 
        {
            this.text.destroy()
            theScore.addScore(this.value)
            return 1
        }
        return 0
    }
}

////////////////////////////////////////////////////////////////////////////////////////

class Score extends Widget
{
    constructor()
    {
        super()
        this.scorex = width()-width()/4
        this.scorey =  height()/6
        this.scoreValue = 0

        this.scoreText = k.add([
        text("Score:0", {font: "jersey"}),
        pos(this.scorex,this.scorey),
        scale(2),
        rotate(0),
        anchor("center"),
        color(255,0,0),
        z(200)
    ])
    }

    getx()
    {
        return this.scorex
    }

    gety()
    {
        return this.scorey
    }

    draw()
    {

    }

    

    addScore(v)
    {
        this.scoreValue += v
        this.scoreText.text = "Score:" + this.scoreValue
       
    }

    getScore()
    {
        return this.scoreValue
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////

const CONVEYOR_Y = 445
const TRASHING_Y = 600
var recycleAddTime = 0
class ConveyorItem extends Widget
{

    constructor(name, xpos, ypos, maxhealth, conveyorController)
    {
        super()
        this._xpos = xpos
        this._ypos = ypos
        this._health = maxhealth
        this._maxhealth = maxhealth
        this._state = FALLING_STATE

        this._img = k.add([sprite(name),
        pos(this._xpos, this._ypos),
        z(8),
        anchor("center"),
        scale(0.5,0.5)
        ])

        this.conveyorController = conveyorController
     
    }

    getSpriteIndex(A, max)
    {
        if(A === 0)
            return 3

        const ratio = (max - A) / max
        return Math.floor(ratio * 3)

}
        
    conveyor()
    {
        this._xpos+=conveyorSpeed

        this._img.pos.x = Math.round(this._xpos)

        if(this._health >= 0)
        {
            var stage = this.getSpriteIndex(this._health, this._maxhealth)


            this._img.frame = stage
        }

        if(this._xpos > (trashBinXpos + 120))
        {

            this._state = TRASHING_STATE
            allsprites.push(new NumberWidget(this._xpos, this._ypos, theScore.getx()+ 100, theScore.gety(),-this._maxhealth))
            wrongHandle = k.play("wrong", {volume: 1, loop: false})
            this.conveyorController.badKick()
        }

        if(this._xpos > (recycleBinXpos) && this._health == 0)
        {
            this._state = RECYCLING_STATE
            allsprites.push(new NumberWidget(this._xpos, this._ypos, theScore.getx(), theScore.gety(),this._maxhealth * 2))
            pingHandle = k.play("ping", {volume: 1, loop: false})
            this.conveyorController.goodKick()
        }

        return false
    }

    trashing()
    {
        this._ypos += 4
        this._img.pos.y = this._ypos
        if(this._ypos >= TRASHING_Y)
        {
           k.destroy(this._img)

           return true
        }
        return false
    }

    recycling()
    {
        this._ypos += 4
        this._img.pos.y = this._ypos
        if(this._ypos >= TRASHING_Y)
        {
           k.destroy(this._img)
           recycleAddTime = 8

           return true
        }
        return false
    }

    falling()
    {
        this._img.pos.y = this._ypos
        this._ypos+=8
        if(this._ypos >= CONVEYOR_Y)
        {
            this._ypos = CONVEYOR_Y
            this._state = CONVEYOR_STATE
        }
    }

    draw()
    {
        if(this._state == CONVEYOR_STATE)
            return this.conveyor()

        if(this._state == FALLING_STATE)
        {
            return this.falling()
        }

        if(this._state == TRASHING_STATE)
        {
            return this.trashing()
        }

        if(this._state == RECYCLING_STATE)
        {
            return this.recycling()
        }
    }

    squish(x, w)
    {
        if(this._health > 0 && this._xpos >= (x + (w/20)) && this._xpos < (x + w- (w/20)))
        {
            this._health -= 1
            if(this._health < 0)
            {
                this._health = 0
            }
        }
        return false
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////

var pistonPositions = [200,  180, 160, 120, 100, 80,60,40,20,0,0]
class Piston
{
    constructor(xpos,ypos, pistonOffset)
    {
        this._pistoResetSpeed = 1
        this._pistonPos = pistonOffset
        this._pistonSpeed = this._pistoResetSpeed
     

        this._xpos = xpos
        this._ypos = ypos
        this._theBlock = k.add([
            sprite("pistonblock"),
            pos(this._xpos-30, this._ypos),
            z(10),
            anchor("center"),
            scale(0.5, 0.5),
        ]);

      

        this._thePiston = k.add([
            sprite("piston"),
            pos(this._pistonx, this._pistony),
            z(9),
            anchor("center"),
            scale(0.5, 0.5),
        ]);
    }    
    
    draw()
    {

        var updated = false

        this._pistonPos++
        if(this._pistonPos >= pistonPositions.length)
        {
            this._pistonPos = 0
        }
        this._pistonSpeed = this._pistoResetSpeed
        updated = true

 
        
        this._pistony = this._ypos + pistonPositions[this._pistonPos]
        this._pistonx = this._xpos
        this._thePiston.pos = vec2(this._pistonx, this._pistony)
        return updated

    }    

    down()
    {
        if(this._pistonPos == 0)
        {
            return true
        }
        return false
    }

    getX()
    {
        return this._pistonx - this._thePiston.width/2
    }

    getW()
    {
        return this._thePiston.width
    }

}


//////////////////////////////////////////////////////////////////////////////////////////////////////

scene("initialise", ()=>
{
    var wsManager = new WSManager();

    var initText = k.add([
        text("Initialising:0", {font: "jersey"}),
        pos(width()/2, height()/2),
        scale(2),
        rotate(0),
        anchor("center"),
        color(255,0,0),
        z(200)
    ])

    wsManager.initConnections()


    function awaitConnections()
    {
     
        var connCount = exports.getConnections()
        initText.text="Initialising:"+connCount
        if( connCount >=1)     
        {
            exports.removeDisconnected()
            initText.destroy()
            go("awaitingStart")
            exports.setOnMessageCallback(null)
        }
     
    }

    loop(.5,awaitConnections)
})

//////////////////////////////////////////////////////////////////////////////////////////////

class PistonManager 
{
    constructor()
    {
        this.piston1 = new Piston(500,60,0)

        this.piston2 = new Piston(800,60,4)
        this.pistons = []
        this.pistons.push(this.piston1)
        this.pistons.push(this.piston2)
        this.speed = 1000
        this.timer = this.speed
        this.pistonWasDrawn = false
        this.bikeSpeed = 0
    }

    draw()
    {
        if(this.timer <= 0 && this.bikeSpeed > 0)
        {
            this.piston1.draw()
            this.piston2.draw()     
            this.timer = this.speed
            this.pistonWasDrawn = true
        }
        else
        {
            this.timer--;
            this.pistonWasDrawn = false
        }
    
    }

    setSpeed(speed)
    {
        this.bikeSpeed = speed
        speed = Math.floor(speed / 100)
        if(this.speed != speed)
        {
            this.speed = Math.floor((10-speed))
            this.timer = 0
        }            
    }

    down(index)
    {
        return this.pistons[index].down()
    }

    getX(index)
    {
        return this.pistons[index].getX()
    }


    getW(index)
    {
        return this.pistons[index].getW()
    }

    pistonsDrawn()
    {
        return this.pistonWasDrawn
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

class TimeDisplay 
{
    constructor()
    {
        this.timeSoFar = 0
        this.timeText = k.add([
        text("",  {font: "jersey"}),
        pos(width()-width()/4,40),
        scale(2),
        anchor("center"),
        color(255,0,0),
        outline(10,BLACK),
        z(200)
    ]);
    }

    draw()
    {
        if(!gameOver)
        {
            this.timeText.text = "Time " + (Math.abs(GAME_TIME_LENGTH -  this.timeSoFar)).toFixed(1)
            this.timeSoFar += 0.01

            if(GAME_TIME_LENGTH - this.timeSoFar <= 0)
            {
                gameOver = true
                go("gameover")
            }
        }
        else
        {
            this.timeText.text = "Time 0.0" 
        }    
    }

    getTimeSoFar()
    {
        return this.timeSoFar
    }
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class DifficultyController
{
    constructor(timeDisplay, conveyorController)
    {
        this.timeDisplay = timeDisplay
        this.conveyorController = conveyorController

    }


    getDifficulty()
    {
        return this.timeDisplay.getTimeSoFar() / GAME_TIME_LENGTH   
    }

    runDifficulty()
    {
        var throughGame =  this.getDifficulty()
        if(throughGame < 0.3)
        {
            this.conveyorController.setInsertRate(0)   
      
        }    
        
        if(throughGame >= 0.3 && throughGame <=0.66)
        {
            this.conveyorController.setInsertRate(1)   
           
        }   

        if(throughGame > 0.66)
        {
            this.conveyorController.setInsertRate(2)               
        }  
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

class ConveryorController
{
    constructor(demo)
    {
        this.tSinceLast = 0
        this.insertRate = 60
        this.healthMultiplier = 1.0
        this.gearIndex = 0
        this.gearSpeed = 0
        this.gearSpeedReset = 130
        this.beltFrameIndex = 0
        this.goodKickerTime = 0
        this.badKickerTime = 0
        this.demo = demo


      
        this.belt = add([sprite("conveyorTest"),
            pos(100,480),
            scale(0.8,0.8),
            z(7),
            anchor("topleft"),
            ])

        this.kickerGood = add([sprite("kicker"),
            pos(recycleBinXpos,this.belt.pos.y-135),
            scale(0.5,0.5),
            z(10),
            anchor("center")
            ])        
        
        
        this.kickerBad = add([sprite("kicker"),
            pos(trashBinXpos + 120,this.belt.pos.y-135),
            scale(0.5,0.5),
            z(10),
            anchor("center")
            ])        
        
        
        this.convback = add([sprite("convback"),
            pos(this.belt.pos.x+200, this.belt.pos.y+35),
            scale(0.8,0.8),
            z(1),
            anchor("topleft")
            ])    
            
                    
        this.flame1 = add([sprite("flame"),
            pos(this.belt.pos.x+252, this.belt.pos.y+50),
            scale(0.5,0.3),
            z(1),
            anchor("topleft")
            ])   

        this.flame2 = add([sprite("flame"),
            pos(this.belt.pos.x+1205, this.belt.pos.y+57),
            scale(0.5,0.3),
            z(1),
            anchor("topleft")
            ]) 
            
        this.flame1.play("flame")
        this.flame2.play("flame")

        }

        

        

        conveyerUpdate(){
   
            if(this.gearSpeed <= 0)
            {
                this.belt.frame = this.beltFrameIndex
                this.gearIndex++
                this.beltFrameIndex++

                if(this.beltFrameIndex >= 6)
                {
                    this.beltFrameIndex = 0
                }
                this.gearSpeed = this.gearSpeedReset
            }
            else
            {
                this.gearSpeed--
            }                
        }

    setInsertRate(insertRate)  
    {
        if(insertRate == 0)
        {
            this.insertRate = 100
            conveyorSpeed = 2
            this.belt.speed = -200
            this.gearSpeedReset = 8
        }

        if(insertRate == 1)
        {
            this.insertRate = 70
            conveyorSpeed = 3
            this.belt.speed = -280
            this.gearSpeedReset = 3.5
        }

        if(insertRate == 2)
        {
            this.insertRate = 30
            this.belt.speed = -432
            conveyorSpeed = 4.5
            this.gearSpeedReset = 2
        }
        
    } 

    setConveyporSpeed(newSpeed)
    {

    }

    goodKick()
    {
        this.goodKickerTime = 20
        this.kickerGood.frame = 1
    }

    badKick()
    {
        this.badKickerTime = 20
        this.kickerBad.frame = 2
    }

    setHealthMultiplier(m)
    {
        this.healthMultiplier = m
    }

    getMaxItemIndex(difficultyController)
    {
        if(this.demo)
            return 6
        var level = difficultyController.getDifficulty()
        if (level < 0.3)
            return 1
        if (level >= 0.3 & level < 0.6)
            return 3
        if (level >= 0.6)
            return 6
    }

    addConveyorItem(difficultyController)
    {
        var convItem = []
        convItem.push({name: "sprite", health:5})
        convItem.push({ name:"crisps", health:4})
        convItem.push({name:"box", health: 6})
        convItem.push({name:"butter", health: 8})
        convItem.push({name:"milk", health: 10})
        convItem.push({name:"coke", health: 12})
        convItem.push({name: "tin", health:15})

        var max = this.getMaxItemIndex(difficultyController)
       

        var item = convItem[getRandomInt(0, max)]

        var convItem = new ConveyorItem(item.name, 220,250, item.health, this)
        allsprites.push(convItem)
    }

    run(difficultyController)
    {
        this.conveyerUpdate()
        if(this.tSinceLast == 0)
        {
            if(allsprites.length < 20)
            {
                this.addConveyorItem(difficultyController)
                this.tSinceLast = this.insertRate
            }
        }
        else
        {
            this.tSinceLast--
        }

        if(this.goodKickerTime)
        {
            this.goodKickerTime--
            if(this.goodKickerTime == 0)
            {
                this.kickerGood.frame = 0
            }
        }

        if(this.badKickerTime)
        {
            this.badKickerTime--
            if(this.badKickerTime == 0)
            {
                this.kickerBad.frame = 0
            }
        }
    }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

scene("game", () => {

    var pManager = new PistonManager()

    var gameTimer = new TimeDisplay()

    var conveyorController = new ConveryorController(false)

    var difficultyController = new DifficultyController(gameTimer, conveyorController)

    gameOver = false

    
    const musicHandle = k.play("backmusic", {volume : 0.5, loop:false, paused:false})

    

    var chute = k.add([sprite("chute"),
                        pos(-300, -70),
                        scale(0.6,0.6),
                        z(40)
    ])

    var background = k.add([sprite("background"),
        pos(0,0),
        scale(0.7,0.7),
        z(0),
        anchor("topleft")
    ])


  
    var trash = k.add([sprite("trash"),
        pos(trashBinXpos,500),
        scale(0.7,0.7),
        z(50)
    ])
    
    var recycle = k.add([sprite("recycle"),
        pos(recycleBinXpos,780),
        scale(0.7,0.7),
        z(50),
        anchor("center")
    ])

    var recycleadd = k.add([sprite("recycleadd"),
        pos(-300,780),
        scale(0.7,0.7),
        z(50),
        anchor("center")
     ])

     theScore = new Score()
     allsprites.push(theScore)


    exports.setOnMessageCallback(onMessage)

    function onMessage(event)
    {

        const jsonObject = JSON.parse(event.data);
        if(jsonObject.type != "speed_data")
            return
        var dataId = jsonObject.id;
        var speed = jsonObject.speed;

        if(dataId == 0) // Always use player 1 (id0)
        {
            pManager.setSpeed(speed)
        }
 
    }

    function sprot()
    {
        if(gameOver)
        {   
            exports.setOnMessageCallback(null)
            return;
        }            

        background.scale =  vec2(width() / background.width, height() / background.height)

        difficultyController.runDifficulty()

        gameTimer.draw()

        conveyorController.run(difficultyController)

        pManager.draw()


        if(recycleAddTime)
        {
            recycleAddTime --
            recycleadd.pos.x = recycleBinXpos,780
            recycle.pos.x = -300,780

        }
        else
        {
            recycle.pos.x= recycleBinXpos
            recycleadd.pos.x = -300
        }

        allsprites.forEach((sprite , index) => {

            if(pManager.pistonsDrawn() && pManager.down(0))
            {
                sprite.squish(pManager.getX(0), pManager.getW(0))
            }

            if(pManager.pistonsDrawn() && pManager.down(1))
            {
                sprite.squish(pManager.getX(1), pManager.getW(1))
            }

            if(sprite.draw())
            {
                allsprites.splice(index,1)
            }
            
        });
    }

    loop(0.01,sprot)
});

/////////////////////////////////////////////////////////////////////////////////////////////////

scene("gameover", () => {

    var gameOver = k.add([sprite("gameover"),
        pos(0,0),
        scale(0.7,0.7),
        z(50),
        anchor("topleft")
    ])

    if(pingHandle != undefined)
    {
        pingHandle.stop()
    }

    if(wrongHandle != undefined)
    {
        wrongHandle.stop()
    }

    var currentSpeed = 100
    var minTime = 50

    exports.setOnMessageCallback(onMessage)

    var scoreText = k.add([
        text("Score:", {font: "jersey"}),
        pos(width()/2 ,height() - 110),
        scale(3),
        rotate(0),
        anchor("center"),
        color(255,0,0),
        z(200)
    ])
    function onMessage(event)
    {

        const jsonObject = JSON.parse(event.data);
        if(jsonObject.type != "speed_data")
            return
        var dataId = jsonObject.id;
        var speed = jsonObject.speed;

        if(dataId == 0) // Always use player 1 (id0)
        {
            currentSpeed = speed
        }
 
    }

    scoreText.text = "Score: " + theScore.getScore()

    function sprot()
    {
        var xscale = 
        gameOver.scale = vec2(width() / gameOver.width, height() / gameOver.height)
        scoreText.color = getFlashColor()
        if(minTime)
        {
            minTime--
        }

        if(minTime == 0 && currentSpeed == 0)
        {
            exports.setOnMessageCallback(null)
            go("awaitingStart")
        }
    }

    loop(0.1,sprot)

})



scene("awaitingStart", () => {

    var logo = k.add([sprite("logo"),
        pos(0,0),
        scale(0.7,0.7),
        z(5),
        anchor("topleft")
    ])

    var currentSpeed = 0
    var speedCounter = 0

    var piston1 = new Piston(width() * 0.1,60,0)

    var piston2 = new Piston(width() * 0.9,60,4)



    allsprites = []

    exports.setOnMessageCallback(onMessage)


    function onMessage(event)
    {

        const jsonObject = JSON.parse(event.data);
        if(jsonObject.type != "speed_data")
            return
        var dataId = jsonObject.id;
        var speed = jsonObject.speed;

        if(dataId == 0) // Always use player 1 (id0)
        {
            currentSpeed = speed
            if(currentSpeed > 0)
            {
                speedCounter ++
            }
            else
            {
                speedCounter = 0
            }
        }
 
    }


    function sprot()
    {
 
        logo.scale = vec2(width() / logo.width, height() / logo.height)

        if(speedCounter > 5)
        {
            exports.setOnMessageCallback(null)
            go("game")
        }

        piston1.draw()
        piston2.draw()

   }

    loop(0.1,sprot)

})




go("initialise")

