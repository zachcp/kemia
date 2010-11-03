goog.require('goog.testing.jsunit');
goog.require('kemia.io.json');
goog.require('goog.json.Serializer');
goog.require('goog.debug.Console');
goog.require('goog.debug.Logger');

function setUp() {
	var c = new goog.debug.Console();
	c.setCapturing(true);
	logger = goog.debug.Logger.getLogger('JsonTest');
	logger.setLevel(goog.debug.Logger.Level.ALL);
	json_rxn = goog.json.parse(goog.json.serialize(jreaction));
}

function testReadWriteMolecule() {
	var mol = kemia.io.json.readMolecule(jmol);
	assertEquals('test', mol.name);
	assertEquals(26, mol.countAtoms());
	assertEquals(27, mol.countBonds());

	var moljson = kemia.io.json.moleculeToJson(mol);
	var mol2 = kemia.io.json.readMolecule(moljson);
	assertEquals(mol.name, "test");
	assertEquals(mol.countAtoms(), 26);
	assertEquals(mol.countBonds(), 27);
}

function testReadMoleculeAromatic() {
	var mol = kemia.io.json.readMolecule(jmol2);
	assertEquals(mol.name, "test");
	assertEquals(mol.countAtoms(), 26);
	assertEquals(mol.countBonds(), 27);
}

function test1ExportMol() {
	var mol = kemia.io.json.readMolecule(jmol);
	var jmolstr = kemia.io.json.writeMolecule(mol);

	// test the string representation
	var mol2 = kemia.io.json.readMolecule(jmolstr);
	assertEquals('test', mol2.name);
	assertEquals(26, mol2.countAtoms());
	assertEquals(27, mol2.countBonds());

}

function test2ImportReaction() {
	var rxn = kemia.io.json.readReaction(json_rxn);
	assertEquals("3-component UGI", rxn.getHeader());
	assertEquals(3, rxn.getReactants().length);
	assertEquals(rxn.getReactants()[1].name, "isocyanoethane");
	assertEquals(4, rxn.getReactants()[1].countAtoms());
	assertEquals(3, rxn.getReactants()[1].countBonds());

	assertEquals(1, rxn.getProducts().length);
	assertEquals(15, rxn.getProducts()[0].countBonds());
	assertEquals('foo reagent', rxn.getReagentsText());
	assertEquals('bar conditions', rxn.getConditionsText());
	
	// test the string representation
	rxn = kemia.io.json.readReaction(JSON.stringify(json_rxn));
	assertEquals(rxn.header, "3-component UGI");
	assertEquals(3, rxn.getReactants().length);
	assertEquals(rxn.getReactants()[1].name, "isocyanoethane");
	assertEquals(rxn.getReactants()[1].countAtoms(), 4);
	assertEquals(rxn.getProducts()[0].countBonds(), 15);
	assertEquals(rxn.getProducts().length, 1);
	assertEquals('foo reagent', rxn.getReagentsText());
	assertEquals('bar conditions', rxn.getConditionsText());
}

function testImportReactionWithUndefinedConditions() {
	json_rxn.conditions_text = undefined;
	json_rxn.reagents_text = undefined
	var rxn = kemia.io.json.readReaction(json_rxn);
	assertEquals('', rxn.getReagentsText());
	assertEquals('', rxn.getConditionsText());
}

function testImportReactionWithUndefinedPluses(){
	json_rxn.pluses = undefined;
	var rxn = kemia.io.json.readReaction(json_rxn);
	assertEquals(3, rxn.getReactants().length);
	assertEquals(1, rxn.getProducts().length);
}

function testImportReactionWithUndefinedArrows(){
	json_rxn.arrows = undefined;
	var rxn = kemia.io.json.readReaction(json_rxn);
	assertEquals(3, rxn.getReactants().length);
	assertEquals(1, rxn.getProducts().length);
	assertEquals(4.60065, rxn.arrows[0].source.x);
}

function testImportReactionWithNoReactantsAndNoProducts(){
	json_rxn.reactants = undefined;
	json_rxn.products = undefined;
	var rxn = kemia.io.json.readReaction(json_rxn);
	assertEquals(0, rxn.getReactants().length);
	assertEquals(0, rxn.getProducts().length);
}

function test3ExportReaction() {
	var rxn1 = kemia.io.json.readReaction(json_rxn);
	var jrxnstr1 = kemia.io.json.writeReaction(rxn1);

	// test the string representation
	var rxn2 = kemia.io.json.readReaction(JSON.stringify(json_rxn));
	var jrxnstr2 = kemia.io.json.writeReaction(rxn2);
	assertEquals(jrxnstr1.length, jrxnstr2.length);

}

function test4ReactionToJson() {
	var rxn = kemia.io.json.readReaction(reactionDrawing);
	var rxn_json = kemia.io.json.reactionToJson(rxn);
	assertEquals(rxn.getReactants().length, rxn_json.reactants.length);
	assertEquals(rxn.getProducts().length, rxn_json.products.length);
	assertEquals(rxn.getReactants()[0].countAtoms(),
			rxn_json.reactants[0].atoms.length);
	assertEquals('NaOH', rxn_json.reagents_text);
	assertEquals('90 C', rxn_json.conditions_text);
};

function test5ModelRxnExportImport() {
	var rxn1 = buildReaction();

	var rxn_json = kemia.io.json.reactionToJson(rxn1);
	logger.info(JSON.stringify(rxn_json));
	var rxn2 = kemia.io.json.readReaction(rxn_json);
	assertEquals(rxn1.header, rxn2.header);
}

function buildReaction() {
	var rxn1 = new kemia.model.Reaction();
	rxn1.header = 'my header';
	rxn1.reagentsText = 'my reagents';
	rxn1.conditionsText = 'my conditions';
	var mol1 = new kemia.model.Molecule('mol1');
	var a1a = new kemia.model.Atom('C', 0, 1);
	var a1b = new kemia.model.Atom('C', 0, 2);
	var b1 = new kemia.model.Bond(a1a, a1b);
	mol1.addAtom(a1a);
	mol1.addAtom(a1b);
	mol1.addBond(b1);
	rxn1.addMolecule(mol1);

	rxn1.addPlus(new kemia.model.Plus(new goog.math.Coordinate(1, 1.5)));

	var mol2 = new kemia.model.Molecule('mol2');
	var a2a = new kemia.model.Atom('C', 2, 1);
	var a2b = new kemia.model.Atom('C', 2, 2);
	var b2 = new kemia.model.Bond(a2a, a2b);
	mol2.addAtom(a2a);
	mol2.addAtom(a2b);
	mol2.addBond(b2);
	rxn1.addMolecule(mol2);

	rxn1.setArrow(new kemia.model.Arrow(new goog.math.Coordinate(3, 1.5),
			new goog.math.Coordinate(4, 1.5)));

	var mol3 = new kemia.model.Molecule('mol3');
	var a3a = new kemia.model.Atom('C', 5, 1);
	var a3b = new kemia.model.Atom('C', 5, 2);
	var b3 = new kemia.model.Bond(a3a, a3b);
	mol3.addAtom(a3a);
	mol3.addAtom(a3b);
	mol3.addBond(b3);
	rxn1.addMolecule(mol3);
	return rxn1;
}