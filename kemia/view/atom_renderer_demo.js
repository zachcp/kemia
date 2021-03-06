goog.require('goog.dom');
goog.require('goog.graphics');
goog.require('kemia.view.AtomRenderer');
goog.require('kemia.graphics.AffineTransform');
goog.require('kemia.graphics.ElementArray');
goog.require('kemia.model.Molecule');
goog.require('kemia.model.Atom');
goog.require('kemia.model.Bond');
goog.require('goog.debug.Console');

function initPage(){

// note:  uncomment the next two lines to turn on console logging
	var c = new goog.debug.Console(); 
	c.setCapturing(true); 


	var element = goog.dom.getElement('container')
	var graphics = goog.graphics.createGraphics(element.clientWidth,
			element.clientHeight);
	graphics.render(element);
	var elements = new kemia.graphics.ElementArray();
	var r = new kemia.view.AtomRenderer( graphics);
	
	var trans = new kemia.graphics.AffineTransform(20,0,0,-20,0,0);
	var mol1 = new kemia.model.Molecule();
	var c1 = new kemia.model.Atom("C", 2, -2);
	mol1.addAtom(c1);
	r.render(c1, trans, elements);

	
	var mol2 = new kemia.model.Molecule();
	var c2 = new kemia.model.Atom("C", 5, -2);
	var o2 = new kemia.model.Atom("O", 6, -2);
	mol2.addBond(new kemia.model.Bond(c2, o2, 2));
	trans = new kemia.graphics.AffineTransform(30,0,0,-30,0,0);
	r.render(c2, trans, elements);
	r.render(o2, trans, elements);

	
	var mol3 = new kemia.model.Molecule();
	var c3 = new kemia.model.Atom("C", 7, -2);
	var c4 = new kemia.model.Atom("C", 8, -2);
	mol3.addBond(new kemia.model.Bond(c3, c4, 3));
	trans = new kemia.graphics.AffineTransform(40,0,0,-40,0,0);
	r.render(c3, trans, elements);
	r.render(c4, trans, elements);
	
	var mol4 = new kemia.model.Molecule();
	var n = new kemia.model.Atom("N", 2, -4, 1);
	var s = new kemia.model.Atom("S", 2, -5);
	var p = new kemia.model.Atom("P", 4, -4);
	var cl = new kemia.model.Atom("Cl", 4, -5); 
	var f = new kemia.model.Atom("F", 6, -4);
	var br = new kemia.model.Atom("Br", 6, -5);
	var i = new kemia.model.Atom("I", 8, -4);
	var h = new kemia.model.Atom("H", 8, -5);
	mol4.addBond(new kemia.model.Bond(n,s));
	mol4.addBond(new kemia.model.Bond(p, cl));
	mol4.addBond(new kemia.model.Bond(f, br));
	mol4.addBond(new kemia.model.Bond(i,h));
	
	trans = new kemia.graphics.AffineTransform(30,0,0,-30,0,0);
	r.render(n, trans, elements);
	r.render(s, trans, elements);
	r.render(p, trans, elements);
	r.render(cl, trans, elements);
	r.render(f, trans, elements);
	r.render(br, trans, elements);
	r.render(i, trans, elements);
	r.render(h, trans, elements);
	// elements.clear();
};

goog.events.listen(window, goog.events.EventType.LOAD, initPage);