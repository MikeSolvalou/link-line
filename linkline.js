//pack everything into linkline object
const linkline={

  //add a listener for a mouseenter event on every :link in the document
  init: function(){
    const links=document.querySelectorAll(':link');
    for(var link of links){
      link.addEventListener('mouseenter', this.draw);
    }
  },


  //draw lines between this :link and every other :link with the same href value
  draw: function(e){
    //get bounding rect for :link being hovered over (e.target)
    //provides top, bottom, left and right values rel to top left of viewport
    //from https://plainjs.com/javascript/styles/get-the-position-of-an-element-relative-to-the-document-24/
    var rect0=e.target.getBoundingClientRect();

    //get static NodeList of all :links with the same href value; includes :link being hovered over
    var links=document.querySelectorAll(`:link[href="${e.target.href}"]`);

    //draw a line from hovered :link to every other :link with same href value
    for(var link of links){
      //don't draw line from hovered :link to itself
      if(link===e.target)
        continue;

      var rect1=link.getBoundingClientRect();
      drawLine(rect1);
    }

    //draw an svg over the :link to serve as a hitbox for the mouseleave event
    // ie, detect when mouse leaves the :link, by detecting when it leaves this svg
    // can't just use the :link since the other svgs are children of it
    //TODO: try inserting other svgs between :link and :link's parent so this hitbox isn't needed
    drawHitbox();
    //end of draw function, only function definitions past here


    //remove all svgs drawn by this script
    function undraw(){
      //static NodeList of all svgs to remove
      const svgs=document.querySelectorAll('svg[class^="-linkline"]');

      for(var svg of svgs)
        svg.parentNode.removeChild(svg);
    }


    //draw svg that just covers rect0, plus a little extra buffer
    function drawHitbox(){
      //create svg element
      var svg=document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // set svg's boundaries to rect0's boundaries, plus a buffer
      const buff=2;
      svg.setAttribute('style', `position:fixed; top:${rect0.top-buff}px;
        left:${rect0.left-buff}px;`);
      svg.setAttribute('width', rect0.right - rect0.left + buff + buff);
      svg.setAttribute('height', rect0.bottom - rect0.top + buff + buff);
      svg.setAttribute('class', '-linkline-linkhitbox');

      e.target.appendChild(svg);

      svg.addEventListener('mouseleave', undraw);
    }


    //draw line from rect0 to rect1
    function drawLine(rect1){
      //create svg element
      var svg=document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // set svg's boundaries to the bounding rectangle that encloses rect0 and rect1
      //  top, left, bottom and right are rel to top left corner of viewport
      var top = (rect0.top < rect1.top) ? rect0.top : rect1.top;
      var bottom = (rect0.bottom > rect1.bottom) ? rect0.bottom : rect1.bottom;
      var left = (rect0.left < rect1.left) ? rect0.left : rect1.left;
      var right = (rect0.right > rect1.right) ? rect0.right : rect1.right;
      var width = right-left; //min 1 ?
      var height = bottom-top;  //min 1 ?

      svg.setAttribute('style', `position:fixed; top:${top}px; left:${left}px;`);
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.setAttribute('class', '-linkline-linkline');

      e.target.appendChild(svg);

      //draw line from center of rect0 to center of rect1
      // rect centers, rel to tl corner of viewport
      var rect0CenterX = (rect0.left + rect0.right)/2;
      var rect0CenterY = (rect0.top + rect0.bottom)/2;
      var rect1CenterX = (rect1.left + rect1.right)/2;
      var rect1CenterY = (rect1.top + rect1.bottom)/2;

      // rect centers, rel to tl corner of svg
      var rect0CenterXrelsvg = rect0CenterX - left;
      var rect0CenterYrelsvg = rect0CenterY - top;
      var rect1CenterXrelsvg = rect1CenterX - left;
      var rect1CenterYrelsvg = rect1CenterY - top;

      // create svg path element for line
      var path=document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${rect0CenterXrelsvg},${rect0CenterYrelsvg}
        L ${rect1CenterXrelsvg},${rect1CenterYrelsvg}`);
      path.setAttribute('fill', 'none');

      //  TODO: should set these attributes in css; the default values aren't acceptable
      path.setAttribute('stroke', 'black');
      path.setAttribute('stroke-width', '3');

      svg.appendChild(path);
    }
  }
};

linkline.init();
