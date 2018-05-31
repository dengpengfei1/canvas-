let canvasDrawer = function (selector) {
  let canvas = document.querySelector(selector)
  let ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  let requestFrame = window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    function(callback) {
                      window.setTimeout(callback, 1000 / 60);
                    }
  let clearRequestFrame =
                  window.cancelAnimationFrame ||
                  window.webkitCancelAnimationFrame ||
                  window.mozCancelAnimationFrame ||
                  window.oCancelAnimationFrame ||
                  window.msCancelAnimationFrame ||
                  window.clearTimeout

  let drwaBackground = function () {
    ctx.beginPath()
    let linearGradient = ctx.createLinearGradient(0, canvas.height, 0, 0) 	
    linearGradient.addColorStop(0, 'rgb(255,164,28,0.7)')
    linearGradient.addColorStop(1, 'rgb(253,129,55,0.8)')
    ctx.fillStyle = linearGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.closePath()
  }

  let points = []

  // 获取文字的像素点
  let getPoints = function () {
    let width = getSize().width
    let height = getSize().height
    // 间隙大小
    let gap = 8;
    let imgData = ctx.getImageData(0, 0, width, height).data // 获取画布的像素值

    let pos = [];
    let x = 0, y = 0, index = 0;
    for (let i=0; i < imgData.length; i += (4 * gap)) {
      if (imgData[i + 3] == 255) { // 只要文字不透明, 第四个像素点值就是 255, 根据这个判断像素点是否属于字体(在绘制背景色之前, 绘制字体, 免得背景色干扰)
        pos.push({
          x: x,
          y: y
        })
      }
      index = Math.floor(i / 4);
      x = index % width;
      y = Math.floor(index / width)
      if (x >= width - gap) {
        i += gap * 4 * width
      }
    }

    points = pos
  }

  let drawLetter = (str) => {
    size = getSize()
    ctx.beginPath()
    ctx.font = '150px bold arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white' // 设置字体白色
    ctx.fillText(str, canvas.width / 2, canvas.height / 2)
    ctx.closePath()
    getPoints()
    ctx.clearRect(0, 0, size.width, size.height) // 清除画布, 不显示字体
  }

  let getSize = function () {
    return {
      width: canvas.width,
      height: canvas.height
    }
  }

  let resize = function () {
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth
      drawLetter()
      drwaBackground()
    })
  }

  let move = () => {
    let step = () => {
      ctx.clearRect(0, 0, size.width, size.height)
      drwaBackground()
      store.forEach(item => {
        item.move()
      })
      timer = requestFrame(step)
    }
    return new Promise((resolve, reject) => {
      resolve(step())
    })
  }

  let moveTo = (cb) => {
    if (cb) {
      cb()
    }
    let step = () => {
      ctx.clearRect(0, 0, size.width, size.height)
      drawLetter(arr[i])
      drwaBackground()
      store.forEach((item, i) => {
        item.moveTo()
      })
      timerTo = requestFrame(step)
      let stopState = store.every(item => {
        return item.stop
      })
      if (stopState) {
        clearRequestFrame(timerTo)
      }
    }
    return new Promise((resolve, reject) => {
      resolve(step())
    })
  }

  let randomOutside = () => {
    let width = size.width
    let height = size.height
    let angel = Math.random() * 2 * Math.PI
    let r = Math.sqrt(width * width / 4 + height * height / 4) + 10
    let y = height / 2 - r * Math.sin(angel)
    let x = width / 2 - r * Math.cos(angel)
    return {
      x: x,
      y: y
    }
  }

  class Dots {
    constructor (position, color) {
      this.x = this.randomPosition().a
      this.y = this.randomPosition().b
      this.r = 3
      this.color = color ? color : this.randomColor()
      this.vx = this.randomSpeed()
      this.vy = this.randomSpeed()
      this.position = position
      this.oldColor = this.color
      this.moveDirection = 'in'
      this.stop = false
    }
    drawDot () {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI)
      ctx.fillStyle = this.color
      ctx.fill()
      ctx.closePath()
    }
    randomSpeed () {
      let speedArr = [-3, -2, -1, 1, 2, 3]
      let s = speedArr[Math.floor((Math.random() * 6))]
      return s
    }
    randomColor () {
      return `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
    }
    randomPosition () {
      let size = getSize()
      return {
        a: Math.floor(Math.random() * size.width),
        b: Math.floor(Math.random() * size.height)
      }
    }
    move () {
      let size = getSize()
      if (this.y + this.r >= size.height || this.y - this.r <= 0) {
        this.vy = -this.vy
      }
      if (this.x + this.r >= size.width || this.x - this.r <= 0) {
        this.vx = -this.vx
      }
      this.x += this.vx
      this.y += this.vy
      this.drawDot()
    }
    moveTo () {
      this.drawDot()
      if (this.position) {
        let distanceX = this.position.x - this.x
        let distanceY = this.position.y - this.y
        let abX = Math.ceil(Math.abs(distanceX))
        let abY = Math.ceil(Math.abs(distanceY))
        if (this.moveDirection === 'out') {
          if (abX <= 1 || abY <= 1) {
            this.color = 'transparent'
          }
        } else {
          this.color = this.oldColor
        }
        if (abX <= 1 && abY <= 1) {
          this.stop = true  // 运动到目的位置, 添加停止状态
          return
        }
        if (this.stop) {
          this.stop = false // 没有到目的位置, 状态重置
        }
        if (abX > 10) {
          if (distanceX < 0) {
            this.x -= 10
          } else {
            this.x += 10
          }
        } else {
          if (distanceX < 0) {
            this.x --
          } else {
            this.x ++
          }
        }
        if (abY > 10) {
          if (distanceY < 0) {
            this.y -= 10
          } else {
            this.y += 10
          }
        } else {
          if (distanceY < 0) {
            this.y --
          } else {
            this.y ++
          }
        }
      }
    }
  }

  let i = 0
  let arr = ['Welcome to FUI!', '为企业安全量身定制', 'Components', 'Easy to use', 'Vue 2.0']
  let store = [] // 存储 dot 实例
  let size = getSize()
  let timer = null
  let timerTo = null
  let timerOnce = null
  let timerInterval = null
  let flag = true
  
  drawLetter(arr[i])
  drwaBackground()
  resize()
  
  points.forEach(item => {
    let dot = new Dots(item)
    store.push(dot)
  })
  
  async function interval () {
    if (!flag) return
    flag = false
    clearRequestFrame(timer)
    clearTimeout(timerOnce)
    
    await moveTo(() => {
      store.forEach(item => {
        item.position = randomOutside()
        item.moveDirection = 'out'
      })
    })

    timerOnce = setTimeout(async () => {
      ctx.clearRect(0, 0, size.width, size.height)
      drawLetter(arr[i])
      drwaBackground()
      
      i++
      if (i > arr.length - 1) {
        i = 1
      }
      
      if (store.length > points.length) {
        store.forEach((item, i) => {
          if (i < points.length) {
            store[i].position = points[i]
            store[i].color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
            store[i].moveDirection = 'in'
          } else {
            store[i].color = 'transparent'
          }
        })
      } else {
        points.forEach((item, i) => {
          if (i < store.length) {
            store[i].position = item
            store[i].color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
          } else {
            store.push(new Dots(item))
          }
          store[i].moveDirection = 'in'
        })
      }
      await moveTo()

      flag = true
    }, 3000)
  }

  moveTo()
  i++
  timerInterval = setInterval(() => {
    interval()
  }, 7000)

  return timerInterval
}

module.exports = canvasDrawer