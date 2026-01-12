/**
 * Winwheel.js - Extracted directly from AhaSlides spinner wheel demo (app.js)
 * This is the ACTUAL code from the demo, converted to ES module format
 */

import { gsap } from 'gsap'

let winwheelToDrawDuringAnimation = null

function Animation(e) {
  var t = {
    type: "spinOngoing",
    direction: "clockwise",
    propertyName: null,
    propertyValue: null,
    duration: 10,
    yoyo: !1,
    repeat: null,
    easing: null,
    stopAngle: null,
    spins: null,
    clearTheCanvas: null,
    callbackFinished: null,
    callbackBefore: null,
    callbackAfter: null,
    callbackSound: null,
  };
  for (var n in t)
    null != e && "undefined" !== typeof e[n]
      ? (this[n] = e[n])
      : (this[n] = t[n]);
  if (null != e)
    for (var i in e) "undefined" === typeof this[i] && (this[i] = e[i]);
}

function Segment(e) {
  var t = {
    size: null,
    text: "",
    fillStyle: null,
    strokeStyle: null,
    lineWidth: null,
    textFontFamily: null,
    textFontSize: null,
    textFontWeight: null,
    textOrientation: null,
    textAlignment: null,
    textDirection: null,
    textMargin: null,
    textFillStyle: null,
    textStrokeStyle: null,
    textLineWidth: null,
  };
  for (var n in t)
    null != e && "undefined" !== typeof e[n]
      ? (this[n] = e[n])
      : (this[n] = t[n]);
  if (null != e)
    for (var i in e) "undefined" === typeof this[i] && (this[i] = e[i]);
  this.startAngle = 0;
  this.endAngle = 0;
}

function PointerGuide(e) {
  var t = {
    display: !1,
    strokeStyle: "red",
    lineWidth: 3,
  };
  for (var n in t)
    null != e && "undefined" !== typeof e[n]
      ? (this[n] = e[n])
      : (this[n] = t[n]);
}

function winwheelTriggerSound() {
  0 ==
    winwheelToDrawDuringAnimation.hasOwnProperty(
      "_lastSoundTriggerNumber",
    ) && (winwheelToDrawDuringAnimation._lastSoundTriggerNumber = 0);
  var callbackSound = winwheelToDrawDuringAnimation.animation.callbackSound,
    currentTriggerNumber = 0;
  currentTriggerNumber =
    winwheelToDrawDuringAnimation.getIndicatedSegmentNumber();
  currentTriggerNumber !=
    winwheelToDrawDuringAnimation._lastSoundTriggerNumber &&
    ("function" === typeof callbackSound
      ? callbackSound()
      : eval(callbackSound),
    (winwheelToDrawDuringAnimation._lastSoundTriggerNumber =
      currentTriggerNumber));
}

function winwheelAnimationLoop() {
  if (winwheelToDrawDuringAnimation) {
    0 != winwheelToDrawDuringAnimation.animation.clearTheCanvas &&
      winwheelToDrawDuringAnimation.ctx.clearRect(
        0,
        0,
        winwheelToDrawDuringAnimation.canvas.width,
        winwheelToDrawDuringAnimation.canvas.height,
      );
    var callbackBefore =
        winwheelToDrawDuringAnimation.animation.callbackBefore,
      callbackAfter = winwheelToDrawDuringAnimation.animation.callbackAfter;
    null != callbackBefore &&
      ("function" === typeof callbackBefore
        ? callbackBefore(
            winwheelToDrawDuringAnimation.getIndicatedSegment(),
          )
        : eval(callbackBefore));
    winwheelToDrawDuringAnimation.draw(!1);
    null != callbackAfter &&
      ("function" === typeof callbackAfter
        ? callbackAfter(
            winwheelToDrawDuringAnimation.getIndicatedSegment(),
          )
        : eval(callbackAfter));
    winwheelToDrawDuringAnimation.animation.callbackSound &&
      winwheelTriggerSound();
  }
}

function winwheelStopAnimation(canCallback) {
  if (0 != canCallback) {
    var callback = winwheelToDrawDuringAnimation.animation.callbackFinished;
    null != callback &&
      ("function" === typeof callback
        ? callback(winwheelToDrawDuringAnimation.getIndicatedSegment())
        : eval(callback));
  }
}

function winwheelResize() {
  var e = 40;
  "undefined" !== typeof winwheelToDrawDuringAnimation._responsiveMargin &&
    (e = winwheelToDrawDuringAnimation._responsiveMargin);
  var t = window.innerWidth - e,
    n = winwheelToDrawDuringAnimation._responsiveMinWidth,
    i = winwheelToDrawDuringAnimation._responsiveMinHeight;
  t < n
    ? (t = n)
    : t > winwheelToDrawDuringAnimation._originalCanvasWidth &&
      (t = winwheelToDrawDuringAnimation._originalCanvasWidth);
  var a = t / winwheelToDrawDuringAnimation._originalCanvasWidth;
  winwheelToDrawDuringAnimation.canvas.width =
    winwheelToDrawDuringAnimation._originalCanvasWidth * a;
  if (winwheelToDrawDuringAnimation._responsiveScaleHeight) {
    var s = winwheelToDrawDuringAnimation._originalCanvasHeight * a;
    s < i
      ? (s = i)
      : s > winwheelToDrawDuringAnimation._originalCanvasHeight &&
        (s = winwheelToDrawDuringAnimation._originalCanvasHeight);
    winwheelToDrawDuringAnimation.canvas.height = s;
  }
  winwheelToDrawDuringAnimation.scaleFactor = a;
  winwheelToDrawDuringAnimation.draw();
}

export function Winwheel(e, t) {
  var n = {
    canvasId: "canvas",
    centerX: null,
    centerY: null,
    outerRadius: null,
    innerRadius: 0,
    numSegments: 1,
    drawMode: "code",
    rotationAngle: 0,
    textFontFamily: "Arial",
    textFontSize: 20,
    textFontWeight: "bold",
    textOrientation: "horizontal",
    textAlignment: "center",
    textDirection: "normal",
    textMargin: null,
    textFillStyle: "black",
    textStrokeStyle: null,
    textLineWidth: 1,
    fillStyle: "silver",
    strokeStyle: "white",
    lineWidth: 1,
    clearTheCanvas: !0,
    drawText: !0,
    pointerAngle: 0,
    responsive: !1,
    scaleFactor: 1,
  };
  for (var i in n)
    null != e && "undefined" !== typeof e[i]
      ? (this[i] = e[i])
      : (this[i] = n[i]);
  if (null != e)
    for (var a in e) "undefined" === typeof this[a] && (this[a] = e[a]);

  if (this.canvasId) {
    this.canvas = document.getElementById(this.canvasId);
    if (this.canvas) {
      null == this.centerX && (this.centerX = this.canvas.width / 2);
      null == this.centerY && (this.centerY = this.canvas.height / 2);
      null == this.outerRadius &&
        (this.canvas.width < this.canvas.height
          ? (this.outerRadius = this.canvas.width / 2 - this.lineWidth)
          : (this.outerRadius = this.canvas.height / 2 - this.lineWidth));
      this.ctx = this.canvas.getContext("2d");
    } else {
      this.canvas = null;
      this.ctx = null;
    }
  } else {
    this.canvas = null;
    this.ctx = null;
  }

  this.segments = new Array(null);

  for (var s = 1; s <= this.numSegments; s++)
    null != e && e.segments && "undefined" !== typeof e.segments[s - 1]
      ? (this.segments[s] = new Segment(e.segments[s - 1]))
      : (this.segments[s] = new Segment());

  this.updateSegmentSizes();
  null === this.textMargin && (this.textMargin = this.textFontSize / 1.7);
  null != e && e.animation && "undefined" !== typeof e.animation
    ? (this.animation = new Animation(e.animation))
    : (this.animation = new Animation());

  var shouldDraw = !0;
  null != e && e.pointerGuide && "undefined" !== typeof e.pointerGuide
    ? (this.pointerGuide = new PointerGuide(e.pointerGuide))
    : (this.pointerGuide = new PointerGuide());

  if (this.responsive) {
    winwheelToDrawDuringAnimation = this;
    this._originalCanvasWidth = this.canvas.width;
    this._originalCanvasHeight = this.canvas.height;
    this._responsiveScaleHeight = this.canvas.dataset.responsivescaleheight;
    this._responsiveMinWidth = this.canvas.dataset.responsiveminwidth;
    this._responsiveMinHeight = this.canvas.dataset.responsiveminheight;
    this._responsiveMargin = this.canvas.dataset.responsivemargin;
    window.addEventListener("load", winwheelResize);
    window.addEventListener("resize", winwheelResize);
  }

  if (shouldDraw) this.draw(this.clearTheCanvas);
}

Winwheel.prototype.updateSegmentSizes = function () {
  if (this.segments) {
    var e = 0, t = 0;
    for (var n = 1; n <= this.numSegments; n++)
      null !== this.segments[n].size && (e += this.segments[n].size, t++);
    var i = 360 - e,
      a = 0;
    i > 0 && (a = i / (this.numSegments - t));
    var s = 0;
    for (var r = 1; r <= this.numSegments; r++) {
      this.segments[r].startAngle = s;
      this.segments[r].size ? (s += this.segments[r].size) : (s += a);
      this.segments[r].endAngle = s;
    }
  }
};

Winwheel.prototype.clearCanvas = function () {
  this.ctx &&
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

Winwheel.prototype.draw = function (e) {
  this.ctx &&
    ("undefined" !== typeof e
      ? 1 == e && this.clearCanvas()
      : this.clearCanvas(),
    this.drawSegments(),
    1 == this.drawText && this.drawSegmentText(),
    1 == this.pointerGuide.display && this.drawPointerGuide());
};

Winwheel.prototype.drawPointerGuide = function () {
  if (this.ctx) {
    var e = this.centerX * this.scaleFactor,
      t = this.centerY * this.scaleFactor,
      n = this.outerRadius * this.scaleFactor;
    this.ctx.save();
    this.ctx.translate(e, t);
    this.ctx.rotate(this.degToRad(this.pointerAngle));
    this.ctx.translate(-e, -t);
    this.ctx.strokeStyle = this.pointerGuide.strokeStyle;
    this.ctx.lineWidth = this.pointerGuide.lineWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(e, t);
    this.ctx.lineTo(e, -n / 4);
    this.ctx.stroke();
    this.ctx.restore();
  }
};

Winwheel.prototype.drawSegments = function () {
  if (this.ctx && this.segments)
    for (
      var e = this.centerX * this.scaleFactor,
        t = this.centerY * this.scaleFactor,
        n = this.innerRadius * this.scaleFactor,
        i = this.outerRadius * this.scaleFactor,
        a = 1;
      a <= this.numSegments;
      a++
    ) {
      var s = this.segments[a],
        r = void 0,
        o = void 0,
        l = void 0;
      r = null !== s.fillStyle ? s.fillStyle : this.fillStyle;
      this.ctx.fillStyle = r;
      o = null !== s.lineWidth ? s.lineWidth : this.lineWidth;
      this.ctx.lineWidth = o;
      l = null !== s.strokeStyle ? s.strokeStyle : this.strokeStyle;
      this.ctx.strokeStyle = l;
      if (l || r) {
        this.ctx.beginPath();
        if (this.innerRadius) {
          var c =
              Math.cos(
                this.degToRad(s.startAngle + this.rotationAngle - 90),
              ) *
              (n - o / 2),
            h =
              Math.sin(
                this.degToRad(s.startAngle + this.rotationAngle - 90),
              ) *
              (n - o / 2);
          this.ctx.moveTo(e + c, t + h);
        } else this.ctx.moveTo(e, t);
        this.ctx.arc(
          e,
          t,
          i,
          this.degToRad(s.startAngle + this.rotationAngle - 90),
          this.degToRad(s.endAngle + this.rotationAngle - 90),
          !1,
        );
        this.innerRadius
          ? this.ctx.arc(
              e,
              t,
              n,
              this.degToRad(s.endAngle + this.rotationAngle - 90),
              this.degToRad(s.startAngle + this.rotationAngle - 90),
              !0,
            )
          : this.ctx.lineTo(e, t);
        r && this.ctx.fill();
        l && this.ctx.stroke();
      }
    }
};

Winwheel.prototype.drawSegmentText = function () {
  if (this.ctx)
    for (
      var e,
        t,
        n,
        i,
        a,
        s,
        r,
        o,
        l,
        c,
        h = this.centerX * this.scaleFactor,
        u = this.centerY * this.scaleFactor,
        d = this.outerRadius * this.scaleFactor,
        g = this.innerRadius * this.scaleFactor,
        f = 1;
      f <= this.numSegments;
      f++
    ) {
      this.ctx.save();
      var p = this.segments[f];
      if (p.text) {
        e = null !== p.textFontFamily ? p.textFontFamily : this.textFontFamily;
        t = null !== p.textFontSize ? p.textFontSize : this.textFontSize;
        n = null !== p.textFontWeight ? p.textFontWeight : this.textFontWeight;
        i = null !== p.textOrientation ? p.textOrientation : this.textOrientation;
        a = null !== p.textAlignment ? p.textAlignment : this.textAlignment;
        s = null !== p.textDirection ? p.textDirection : this.textDirection;
        r = null !== p.textMargin ? p.textMargin : this.textMargin;
        o = null !== p.textFillStyle ? p.textFillStyle : this.textFillStyle;
        l = null !== p.textStrokeStyle ? p.textStrokeStyle : this.textStrokeStyle;
        c = null !== p.textLineWidth ? p.textLineWidth : this.textLineWidth;
        t *= this.scaleFactor;
        r *= this.scaleFactor;

        var m = "";
        null != n && (m += "".concat(n, " "));
        null != t && (m += "".concat(t, "px "));
        null != e && (m += e);
        this.ctx.font = m;
        this.ctx.fillStyle = o;
        this.ctx.strokeStyle = l;
        this.ctx.lineWidth = c;

        var v = p.text.split("\n"),
          w = 0 - t * (v.length / 2) + t / 2;
        "curved" != i || ("inner" != a && "outer" != a) || (w = 0);

        for (var b = 0; b < v.length; b++) {
          if ("reversed" == s) {
            if ("horizontal" == i) {
              this.ctx.textAlign =
                "inner" == a
                  ? "right"
                  : "outer" == a
                    ? "left"
                    : "center";
              this.ctx.textBaseline = "middle";
              var _ = this.degToRad(
                p.endAngle -
                  (p.endAngle - p.startAngle) / 2 +
                  this.rotationAngle -
                  90 -
                  180,
              );
              this.ctx.save();
              this.ctx.translate(h, u);
              this.ctx.rotate(_);
              this.ctx.translate(-h, -u);
              "inner" == a
                ? (o && this.ctx.fillText(v[b], h - g - r, u + w),
                  l && this.ctx.strokeText(v[b], h - g - r, u + w))
                : "outer" == a
                  ? (o && this.ctx.fillText(v[b], h - d + r, u + w),
                    l && this.ctx.strokeText(v[b], h - d + r, u + w))
                  : (o &&
                      this.ctx.fillText(
                        v[b],
                        h - g - (d - g) / 2 - r,
                        u + w,
                      ),
                    l &&
                      this.ctx.strokeText(
                        v[b],
                        h - g - (d - g) / 2 - r,
                        u + w,
                      ));
              this.ctx.restore();
            } else if ("vertical" == i) {
              this.ctx.textAlign = "center";
              this.ctx.textBaseline =
                "inner" == a
                  ? "top"
                  : "outer" == a
                    ? "bottom"
                    : "middle";
              var x = p.endAngle - (p.endAngle - p.startAngle) / 2 - 180;
              x += this.rotationAngle;
              this.ctx.save();
              this.ctx.translate(h, u);
              this.ctx.rotate(this.degToRad(x));
              this.ctx.translate(-h, -u);
              var y = 0;
              "outer" == a
                ? (y = u + d - r)
                : "inner" == a && (y = u + g + r);
              var A = t - t / 9;
              if ("outer" == a)
                for (var S = v[b].length - 1; S >= 0; S--) {
                  var k = v[b].charAt(S);
                  o && this.ctx.fillText(k, h + w, y);
                  l && this.ctx.strokeText(k, h + w, y);
                  y -= A;
                }
              else if ("inner" == a)
                for (var j = 0; j < v[b].length; j++) {
                  var D = v[b].charAt(j);
                  o && this.ctx.fillText(D, h + w, y);
                  l && this.ctx.strokeText(D, h + w, y);
                  y += A;
                }
              else if ("center" == a) {
                var T = 0;
                v[b].length > 1 && (T = (A * (v[b].length - 1)) / 2);
                for (
                  var C = u + g + (d - g) / 2 + T + r,
                    E = v[b].length - 1;
                  E >= 0;
                  E--
                ) {
                  var W = v[b].charAt(E);
                  o && this.ctx.fillText(W, h + w, C);
                  l && this.ctx.strokeText(W, h + w, C);
                  C -= A;
                }
              }
              this.ctx.restore();
            } else if ("curved" == i) {
              var F = 0;
              "inner" == a
                ? (F = g + r, this.ctx.textBaseline = "top")
                : "outer" == a
                  ? (F = d - r,
                    this.ctx.textBaseline = "bottom",
                    F -= t * (v.length - 1))
                  : "center" == a &&
                    (F = g + r + (d - g) / 2,
                    this.ctx.textBaseline = "middle");
              var O = 0,
                M = 0;
              if (v[b].length > 1) {
                this.ctx.textAlign = "left";
                O = (t / 10) * 4;
                var R = 100 / F;
                O *= R;
                var P = O * v[b].length;
                M = p.startAngle + ((p.endAngle - p.startAngle) / 2 - P / 2);
              } else {
                M = p.startAngle + (p.endAngle - p.startAngle) / 2;
                this.ctx.textAlign = "center";
              }
              M += this.rotationAngle;
              M -= 180;
              for (var B = v[b].length; B >= 0; B--) {
                this.ctx.save();
                var z = v[b].charAt(B);
                this.ctx.translate(h, u);
                this.ctx.rotate(this.degToRad(M));
                this.ctx.translate(-h, -u);
                l && this.ctx.strokeText(z, h, u + F + w);
                o && this.ctx.fillText(z, h, u + F + w);
                M += O;
                this.ctx.restore();
              }
            }
          } else if ("horizontal" == i) {
            this.ctx.textAlign =
              "inner" == a ? "left" : "outer" == a ? "right" : "center";
            this.ctx.textBaseline = "middle";
            var I = this.degToRad(
              p.endAngle -
                (p.endAngle - p.startAngle) / 2 +
                this.rotationAngle -
                90,
            );
            this.ctx.save();
            this.ctx.translate(h, u);
            this.ctx.rotate(I);
            this.ctx.translate(-h, -u);
            "inner" == a
              ? (o && this.ctx.fillText(v[b], h + g + r, u + w),
                l && this.ctx.strokeText(v[b], h + g + r, u + w))
              : "outer" == a
                ? (o && this.ctx.fillText(v[b], h + d - r, u + w),
                  l && this.ctx.strokeText(v[b], h + d - r, u + w))
                : (o &&
                    this.ctx.fillText(
                      v[b],
                      h + g + (d - g) / 2 + r,
                      u + w,
                    ),
                  l &&
                    this.ctx.strokeText(
                      v[b],
                      h + g + (d - g) / 2 + r,
                      u + w,
                    ));
            this.ctx.restore();
          } else if ("vertical" == i) {
            this.ctx.textAlign = "center";
            this.ctx.textBaseline =
              "inner" == a
                ? "bottom"
                : "outer" == a
                  ? "top"
                  : "middle";
            var N = p.endAngle - (p.endAngle - p.startAngle) / 2;
            N += this.rotationAngle;
            this.ctx.save();
            this.ctx.translate(h, u);
            this.ctx.rotate(this.degToRad(N));
            this.ctx.translate(-h, -u);
            var L = 0;
            "outer" == a
              ? (L = u - d + r)
              : "inner" == a && (L = u - g - r);
            var $ = t - t / 9;
            if ("outer" == a)
              for (var q = 0; q < v[b].length; q++) {
                var U = v[b].charAt(q);
                o && this.ctx.fillText(U, h + w, L);
                l && this.ctx.strokeText(U, h + w, L);
                L += $;
              }
            else if ("inner" == a)
              for (var V = v[b].length - 1; V >= 0; V--) {
                var K = v[b].charAt(V);
                o && this.ctx.fillText(K, h + w, L);
                l && this.ctx.strokeText(K, h + w, L);
                L -= $;
              }
            else if ("center" == a) {
              var G = 0;
              v[b].length > 1 && (G = ($ * (v[b].length - 1)) / 2);
              for (
                var H = u - g - (d - g) / 2 - G - r, Y = 0;
                Y < v[b].length;
                Y++
              ) {
                var X = v[b].charAt(Y);
                o && this.ctx.fillText(X, h + w, H);
                l && this.ctx.strokeText(X, h + w, H);
                H += $;
              }
            }
            this.ctx.restore();
          } else if ("curved" == i) {
            var J = 0;
            "inner" == a
              ? (J = g + r,
                this.ctx.textBaseline = "bottom",
                J += t * (v.length - 1))
              : "outer" == a
                ? (J = d - r, this.ctx.textBaseline = "top")
                : "center" == a &&
                  (J = g + r + (d - g) / 2,
                  this.ctx.textBaseline = "middle");
            var Q = 0,
              Z = 0;
            if (v[b].length > 1) {
              this.ctx.textAlign = "left";
              Q = (t / 10) * 4;
              var ee = 100 / J;
              Q *= ee;
              var te = Q * v[b].length;
              Z = p.startAngle + ((p.endAngle - p.startAngle) / 2 - te / 2);
            } else {
              Z = p.startAngle + (p.endAngle - p.startAngle) / 2;
              this.ctx.textAlign = "center";
            }
            Z += this.rotationAngle;
            for (var ne = 0; ne < v[b].length; ne++) {
              this.ctx.save();
              var ie = v[b].charAt(ne);
              this.ctx.translate(h, u);
              this.ctx.rotate(this.degToRad(Z));
              this.ctx.translate(-h, -u);
              l && this.ctx.strokeText(ie, h, u - J + w);
              o && this.ctx.fillText(ie, h, u - J + w);
              Z += Q;
              this.ctx.restore();
            }
          }
          w += t;
        }
      }
      this.ctx.restore();
    }
};

Winwheel.prototype.degToRad = function (e) {
  return 0.017453292519943295 * e;
};

Winwheel.prototype.setCenter = function (e, t) {
  this.centerX = e;
  this.centerY = t;
};

Winwheel.prototype.addSegment = function (e, t) {
  var n,
    i = new Segment(e);
  this.numSegments++;
  if ("undefined" !== typeof t) {
    for (var a = this.numSegments; a > t; a--)
      this.segments[a] = this.segments[a - 1];
    this.segments[t] = i;
    n = t;
  } else {
    this.segments[this.numSegments] = i;
    n = this.numSegments;
  }
  this.updateSegmentSizes();
  return this.segments[n];
};

Winwheel.prototype.setCanvasId = function (e) {
  if (e) {
    this.canvasId = e;
    this.canvas = document.getElementById(this.canvasId);
    this.canvas && (this.ctx = this.canvas.getContext("2d"));
  } else {
    this.canvasId = null;
    this.ctx = null;
    this.canvas = null;
  }
};

Winwheel.prototype.deleteSegment = function (e) {
  if (this.numSegments > 1) {
    if ("undefined" !== typeof e)
      for (var t = e; t < this.numSegments; t++)
        this.segments[t] = this.segments[t + 1];
    this.segments[this.numSegments] = void 0;
    this.numSegments--;
    this.updateSegmentSizes();
  }
};

Winwheel.prototype.windowToCanvas = function (e, t) {
  var n = this.canvas.getBoundingClientRect();
  return {
    x: Math.floor(e - n.left * (this.canvas.width / n.width)),
    y: Math.floor(t - n.top * (this.canvas.height / n.height)),
  };
};

Winwheel.prototype.getSegmentAt = function (e, t) {
  var n = null,
    i = this.getSegmentNumberAt(e, t);
  return null !== i && (n = this.segments[i]), n;
};

Winwheel.prototype.getSegmentNumberAt = function (e, t) {
  var n,
    i,
    a,
    s,
    r = this.windowToCanvas(e, t),
    o = this.centerX * this.scaleFactor,
    l = this.centerY * this.scaleFactor,
    c = this.outerRadius * this.scaleFactor,
    h = this.innerRadius * this.scaleFactor;
  r.x > o ? (a = r.x - o, i = "R") : (a = o - r.x, i = "L");
  r.y > l ? (s = r.y - l, n = "B") : (s = l - r.y, n = "T");
  var u = s / a,
    d = (180 * Math.atan(u)) / Math.PI,
    g = 0,
    f = Math.sqrt(s * s + a * a);
  "T" == n && "R" == i
    ? (g = Math.round(90 - d))
    : "B" == n && "R" == i
      ? (g = Math.round(d + 90))
      : "B" == n && "L" == i
        ? (g = Math.round(90 - d + 180))
        : "T" == n && "L" == i && (g = Math.round(d + 270));
  if (0 != this.rotationAngle) {
    var p = this.getRotationPosition();
    g -= p;
    g < 0 && (g = 360 - Math.abs(g));
  }
  var m = null;
  for (var v = 1; v <= this.numSegments; v++)
    if (
      g >= this.segments[v].startAngle &&
      g <= this.segments[v].endAngle &&
      f >= h &&
      f <= c
    ) {
      m = v;
      break;
    }
  return m;
};

Winwheel.prototype.getIndicatedSegment = function () {
  var e = this.getIndicatedSegmentNumber();
  return this.segments[e];
};

Winwheel.prototype.getIndicatedSegmentNumber = function () {
  var e = 0,
    t = this.getRotationPosition(),
    n = Math.floor(this.pointerAngle - t);
  n < 0 && (n = 360 - Math.abs(n));
  for (var i = 1; i < this.segments.length; i++)
    if (
      n >= this.segments[i].startAngle &&
      n <= this.segments[i].endAngle
    ) {
      e = i;
      break;
    }
  return e;
};

Winwheel.prototype.getRotationPosition = function () {
  var e = this.rotationAngle;
  if (e >= 0) {
    if (e > 360) {
      var t = Math.floor(e / 360);
      e -= 360 * t;
    }
  } else {
    if (e < -360) {
      var n = Math.ceil(e / 360);
      e -= 360 * n;
    }
    e = 360 + e;
  }
  return e;
};

Winwheel.prototype.startAnimation = function () {
  if (this.animation) {
    this.computeAnimation();
    winwheelToDrawDuringAnimation = this;
    var e = {};
    e[this.animation.propertyName] = this.animation.propertyValue;
    e.yoyo = this.animation.yoyo;
    e.repeat = this.animation.repeat;
    e.ease = this.animation.easing;
    e.onUpdate = winwheelAnimationLoop;
    e.onComplete = winwheelStopAnimation;
    e.duration = this.animation.duration;
    this.tween = gsap.to(this, e);
  }
};

Winwheel.prototype.stopAnimation = function (e) {
  winwheelToDrawDuringAnimation &&
    (winwheelToDrawDuringAnimation.tween &&
      winwheelToDrawDuringAnimation.tween.kill(),
    winwheelStopAnimation(e));
  winwheelToDrawDuringAnimation = this;
};

Winwheel.prototype.pauseAnimation = function () {
  this.tween && this.tween.pause();
};

Winwheel.prototype.resumeAnimation = function () {
  this.tween && this.tween.play();
};

Winwheel.prototype.computeAnimation = function () {
  this.animation &&
    ("spinOngoing" == this.animation.type
      ? (this.animation.propertyName = "rotationAngle",
        null == this.animation.spins && (this.animation.spins = 5),
        null == this.animation.repeat && (this.animation.repeat = -1),
        null == this.animation.easing &&
          (this.animation.easing = "none"),
        null == this.animation.yoyo && (this.animation.yoyo = !1),
        this.animation.propertyValue = 360 * this.animation.spins,
        "anti-clockwise" == this.animation.direction &&
          (this.animation.propertyValue = 0 - this.animation.propertyValue))
      : "spinToStop" == this.animation.type
        ? (this.animation.propertyName = "rotationAngle",
          null == this.animation.spins && (this.animation.spins = 5),
          null == this.animation.repeat && (this.animation.repeat = 0),
          null == this.animation.easing &&
            (this.animation.easing = "power3.out"),
          null == this.animation.stopAngle
            ? (this.animation._stopAngle = Math.floor(359 * Math.random()))
            : (this.animation._stopAngle =
                360 - this.animation.stopAngle + this.pointerAngle),
          null == this.animation.yoyo && (this.animation.yoyo = !1),
          this.animation.propertyValue = 360 * this.animation.spins,
          "anti-clockwise" == this.animation.direction
            ? (this.animation.propertyValue = 0 - this.animation.propertyValue,
              this.animation.propertyValue -= 360 - this.animation._stopAngle)
            : (this.animation.propertyValue += this.animation._stopAngle))
        : "spinAndBack" == this.animation.type &&
          (this.animation.propertyName = "rotationAngle",
          null == this.animation.spins && (this.animation.spins = 5),
          null == this.animation.repeat && (this.animation.repeat = 1),
          null == this.animation.easing &&
            (this.animation.easing = "power2.inOut"),
          null == this.animation.yoyo && (this.animation.yoyo = !0),
          null == this.animation.stopAngle
            ? (this.animation._stopAngle = 0)
            : (this.animation._stopAngle = 360 - this.animation.stopAngle),
          this.animation.propertyValue = 360 * this.animation.spins,
          "anti-clockwise" == this.animation.direction
            ? (this.animation.propertyValue = 0 - this.animation.propertyValue,
              this.animation.propertyValue -= 360 - this.animation._stopAngle)
            : (this.animation.propertyValue += this.animation._stopAngle)));
};

Winwheel.prototype.getRandomForSegment = function (e) {
  var t = 0;
  if (e && "undefined" !== typeof this.segments[e]) {
    var n = this.segments[e].startAngle,
      i = this.segments[e].endAngle,
      a = i - n - 2;
    a > 0 && (t = n + 1 + Math.floor(Math.random() * a));
  }
  return t;
};

export default Winwheel
