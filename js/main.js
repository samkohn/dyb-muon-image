var tracks = [];
var simTrackColor = 0xff0000;
var recoTrackColor = 0x0000ff;
var guessTrackColor = 0xff00ff;
var getCSSColorString = function(hex) {
    return '#' + (hex + 0x1000000).toString(16).substring(1);
};
var cleartracks = function(scene) {
    for(i in tracks) {
        scene.remove(tracks[i]);
    }
    tracks = [];
};
var getfilename = function(params) {
  name = ('../data/' + params['theta_prime'].toFixed(1) +
          '_' + params['phi_prime'].toFixed(1) + '_' +
          params['r0'].toFixed(1) + '_' +
          params['phi0'].toFixed(1) + '.json');
  return name;
};
var addTracks = function(scene, data) {
  if(data['ERROR'] === 'reconstructor')
  {
      var sim = loadtrack(scene, data['simulated'], simTrackColor);
      var guess = loadtrack(scene, data['firstGuess'], guessTrackColor);
      tracks.push(sim);
      tracks.push(guess);
  }
  else if(data['ERROR'] === 'simulator')
  {
      var sim = loadtrack(scene, data['simulated'],
              0x00ff00);
      tracks.push(sim);
  }
  else if(data['ERROR'] === 'roughtrack')
  {
      var sim = loadtrack(scene, data['simulated'], simTrackColor);
      tracks.push(sim);
  }
  else
  {
      var sim = loadtrack(scene, data['simulated'], simTrackColor);
      var reco = loadtrack(scene, data['reconstructed'], recoTrackColor);
      var guess = loadtrack(scene, data['firstGuess'], guessTrackColor);
      tracks.push(sim);
      tracks.push(reco);
      tracks.push(guess);
  }
};
var loadtrack = function(scene, track, color) {
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new
          THREE.Vector3(track['yin'],track['zin'], track['xin']));
  geometry.vertices.push(new THREE.Vector3(track['yout'],
              track['zout'], track['xout']));
  var material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 3,
      depthTest: false,
      opacity: 0.5,
      transparent: true,
  });
  var line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
};
var PMTTexture = function(data) {
  var pmtcanvas = document.createElement('canvas');
  pmtcanvas.width=64;
  pmtcanvas.height=64;
  ringheight = pmtcanvas.height/8.0;
  columnwidth = pmtcanvas.width/24.0;
  context = pmtcanvas.getContext('2d');
  context.fillStyle = getCSSColorString(0x00ff00);
  for(var ring = 0; ring < 8; ring++) {
      for(var column = 0; column < 24; column++) {
          context.fillStyle = getCSSColorString(0x00ff00 * ((ring + column) % 2));
          var startx = column * columnwidth;
          var starty = ring * ringheight;
          context.fillRect(startx, starty, columnwidth, ringheight);
      }
  }
  var pmttexture = new THREE.Texture(pmtcanvas);
  pmttexture.needsUpdate = true;
  var pmtmaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      depthTest: false,
      opacity: 0.8,
      transparent: true,
      map: pmttexture
  });
  return pmtmaterial;
};
var render = 0;
var init = function() {
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa7a7a7);
  var camera = new THREE.PerspectiveCamera(75,
          window.innerWidth/window.innerHeight, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  var pmtcylindergeometry = new THREE.CylinderGeometry(2.3245, 2.3245, 4, 20, 1, true);
  var material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      depthTest: false,
      opacity: 0.3,
      transparent: true,
      color: 0xffffff
  });
  var pmtcylinder = new THREE.Mesh(pmtcylindergeometry, PMTTexture());
  var lscylindergeometry = new THREE.CylinderGeometry(2.0, 2.0, 4, 20, 1, true);
  var lscylinder = new THREE.Mesh(lscylindergeometry, material);
  scene.add(pmtcylinder);
  scene.add(lscylinder);
  camera.position.z = 8;
  scene.add(camera);
  var axes = new THREE.AxisHelper(1);
  axes.position.set(-5, 0, 0);
  scene.add(axes);
  var rpcgrid = new THREE.GridHelper(6, 10, 0, 0);
  rpcgrid.position.set(0, 4, 0);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  guiparams = {
      simulated: simTrackColor,
      reconstructed: recoTrackColor,
      fit_initialization: guessTrackColor,
      theta_prime: 0.3,
      phi_prime: 0.6,
      r0: 0,
      phi0: 0.7,
      show_rpc: false
  };
  $.getJSON(getfilename(guiparams), function(data) {
    addTracks(scene, data);
  });
  var gui = new dat.GUI();
  var thetaprime = gui.add(guiparams, 'theta_prime', 0, 1.40).step(0.1);
  var phiprime = gui.add(guiparams, 'phi_prime', 0, 2.7).step(0.3);
  var r0 = gui.add(guiparams, 'r0', 0, 5.8).step(0.2);
  var phi0 = gui.add(guiparams, 'phi0', 0, 2.8).step(0.7);
  gui.addColor(guiparams, 'simulated');
  gui.addColor(guiparams, 'reconstructed');
  gui.addColor(guiparams, 'fit_initialization');
  var showrpc = gui.add(guiparams, 'show_rpc');
  var currentfile = '';
  var onParamChange = function(value) {
      var newfile = getfilename(guiparams);
      if(newfile === currentfile) { return; }
      else {
          $.getJSON(newfile, function(data) {
              currentfile = newfile;
              cleartracks(scene);
              addTracks(scene, data);
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
  render = function () {
      requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
  };
  render();
  return scene;
};
//main
var scene = init();
