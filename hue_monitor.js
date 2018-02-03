let { ROOT_URL, GET_LIGHTS } = require('./hue_api');
let { MAX_BRI, MIN_BRI } = require('./light_defs');
let fetch = require('node-fetch');
let Light = require('./light');
let lightsToMonitor = [];

function fetchLights() {
  return new Promise((resolve, reject) => {
    fetch(`${ROOT_URL}${GET_LIGHTS}`)
      .then(response => {
        if (response.status === 200) {
          console.log('success');
          response.json()
            .then(data => {
              Object.entries(data).forEach(light => {
                lightsToMonitor.push(new Light(light[1].name, light[0]));
              });
              resolve();
            })
            .catch(err => {
              reject(`Unable to parse fetchLights data: ${err}`);
            });
        } else {
          reject(`Error retreiving lights. Status: ${response.status}`);
        }
      })
      .catch(error => {
        reject(`Error gettings lights ${error}`);
      });
  });
}

function fetchLightInfo() {
  return new Promise((resolve, rejct) => {
    const numLights = lightsToMonitor.length;
    let numLightsReceived = 0;
    lightsToMonitor.forEach(light => {
      fetch(`${ROOT_URL}${GET_LIGHTS}${light.id}`)
        .then(response => {
          if (response.status === 200) {
            response.json()
              .then(data => {
                numLightsReceived += 1;
                let { state } = data;
                state.bri = Math.max(MIN_BRI, state.bri);
                state.bri = Math.min(MAX_BRI, state.bri);
                state.bri = state.bri / MAX_BRI * 100;
                light.on = state.on;
                light.bri = state.bri;
                if (numLightsReceived === numLights) {
                  // We have all lights.
                  resolve();
                }
              })
              .catch(err => {
                reject(`Unable to parse fetchLightInfo data for ${light.id}. ${err}`)
              });
          } else {
            reject(`Unable to fetchLightInfo for ${light.id}. Status: ${response.status}`);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  });
}

function init() {
  return new Promise(function(resolve, reject) {
    fetchLights()
      .then(() => {
        fetchLightInfo()
          .then(() => {
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      })
      .catch(err => {
        reject(err);
      });
  });
}

function checkForChange(light) {
  return new Promise((reject, resolve) => {
    fetch(`${ROOT_URL}${GET_LIGHTS}${light.id}`)
      .then(response => {
        if (response.status === 200) {
          response.json()
            .then(data => {
              let { state } = data;
              state.bri = Math.max(MIN_BRI, state.bri);
              state.bri = Math.min(MAX_BRI, state.bri);
              state.bri = state.bri / MAX_BRI * 100;
              Object.entries(state).forEach(entry => {
                if (light[entry[0]] != null) {
                  if (light[entry[0]] !== entry[1]) {
                    light[entry[0]] = entry[1];
                    let changeObj = {};
                    changeObj.id = light.id;
                    changeObj[entry[0]] = light[entry[0]];
                    console.log(changeObj);
                  }
                }
              });
            })
            .catch(err => {
              reject(`Unable to parse fetchLightInfo data for ${light.id}. ${err}`)
            });
        } else {
          reject(`Unable to fetchLightInfo for ${light.id}. Status: ${response.status}`);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function monitor() {
  lightsToMonitor.forEach(light => {
    checkForChange(light);
  });
}



init()  // Init discovers all the lights we will monitor.
  .then(() => {
    console.log(JSON.stringify(lightsToMonitor));
    setInterval(monitor, 250);  // We will poll the lights every 250ms.
  })
  .catch(err => {
    console.log("Error initalizing hue monitor: ", err);
  });
