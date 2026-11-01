THE CORNER TREE's model (WSP Group 4) — a PREVIEW behind its switch (&tree=model | &tree=dead, the panel's CORNER TREE rows); the hand-drawn
maple stays the default (the owner's HARD RULE: it did not clearly beat the drawn tree — docs/harbor/passes/wsp.md).
Sources (Grok's downloads, copies only): C:\Users\benja\Downloads\Grok\city-models\tree\
  stylized-tree.glb  ← 2-danielpetrov-stylized-tree/stylized_tree/scene.gltf   (CC BY 4.0 — credits-danielpetrov.txt; on the site's CREDITS)
  deadtree-1.glb     ← 1-quaternius-stylized-nature-megakit/glTF/DeadTree_1.gltf (CC0 — credits-quaternius.txt)
Rebuild (the .glb files are git-ignored):  node scripts/gltf-to-glb.mjs <in.gltf> art/models/tree/<name>.glb
Bake:  node scripts/bake-model.mjs "<chromium>" tree   → assets/city/tree/ (+ --look DIR for the review renders)
