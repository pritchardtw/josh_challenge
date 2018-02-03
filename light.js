const { MAX_BRI, MIN_BRI } = require('./light_defs');

class Light {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }

  // Name
  set name(name) {
    this._name = name;
  }

  get name() {
    return this._name;
  }

  // Id
  set id(id) {
    this._id = id;
  }

  get id() {
    return this._id;
  }

  // On
  set on(on) {
    this._on = on;
  }

  get on() {
    return this._on;
  }

  // Brightness
  set bri(brightness) {
    if (brightness > 100) {
      console.log("Brightness cannot be over 100%, %d%", brightness);
      return;
    } else if (brightness < 0) {
      console.log("Brightness cannot be under 0%, %d%", brightness);
      return;
    }
    this._bri = brightness;
  }

  get bri() {
    return this._bri;
  }
}

module.exports = Light
