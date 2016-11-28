var tracks = [];
var simTrackColor = 0xff0000;
var recoTrackColor = 0x0000ff;
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
  console.log(name);
  return name;
};
var addTracks = function(scene, data) {
  if(data['ERROR'] === 'reconstructor')
  {
      var sim = loadtrack(scene, data['simulated'],
          simTrackColor);
      tracks.push(sim);
  }
  else if(data['ERROR'] === 'simulator')
  {
      var sim = loadtrack(scene, data['simulated'],
              0x00ff00);
      tracks.push(sim);
  }
  else
  {
      var sim = loadtrack(scene, data['simulated'], simTrackColor);
      var reco = loadtrack(scene, data['reconstructed'], recoTrackColor);
      tracks.push(sim);
      tracks.push(reco);
  }
};
var loadtrack = function(scene, track, color) {
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new
          THREE.Vector3(track['yin'],track['zin'], track['xin']));
  geometry.vertices.push(new THREE.Vector3(track['yout'],
              track['zout'], track['xout']));
  var material = new THREE.LineBasicMaterial({color:
      color, linewidth: 2});
  var line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
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
  var pmtcylinder = new THREE.Mesh(pmtcylindergeometry, material);
  var lscylindergeometry = new THREE.CylinderGeometry(2.0, 2.0, 4, 20, 1, true);
  var lscylinder = new THREE.Mesh(lscylindergeometry, material);
  scene.add(pmtcylinder);
  scene.add(lscylinder);
  camera.position.z = 8;
  scene.add(camera);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  guiparams = {
      simulated: simTrackColor,
      reconstructed: recoTrackColor,
      theta_prime: 0.3,
      phi_prime: 0.7,
      r0: 0,
      phi0: 0.7
  };
  $.getJSON(getfilename(guiparams), function(data) {
    addTracks(scene, data);
  });
  var gui = new dat.GUI();
  var thetaprime = gui.add(guiparams, 'theta_prime', 0, 1.20).step(0.3);
  var phiprime = gui.add(guiparams, 'phi_prime', 0, 3).step(0.7);
  var r0 = gui.add(guiparams, 'r0', 0, 2).step(0.5);
  var phi0 = gui.add(guiparams, 'phi0', 0, 3).step(0.7);
  gui.addColor(guiparams, 'simulated');
  gui.addColor(guiparams, 'reconstructed');
  thetaprime.onChange(function(value) {
      $.getJSON(getfilename(guiparams), function(data) {
          cleartracks(scene);
          addTracks(scene, data);
      });
  });
  phiprime.onChange(function(value) {
      $.getJSON(getfilename(guiparams), function(data) {
          cleartracks(scene);
          addTracks(scene, data);
      });
  });
  r0.onChange(function(value) {
      $.getJSON(getfilename(guiparams), function(data) {
          cleartracks(scene);
          addTracks(scene, data);
      });
  });
  phi0.onChange(function(value) {
      $.getJSON(getfilename(guiparams), function(data) {
          cleartracks(scene);
          addTracks(scene, data);
      });
  });
  var axes = new THREE.AxisHelper(1);
  axes.position.set(-5, 0, 0);
  scene.add(axes);
  var rpcgrid = new THREE.GridHelper(6, 10, 0, 0);
  rpcgrid.position.set(0, 4, 0);
  scene.add(rpcgrid);
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
