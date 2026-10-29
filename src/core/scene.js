import {buildPhysics,updatePhysics} from './physics-scene.js';
import {physicsExperiments} from './physics.js';
import * as THREE from 'three';
import {RenderLoop} from '../framework/render-loop.js';
import {setTransform3d} from '../framework/dom.js';

const teal=0x375d50, cream=0xdbe1c8, copper=0xbe8764;
const scratchProj = new THREE.Vector3();

export class LabScene{
 constructor(canvas,onSelect){
  this.canvas=canvas;
  this.onSelect=onSelect;
  this.theta=.58;
  this.phi=1.12;
  this.radius=14.5;
  this.target=new THREE.Vector3(0,2.1,0);
  this.labels=[];
  this.pickables=[];
  this.t=0;
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  this.scene=new THREE.Scene();
  this.scene.fog=new THREE.Fog(0xeef2e5,19,40);
  this.camera=new THREE.PerspectiveCamera(33,1,.1,60);
  this.renderer=new THREE.WebGLRenderer({
    canvas,
    antialias:true,
    alpha:true,
    preserveDrawingBuffer:true,
    powerPreference:'high-performance'
  });
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.setClearColor(0x000000,0);
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=.95;

  this.scene.add(new THREE.HemisphereLight(0xffffff,0x83926d,1.8));
  let light=new THREE.DirectionalLight(0xfff8df,2.4);
  light.position.set(-4,9,5);
  light.castShadow=true;
  light.shadow.mapSize.set(1024,1024);
  Object.assign(light.shadow.camera,{left:-8,right:8,top:8,bottom:-8});
  light.shadow.bias=-.001;
  this.scene.add(light);
  let fill=new THREE.DirectionalLight(0xd4e8ff,.8);
  fill.position.set(6,5,-4);
  this.scene.add(fill);

  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:0x58684a,opacity:.14}));
  ground.rotation.x=-Math.PI/2;
  ground.receiveShadow=true;
  ground.position.y=-.01;
  this.scene.add(ground);
  const grid=new THREE.GridHelper(40,80,0xc3cfb2,0xd4ddc7);
  grid.material.transparent=true;
  grid.material.opacity=.48;
  grid.position.y=-.008;
  this.scene.add(grid);

  this.world=new THREE.Group();
  this.scene.add(this.world);
  this.raycaster=new THREE.Raycaster();
  this.pointer=new THREE.Vector2();
  this.setupInput();

  this.resizeObserver=new ResizeObserver(()=>this.resize());
  this.resizeObserver.observe(canvas.parentElement);
  this.resize();

  // Optimized Render-on-demand loop
  this.renderLoop = new RenderLoop(this.render.bind(this));
  this.renderLoop.requestRender();
 }

 requestRender(){
  if (this.renderLoop) this.renderLoop.requestRender();
 }

 material(color,roughness=.5,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
 mesh(geometry,material,x=0,y=0,z=0,parent=this.world){let m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 cylinder(r1,r2,h,color,x,y,z,parent=this.world){return this.mesh(new THREE.CylinderGeometry(r1,r2,h,48),typeof color==='number'?this.material(color):color,x,y,z,parent);}
 box(w,h,d,color,x,y,z,parent=this.world){let g=new THREE.BoxGeometry(w,h,d);return this.mesh(g,this.material(color),x,y,z,parent);}
 glass(){return new THREE.MeshPhysicalMaterial({color:0xe6f4ed,transparent:true,opacity:.2,roughness:.08,metalness:.05,side:THREE.DoubleSide,depthWrite:false});}
 tube(points,r=.04,color=0xb7c7a2,parent=this.world){let curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return this.mesh(new THREE.TubeGeometry(curve,60,r,10,false),this.material(color),0,0,0,parent);}
 label(name,pos,description,obj){this.labels.push({name,pos:new THREE.Vector3(...pos),description,obj});if(obj){obj.traverse(o=>{if(o.isMesh){o.userData.labelIndex=this.labels.length-1;this.pickables.push(o)}})}}
 textTexture(text,bg='#f0efda',color='#496249'){let c=document.createElement('canvas');c.width=256;c.height=128;let ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,256,128);ctx.fillStyle=color;ctx.textAlign='center';ctx.font='bold 34px sans-serif';ctx.fillText(text,128,75);return new THREE.CanvasTexture(c);}
 plaque(text,w,h,x,y,z,parent=this.world){let material=new THREE.MeshStandardMaterial({map:this.textTexture(text),roughness:.9});return this.mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,parent);}
 vessel(kind,x,z,scale=1,color=0x9dbfbc){let g=new THREE.Group();g.position.set(x,.14,z);g.scale.setScalar(scale);this.world.add(g);let pts=kind==='flask'?[[0,0],[.65,0],[.75,.12],[.72,.3],[.25,1.3],[.2,1.42],[.2,1.95],[.26,2],[.22,2.04],[.17,1.98],[.17,1.42],[.69,.26],[.69,.12],[.6,.06]]:[[0,0],[.64,0],[.67,.06],[.67,1.65],[.73,1.72],[.67,1.75],[.62,1.68],[.62,.08],[0,.08]];this.mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),64),this.glass(),0,0,0,g);
 const rim=this.mesh(new THREE.TorusGeometry(kind==='flask'?.225:.675,.022,8,64),this.material(0xb7cbbb,.2,.3),0,kind==='flask'?2.02:1.72,0,g);rim.rotation.x=Math.PI/2;
 const liquidMat=new THREE.MeshPhysicalMaterial({color,transparent:true,opacity:.67,roughness:.15,metalness:.02,side:THREE.DoubleSide});let liquid=kind==='flask'?this.cylinder(.45,.66,.65,liquidMat,0,.4,0,g):this.cylinder(.61,.61,.95,liquidMat,0,.54,0,g);this.cylinder(kind==='flask'?.45:.61,kind==='flask'?.45:.61,.015,new THREE.MeshStandardMaterial({color,transparent:true,opacity:.8,roughness:.15}),0,kind==='flask'?.73:1.02,0,g).name='surface';
 for(let i=1;i<5;i++){let line=this.box(.13,.012,.006,0x7e9a85,.32,i*.22+.13,kind==='flask'?.48:.59,g);if(kind==='flask')line.position.z=.64-i*.075;}
 this.plaque(kind==='flask'?'100 mL':'250 mL',.5,.25,0,.5,kind==='flask'?.645:.675,g);g.userData.liquid=liquid;g.userData.surface=g.getObjectByName('surface');g.userData.kind=kind;return g;}
 bottle(text,x,z,color=0xc3a376){let g=new THREE.Group();g.position.set(x,.13,z);this.world.add(g);this.cylinder(.37,.38,1.12,this.material(color,.25),0,.6,0,g);this.cylinder(.19,.34,.19,this.material(color),0,1.23,0,g);this.cylinder(.22,.22,.24,this.material(0x435c4b),0,1.43,0,g);this.plaque(text,.62,.42,0,.66,.385,g);return g;}
 stand(x,z){this.box(1.2,.13,.9,teal,x,.07,z);this.cylinder(.045,.045,4.65,this.material(0xa8b7a4,.25,.8),x,2.4,z);this.box(.8,.07,.08,0x8d9c85,x+.35,3.8,z);this.cylinder(.09,.09,.2,teal,x,3.8,z);}
 bubbles(x,z,n=32,span=.5){let group=new THREE.Group();group.position.set(x,.2,z);this.world.add(group);for(let i=0;i<n;i++){let m=this.mesh(new THREE.SphereGeometry(.02+Math.random()*.025,8,8),new THREE.MeshStandardMaterial({color:0xe9f6e4,transparent:true,opacity:.7}), (Math.random()-.5)*span,Math.random()*1.2,(Math.random()-.5)*span,group);m.userData.seed=Math.random();}return group;}

 build(id){
  this.world.traverse(o=>{if(o.geometry){o.geometry?.dispose();for(const m of(Array.isArray(o.material)?o.material:[o.material])){m.map?.dispose();m.dispose();}}});
  this.world.clear();this.labels=[];this.pickables=[];this.drops=null;this.bubbleGroups=[];this.id=id;this.extra=[];this.physics=null;this.theta=.58;this.radius=id==='electrolysis'?14.8:14.5;this.target.set(0,2.1,0);
  if(physicsExperiments.some(e=>e.id===id)){buildPhysics(this,id);this.requestRender();return;}
  this.box(6.5,.13,3.5,0xe6e5d1,0,.04,0);this.box(6.35,.06,3.4,0xc8d0b5,0,-.035,0);
  if(id==='titration'){
   this.stand(-1.55,-.3);this.main=this.vessel('flask',-.65,.35,1.08,0xbfd8cd);const burette=new THREE.Group();burette.position.set(-.65,0,.35);this.world.add(burette);this.cylinder(.10,.10,2.45,this.glass(),0,3.6,0,burette);this.buretteLiquid=this.cylinder(.078,.078,2.1,new THREE.MeshStandardMaterial({color:0xa8c7b7,transparent:true,opacity:.55}),0,3.7,0,burette);this.cylinder(.025,.06,.28,0xb6c7b5,0,2.23,0,burette);this.box(.43,.07,.08,teal,0,2.42,0,burette);for(let i=0;i<15;i++)this.box(i%5===0?.12:.07,.012,.008,0x718c75,.04,2.65+i*.13,.1,burette);
   this.box(1,.07,.09,0x879a7c,-1.15,3.85,.35);this.tube([[-1.55,3.85,-.3],[-1.55,3.85,.35],[-.65,3.85,.35]],.035,0x9aad91);this.label('Burette · NaOH',[-.58,4.9,.35],'A calibrated tube delivers a measured volume of sodium hydroxide into the flask.',burette);this.label('Indicator + acid',[-.65,1.55,.35],'25 mL of hydrochloric acid with phenolphthalein. The indicator turns pink when excess base is present.',this.main);
   let b=this.bottle('NaOH',1.65,-.25,0xc6aa78);this.label('NaOH solution',[1.65,1.7,-.25],'Sodium hydroxide is the titrant. Adjust its concentration using the controls. The flask begins with 25 mL of 0.10 mol/L HCl.',b);this.plaque('NaOH',.62,.42,1.65,.79,.136);let stopper=this.cylinder(.23,.27,.18,0xc09a6d,2.15,.23,.9);this.drops=this.bubbles(-.65,.35,7,.04);this.drops.children.forEach(m=>m.material.color.set(0x70afbf));
  }else if(id==='gas'){
   this.main=this.vessel('flask',-1.3,0,1.2,0xc5d0ae);this.cylinder(.25,.28,.2,0xbd9668,-1.3,2.66,0);this.tube([[-1.3,2.72,0],[-1.3,3.05,0],[.3,3.05,0],[1.35,2.8,0],[1.35,.7,0]],.045,0xb3bda1);this.collector=this.vessel('beaker',1.35,0,1.35,0xaccac9);this.bubbleGroups.push(this.bubbles(-1.3,0),this.bubbles(1.35,0));this.label('Reaction flask',[-1.3,2.5,0],'Calcium carbonate reacts with acid to release carbon dioxide.',this.main);this.label('Gas collection',[1.35,2.6,0],'The readout measures calculated CO₂ volume at 25 °C and 1 atm.',this.collector);this.bottle('HCl',-2.5,.8,0xc4a37b);
  }else if(id==='electrolysis'){
   this.main=this.vessel('beaker',0,0,1.65,0xb4d5c9);for(let x of[-.55,.55]){this.cylinder(.18,.18,2.55,this.glass(),x,2.6,0);this.cylinder(.035,.035,1.6,this.material(0x6a7766,.25,.5),x,1,0);this.bubbleGroups.push(this.bubbles(x,0,20,.2));this.tube([[x,1.4,0],[x,1.5,1.5],[x<0?-2.1:-1.6,.8,1.5]],.025,x<0?0x416b59:0xbb7959);}let power=this.box(1.25,.65,1,teal,-2,.48,1);this.plaque('DC  + −',.9,.28,-2,.56,1.505);this.label('H₂ · cathode',[-.55,4,0],'Hydrogen forms at the negative electrode. Two electrons are needed per H₂ molecule.');this.label('O₂ · anode',[.65,3.65,0],'Oxygen forms at the positive electrode. Four electrons are needed per O₂ molecule.');this.label('Power supply',[-2,1.2,1],'The power supply drives this non-spontaneous reaction.',power);
  }else if(id==='precipitation'){
   this.main=this.vessel('beaker',-.6,.2,1.5,0xc4d7cd);let a=this.bottle('AgNO₃',1.55,-.4,0xbba075);let b=this.bottle('NaCl',2,.8,0xb4c4b1);this.label('Silver nitrate',[-.6,2.9,.2],'Aqueous silver ions react with chloride ions to form solid AgCl.',this.main);this.label('Sodium chloride',[2,2.1,.8],'Sodium chloride supplies the chloride ions for precipitation.',b);this.precipitate=new THREE.Group();this.precipitate.position.set(-.6,.3,.2);this.world.add(this.precipitate);for(let i=0;i<70;i++)this.mesh(new THREE.IcosahedronGeometry(.025+Math.random()*.035,0),this.material(0xf5f1dc),(Math.random()-.5)*1.3,Math.random()*1.1,(Math.random()-.5)*1.3,this.precipitate);
  }else if(id==='heating'){
   const heater=this.box(2,.45,1.7,teal,-.4,.38,0);this.cylinder(.79,.79,.09,this.material(0x788b77,.4,.6),-.4,.65,0);this.plaque('HEAT',.62,.2,-.4,.4,.86);this.main=this.vessel('beaker',-.4,0,1.25,0xabc9c6);this.main.position.y=.71;this.cylinder(.045,.045,3.2,this.glass(),.05,2.7,.12);this.thermometer=this.cylinder(.018,.018,2.5,0xc98868,.05,2.35,.12);this.stand(1.7,-.5);this.tube([[1.7,3.85,-.5],[1.7,3.85,.12],[.05,3.85,.12]],.04,0x99a98c);this.bubbleGroups.push(this.bubbles(-.4,0,32,.9));this.bubbleGroups[0].position.y=.85;this.label('Water',[-.65,3,0],'Temperature depends on energy supplied and the mass of water.',this.main);this.label('Thermometer',[.1,4.3,.12],'At atmospheric pressure, liquid water boils at 100 °C.');this.label('Electric heater',[-.4,.9,1],'The idealized heater supplies energy at the selected power.',heater);
  }else{
   this.main=this.vessel('beaker',0,0,1.8,0xb7d0c7);this.dye=new THREE.Group();this.dye.position.set(0,.3,0);this.world.add(this.dye);for(let i=0;i<160;i++){let m=this.mesh(new THREE.SphereGeometry(.025,6,6),this.material(0x8056a9),0,0,0,this.dye);m.userData.seed=[Math.random(),Math.random(),Math.random()];}let b=this.bottle('DYE',-2,.5,0x9678ac);this.label('Still water',[.15,3.3,0],'Individual particles move randomly. Net diffusion spreads dye down its concentration gradient.',this.main);this.label('Dye',[-2,1.9,.5],'More drops deepen the color but do not change the model’s diffusion coefficient.',b);
  }
  this.liquid=this.main.userData.liquid;this.surface=this.main.userData.surface;this.initialColor=this.liquid.material.color.clone();this.makeLabels();
  this.requestRender();
 }

 makeLabels(){
  const container=document.querySelector('#labels');
  container.replaceChildren();
  for(let l of this.labels){
   let b=document.createElement('button');
   b.className='object-label';
   b.textContent=l.name;
   b.style.position='absolute';
   b.style.left='0';
   b.style.top='0';
   b.style.willChange='transform, opacity';
   b.addEventListener('click',()=>this.onSelect(l));
   container.append(b);
   l.element=b;
  }
  this.requestRender();
 }

 addVessel(){
  if(this.extra.length>=4)return false;
  let index=this.extra.length;
  let g=this.vessel(index%2?'flask':'beaker',-2.2+(index%2)*4.4,index<2?1.2:-1.2,.65,0xc2d4b8);
  this.extra.push(g);
  this.requestRender();
  return true;
 }

 update(p,progress,result,running){
  this.p=p;
  this.progress=progress;
  this.result=result;
  this.running=running;
  this.renderLoop.setRunning(running);
  
  if(this.physics){
   updatePhysics(this,p,progress,result);
   this.requestRender();
   return;
  }
  if(!this.liquid){
   this.requestRender();
   return;
  }
  if(this.id==='titration'){
   let c=this.initialColor.clone().lerp(new THREE.Color(0xd974af),result.pink);
   this.liquid.material.color.copy(c);
   this.surface.material.color.copy(c);
   let scale=1+result.b/80;
   this.liquid.scale.y=scale;
   this.surface.position.y=.73+(scale-1)*.65/2;
   this.buretteLiquid.scale.y=1-result.b/65;
   this.buretteLiquid.position.y=3.7-result.b/65*1.05;
  }
  if(this.id==='precipitation'){
   this.liquid.material.color.copy(this.initialColor).lerp(new THREE.Color(0xf3eedb),progress);
   this.liquid.material.opacity=.6+progress*.3;
   this.surface.material.color.copy(this.liquid.material.color);
   this.precipitate.visible=progress>0;
   this.precipitate.children.forEach((m,i)=>{m.visible=i<progress*70;m.position.y=Math.max(.02,(1-progress)*((i%11)/10));});
  }
  if(this.id==='heating'){
   this.liquid.scale.y=1-result.vapor;
   this.surface.position.y=1.02-result.vapor*.95;
   this.thermometer.scale.y=(result.a-10)/90;
  }
  if(this.id==='diffusion'){
   let spread=result.spread;
   this.dye.visible=progress>0;
   this.dye.children.forEach((m,i)=>{let s=m.userData.seed;m.position.set((s[0]-.5)*1.9*spread,.85+(s[1]-.5)*1.6*spread,(s[2]-.5)*1.9*spread);m.visible=i<32*p.drops;});
   this.liquid.material.color.copy(this.initialColor).lerp(new THREE.Color(0x9f81be),progress*.4*p.drops/5);
   this.surface.material.color.copy(this.liquid.material.color);
  }
  this.requestRender();
 }

 setupInput(){
  let start=null,last=null,moved=false;
  this.canvas.addEventListener('pointerdown',e=>{
   start=[e.clientX,e.clientY];
   last=start;
   moved=false;
   this.canvas.setPointerCapture(e.pointerId);
  });
  this.canvas.addEventListener('pointermove',e=>{
   if(!last)return;
   let dx=e.clientX-last[0],dy=e.clientY-last[1];
   if(Math.hypot(e.clientX-start[0],e.clientY-start[1])>4)moved=true;
   this.theta-=dx*.006;
   this.phi=Math.max(.45,Math.min(1.45,this.phi+dy*.004));
   last=[e.clientX,e.clientY];
   this.requestRender();
  });
  this.canvas.addEventListener('pointerup',e=>{
   if(!moved){
    let rect=this.canvas.getBoundingClientRect();
    this.pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    let hit=this.raycaster.intersectObjects(this.pickables,false)[0];
    if(hit)this.onSelect(this.labels[hit.object.userData.labelIndex]);
   }
   last=null;
  });
  this.canvas.addEventListener('pointercancel',()=>last=null);
  this.canvas.addEventListener('wheel',e=>{
   e.preventDefault();
   this.radius=Math.max(7,Math.min(19,this.radius+e.deltaY*.008));
   this.requestRender();
  },{passive:false});
 }

 resize(){
  const r=this.canvas.parentElement.getBoundingClientRect();
  this.camera.aspect=r.width/r.height;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(r.width,r.height,false);
  this.requestRender();
 }

 resetCamera(){
  this.theta=.58;
  this.phi=1.12;
  this.radius=14.5;
  this.requestRender();
 }

 render(time, dt = 0.016, isRunning = false){
  this.camera.position.set(
   this.target.x+this.radius*Math.sin(this.phi)*Math.sin(this.theta),
   this.target.y+this.radius*Math.cos(this.phi),
   this.target.z+this.radius*Math.sin(this.phi)*Math.cos(this.theta)
  );
  this.camera.lookAt(this.target);
  
  let active=isRunning && !this.reduced;
  if(active) this.t += dt;

  if(this.drops){
   this.drops.visible=!!active;
   if(active){
    const count=this.drops.children.length;
    for(let i=0;i<count;i++){
     const m=this.drops.children[i];
     const u=((this.t/.85+i/count)%1);
     if(u<.74){
      const tau=u/.74;
      m.position.y=1.89-1.162*tau*tau;
      m.position.x=Math.sin(i*1.5)*.01;
      m.position.z=Math.cos(i*1.5)*.01;
      m.scale.set(1/Math.sqrt(1+.9*tau),1+.9*tau,1/Math.sqrt(1+.9*tau));
      m.visible=true;
     }else{
      const s=(u-.74)/.26;
      m.position.y=.728+.14*Math.sin(s*Math.PI)*(1-s*.85);
      m.scale.set(1.4*(1-s*.4),Math.max(.2,.6*(1-s)),1.4*(1-s*.4));
      m.visible=s<.85;
     }
    }
    if(this.main&&this.main.userData&&this.main.userData.surface){
     const ripple=Math.sin(this.t*24)*.035;
     this.main.userData.surface.scale.set(1+ripple,1,1+ripple);
    }
   }
  }
  if(this.bubbleGroups.length){
   this.bubbleGroups.forEach((g,gi)=>{
    g.visible=this.progress>0&&(this.id!=='heating'||this.result?.a>=99);
    if(g.visible && active){
     g.children.forEach((m)=>{m.position.y=((this.t*(this.id==='electrolysis'?(gi===0?1:.5):.7)+m.userData.seed)*1.1)%1.1;});
    }
   });
  }

  // GPU-composited label transforms without DOM layout reflow
  const w=this.canvas.clientWidth,h=this.canvas.clientHeight;
  for(let i=0; i<this.labels.length; i++){
   const l=this.labels[i];
   scratchProj.copy(l.pos).project(this.camera);
   const visible = Math.abs(scratchProj.x) <= 1 && Math.abs(scratchProj.y) <= 1;
   setTransform3d(l.element, (scratchProj.x+1)/2*w, (-scratchProj.y+1)/2*h - 23, visible);
  }

  this.renderer.render(this.scene,this.camera);
  return active;
 }

 destroy(){
  this.renderLoop.stop();
  this.resizeObserver.disconnect();
  this.renderer.dispose();
 }
}
