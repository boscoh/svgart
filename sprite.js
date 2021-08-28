/**
 * A global animation loop manager, requires objects with the
 * interface:
 * - .animate( timeElapsed )
 * - .isChanged
 * - .draw()
 */

function registerWidgetForAnimation (widget) {
    function loop () {
        window.requestAnimationFrame(loop)

        if (window.animationWidgets.length === 0) {
            return
        }

        let currTime = new Date().getTime()
        let elapsedTime = currTime - window.lastAnimationTime
        window.totalAnimationTime += elapsedTime

        for (let widget of window.animationWidgets) {
            widget.animate(elapsedTime, window.totalAnimationTime)
        }

        window.lastAnimationTime = currTime

        for (let widget of window.animationWidgets) {
            if (widget.isChanged) {
                widget.draw()
            }
        }
    }

    if (typeof window.animationWidgets === 'undefined') {
        window.animationWidgets = []
        window.lastAnimationTime = new Date().getTime()
        window.totalAnimationTime = 0
        loop()
    }

    window.animationWidgets.push(widget)
}

/**
 * A Base Widget Class to wrap <div>'s in the DOM
 * bind callbacks and handle mouse/touch input
 * Also contains a resize, animate and draw functionality
 * for tying together animation loops
 */
class Widget {
    constructor (selector) {
        this.selector = selector
        this.div = $(this.selector)
        this.divDom = this.div[0]

        // for the animation loop
        this.isChanged = false

        // mouse/touch input parameters
        this.pointerX = null
        this.pointerY = null
        this.savePointerX = null
        this.savePointerY = null
        this.mousePressed = false
        this.isGesture = false
        this.gestureRot = 0
        this.gestureScale = 1.0
    }

    // for the animation loop

    registerAnimation () {
        registerWidgetForAnimation(this)
    }

    draw () {}

    animate (elapsedTime) {} // eslint-disable-line

    bindCallbacks (dom) {
        let bind = (eventType, callback) => {
            dom.addEventListener(eventType, callback)
        }

        bind('mousedown', e => this.mousedown(e))
        bind('mousemove', e => this.mousemove(e))
        bind('mouseup', e => this.mouseup(e))
        bind('mousewheel', e => this.mousewheel(e))
        bind('DOMMouseScroll', e => this.mousewheel(e))
        bind('touchstart', e => this.mousedown(e))
        bind('touchmove', e => this.mousemove(e))
        bind('touchend', e => this.mouseup(e))
        bind('touchcancel', e => this.mouseup(e))
        bind('gesturestart', e => this.gesturestart(e))
        bind('gesturechange', e => this.gesturechange(e))
        bind('gestureend', e => this.gestureend(e))
    }

    resize () {
        // override
    }

    x () {
        let divPos = this.div.offset()
        return divPos.left
    }

    y () {
        let divPos = this.div.offset()
        return divPos.top
    }

    width () {
        return this.div.width()
    }

    height () {
        return this.div.height()
    }

    isInside (x, y) {
        return (
            x >= this.x() &&
            x <= this.x() + this.width() &&
            y >= this.y() &&
            y <= this.y() + this.height()
        )
    }

    calcPointerXY (event) {
        // calculation of div position by traversing DOM tree
        let top = 0
        let left = 0
        let dom = this.divDom
        if (dom.offsetParent) {
            left = dom.offsetLeft
            top = dom.offsetTop
            dom = dom.offsetParent
            while (dom) {
                left += dom.offsetLeft
                top += dom.offsetTop
                dom = dom.offsetParent
            }
        }
        dom = this.divDom
        do {
            left -= dom.scrollLeft || 0
            top -= dom.scrollTop || 0
            dom = dom.parentNode
        } while (dom)

        if (!_.isUndefined(event.touches) && event.touches.length > 0) {
            this.eventX = event.touches[0].clientX
            this.eventY = event.touches[0].clientY
        } else {
            this.eventX = event.clientX
            this.eventY = event.clientY
        }

        this.pointerX = this.eventX - left
        this.pointerY = this.eventY - top
    }

    savePointerXY () {
        this.savePointerX = this.pointerX
        this.savePointerY = this.pointerY
    }

    mousedown (event) {
        this.calcPointerXY(event)

        // event.preventDefault()

        this.mouseclick(this.pointerX, this.pointerY)

        let now = new Date().getTime()

        let isDoubleClick = now - this.timeLastPressed < 500
        if (isDoubleClick) {
            this.mousedoubleclick(this.pointerX, this.pointerY)
        }

        this.timeLastPressed = now

        this.savePointerXY()
        this.mousePressed = true
    }

    mousemove (event) {
        this.calcPointerXY(event)

        // event.preventDefault()

        // skip if touch gesture has started
        if (this.isGesture) {
            return
        }

        let shiftDown = event.shiftKey === 1

        let rightMouse = event.button === 2 || event.which === 3

        if (this.mousePressed) {
            if (rightMouse || shiftDown) {
                this.rightmousedrag(
                    this.savePointerX,
                    this.savePointerY,
                    this.pointerX,
                    this.pointerY
                )
            } else {
                this.leftmousedrag(
                    this.savePointerX,
                    this.savePointerY,
                    this.pointerX,
                    this.pointerY
                )
            }
        }
        this.savePointerXY()
    }

    mouseup (event) {
        this.calcPointerXY(event)

        // event.preventDefault()

        if (!_.isUndefined(event.touches)) {
            this.pointerX = null
            this.pointerY = null
        }

        this.mousePressed = false
    }

    gesturestart (event) {
        // event.preventDefault()
        this.isGesture = true
        this.gestureRot = 0
        this.gestureScale = event.scale * event.scale
    }

    gesturechange (event) {
        // event.preventDefault()
        this.gesturedrag(
            event.rotation - this.gestureRot,
            this.gestureScale / event.scale
        )

        this.gestureRot = event.rotation
        this.gestureScale = event.scale
    }

    gestureend (event) {
        event.preventDefault()
        this.isGesture = false
        this.mousePressed = false
    }

    mousewheel (event) {
        // event.preventDefault()

        let wheel
        if (!_.isUndefined(event.wheelDelta)) {
            wheel = event.wheelDelta / 120
        } else {
            // for Firefox
            wheel = -event.detail / 12
        }

        this.mousescroll(wheel)
    }

    // override these functions

    mousescroll (wheel) {} // eslint-disable-line

    mouseclick (x, y) {} // eslint-disable-line

    mousedoubleclick (x, y) {} // eslint-disable-line

    leftmousedrag (x0, y0, x1, y1) {} // eslint-disable-line

    rightmousedrag (x0, y0, x1, y1) {} // eslint-disable-line

    gesturedrag (rot, scale) {} // eslint-disable-line
}

/**
 * CanvasWidget
 *   - abstract class to wrap a canvas element
 *   - instantiates an absolute div that fits the $(selector)
 *   - attaches a canvas to this div
 *   - creates methods that redirects mouse commands to that canvas
 */
class CanvasWidget extends Widget {
    constructor (selector) {
        super(selector)

        this.canvas = $('<canvas>')
        this.canvas.attr('width', this.width())
        this.canvas.attr('height', this.height())
        this.div.append(this.canvas)

        this.canvasDom = this.canvas[0]
        this.drawContext = this.canvasDom.getContext('2d')

        this.bindCallbacks(this.canvasDom)
        this.registerAnimation()
    }

    resize () {
        this.canvasDom.width = this.width()
        this.canvasDom.height = this.height()
    }

    strokeRect (x, y, w, h, strokeStyle) {
        this.drawContext.strokeStyle = strokeStyle
        this.drawContext.strokeRect(x, y, w, h)
    }

    fillRect (x, y, w, h, fillStyle) {
        this.drawContext.fillStyle = fillStyle
        this.drawContext.fillRect(x, y, w, h)
    }

    line (x1, y1, x2, y2, lineWidth, color) {
        this.drawContext.moveTo(x1, y1)
        this.drawContext.lineTo(x2, y2)
        this.drawContext.lineWidth = lineWidth
        this.drawContext.strokeStyle = color
        this.drawContext.stroke()
    }

    text (text, x, y, font, color, align) {
        this.drawContext.fillStyle = color
        this.drawContext.font = font
        this.drawContext.textAlign = align
        this.drawContext.textBaseline = 'middle'
        this.drawContext.fillText(text, x, y)
    }

    textWidth (text, font) {
        this.drawContext.font = font
        this.drawContext.textAlign = 'center'
        return this.drawContext.measureText(text).width
    }
}

class Sprite {
    constructor (options = null) {
        this.url = null
        this.width = 0
        this.height = 0
        this.image = new Image()
        this.isLoaded = false

        this.absScale = 1
        this.scale = 1

        this.x = 0
        this.y = 0
        this.relX = 0
        this.relY = 0
        this.dRelX = 0
        this.dRelY = 0

        this.anchor = { x: 0, y: 0, relX: 0, relY: 0 }
        this.angle = 0

        this.iFrame = 0
        this.iCounter = 0
        this.nCounterPerFrame = 1
        this.frames = []

        this.isBorderBox = false

        this.animateVar = null
        this.animateFn = null

        if (options) {
            for (let [key, value] of _.toPairs(options)) {
                this[key] = value
            }
        }

        if (this.url) {
            this.asyncLoadSrc(this.url).then(() => this.onLoad())
        }
    }

    asyncLoadSrc (src) {
        return new Promise(resolve => {
            console.log(`Loading ${src}`)
            this.src = src
            this.image.src = src
            this.image.onload = () => {
                console.log(
                    `Loaded ${src}`,
                    this.image.width,
                    this.image.height
                )
                this.isLoaded = true
                this.width = this.image.width
                this.height = this.image.height
                this.anchor = {
                    x: this.width / 2,
                    y: this.height / 2,
                }
                resolve()
            }
        })
    }

    getFrame () {
        let iFrame = this.iFrame
        if (!_.isNil(iFrame)) {
            return this.frames[iFrame]
        } else {
            return null
        }
    }

    updateFrame () {
        this.iCounter += 1
        if (this.iCounter % this.nCounterPerFrame === 0) {
            let frame = this.frames[this.iFrame]
            this.relX += (frame.diffX * this.scale) / this.parentWidth
            if (this.relX >= 1) {
                this.relX = (-frame.w * this.scale) / this.parentWidth
            }
            this.iFrame += 1
            if (this.iFrame >= this.frames.length) {
                this.iFrame = 0
            }
        }
    }

    animate (timeElapsed) {
        if (this.animateFn) {
            let key = this.animateVar
            this[key] = this.animateFn(timeElapsed)
        }
    }

    render (context) {
        let frame
        let iFrame = this.iFrame
        if (_.isNil(iFrame) || this.frames.length === 0) {
            frame = {
                x: 0,
                y: 0,
                w: this.image.width,
                h: this.image.height,
            }
        } else {
            frame = this.frames[iFrame]
        }

        if (this.angle !== 0) {
            context.save()
            context.translate(this.anchor.x, this.anchor.y)
            context.rotate((this.angle * Math.PI) / 180.0)
            context.translate(-this.anchor.x, -this.anchor.y)
        }

        this.x = (this.relX + this.dRelX) * this.parentWidth
        this.y = (this.relY + this.dRelY) * this.parentHeight

        context.drawImage(
            this.image,
            frame.x,
            frame.y,
            frame.w,
            frame.h,
            this.x,
            this.y,
            frame.w * this.scale,
            frame.h * this.scale
        )

        if (this.isBorderBox) {
            context.strokeStyle = 'red'
            context.strokeRect(
                this.x - 1,
                this.y - 1,
                frame.w * this.scale + 2,
                frame.h * this.scale + 2
            )
        }

        if (this.angle !== 0) {
            context.restore()
        }
    }
}
