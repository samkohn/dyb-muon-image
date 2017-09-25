/*
 * This file contains all of the logic for the event display, including:
 *
 *    - visualizing the AD and PMTs
 *    - loading muon tracks from JSON data files
 *    - visualizing the muon tracks as straight lines
 *    - Adjusting the parameters of the track to load
 *
 *
 * The file uses three.js for graphics. The master object in three.js is
 * the scene, which is why many of the functions take scene as the first
 * parameter.
 *
 * The 'data' object contains the data from a particular track
 * simulation and reconstruction. E.g. data['simulated'] is the
 * information about the simulated track, and data['reconstructed'] is
 * the information about the final reconstructed track.
 */
var simTrackColor = 0xff0000;
var recoTrackColor = 0x0000ff;
var guessTrackColor = 0xff00ff;

// Master list of objects that I might want to remove from the canvas (i.e. tracks)
var eventObjects = [];
var clearEventObjects = function(scene) {
  for(i in eventObjects) {
    scene.remove(eventObjects[i]);
  }
  eventObjects = [];
};
// Construct the file name corresponding to the selected parameters
var getfilename = function(params) {
  name = ('data/' + params['theta_prime'].toFixed(1) +
      '_' + params['phi_prime'].toFixed(1) + '_' +
      params['r0'].toFixed(1) + '_' +
      params['phi0'].toFixed(1) + '.json');
  return name;
};
// Add the track(s) specified by 'data' to the scene
var addTracks = function(scene, data) {
  // If there were errors, only add the tracks for which there's data
  if(data['ERROR'] === 'reconstructor')
  {
    var sim = loadtrack(scene, data['simulated'], simTrackColor);
    var guess = loadtrack(scene, data['firstGuess'], guessTrackColor);
    eventObjects.push(sim);
    eventObjects.push(guess);
  }
  else if(data['ERROR'] === 'simulator')
  {
    var sim = loadtrack(scene, data['simulated'],
        0x00ff00);
    eventObjects.push(sim);
  }
  else if(data['ERROR'] === 'roughtrack')
  {
    var sim = loadtrack(scene, data['simulated'], simTrackColor);
    eventObjects.push(sim);
  }
  else
  {
    var sim = loadtrack(scene, data['simulated'], simTrackColor);
    var reco = loadtrack(scene, data['reconstructed'], recoTrackColor);
    var guess = loadtrack(scene, data['firstGuess'], guessTrackColor);
    eventObjects.push(sim);
    eventObjects.push(reco);
    eventObjects.push(guess);
  }
};
// Create a specified track and add it to the scene
var loadtrack = function(scene, track, color) {
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new
      THREE.Vector3(track['yin'],track['zin'], track['xin']));
  geometry.vertices.push(new THREE.Vector3(track['yout'],
        track['zout'], track['xout']));
  var material = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 3, depthWrite: false,
    opacity: 0.5,
    transparent: true,
  });
  var line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
};
// Create all of the PMT objects and add them to the scene.
//
// The design follows IceCube's event display: Each PMT is sized
// according to the charge, and colored according to the first photon
// arrival time.
var addPMTs = function(scene, data) {
  AD = data['AD'];
  // Find the min and max time and charge
  maxtime = -1e20;
  mintime = 1e20;
  maxcharge = -1e20;
  mincharge = 1e20;
  for(i in AD['PMTs']) {
    charge = AD['PMTs'][i]['q'];
    time = AD['PMTs'][i]['t'];
    maxtime = time > maxtime ? time : maxtime;
    mintime = time < mintime ? time : mintime;
    maxcharge = charge > maxcharge ? charge : maxcharge;
    mincharge = charge < mincharge ? charge : mincharge;
  }
  // Create the color scale to use for the time
  scale = chroma.scale(['black', 'red', 'yellow', 'white'])
    .correctLightness(true)
    .domain([mintime, maxtime]); // range of input values
  for(i in AD['PMTs']) {
    pmt = AD['PMTs'][i];
    pmtx = pmt['y'];
    pmty = pmt['z'];
    pmtz = pmt['x'];
    // Here, the pmt['q'] parameter refers to the radius
    var pmtgeometry = new THREE.SphereGeometry(pmt['q'] /7000, 4, 3);
    var pmtmaterial = new THREE.MeshBasicMaterial({
      // pmt['t'] is the time, and scale(...).hex() extracts the color
      // for that time
      color: scale(pmt['t']).hex(),
      transparent: true,
      opacity: 0.9
    });
    // In order to figure out which PMTs correspond to which row and
    // column, I alter the characteristics of row 0, column 0 and row 0,
    // column 1.
    // This line marks ring 0, column 0 using just an empty wireframe
    if (pmt['r'] === 0 && pmt['c'] === 0) {
      pmtmaterial.wireframe = true;
    }
    // This line marks ring 0, column 1 using a wireframe outline
    if(pmt['r'] === 0 && pmt['c'] === 1) {
      // add a wireframe outline
      pmt2geometry = new THREE.SphereGeometry(pmt['q']/6900, 4, 3);
      pmt2material = new THREE.MeshBasicMaterial({ color: 0 });
      pmt2material.wireframe = true;
      pmt2 = new THREE.Mesh(pmt2geometry, pmt2material);
      pmt2.position.set(pmtx, pmty, pmtz);
      scene.add(pmt2);
      eventObjects.push(pmt2);
    }
    var pmt = new THREE.Mesh(pmtgeometry, pmtmaterial);
    pmt.position.set(pmtx, pmty, pmtz);
    scene.add(pmt);
    eventObjects.push(pmt);
  }
};
// There's some mojo going on with the 'render' variable which I haven't
// quite figured out. Nevertheless, this works as written.
var render = 0;
var init = function() {
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa7a7a7);
  var camera = new THREE.PerspectiveCamera(75,
      window.innerWidth/window.innerHeight, 0.1, 1000);
  // This renderer is eventually called on to run the animatino loop
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  // This material is used for the LS
  var material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    depthWrite: false,
    opacity: 0.3,
    transparent: true,
    color: 0xffffff
  });
  var lscylindergeometry = new THREE.CylinderGeometry(2.0, 2.0, 4, 20, 1, true);
  var lscylinder = new THREE.Mesh(lscylindergeometry, material);
  camera.position.z = 8; // note +z is "out of the screen"
  scene.add(camera);
  var axes = new THREE.AxisHelper(0.5);
  axes.position.set(-5, 0, 0);
  scene.add(axes);
  var rpcgrid = new THREE.GridHelper(6, 10, 0, 0);
  rpcgrid.position.set(0, 4, 0);
  // These controls allow you to control the camera using the mouse
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // These are the parameters which can be changed using the GUI
  guiparams = {
    simulated: simTrackColor,
    reconstructed: recoTrackColor,
    fit_initialization: guessTrackColor,
    theta_prime: 0.4,
    phi_prime: 2.1,
    r0: 0.2,
    phi0: 0.0,
    show_rpc: false,
    show_ls: false
  };
  // Initialize the GUI and add each controlled parameter
  var gui = new dat.GUI();
  var thetaprime = gui.add(guiparams, 'theta_prime', 0, 1.40).step(0.1);
  var phiprime = gui.add(guiparams, 'phi_prime', 0, 2.7).step(0.3);
  var r0 = gui.add(guiparams, 'r0', 0, 5.8).step(0.2);
  var phi0 = gui.add(guiparams, 'phi0', 0, 2.8).step(0.7);
  gui.addColor(guiparams, 'simulated');
  gui.addColor(guiparams, 'reconstructed');
  gui.addColor(guiparams, 'fit_initialization');
  var showrpc = gui.add(guiparams, 'show_rpc');
  var showls = gui.add(guiparams, 'show_ls');
  var currentfile = '';
  // When the track parameters are changed, read in the appropriate file
  // and update the scene accordingly
  var onParamChange = function(value) {
    var newfile = getfilename(guiparams);
    // This line is necessary because sliding the slider just a little
    // bit counts as a change, even if the slider doesn't change value.
    if(newfile === currentfile) { return; }
    else {
      $.getJSON(newfile, function(data) {
        currentfile = newfile;
        clearEventObjects(scene);
        addTracks(scene, data);
        addPMTs(scene, data);
      });
    }
  };
  thetaprime.onChange(onParamChange);
  phiprime.onChange(onParamChange);
  r0.onChange(onParamChange);
  phi0.onChange(onParamChange);
  showrpc.onChange(function(value) {
    if(value) {
      scene.add(rpcgrid);
    }
    else {
      scene.remove(rpcgrid);
    }
  });
  showls.onChange(function(value) {
    if(value) {
      scene.add(lscylinder);
    }
    else {
      scene.remove(lscylinder);
    }
  });
  // Set up the first tracks
  onParamChange();
  // Set up the animation loop
  render = function () {
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  };
  // Run the animation loop
  render();
  return scene;
};
//main
var scene = init();
