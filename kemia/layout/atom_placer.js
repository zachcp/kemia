goog.provide('kemia.layout.AtomPlacer');
goog.require('goog.math');
goog.require('kemia.layout.ConnectionMatrix');
goog.require('kemia.layout.Vector2D');

/**
 * Javascript version of CDK's AtomPlacer class. Methods for generating
 * coordinates for atoms in various situations.
 *
 * @author: markr@ebi.ac.uk
 */

kemia.layout.AtomPlacer.getInitialLongestChain = function(molecule) {

    var connectionMatrix = kemia.layout.ConnectionMatrix.getMatrix(molecule);
    var apsp = kemia.layout.AtomPlacer.computeFloydAPSP(connectionMatrix);
    var maxPathLength = 0;
    var bestStartAtom = -1;
    var bestEndAtom = -1;
    var bondCount = molecule.countBonds();
    var apspLength = apsp.length;

    for (var f = 0; f < apspLength; f++) {
        var atom = molecule.getAtom(f);
        var connBondCount = kemia.layout.AtomPlacer.getConnectedBondsCount(atom, molecule, bondCount);
        if (connBondCount == 1) {
            for (var g = 0; g < apspLength; g++) {
                if (apsp[f][g] > maxPathLength) {
                    maxPathLength = apsp[f][g];
                    bestStartAtom = f;
                    bestEndAtom = g;
                }
            }
        }
    }
    // kemia.layout.ConnectionMatrix.display(apsp);

    var startAtom = molecule.getAtom(bestStartAtom);
    var path = kemia.layout.AtomPlacer.getLongestUnplacedChain(molecule, startAtom);

	/* DEBUG PATH */
	// var debugPath="";
	// for(a=0; a<path.countAtoms(); a++) {
	// debugPath+=path.getAtom(a).symbol;
	// }
    // alert("longest path is >> "+debugPath);
    /* DEBUG PATH */

    return path;
};


/**
 * All-Pairs-Shortest-Path computation based on Floyds algorithm. Takes an nxn
 * matrix C of edge costs and produces an nxn matrix A of lengths of shortest
 * paths.
 */
kemia.layout.AtomPlacer.computeFloydAPSP = function(costMatrix) {
    var nrow = costMatrix.length;

    var distMatrix = new Array(nrow);
    for (var i = 0; i < nrow; ++i)
        distMatrix[i] = new Array(nrow);

    for (var i = 0; i < nrow; i++) {
        for (var j = 0; j < nrow; j++) {
            if (costMatrix[i][j] == 0) {
                distMatrix[i][j] = 999999;
            }
            else {
                distMatrix[i][j] = 1;
            }
        }
    }

    for (i = 0; i < nrow; i++) {
        distMatrix[i][i] = 0;        // no self cycle
    }
    for (var k = 0; k < nrow; k++) {
        for (i = 0; i < nrow; i++) {
            for (j = 0; j < nrow; j++) {
                if (distMatrix[i][k] + distMatrix[k][j] < distMatrix[i][j]) {
                    distMatrix[i][j] = distMatrix[i][k] + distMatrix[k][j];
                }
            }
        }
    }
    // kemia.layout.ConnectionMatrix.display(distMatrix);
    return distMatrix;
};

/**
 * Search a molecule for the longest unplaced, aliphatic chain in it. If an
 * aliphatic chain encounters an unplaced ring atom, the ring atom is also
 * appended to allow for it to be laid out. This gives us an array for attaching
 * the unplaced ring later.
 */
kemia.layout.AtomPlacer.getLongestUnplacedChain = function(molecule, startAtom) {

    var longest = 0;
    var longestPathLength = 0;
    var maxDegreeSum = 0;
    var degreeSum = 0;
    var paths = new Array();// of molecules
    var atCount = molecule.countAtoms();
    var bondCount = molecule.countBonds();

    for (var f = 0; f < atCount; f++) {
        molecule.getAtom(f).setFlag(kemia.model.Flags.VISITED, false);
        paths[f] = new kemia.model.Molecule;
        paths[f].addAtom(startAtom);
    }

    var startSphere = new Array();
    startSphere.push(startAtom);
	startAtom.flags[kemia.model.Flags.VISITED] = true;

    kemia.layout.AtomPlacer.breadthFirstSearch(molecule, startSphere, paths, bondCount);

    for (var ds = 0; ds < atCount; ds++) {

        if (paths[ds].countAtoms() >= longestPathLength) {
            degreeSum = kemia.layout.AtomPlacer.getDegreeSum(paths[ds], molecule, bondCount);
            if (degreeSum > maxDegreeSum) {
                maxDegreeSum = degreeSum;
                longest = ds;
                longestPathLength = paths[ds].countAtoms();
            }
        }
    }
    return paths[longest];
};

/**
 * Sums up the degrees of atoms in a molecule
 */
kemia.layout.AtomPlacer.getDegreeSum = function(molecule, superMolecule, superBondCount) {
    var degreeSum = 0;
	var atCount = molecule.countAtoms();
    for (var cb = 0; cb < atCount; cb++) {
        degreeSum += kemia.layout.AtomPlacer.getConnectedBondsCount(molecule.getAtom(cb), superMolecule, superBondCount);
    }
    return degreeSum;
};

/**
 * Returns the number of Bonds for a given Atom.
 */
kemia.layout.AtomPlacer.getConnectedBondsCount = function(atom, molecule, bondCount) {
	var connBondCount = 0;
	for (var i = 0; i < bondCount; i++) {
		if (molecule.getBond(i).source == atom || molecule.getBond(i).target == atom)
			connBondCount++;
	}
	return connBondCount;
};


/**
 * Performs a breadthFirstSearch in an molecule starting with a particular
 * sphere, which usually consists of one start atom, and searches for the
 * longest aliphatic chain which is yet unplaced. If the search encounters an
 * unplaced ring atom, it is also appended to the chain so that this last bond
 * of the chain can also be laid out. This gives us the orientation for the
 * attachment of the ring system.
 */
kemia.layout.AtomPlacer.breadthFirstSearch = function(mol, sphere, paths, bondCount) {
	var newSphere = new Array();
	var sphere_len = sphere.length;
	for (var f = 0; f < sphere_len; f++)
	{
	    var atom = sphere[f];
	    if (!atom.flags[kemia.model.Flags.ISINRING])
	    {
	        var atomNr = mol.indexOfAtom(atom);
	        var bonds = mol.getConnectedBondsList(atom);
	        for (var g = 0; g < bonds.length; g++)
	        {
	            var curBond = bonds[g];
	            var nextAtom = curBond.otherAtom(atom);

	            if (!nextAtom.flags[kemia.model.Flags.VISITED] && !nextAtom.flags[kemia.model.Flags.ISPLACED])
	            {
	                var nextAtomNr = mol.indexOfAtom(nextAtom);
	                paths[nextAtomNr] = kemia.layout.AtomPlacer.copyPath(paths[atomNr]);
	                paths[nextAtomNr].addAtom(nextAtom);
	                paths[nextAtomNr].addBond(curBond);
	                if (kemia.layout.AtomPlacer.getConnectedBondsCount(nextAtom, mol, bondCount) > 1) {
	                    newSphere.push(nextAtom);
	                }
	            }
	        }
	    }
	}
	if (newSphere.length > 0) {
	    for (var ns = 0; ns < newSphere.length; ns++) {
	        newSphere[ns].setFlag(kemia.model.Flags.VISITED, true);
	    }
	    kemia.layout.AtomPlacer.breadthFirstSearch(mol, newSphere, paths, bondCount);
	}
};

kemia.layout.AtomPlacer.copyPath = function(path) {
	var pathCopy = new kemia.model.Molecule;
	for (var pl = 0, pathLen = path.countAtoms(); pl < pathLen; pl++) {
		pathCopy.addAtom(path.getAtom(pl));
	}
	return pathCopy;
};


/**
 * Places the atoms in a linear chain. Not included: CIS/TRANS logic from CDK
 * class (could do look for double bond instead)
 */

kemia.layout.AtomPlacer.placeLinearChain = function(chain, initialBondVector, bondLength) {

    var bondVector = initialBondVector;
	for (var f = 0; f < chain.countAtoms() - 1; f++)
	{
		var atom = chain.getAtom(f);
		var nextAtom = chain.getAtom(f + 1);
        var atomPoint = new goog.math.Coordinate(atom.coord.x, atom.coord.y);
        bondVector.normalize();
        bondVector.scale(bondLength);
		atomPoint.x += bondVector.x;
        atomPoint.y += bondVector.y;
		nextAtom.coord = atomPoint;
		nextAtom.setFlag(kemia.model.Flags.ISPLACED, true);
		var trans = true;
        if (kemia.layout.AtomPlacer.has2DCoordinatesNew(chain) == 2)
	   	   trans = false;
		bondVector = kemia.layout.AtomPlacer.getNextBondVector(nextAtom, atom, kemia.layout.AtomPlacer.get2DCenter(chain), trans);
	}
};

kemia.layout.AtomPlacer.has2DCoordinatesNew = function(chain) {
    if (chain == null) return 0;

    var no2d = false;
    var with2d = false;
    goog.array.forEach(chain.atoms, function(atom) {
        if (atom.coord == null || (atom.coord.x == 0 && atom.coord.y == 0)) {
            no2d = true;
        } else {
            with2d = true;
        }
    });

    if (!no2d && with2d) {
        return 2;
    } else if (no2d && with2d) {
        return 1;
    } else {
        return 0;
    }
};

kemia.layout.AtomPlacer.get2DCenter = function(molecule) {
    var centerX = 0;
	var centerY = 0;
	var counter = 0;
	for (var atIdx = 0, atCount = molecule.countAtoms(); atIdx < atCount; atIdx++) {
		var atom = molecule.getAtom(atIdx);
		if (atom.flags[kemia.model.Flags.ISPLACED] == true) {
		        centerX += atom.coord.x;
		        centerY += atom.coord.y;
		        counter++;
		}
    }
	var center = new goog.math.Coordinate(centerX / (counter), centerY / (counter));
    return center;
};

kemia.layout.AtomPlacer.getAtoms2DCenter = function(atoms) {
	var centerX = 0;
	var centerY = 0;
	var counter = 0;
	for (var atIdx = 0, atCount = atoms.length; atIdx < atCount; atIdx++) {
		var atom = atoms[atIdx];
		if (atom.flags[kemia.model.Flags.ISPLACED] == true) {
			centerX += atom.coord.x;
			centerY += atom.coord.y;
			counter++;
		}
	}
	var center = new goog.math.Coordinate(centerX / (counter), centerY / (counter));
	return center;
};

kemia.layout.AtomPlacer.getAngle = function(xDiff, yDiff) {

	var angle = 0;
	if (xDiff >= 0 && yDiff >= 0) {
	    angle = Math.atan(yDiff / xDiff);
	} else if (xDiff < 0 && yDiff >= 0) {
	    angle = Math.PI + Math.atan(yDiff / xDiff);
	} else if (xDiff < 0 && yDiff < 0) {
	    angle = Math.PI + Math.atan(yDiff / xDiff);
	} else if (xDiff >= 0 && yDiff < 0) {
	    angle = 2 * Math.PI + Math.atan(yDiff / xDiff);
	}
	return angle;
};


kemia.layout.AtomPlacer.getNextBondVector = function(atom, previousAtom, distanceMeasure,trans) {

	var angle = kemia.layout.AtomPlacer.getAngle(previousAtom.coord.x - atom.coord.x, previousAtom.coord.y - atom.coord.y);
    var addAngle = Math.PI * (120 / 180);
    if (!trans)
        addAngle = Math.PI * (60 / 180);

	angle += addAngle;
	var vec1 = new kemia.layout.Vector2D(Math.cos(angle), Math.sin(angle));
	var point1 = new goog.math.Coordinate(atom.coord.x + vec1.x, atom.coord.y + vec1.y);
	var distance1 = goog.math.Coordinate.distance(point1, distanceMeasure);
	angle += addAngle;

	var vec2 = new kemia.layout.Vector2D(Math.cos(angle), Math.sin(angle));
	var point2 = new goog.math.Coordinate(atom.coord.x + vec2.x, atom.coord.y + vec2.y);
    var distance2 = goog.math.Coordinate.distance(point2, distanceMeasure);

	if (distance2 > distance1) {
		return vec2;
	}
	else {
		return vec1;
	}
};


kemia.layout.AtomPlacer.allPlaced = function(molecule, atCount) {
    for (var ap = 0; ap < atCount; ap++)
        if (!molecule.getAtom(ap).flags[kemia.model.Flags.ISPLACED])
            return false;
    return true;
};

/**
 * Distribute the bonded atoms (neighbours) of an atom such that they fill the
 * remaining space around an atom in a geometrically nice way.
 */
kemia.layout.AtomPlacer.distributePartners = function(atom, placedNeighbours, sharedAtomsCenter, unplacedNeighbours, bondLength) {

	var occupiedAngle = 0;
	var startAngle = 0.0;
	var addAngle = 0.0;
	var radius = 0.0;
	var remainingAngle = 0.0;

	// Calculate the direction away from the already placed partners of atom
	var sharedAtomsCenterVector = new kemia.layout.Vector2D(sharedAtomsCenter.x, sharedAtomsCenter.y);
	var newDirection = new kemia.layout.Vector2D(atom.coord.x, atom.coord.y);

	var occupiedDirection = new kemia.layout.Vector2D(sharedAtomsCenter.x, sharedAtomsCenter.y);
	occupiedDirection.sub(newDirection);
	var atomsToDraw = new Array();

    var placedNeighboursCountAtoms = placedNeighbours.countAtoms();
    var unPlacedNeighboursCountAtoms = unplacedNeighbours.countAtoms();

	if (placedNeighboursCountAtoms == 1)
	{
	    for (var f1 = 0; f1 < unPlacedNeighboursCountAtoms; f1++) {
	        atomsToDraw.push(unplacedNeighbours.getAtom(f1));
	    }
	    addAngle = Math.PI * 2 / (unPlacedNeighboursCountAtoms + placedNeighboursCountAtoms);
	    var placedAtom = placedNeighbours.getAtom(0);
	    var xDiff = placedAtom.coord.x - atom.coord.x;
	    var yDiff = placedAtom.coord.y - atom.coord.y;

	    startAngle = kemia.layout.AtomPlacer.getAngle(xDiff, yDiff);
	    kemia.layout.AtomPlacer.populatePolygonCorners(atomsToDraw, new goog.math.Coordinate(atom.coord.x, atom.coord.y), startAngle, addAngle, bondLength);
	    return;
	} else if (placedNeighboursCountAtoms == 0)
	{
        for (f1 = 0; f1 < unPlacedNeighboursCountAtoms; f1++) {
            atomsToDraw.push(unplacedNeighbours.getAtom(f1));
        }
		addAngle = Math.PI * 2.0 / unPlacedNeighboursCountAtoms;
		startAngle = 0.0;
		kemia.layout.AtomPlacer.populatePolygonCorners(atomsToDraw, new goog.math.Coordinate(atom.coord.x, atom.coord.y), startAngle, addAngle, bondLength);
		return;
	}
    var sortedAtoms = new Array();
	// if the least hindered side of the atom is clearly defined (bondLength /
	// 10 is an arbitrary value that seemed reasonable) */
	sharedAtomsCenterVector.sub(newDirection);

	newDirection = sharedAtomsCenterVector;
	newDirection.normalize();
	newDirection.scale(bondLength);
	newDirection.negate();

	var distanceMeasure = new goog.math.Coordinate(atom.coord.x, atom.coord.y);
	distanceMeasure.x += newDirection.x;
    distanceMeasure.y += newDirection.y;

	 // get the two sharedAtom partners with the smallest distance to the new
		// center
    for (f1 = 0; f1 < placedNeighboursCountAtoms; f1++) {
        sortedAtoms.push(placedNeighbours.getAtom(f1));
    }
    kemia.layout.AtomPlacer.sortBy2DDistance(sortedAtoms, distanceMeasure);
	var closestPoint1 = new kemia.layout.Vector2D(sortedAtoms[0].coord.x, sortedAtoms[0].coord.y);
    var closestPoint2 = new kemia.layout.Vector2D(sortedAtoms[1].coord.x, sortedAtoms[1].coord.y);
    closestPoint1.sub(new kemia.layout.Vector2D(atom.coord.x, atom.coord.y));
    closestPoint2.sub(new kemia.layout.Vector2D(atom.coord.x, atom.coord.y));
    occupiedAngle = closestPoint1.angle(occupiedDirection);
    occupiedAngle += closestPoint2.angle(occupiedDirection);

    var angle1 = kemia.layout.AtomPlacer.getAngle(sortedAtoms[0].coord.x - atom.coord.x, sortedAtoms[0].coord.y - atom.coord.y);
    var angle2 = kemia.layout.AtomPlacer.getAngle(sortedAtoms[1].coord.x - atom.coord.x, sortedAtoms[1].coord.y - atom.coord.y);
    var angle3 = kemia.layout.AtomPlacer.getAngle(distanceMeasure.x - atom.coord.x, distanceMeasure.y - atom.coord.y);

	var startAtom = null;

	if (angle1 > angle3)
	{
	    if (angle1 - angle3 < Math.PI)
	        startAtom = sortedAtoms[1];
	    else
	        startAtom = sortedAtoms[0];

	} else
	{
	    if (angle3 - angle1 < Math.PI)
	        startAtom = sortedAtoms[0];
	    else
	        startAtom = sortedAtoms[1];
	}
	remainingAngle = (2 * Math.PI) - occupiedAngle;
	addAngle = remainingAngle / (unPlacedNeighboursCountAtoms + 1);

	for (var fff = 0; fff < unPlacedNeighboursCountAtoms; fff++) {
	    atomsToDraw.push(unplacedNeighbours.getAtom(fff));
	}
	radius = bondLength;
	startAngle = kemia.layout.AtomPlacer.getAngle(startAtom.coord.x - atom.coord.x, startAtom.coord.y - atom.coord.y);

    kemia.layout.AtomPlacer.populatePolygonCorners(atomsToDraw, new goog.math.Coordinate(atom.coord.x, atom.coord.y), startAngle, addAngle, radius);
};


/**
 * Sorts an array of atoms such that the 2D distances of the atom locations from
 * a given point are smallest for the first atoms in the vector
 *
 */
kemia.layout.AtomPlacer.sortBy2DDistance = function(atoms, point) {

	var doneSomething;
	do {
		doneSomething = false;
	    for (var atIdx = 0, atLen = atoms.length; atIdx < atLen - 1; atIdx++) {
	        var atom1 = atoms[atIdx];
	        var atom2 = atoms[atIdx + 1];
	        var distance1 = goog.math.Coordinate.distance(point, atom1.coord);
	        var distance2 = goog.math.Coordinate.distance(point, atom2.coord);
	        if (distance2 < distance1) {
	            atoms[atIdx] = atom2;
	            atoms[atIdx + 1] = atom1;
	            doneSomething = true;
	        }
	    }
	} while (doneSomething);
};

 /**
	 * Populates the corners of a polygon with atoms. Used to place atoms in a
	 * geometrically regular way around a ring center or another atom. If this
	 * is used to place the bonding partner of an atom (and not to draw a ring)
	 * we want to place the atoms such that those with highest "weight" are
	 * placed farmost away from the rest of the molecules. The "weight"
	 * mentioned here is calculated by a modified morgan number algorithm.
	 */
kemia.layout.AtomPlacer.populatePolygonCorners = function(atomsToDraw, rotationCenter, startAngle, addAngle, radius) {

	var points = new Array();
    var angle = startAngle;
	for (var ad = 0, ads = atomsToDraw.length; ad < ads; ad++) {

	    angle = angle + addAngle;
	    if (angle >= 2.0 * Math.PI)
	        angle -= 2.0 * Math.PI;

        //Fix Github issue 17 : Generated bond lengths should better reflect bond and participating element chemistry.
        var connectAtom = atomsToDraw[ad];

		if (connectAtom.symbol == 'H')
		  radius *= .6;
        //End fix

	    var x = Math.cos(angle) * radius;
	    var y = Math.sin(angle) * radius;
	    var newX = x + rotationCenter.x;
	    var newY = y + rotationCenter.y;
	    points.push(new goog.math.Coordinate(newX, newY));
	}
    for (ad = 0, ads = atomsToDraw.length; ad < ads; ad++) {
	    connectAtom = atomsToDraw[ad];
	    connectAtom.coord = points[ad];
		connectAtom.flags[kemia.model.Flags.ISPLACED] = true;
	}
};

/**
 * Partition the bonding partners of a given atom into placed and not placed.
 * @param molecule
 *            {kemia.model.Molecule} The molecule getting laid.
 * @param atom
 *            {kemia.model.Atom} The atom whose bonding partners are to be
 *            partitioned.
 * @param unplacedPartners
 *            An array for the unplaced bonding partners to go in.
 * @param placedPartners
 *            An array vector for the placed bonding partners to go in.
 */
kemia.layout.AtomPlacer.partitionPartners = function(molec, atom, unplacedPartners, placedPartners) {
    var cntLoop = 0;
	goog.array.forEach(atom.bonds.getValues(), function(bond) {
		cntLoop++;
		var other_atom = bond.otherAtom(atom);
		if (!other_atom.flags[kemia.model.Flags.ISPLACED]) {
            unplacedPartners.addAtom(other_atom);
		}else {
            placedPartners.addAtom(other_atom);
		}
	});
	return cntLoop;
};

kemia.layout.AtomPlacer.markNotPlaced = function(atoms) {
	goog.array.forEach(atoms, function(atom) {
		atom.setFlag(kemia.model.Flags.ISPLACED, false);
	});
};

kemia.layout.AtomPlacer.markPlaced = function(atoms) {
	goog.array.forEach(atoms, function(atom) {
		atom.setFlag(kemia.model.Flags.ISPLACED, true);
	});
};

