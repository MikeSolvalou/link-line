/*
a hidden svg covers the whole document; graphics are drawn on this svg;
a hitbox (<rect>) covers the :link, but resides on the svg layer,
so it can detect when the mouse moves off the link;
the <rect> is wrapped in an <a> (svg namespace) so it can respond to clicks;
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

    // setting height:100%; in CSS just sets the SVG to the viewport height(!?), not document height
    // also, document height may grow as images load
    svg.setAttribute('height', document.body.clientHeight); //incase window has already loaded
    window.addEventListener('load', function() {           //incase window is still loading
      svg.setAttribute('height', document.body.clientHeight);
    });

    document.body.appendChild(svg);

    //add clickable rect to act as hitbox to detect when mouse leaves a link, or link is clicked
    const hitboxLink=document.createElementNS('http://www.w3.org/2000/svg', 'a');
    hitboxLink.id='-linkline-hitbox-link';
    svg.appendChild(hitboxLink);

    const hitbox=document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hitbox.id='-linkline-hitbox';
    hitboxLink.appendChild(hitbox);

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

    //undraw all lines
    var lines=svg.querySelectorAll('.-linkline-linkline');
    for(line of lines){
      svg.removeChild(line);
    }

    //hitbox links to nowhere while graphcis are down
    var hitboxLink=document.getElementById('-linkline-hitbox-link');
    hitboxLink.setAttribute('href', '');

    //don't listen for these while graphics are down
    window.removeEventListener('scroll', linkline.handleScroll);
  },


  //draw graphics highlighting :links with the same href value as this one
  draw: function(e){
    //get bounding rect for :link being hovered over (e.target)
    //provides top, bottom, left and right values rel to top left of viewport
    //see https://plainjs.com/javascript/styles/get-the-position-of-an-element-relative-to-the-document-24/
    var rect0=e.target.getBoundingClientRect();

    //get values indicating how far page has been scrolled
    var scrollY = window.scrollY; //unavailable in IE
    var scrollX = window.scrollX; //unavailable in IE

    //rect0 center, rel to tl corner of viewport
    var rect0CenterX = (rect0.left + rect0.right)/2;
    var rect0CenterY = (rect0.top + rect0.bottom)/2;

    //rect0 center, rel to tl corner of document
    var rect0CenterXreldoc = rect0CenterX + scrollX;
    var rect0CenterYreldoc = rect0CenterY + scrollY;

    //need these pointers in-scope at drawLine function call
    var svg=document.getElementById('-linkline-layer');
    var hitbox=document.getElementById('-linkline-hitbox');
    var hitboxLink=document.getElementById('-linkline-hitbox-link');

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

    //set hitboxLink target
    hitboxLink.setAttribute('href', e.target.href)

    //fix for case when cursor leaves hitbox before mouseleave event is being listened for
    svg.addEventListener('mousemove', earlyExitCheck, {once:true});

    //adjust lines to links with position:fixed; while scrolling
    //TODO: scroll events are fired once per frame(?); might need to ignore some for performance
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
      svg.insertBefore(path, hitboxLink);
    }
  }
};

linkline.init();
