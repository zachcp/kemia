goog.provide('kemia.controller.plugins.AtomEdit');
goog.require('kemia.controller.Plugin');
goog.require('goog.debug.Logger');

/**
 * @constructor
 * @extends{kemian.controller.Plugin}s
 */
kemia.controller.plugins.AtomEdit = function() {
	kemia.controller.Plugin.call(this);

}
goog.inherits(kemia.controller.plugins.AtomEdit, kemia.controller.Plugin);
goog.exportSymbol('kemia.controller.plugins.AtomEdit',
		kemia.controller.plugins.AtomEdit);

/**
 * Command implemented by this plugin.
 */
kemia.controller.plugins.AtomEdit.COMMAND = 'selectSymbol';

/** @inheritDoc */
kemia.controller.plugins.AtomEdit.prototype.isSupportedCommand = function(
		command) {
	return command == kemia.controller.plugins.AtomEdit.COMMAND;
};

/** @inheritDoc */
kemia.controller.plugins.AtomEdit.prototype.getTrogClassId = goog.functions
		.constant(kemia.controller.plugins.AtomEdit.COMMAND);

kemia.controller.plugins.AtomEdit.SHORTCUTS = [ {
	id : 'C',
	key : 'c'
}, {
	id : 'N',
	key : 'n'
}, {
	id : 'S',
	key : 's'
}, {
	id : 'P',
	key : 'p'
}, {
	id : 'O',
	key : 'o'
} ];

kemia.controller.plugins.AtomEdit.prototype.getKeyboardShortcuts = function() {
	return kemia.controller.plugins.AtomEdit.SHORTCUTS;
}

/**
 * reset to default state called when another plugin is made active
 */
kemia.controller.plugins.AtomEdit.prototype.resetState = function() {
	this.symbol = undefined;
}

/**
 * sets atom symbol.
 * 
 * @param {string}
 *            command Command to execute.
 * @return {Object|undefined} The result of the command.
 */
kemia.controller.plugins.AtomEdit.prototype.execCommandInternal = function(
		command, var_args) {
	this.symbol = arguments[1];
};

/**
 * The logger for this class.
 * 
 * @type {goog.debug.Logger}
 * @protected
 */
kemia.controller.plugins.AtomEdit.prototype.logger = goog.debug.Logger
		.getLogger('kemia.controller.plugins.AtomEdit');

kemia.controller.plugins.AtomEdit.prototype.handleKeyboardShortcut = function(e) {
	try {
		var id = e.identifier;
		var shortcut = goog.array.find(
				kemia.controller.plugins.AtomEdit.SHORTCUTS, function(obj) {
					return obj.id == e.identifier
				});
		if (shortcut) {
			// this.logger.info('handleKeyboardShortcut ' + e.identifier);
			this.symbol = shortcut.id;
			return true;
		}

	} catch (e) {
		this.logger.info(e);
	}
}

kemia.controller.plugins.AtomEdit.prototype.handleMouseMove = function(e) {

	if (this.symbol) {
		// this.logger.info('handleMouseMove');
		var target = this.editorObject.findTarget(e);
		if (e.currentTarget.highlightGroup) {
			e.currentTarget.highlightGroup.clear();
		}

		if (target instanceof kemia.model.Atom) {
			if (!e.currentTarget.highlightGroup) {
				e.currentTarget.highlightGroup = this.highlightAtom(target);
			} else {
				e.currentTarget.highlightGroup = this.highlightAtom(target,
						e.currentTarget.highlightGroup);
			}
			return true;
		}
	}
	return false;

}

kemia.controller.plugins.AtomEdit.prototype.handleMouseDown = function(e) {

	var target = this.editorObject.findTarget(e);
	if (target instanceof kemia.model.Atom) {
		var atom = target;
		if (this.symbol && (this.symbol != atom.symbol)) {
			this.editorObject.dispatchBeforeChange();
			this.setAtomSymbol(e, atom);
			this.editorObject.setModels(this.editorObject.getModels());
			this.editorObject.dispatchChange();
			return true;
		}
	}
	if (target == undefined && this.symbol) {
		this.createMolecule(kemia.controller.ReactionEditor.getMouseCoords(e));
		this.editorObject.setModels(this.editorObject.getModels());
		this.editorObject.dispatchChange();
		return true;
	}
	return false;

};

kemia.controller.plugins.AtomEdit.prototype.highlightAtom = function(atom,
		opt_group) {
	// this.logger.info('highlightAtom');
	return this.editorObject.reactionRenderer.moleculeRenderer.atomRenderer
			.highlightOn(atom, 'purple', opt_group);
};

kemia.controller.plugins.AtomEdit.prototype.setAtomSymbol = function(e, atom) {
	var new_atom = new kemia.model.Atom(this.symbol, atom.coord.x, atom.coord.y);
	var molecule = atom.molecule
	goog.array.forEach(atom.bonds.getValues(), function(bond) {
		var new_bond = bond.clone();
		new_bond.molecule = undefined;
		atom == new_bond.source ? new_bond.source = new_atom
				: new_bond.target = new_atom;
		molecule.addBond(new_bond);
		molecule.removeBond(bond);
	});
	molecule.removeAtom(atom);
	molecule.addAtom(new_atom);
};

kemia.controller.plugins.AtomEdit.prototype.createMolecule = function(pos) {
	var coord = this.editorObject.reactionRenderer.transform.createInverse()
			.transformCoords( [ pos ])[0];
	var atom = new kemia.model.Atom(this.symbol, coord.x, coord.y);
	var molecule = new kemia.model.Molecule();
	molecule.addAtom(atom);

	var reaction;
	if (this.editorObject.getModels().length > 0) {
		reaction = this.editorObject.getModels()[0];
		if (reaction.arrows.length > 0) {
			var arrow_pos = reaction.arrows[0];
			if (arrow_pos.x > coord.x) {
				// left of arrow, so reactant
				reaction.addReactant(molecule);
			} else {
				// right of arrow so product
				reaction.addProduct(molecule);
			}
		}
		// no arrow
		reaction.addReactant(molecule);
	}
};

/** @inheritDoc */
kemia.controller.plugins.AtomEdit.prototype.queryCommandValue = function(
		command) {
	if (command == kemia.controller.plugins.AtomEdit.COMMAND) {
		return this.symbol;
	}
};
