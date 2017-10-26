paper.install(window);

window.onload = function() {

  paper.setup('sketchpad');
  // Create a simple drawing tool:
  var tool = new Tool();
  tool.minDistance = 10;
  var path, path2;      

  // Define a mousedown and mousedrag handler
  tool.onMouseDown = function(event) {
    path = new Path();      
    path.strokeColor = '#0074D9';
    path.strokeWidth = 10;
    path.add(event.point);
    path.fullySelected = true;

    path2 = new Path();
    path2.strokeColor = '#0074D9';
    path2.strokeWidth = 5;

  }

  tool.onMouseDrag = function(event) {
    path.add(event.point);

  }

  tool.onMouseUp = function(event) {
    path.selected = false;
    path.simplify(15);
    finalPoint = path._segments.slice(-1)[0];

  }
}