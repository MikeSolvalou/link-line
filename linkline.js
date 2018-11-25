/*strategy:
a hidden svg covers the whole page;
the hitbox that detects the mouseleave event is persistent;
it gets repositioned over the :link being hovered over;
*/

//pack everything into linkline object
const linkline={

  //initialize svg (#-linkline-layer), event handlers, hitbox (#-linkline-hitbox)
  init: function(){
    //add a handler for a mouseenter event on every :link in the document
    const links=document.querySelectorAll(':link');
    for(var link of links){
      link.addEventListener('mouseenter', this.draw);
    }

    //add svg covering whole document to draw graphics on; initially hidden
    const svg=document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id='-linkline-layer';
    svg.style.display='none';
    svg.setAttribute('height', document.body.clientHeight);
    document.body.appendChild(svg);

    //add rect for hitbox to detect when mouse leaves a link
    const hitbox=document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hitbox.id='-linkline-hitbox';
    svg.appendChild(hitbox);

    //add handler for a mouseleave event on hitbox
    hitbox.addEventListener('mouseleave', this.undrawAll);
  },


  //hide the svg and undraw graphics
  undrawAll: function(){
    //hide -linkline-layer svg
    var svg=document.getElementById('-linkline-layer');
    svg.style.display='none';

    //undraw all lines
    var lines=svg.querySelectorAll('.-linkline-linkline');
    for(line of lines){
      svg.removeChild(line);
    }
  },


  //draw graphics highlighting :links with the same href value as this one
  draw: function(e){
    //get bounding rect for :link being hovered over (e.target)
    //provides top, bottom, left and right values rel to top left of viewport
    //see https://plainjs.com/javascript/styles/get-the-position-of-an-element-relative-to-the-document-24/
    var rect0=e.target.getBoundingClientRect();

    //get values indicating how far page has been scrolled
    //note: scrollY and scrollX not available in IE
    var scrollY = window.scrollY;
    var scrollX = window.scrollX;

    //rect0 center, rel to tl corner of viewport
    var rect0CenterX = (rect0.left + rect0.right)/2;
    var rect0CenterY = (rect0.top + rect0.bottom)/2;

    //rect0 center, rel to tl corner of document
    var rect0CenterXreldoc = rect0CenterX + scrollX;
    var rect0CenterYreldoc = rect0CenterY + scrollY;

    //need refs to svg and hitbox
    var svg=document.getElementById('-linkline-layer');
    var hitbox=document.getElementById('-linkline-hitbox');

    //draw a line from hovered :link to every other :link with same href value
    var links=document.querySelectorAll(`:link[href="${e.target.href}"]`);
    for(var link of links){
      //don't draw line from hovered :link to itself
      if(link===e.target)
        continue;

      var rect1=link.getBoundingClientRect();
      drawLine(rect1);
    }

    //position hitbox over hovered link
    positionHitbox();

    //show svg
    svg.style.display='unset';
    //end of draw function, only function definitions past here


    //position the hitbox (#-linkline-hitbox) so that it covers the hovered :link
    function positionHitbox(){
      //set hitbox's boundaries to rect0's boundaries, plus a buffer
      const buff=2;

      hitbox.setAttribute('x', rect0.left + scrollX - buff);
      hitbox.setAttribute('y', rect0.top + scrollY - buff);
      hitbox.setAttribute('width', rect0.right - rect0.left + buff + buff);
      hitbox.setAttribute('height', rect0.bottom - rect0.top + buff + buff);
    }


    //draw line from center of rect0 to center of rect1
    function drawLine(rect1){
      //rect1 center, rel to tl corner of viewport
      var rect1CenterX = (rect1.left + rect1.right)/2;
      var rect1CenterY = (rect1.top + rect1.bottom)/2;

      //rect1 center, rel to tl corner of document
      var rect1CenterXreldoc = rect1CenterX + scrollX;
      var rect1CenterYreldoc = rect1CenterY + scrollY;

      //create svg path element for line
      var path=document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${rect0CenterXreldoc},${rect0CenterYreldoc}
        L ${rect1CenterXreldoc},${rect1CenterYreldoc}`);
      path.setAttribute('class', '-linkline-linkline')

      //add path to svg; ensure hitbox is last so it gets drawn over the lines
      svg.insertBefore(path, hitbox);
    }
  }
};

linkline.init();
