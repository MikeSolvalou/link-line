/*
a hidden svg covers the whole document; graphics are drawn on this svg;
a hitbox (<rect>) covers the hovered :link, but resides on the svg layer,
so it can detect when the mouse moves off the link;
*/

//pack everything into linkline object
const linkline={

  //initialize svg, some event handlers, hitbox, and hitbox link
  init: function(){
    //add a handler for a mouseenter event on every :link in the document
    const links=document.querySelectorAll(':link');
    for(var link of links){
      link.addEventListener('mouseenter', linkline.draw);
    }

    //add svg covering whole document to draw graphics on; initially hidden
    const svg=document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id='-linkline-layer';
    svg.style.display='none';

    // set svg's height and width
    //  setting height:100%; in CSS just sets the SVG to:
    //  - the viewport height if its positioning context is the root element
    //  - the containing element's height otherwise
    //  same for width
    // set now incase document has already loaded
    // -2 pixel buffer stops browser scrollbars appearing when they shouldn't
    svg.setAttribute('height', document.body.clientHeight-2);
    svg.setAttribute('width', document.body.clientWidth-2);

    //  document height (and width?) may grow as document loads
    window.addEventListener('load', function() {    //incase window is still loading
      svg.setAttribute('height', document.body.clientHeight-2);
      svg.setAttribute('width', document.body.clientWidth-2);
    });

    //  document width changes on window resize, but height does not
    window.addEventListener('resize', function(){
      svg.setAttribute('width', document.body.clientWidth-2);
    });

    document.body.appendChild(svg); //stow in body for now

    const hitbox=document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hitbox.id='-linkline-hitbox';
    svg.appendChild(hitbox);

    //add handler for mouseleave event on hitbox
    hitbox.addEventListener('mouseleave', linkline.undrawAll);
  },


  lastScrollYOffset:0,

  //adjust endpoints of lines to fixed-position links to match scrolling
  handleScroll: function(e){
    //latch current scroll offset
    var scrollY=window.scrollY;

    //adjust endpoints of all lines to a fixed :link
    // get list of relevant lines
    var paths=document.getElementById('-linkline-layer').getElementsByClassName('-linkline-endfixed');

    for(var path of paths){
      // parse end y coordinate from path string
      var dString=path.getAttribute('d');
      var commaPos=dString.lastIndexOf(',');
      var rect1CenterYreldoc=parseInt(dString.substring(commaPos+1));

      // adjust end y coordinate by scrolled distance
      rect1CenterYreldoc += (scrollY - linkline.lastScrollYOffset);

      // set new path string
      path.setAttribute('d', dString.substring(0, commaPos+1) + rect1CenterYreldoc);
    }

    //store latched scroll offset
    linkline.lastScrollYOffset=scrollY;
  },


  //hide the svg and undraw graphics
  undrawAll: function(){
    //hide -linkline-layer svg
    var svg=document.getElementById('-linkline-layer');
    svg.style.display='none';

    //remove inline styling for nudging svg
    svg.style.left=null;
    svg.style.top=null;

    //undraw all lines
    var lines=svg.querySelectorAll('.-linkline-linkline');
    for(line of lines){
      svg.removeChild(line);
    }

    //don't listen for these while graphics are down
    window.removeEventListener('scroll', linkline.handleScroll);
  },


  //draw graphics highlighting :links with the same href value as the event target
  draw: function(e){
    //get bounding rect for :link being hovered over (e.target)
    //provides top, bottom, left and right values rel to top left of viewport
    //see https://plainjs.com/javascript/styles/get-the-position-of-an-element-relative-to-the-document-24/
    var rect0=e.target.getBoundingClientRect();

    //rect0 center, rel to tl corner of viewport
    var rect0CenterX = (rect0.left + rect0.right)/2;
    var rect0CenterY = (rect0.top + rect0.bottom)/2;

    //get values indicating how far page has been scrolled
    var scrollY = window.scrollY; //unavailable in IE
    var scrollX = window.scrollX; //unavailable in IE

    //rect0 center, rel to tl corner of document
    var rect0CenterXreldoc = rect0CenterX + scrollX;
    var rect0CenterYreldoc = rect0CenterY + scrollY;

    //need these pointers
    var svg=document.getElementById('-linkline-layer');
    var hitbox=document.getElementById('-linkline-hitbox');

    //put svg inside hovered :link
    e.target.appendChild(svg);

    //If svg's positioning context is not the root element, nudge it so its top-left
    //corner coincides with the root element's top left corner.
    // Search for :link's nearest positioned ancestor.
    for(var element=e.target; element!==null; element=element.parentElement){
      //if a positioned ancestor is found, get its bounding rect and nudge the svg accordingly
      if(window.getComputedStyle(element).position!=='static'){
        var posContextRect=element.getBoundingClientRect();
        svg.style.left = (-posContextRect.left-scrollX)+'px';
        svg.style.top = (-posContextRect.top-scrollY)+'px';
        break;
      }
    }

    //draw a line from hovered :link to every other :link with same href value
    var links=document.querySelectorAll(`:link[href="${e.target.href}"]`);
    for(var link of links){
      //don't draw line from hovered :link to itself
      if(link===e.target)
        continue;

      drawLine();
    }

    //position hitbox over hovered link
    positionHitbox();

    //fix for case when cursor leaves hitbox before mouseleave event is being listened for
    svg.addEventListener('mousemove', earlyExitCheck, {once:true});

    //adjust lines to links with position:fixed; while scrolling
    // TODO: scroll events are fired once per frame(?); should ignore some for performance
    // TODO: if there are no lines to position:fixed; links, don't add this handler
    window.addEventListener('scroll', linkline.handleScroll);
    linkline.lastScrollYOffset=window.scrollY;

    //show svg
    svg.style.display='unset';
    //end of draw function, only function definitions past here


    //if cursor is outside hitbox, call undrawAll; e is a MouseEvent
    function earlyExitCheck(e){
      if(e.clientX < rect0.left || e.clientX > rect0.right
        || e.clientY < rect0.top || e.clientY > rect0.bottom){
        linkline.undrawAll();
      }
    }


    //position the hitbox (#-linkline-hitbox) so that it covers the hovered :link
    function positionHitbox(){
      //set hitbox's boundaries to rect0's boundaries, plus a buffer
      hitbox.setAttribute('x', rect0.left + scrollX - 2);
      hitbox.setAttribute('y', rect0.top + scrollY - 2);
      hitbox.setAttribute('width', rect0.right - rect0.left + 4);
      hitbox.setAttribute('height', rect0.bottom - rect0.top + 4);
    }


    //draw line from center of rect0 to center of rect1
    function drawLine(){
      var rect1=link.getBoundingClientRect();

      //rect1 center, rel to tl corner of viewport
      var rect1CenterX = (rect1.left + rect1.right)/2;
      var rect1CenterY = (rect1.top + rect1.bottom)/2;

      //rect1 center, rel to tl corner of document
      var rect1CenterXreldoc = rect1CenterX + scrollX;
      var rect1CenterYreldoc = rect1CenterY + scrollY;

      //create svg path element for line
      var path=document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${rect0CenterXreldoc},${rect0CenterYreldoc} L ${rect1CenterXreldoc},${rect1CenterYreldoc}`);
      path.setAttribute('class', '-linkline-linkline');

      //if path endpoint (or any ancestor) has fixed position, mark with a class
      for(var element=link; element!==null; element=element.parentElement){
        if(window.getComputedStyle(element).position==='fixed'){
          path.setAttribute('class', path.getAttribute('class') + ' -linkline-endfixed');
          break;
        }
      }

      //add path to svg; ensure hitbox is last so it gets drawn over the lines
      svg.insertBefore(path, hitbox);
    }
  }
};

linkline.init();
