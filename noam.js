var Table = require('/home/izuzak/cli-table');

var noam = {};

module.exports = noam;

// validates a FSM definition
noam.validateFsm = function(fsm) {
  var self = this;

  if (!(typeof fsm !== 'undefined' &&
      Array.isArray(fsm.states) &&
      Array.isArray(fsm.alphabet) &&
      Array.isArray(fsm.acceptingStates) &&
      fsm.initialState !== 'undefined' && fsm.initialState !== null &&
      Array.isArray(fsm.transitions))) {
    return new Error('FSM must be defined and have states, alphabet, acceptingStates, initialState and transitions array properties!');
  }

  if (fsm.states.length < 1) {
    return new Error('Set of states must not be empty.');
  }

  for (var i=0; i<fsm.states.length; i++) {
    if (self.containsEquivalentObject(fsm.states, fsm.states[i], i+1)) {
      return new Error('Equivalent states');
    }
  }

  if (fsm.alphabet.length < 1) {
    return new Error('Alphabet must not be empty.');
  }

  for (var i=0; i<fsm.alphabet.length; i++) {
    if (self.containsEquivalentObject(fsm.alphabet, fsm.alphabet[i], i+1)) {
      return new Error('Equivalent alphabet symbols');
    }
  }

  for (var i=0; i<fsm.alphabet.length; i++) {
    if (noam.containsEquivalentObject(fsm.states, fsm.alphabet[i])) {
      return new Error('States and alphabet symbols must not overlap');
    }
  }

  for (var i=0; i<fsm.acceptingStates.length; i++) {
    if (self.containsEquivalentObject(fsm.acceptingStates, fsm.acceptingStates[i], i+1)) {
      return new Error('Equivalent acceptingStates');
    }

    if (!(self.containsEquivalentObject(fsm.states, fsm.acceptingStates[i]))) {
      return new Error('Each accepting state must be in states');
    }
  }

  if (!(self.containsEquivalentObject(fsm.states, fsm.initialState))) {
    return new Error('Initial state must be in states');
  }

  for (var i=0; i<fsm.transitions.length; i++) {
    var transition = fsm.transitions[i];

    if (typeof transition.fromState === 'undefined' ||
        typeof transition.toStates === 'undefined' ||
        typeof transition.symbol === 'undefined') {
      return new Error('Transitions must have fromState, toState and symbol');
    }

    if (!(self.containsEquivalentObject(fsm.states, transition.fromState))) {
      return new Error('Transition fromState must be in states.');
    }

    if (!(self.containsEquivalentObject(fsm.alphabet, transition.symbol)) && transition.symbol !== '$') {
      return new Error('Transition symbol must be in alphabet.');
    }

    for (var k=0; k<transition.toStates.length; k++) {
      if (!(self.containsEquivalentObject(fsm.states, transition.toStates[k]))) {
        return new Error('Transition toStates must be in states.');
      }

      if (self.containsEquivalentObject(transition.toStates, transition.toStates[k], k+1)) {
        return new Error('Transition toStates must not contain duplicates.');
      }
    }

  }

  for (var i=0; i<fsm.transitions.length; i++) {
    for (var j=i+1; j<fsm.transitions.length; j++) {
      if (fsm.transitions[i].fromState === fsm.transitions[j].fromState &&
          fsm.transitions[i].symbol === fsm.transitions[j].symbol) {
        return new Error('Transitions for the same fromState and symbol must be defined in a single trainsition.');
      }
    }
  }

  return true;
};

noam.containsAllObjects = function(arr1, arr2) {
  for (var i=0; i<arr2.length; i++) {
    if (!(noam.containsEquivalentObject(arr1, arr2[i]))) {
      console.log(arr1, arr2[i]);
      return false;
    }
  }

  return true;
}

noam.containsEquivalentObject = function(arr, obj, startIndex) {
  startIndex = startIndex ? startIndex : 0;

  for (var i=startIndex; i<arr.length; i++) {
    if (noam.areEquivalentObjects(arr[i], obj)) {
      return true;
    }
  }

  return false;
};

// from: http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
noam.areEquivalentObjects = function(object1, object2) {
  if (typeof object1 === 'undefined' ||
      typeof object2 === 'undefined' ||
      object1 === null ||
      object2 === null) {
    throw new Error('objects must be defined.');
  }

  if ( object1 === object2 ) return true;
  if ( ! ( object1 instanceof Object ) || ! ( object2 instanceof Object ) ) return false;
  if ( object1.constructor !== object2.constructor ) return false;

  for ( var p in object1 ) {
    if ( ! object1.hasOwnProperty( p ) ) continue;
    if ( ! object2.hasOwnProperty( p ) ) return false;
    if ( object1[ p ] === object2[ p ] ) continue;
    if ( typeof( object1[ p ] ) !== "object" ) return false;
    if ( ! noam.areEquivalentObjects( object1[ p ],  object2[ p ] ) ) return false;
  }

  for ( p in object2 ) {
    if ( object2.hasOwnProperty( p ) && ! object1.hasOwnProperty( p ) ) return false;
  }

  return true;
};

var fsm1 = {
  states : ["s1", "s2", "s3", "s4", "s5"],
  alphabet : ["a", "b", "c"],
  acceptingStates : ["s2", "s3"],
  initialState : "s1",
  transitions : [
    { fromState : "s1", toStates : ["s2"], symbol : "$"},
    { fromState : "s1", toStates : ["s3"], symbol : "b"},
    { fromState : "s2", toStates : ["s3", "s2", "s1"], symbol : "a"},
    { fromState : "s3", toStates : ["s1"], symbol : "c"},
    { fromState : "s4", toStates : ["s4", "s5"], symbol : "c"},
    { fromState : "s5", toStates : ["s1"], symbol : "$"}
  ]
};

console.log(require('util').inspect(fsm1, false, null));

console.log(noam.validateFsm(fsm1));

noam.determineFsmType = function(fsm) {
  var fsmType = 'DFA';

  for (var i=0; i<fsm.transitions.length; i++) {
    var transition = fsm.transitions[i];

    if (transition.toStates.length === 0 ||
        transition.toStates.length > 1) {
      fsmType = 'NFA';
    } else if (transition.symbol === '$') {
      fsmType = 'eNFA';
      break;
    }
  }

  return fsmType;
};

console.log(noam.determineFsmType(fsm1));

noam.epsilonArea = function(fsm, states) {
  states = Array.isArray(states) ? states : [states];

  if (!(noam.containsAllObjects(fsm.states, states))) {
    return new Error('FSM must contain all states for which epsilon area is being computed');
  }

  var self = this;
  var unprocessedStates = states
  var targetStates = [];

  while (unprocessedStates.length !== 0) {
    var currentState = unprocessedStates.pop();
    targetStates.push(currentState);

    for (var i=0; i<fsm.transitions.length; i++) {
      var transition = fsm.transitions[i];
      
      if (transition.symbol === '$' &&
          self.areEquivalentObjects(transition.fromState, currentState)) {
        for (var j=0; j<transition.toStates.length; j++) {
          if (self.containsEquivalentObject(targetStates, transition.toStates[j]) ||
              self.containsEquivalentObject(unprocessedStates, transition.toStates[j])) {
            continue;
          }

          unprocessedStates.push(transition.toStates[j]);
        }
      }
    }
  }

  return targetStates;
};

console.log(noam.epsilonArea(fsm1, "s1"));
console.log(noam.epsilonArea(fsm1, "s2"));
console.log(noam.epsilonArea(fsm1, "s3"));

noam.makeSimpleTransition = function(fsm, states, symbol) {
  states = Array.isArray(states) ? states : [states];

  if (!(noam.containsAllObjects(fsm.states, states))) {
    return new Error('FSM must contain all states for which the transition is being computed');
  }

  if (!(noam.containsEquivalentObject(fsm.alphabet, symbol))) {
    return new Error('FSM must contain input symbol for which the transition is being computed');
  }

  var targetStates = [];

  for (var i=0; i<fsm.transitions.length; i++) {
    var transition = fsm.transitions[i];

    if (fsm.transitions[i].symbol === symbol &&
        noam.containsEquivalentObject(states, transition.fromState)) {
      for (var j=0; j<transition.toStates.length; j++) {
        if (!(noam.containsEquivalentObject(targetStates, transition.toStates[j]))) {
          targetStates.push(transition.toStates[j]);
        }
      }
    }
  }

  return targetStates;
};

console.log("simple transition:", noam.makeSimpleTransition(fsm1, ["s1", "s2"], "a"));

noam.makeTransition = function(fsm, states, symbol) {
  states = Array.isArray(states) ? states : [states];

  if (!(noam.containsAllObjects(fsm.states, states))) {
    return new Error('FSM must contain all states for which the transition is being computed');
  }

  if (!(noam.containsEquivalentObject(fsm.alphabet, symbol))) {
    return new Error('FSM must contain input symbol for which the transition is being computed');
  }

  states = noam.epsilonArea(fsm, states);
  states = noam.makeSimpleTransition(fsm, states, symbol);
  states = noam.epsilonArea(fsm, states);

  return states;
};

console.log("transition:", noam.makeTransition(fsm1, ["s3"], "a"));

noam.readString = function(fsm, inputSymbolStream) {
  if (!(noam.containsAllObjects(fsm.alphabet, inputSymbolStream))) {
    return new Error('FSM must contain all symbols for which the transition is being computed');
  }
  
  var states = fsm1.initialState;

  for (var i=0; i<inputSymbolStream.length; i++) {
    states = noam.makeTransition(fsm, states, inputSymbolStream[i]);
    console.log("bla:", states);
  }
  
  return states;
};

console.log("readString:", noam.readString(fsm1, ["a", "a", "b"]));

noam.prettyFsm = function(fsm) {
  var colHeads = [""].concat(fsm.alphabet);

  if (noam.determineFsmType(fsm) === 'eNFA') {
    colHeads.push("$");
  }

  colHeads.push("");

  var table = new Table({
     head: colHeads,
     chars: {
       'top': '-',
       'top-mid': '+',
       'top-left': '+', 
       'top-right': '+',
       'bottom': '-',
       'bottom-mid': '+',
       'bottom-left': '+', 
       'bottom-right': '+',
       'left': '|',
       'left-mid': '+',
       'mid': '-',
       'mid-mid': '+',
       'right': '|',
       'right-mid': '+'
     }, 
     truncate: '…'
  });

  var tableRows = [];
  for (var i=0; i<fsm.states.length; i++) {
    tableRows.push(new Array(colHeads.length));
    for (var j=0; j<colHeads.length; j++) {
      tableRows[i][j] = "";
    }
    tableRows[i][0] = fsm.states[i];
    tableRows[i][colHeads.length-1] = 
      noam.containsEquivalentObject(fsm.acceptingStates, fsm.states[i]) ? 
      "1" : "0" ;
    table.push(tableRows[i]);
  }

  for (var i=0; i<fsm.transitions.length; i++) {
    var transition = fsm.transitions[i];

    var colNum = null;
    var rowNum = null;

    for (var j=0; j<fsm.states.length; j++) {
      if (noam.areEquivalentObjects(fsm.states[j], transition.fromState)) {
        rowNum = j;
        break;
      }
    }

    if (transition.symbol === "$") {
      colNum = colHeads.length-2;
    } else {
      for (var j=0; j<fsm.alphabet.length; j++) {
        if (noam.areEquivalentObjects(fsm.alphabet[j], transition.symbol)) {
          colNum = j+1;
          break;
        }
      }
    }

    tableRows[rowNum][colNum] = { text : transition.toStates };
  }

  return table.toString();
};

console.log(noam.prettyFsm(fsm1));

noam.removeUnreachableStates = function (fsm) {
  var self = this;
  var unprocessedStates = [fsm.initialState];
  var reachableStates = [];

  while (unprocessedStates.length !== 0) {
    var currentState = unprocessedStates.pop();
    console.log("cur:", currentState);
    reachableStates.push(currentState);

    for (var i=0; i<fsm.transitions.length; i++) {
      var transition = fsm.transitions[i];

      if (self.containsEquivalentObject(reachableStates, transition.fromState)) {
        for (var j=0; j<transition.toStates.length; j++) {
          if (self.containsEquivalentObject(reachableStates, transition.toStates[j]) ||
              self.containsEquivalentObject(unprocessedStates, transition.toStates[j])) {
            continue;
          }
  
          unprocessedStates.push(transition.toStates[j]);
        }
      }
    }
  }

  var newFsm = JSON.parse(JSON.stringify(fsm1));

  newFsm.states = JSON.parse(JSON.stringify(reachableStates));
  newFsm.acceptingStates = [];
  newFsm.transitions = [];

  for (var i=0; i<fsm.acceptingStates.length; i++) {
    if (noam.containsEquivalentObject(reachableStates, fsm.acceptingStates[i])) {
      newFsm.acceptingStates.push(fsm.acceptingStates[i]);
    }
  }

  for (var i=0; i<fsm.transitions.length; i++) {
    if (noam.containsEquivalentObject(reachableStates, fsm.transitions[i].fromState)) {
      newFsm.transitions.push(fsm.transitions[i]);
    }
  }

  return newFsm;
};

console.log(noam.removeUnreachableStates(fsm1));

noam.areNondistinguishableState = function(fsmA, stateA, fsmB, stateB) {
  if (noam.determineFsmType(fsmA) !== 'DFA' || 
      noam.determineFsmType(fsmB) !== 'DFA') {
    return new Error('FSMs must be DFAs');
  }
  
  if (fsmA.alphabet.length !== fsmB.alphabet.length ||
      !(noam.containsAllObjects(fsmA.alphabet, fsmB.alphabet))) {
    return new Error('FSM alphabets must be the same');
  }
  
  if (!(noam.containsEquivalentObject(fsmA.states, stateA)) ||
      !(noam.containsEquivalentObject(fsmB.states, stateB))) {
    return new Error('FSMs must contain states');
  }

  function doBothHaveSameAcceptance(fsmX, stateX, fsmY, stateY) {
    var stateXAccepting = noam.containsEquivalentObject(fsmX.acceptingStates, stateX);
    var stateYAccepting = noam.containsEquivalentObject(fsmY.acceptingStates, stateY);

    return (stateXAccepting && stateYAccepting) || 
           (!(stateXAccepting) && !(stateYAccepting));
  }
  
  var unprocessedPairs = [[stateA, stateB]];
  var processedPairs = [];

  while (unprocessedPairs.length !== 0) {
    var currentPair = unprocessedPairs.pop();

    for (var i=0; i<fsmA.alphabet.length; i++) {
      if (!(doBothHaveSameAcceptance(fsmA, currentPair[0], fsmB, currentPair[1]))) {
        return false;
      }

      processedPairs.push(currentPair);

      for (var j=0; j<fsmA.alphabet.length; j++) {
        var pair = [noam.makeTransition(fsmA, currentPair[0], fsmA.alphabet[j])[0],
                    noam.makeTransition(fsmB, currentPair[1], fsmA.alphabet[j])[0]];
        
        if (!(noam.containsEquivalentObject(processedPairs, pair)) &&
            !(noam.containsEquivalentObject(unprocessedPairs, pair))) {
          unprocessedPairs.push(pair);
        }
      }
    }
  }

  return true;
};

noam.areEquivalentFSMs = function(fsmA, fsmB) {
  return noam.areNondistinguishableState(fsmA, fsmA.initialState, fsmB, fsmB.initialState);
};

var fsm2 = {
  states : ["s1", "s2", "s3",],
  alphabet : ["a", "b"],
  acceptingStates : ["s2", "s3"],
  initialState : "s3",
  transitions : [
    { fromState : "s1", toStates : ["s2"], symbol : "a"},
    { fromState : "s1", toStates : ["s3"], symbol : "b"},
    { fromState : "s2", toStates : ["s3"], symbol : "a"},
    { fromState : "s2", toStates : ["s1"], symbol : "b"},
    { fromState : "s3", toStates : ["s2"], symbol : "a"},
    { fromState : "s3", toStates : ["s1"], symbol : "b"}
  ]
};

console.log(noam.areNondistinguishableState(fsm2, "s1", fsm2, "s1"));
console.log(noam.areNondistinguishableState(fsm2, "s2", fsm2, "s3"));
console.log(noam.areEquivalentFSMs(fsm2, fsm2));

noam.removeEquivalentStates = function(fsm) {
  if (noam.determineFsmType(fsm) !== 'DFA') {
    return new Error('FSM must be DFA');
  }

  var equivalentPairs = [];
 
  for (var i=0; i<fsm.states.length; i++) {
    for (var j=i+1; j<fsm.states.length; j++) {
      if (noam.areNondistinguishableState(fsm, fsm.states[i], fsm, fsm.states[j])) {
        var pair = [fsm.states[i], fsm.states[j]];

        for (var k=0; k<equivalentPairs.length; k++) {
          if (noam.areEquivalentObjects(equivalentPairs[k][1], pair[0])) {
            pair[0] = equivalentPairs[k][1];
            break;
          }
        }

        if (!(noam.containsEquivalentObject(equivalentPairs, pair))) {
          equivalentPairs.push(pair);
        }
      }
    }
  }

  var newFsm = {
    states : [],
    alphabet : JSON.parse(JSON.stringify(fsm.alphabet)),
    initialState : [],
    acceptingStates : [],
    transitions : []
  };

  function isOneOfEquivalentStates(s) {
    for (var i=0; i<equivalentPairs.length; i++) {
      if (noam.areEquivalentObjects(equivalentPairs[i][1], s)) {
        return true;
      }
    }

    return false;
  }

  function getEquivalentState(s) {
    for (var i=0; i<equivalentPairs.length; i++) {
      if (noam.areEquivalentObjects(equivalentPairs[i][1], s)) {
        return equivalentPairs[i][0];
      }
    }

    return s;
  }

  for (var i=0; i<fsm.states.length; i++) {
    if (!(isOneOfEquivalentStates(fsm.states[i]))) {
      newFsm.states.push(JSON.parse(JSON.stringify(fsm.states[i])));
    }
  }

  for (var i=0; i<fsm.acceptingStates.length; i++) {
    if (!(isOneOfEquivalentStates(fsm.states[i]))) {
      newFsm.acceptingStates.push(JSON.parse(JSON.stringify(fsm.acceptingStates[i])));
    }
  }

  newFsm.initialState = JSON.parse(JSON.stringify(getEquivalentState(fsm.initialState)));

  for (var i=0; i<fsm.transitions.length; i++) {
    var transition = JSON.parse(JSON.stringify(fsm.transitions[i]));

    if (isOneOfEquivalentStates(transition.fromState)) {
      continue;
    }

    for (var j=0; j<transition.toStates.length; j++) {
      transition.toStates[j] = getEquivalentState(transition.toStates[j]);
    }

    newFsm.transitions.push(transition);
  }

  return newFsm;
};

console.log(require('util').inspect(fsm2, false, null));
console.log(require('util').inspect(noam.removeEquivalentStates(fsm2), false, null));

var fsm3 = {
  states : ["p1", "p2", "p3", "p4", "p5", "p6", "p7"],
  initialState : "p1",
  acceptingStates : ["p5", "p6", "p7"],
  alphabet : ["c", "d"],
  transitions : [
    { fromState : "p1", symbol : "c", toStates : ["p6"] },
    { fromState : "p1", symbol : "d", toStates : ["p3"] },
    { fromState : "p2", symbol : "c", toStates : ["p7"] },
    { fromState : "p2", symbol : "d", toStates : ["p3"] },
    { fromState : "p3", symbol : "c", toStates : ["p1"] },
    { fromState : "p3", symbol : "d", toStates : ["p5"] },
    { fromState : "p4", symbol : "c", toStates : ["p4"] },
    { fromState : "p4", symbol : "d", toStates : ["p6"] },
    { fromState : "p5", symbol : "c", toStates : ["p7"] },
    { fromState : "p5", symbol : "d", toStates : ["p3"] },
    { fromState : "p6", symbol : "c", toStates : ["p4"] },
    { fromState : "p6", symbol : "d", toStates : ["p1"] },
    { fromState : "p7", symbol : "c", toStates : ["p4"] },
    { fromState : "p7", symbol : "d", toStates : ["p2"] }
  ]
};

console.log(noam.validateFsm(fsm3));
console.log(noam.prettyFsm(fsm3));
console.log(noam.prettyFsm(noam.removeEquivalentStates(fsm3)));

var fsm4 = {
  states : ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
  initialState : "p1",
  acceptingStates : ["p3"],
  alphabet : ["0", "1"],
  transitions : [
    { fromState : "p1", symbol : "0", toStates : ["p2"] },
    { fromState : "p1", symbol : "1", toStates : ["p6"] },
    { fromState : "p2", symbol : "0", toStates : ["p7"] },
    { fromState : "p2", symbol : "1", toStates : ["p3"] },
    { fromState : "p3", symbol : "0", toStates : ["p1"] },
    { fromState : "p3", symbol : "1", toStates : ["p3"] },
    { fromState : "p4", symbol : "0", toStates : ["p3"] },
    { fromState : "p4", symbol : "1", toStates : ["p7"] },
    { fromState : "p5", symbol : "0", toStates : ["p8"] },
    { fromState : "p5", symbol : "1", toStates : ["p6"] },
    { fromState : "p6", symbol : "0", toStates : ["p3"] },
    { fromState : "p6", symbol : "1", toStates : ["p7"] },
    { fromState : "p7", symbol : "0", toStates : ["p7"] },
    { fromState : "p7", symbol : "1", toStates : ["p5"] },
    { fromState : "p8", symbol : "0", toStates : ["p7"] },
    { fromState : "p8", symbol : "1", toStates : ["p3"] }
  ]
};

console.log(noam.validateFsm(fsm4));
console.log(noam.prettyFsm(fsm4));
console.log(noam.prettyFsm(noam.removeEquivalentStates(fsm4)));
