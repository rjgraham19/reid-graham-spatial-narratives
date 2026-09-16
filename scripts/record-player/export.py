"""Blender background export of the audited Rhino render meshes.

Input geometry.json is produced by the accompanying source audit; coordinates
stay in inches until export. Y-up GLB coordinates are (x-48, z, 51.918-y).
"""
import bpy,json,math,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
work=root.parent/'record-player-work'
bpy.ops.wm.read_factory_settings(use_empty=True)
data=json.loads((work/'geometry.json').read_text())
materials={}
def material(kind):
 if kind not in materials:
  m=bpy.data.materials.new(kind);m.use_nodes=True
  m.diffuse_color=(.5,.5,.5,1);materials[kind]=m
 return materials[kind]
for item in data:
 name=item['name']; layer=item['layer'];index=int(name.rsplit('_',1)[1])
 verts=item['vertices'];faces=item['faces']
 kind='structure'
 if index in [15,16,18,20,21,22,23,24,25,26,27,28,29]:kind='housing'
 if index in [17,19]:kind='button'
 if index in [0,1]:kind='speaker-top'
 if index in [34,35]:kind='grille'
 if index in [31,32,42]:kind='dark'
 if index in [2,3,4,12,14,43,45,46]:kind='metal'
 if index in [6,8,9,11]:kind='rim'
 if index in [7,10]:kind='scrim'
 if index==13:kind='moon'
 if index==33:kind='deck'
 if index==44:kind='disc'
 pivot=(48.001261,51.918004,23.127212) if kind=='disc' else (48,51.918,0)
 mesh=bpy.data.meshes.new(name)
 # Raise the existing disc only 0.06 inches above its coplanar backing cap.
 mesh.from_pydata([(x-pivot[0],y-pivot[1],z-pivot[2]+(.06 if kind=='disc' else 0)) for x,y,z in verts],[],faces)
 mesh.update()
 obj=bpy.data.objects.new('CD_SPINS' if kind=='disc' else name,mesh)
 bpy.context.collection.objects.link(obj)
 if kind=='disc':obj.location=(pivot[0]-48,pivot[1]-51.918,pivot[2])
 obj['source_layer']=layer;obj['source_object']=name;obj['finish']=kind
 obj.data.materials.append(material(kind))
 uv=mesh.uv_layers.new(name='UVMap')
 bounds=[(min(v[i] for v in verts),max(v[i] for v in verts)) for i in range(3)]
 for poly in mesh.polygons:
  for li in poly.loop_indices:
   x,y,z=verts[mesh.loops[li].vertex_index]
   if kind=='disc': u,v=(x-19.00126)/58,(y-22.918)/58
   elif kind=='button': u,v=(x-bounds[0][0])/(bounds[0][1]-bounds[0][0]),(z-bounds[2][0])/(bounds[2][1]-bounds[2][0])
   elif kind in ['scrim','rim','moon']: u,v=(x-2)/92,(z-13.151635)/92
   else:u,v=x/96,y/96
   uv.data[li].uv=(u,v)
 # Split at the CAD seams, smooth only curved surfaces.
 if kind in ['metal','housing','moon','rim','grille'] and len(faces)>10:
  for poly in mesh.polygons:poly.use_smooth=True
  mod=obj.modifiers.new('CAD hard edges','EDGE_SPLIT');mod.split_angle=math.radians(35)
bpy.ops.export_scene.gltf(filepath=str(root/'public/models/record-player/record-player.glb'),export_format='GLB',export_extras=True,export_animations=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
print('RECORD_PLAYER_EXPORTED')
